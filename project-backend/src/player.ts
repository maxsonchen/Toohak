import { getData, save, gameTimers } from './dataStore';
import { GameState, PlayerId, Player, playerQuestionInfo, EmptyObj } from './interface';
import { genRandName, GameFromPlayerId, positionCheck, checkDuplicates } from './playerHelper';
import { questionCountdown } from './gameStateMach';
import {
  FinalError, INVALID_PLAYER_ID, INVALID_POSITION, INVALID_PLAYER_NAME, INCOMPATIBLE_GAME_STATE,
  INVALID_GAME_ID, INVALID_ANSWER_IDS,
} from './errorHandling';

const VALID_NAME_REGEX = /^[a-zA-Z0-9 ]*$/;

/** Allow a guest player to join
 *
 * @param {number} gameId
 * @param {string} playerName
 *
 * @returns {Object} - PlayerId
 * @throws {ErrorResponse}
 */
export function playerJoin(gameId: number, playerName: string): PlayerId {
  const data = getData();

  const game = data.games.find(game => game.gameId === gameId);
  if (!game) {
    throw new FinalError(INVALID_GAME_ID, 'Game Id does not refer to a valid game');
  }

  if (game.state !== GameState.LOBBY) {
    throw new FinalError(INCOMPATIBLE_GAME_STATE, 'Game is not in LOBBY state');
  }

  if (!VALID_NAME_REGEX.test(playerName)) {
    throw new FinalError(INVALID_PLAYER_NAME, 'Name contains invalid characters');
  }

  if (game.players.find(player => player.playerName === playerName)) {
    throw new FinalError(INVALID_PLAYER_NAME, 'Name of user entered is not unique');
  }

  if (playerName === '') {
    playerName = genRandName(game);
  }

  const playerId = { playerId: game.gameId * 100 + game.players.length };
  const newPlayer: Player = {
    playerId: playerId.playerId,
    score: 0,
    playerName: playerName,
  };
  game.players.push(newPlayer);
  game.usersRankedByScore.push({
    playerName: playerName,
    score: 0,
  });

  // Next question timer
  if (game.players.length >= game.autoStartNum && game.autoStartNum !== 0 &&
      game.state === GameState.LOBBY && !gameTimers[gameId]
  ) {
    questionCountdown(game, data);
  } else {
    save(data);
  }
  return playerId;
}

// For the /v1/player/{playerid}
export function getPlayerStatus(playerid: number):
{ state: GameState, numQuestions: number, atQuestion: number } {
  const data = getData();

  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerid);

    if (player) {
      return {
        state: game.state,
        numQuestions: game.numQuestions,
        atQuestion: game.atQuestion
      };
    }
  }
  throw new FinalError(INVALID_PLAYER_ID, 'Player ID does not exist');
}

/** Get the information about a question that the guest player is on.
 *
 * @param {number} playerId
 * @param {string} questionPosition
 *
 * @returns {Object} - playerQuestionInfo
 * @throws {ErrorResponse}
 */
export function getQuestionPosition(
  playerid: number, questionPosition: number): playerQuestionInfo {
  const data = getData();

  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerid);

    if (player) {
      if (game.state === GameState.LOBBY ||
        game.state === GameState.QUESTION_COUNTDOWN ||
        game.state === GameState.FINAL_RESULTS ||
        game.state === GameState.END
      ) {
        throw new FinalError(INCOMPATIBLE_GAME_STATE, 'Game is in an incompatible state');
      }

      const quiz = data.quizzes.find(q => q.quizId === game.quizId);
      if (!quiz || questionPosition < 1 || questionPosition > quiz.questions.length) {
        throw new FinalError(INVALID_POSITION, 'No such question exists');
      }

      if (questionPosition !== game.atQuestion) {
        throw new FinalError(INVALID_POSITION, 'Game is not currently on this question');
      }

      const question = quiz.questions[questionPosition - 1];

      return {
        questionId: question.questionId,
        question: question.question,
        timeLimit: question.timeLimit,
        thumbnailUrl: question.thumbnailUrl,
        points: question.points,
        answerOptions: question.answerOptions.map(option => ({
          answerId: option.answerId,
          answer: option.answer,
          colour: option.colour
        }))
      };
    }
  }
  throw new FinalError(INVALID_PLAYER_ID, 'The player ID does not exists');
}

/** Player submission of answer(s)
 *
 * @param {number[]} answerIds
 * @param {number} playerId
 * @param {number} questionPosition
 *
 * @returns {object} - Empty object
 * @throws {ErrorResponse}
 */
export function playerSubmitAnswers(
  answerIds: number[], playerId: number, questionPosition: number
): EmptyObj {
  const data = getData();
  const game = GameFromPlayerId(playerId, data);
  positionCheck(questionPosition, game);
  const currQuestionId = game.questions[questionPosition - 1].questionId;

  if (game.state !== GameState.QUESTION_OPEN) {
    throw new FinalError(INCOMPATIBLE_GAME_STATE, 'Game is not in QUESTION_OPEN state');
  }
  const validAnswers = game.questions[questionPosition - 1].answerOptions.map(ans => ans.answerId);
  if (!answerIds.every(value => validAnswers.includes(value))) {
    throw new FinalError(INVALID_ANSWER_IDS, 'Answer IDs are not valid for this question');
  }
  if (checkDuplicates(answerIds)) {
    throw new FinalError(INVALID_ANSWER_IDS, 'Duplicate answer Ids submitted');
  }
  if (answerIds.length < 1) {
    throw new FinalError(INVALID_ANSWER_IDS, 'Less than 1 answer submitted');
  }

  const player = game.players.find(p => p.playerId === playerId);
  const name = player.playerName;

  // determine if the answer is fully correct
  const answerOptions = game.questions[questionPosition - 1].answerOptions;
  const correctAnswerIds = answerOptions.filter(option => option.correct)
    .map(option => option.answerId).sort((a, b) => a - b);
  const submittedAnswerIds = answerIds.slice().sort((a, b) => a - b);
  const answersCorrect = correctAnswerIds.length === submittedAnswerIds.length &&
    correctAnswerIds.every((id, idx) => id === submittedAnswerIds[idx]);

  // correctness array handling
  const questionResults = game.questionResults.find(q => q.questionId === currQuestionId);
  const index = questionResults.playersCorrect.indexOf(name);

  if (answersCorrect && index === -1) {
    questionResults.playersCorrect.push(name);
  } else if (!answersCorrect && index !== -1) {
    questionResults.playersCorrect.splice(index, 1);
  }

  // update response time
  const responseTime = Math.round(Date.now() / 1000) - game.questionOpenTime;
  game.answerTimes[playerId] = responseTime;
  save(data);
  return {};
}

/**
 * Get results for a particular question of a game a player is playing.
 * @param playerId
 * @param questionPosition
 *
 *
 */
export function playerQuestionResults(playerId: number, questionPosition: number) {
  const data = getData();

  // Throws INVALID_PLAYER_ID if player not found in any game
  const game = GameFromPlayerId(playerId, data);

  // Must be in ANSWER_SHOW to view results
  if (game.state !== GameState.ANSWER_SHOW) {
    throw new FinalError(INCOMPATIBLE_GAME_STATE, 'Game is not in ANSWER_SHOW state');
  }

  // Validate that the requested question position exists and matches current
  positionCheck(questionPosition, game);

  const questionId = game.questions[questionPosition - 1].questionId;
  const result = game.questionResults.find(q => q.questionId === questionId);

  return {
    questionId: result.questionId,
    playersCorrect: result.playersCorrect,
    averageAnswerTime: result.averageAnswerTime,
    percentCorrect: result.percentCorrect,
  };
}

export function playerFinalResults(playerId: number) {
  const data = getData();

  // Throws INVALID_PLAYER_ID if player not found in any game
  const game = GameFromPlayerId(playerId, data);
  if (game.state !== GameState.FINAL_RESULTS) {
    throw new FinalError(INCOMPATIBLE_GAME_STATE, 'Game is not in FINAL_RESULTS state');
  }

  // Compose final results: users ranked by score and all questionResults (normalized)
  return {
    usersRankedByScore: game.usersRankedByScore,
    questionResults: game.questionResults.map(q => ({
      questionId: q.questionId,
      playersCorrect: q.playersCorrect.slice(),
      averageAnswerTime: q.averageAnswerTime,
      percentCorrect: q.percentCorrect,
    })),
  };
}
