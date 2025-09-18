import { getData, save } from './dataStore';
import {
  GameId, QuizGame, GameState,
  GameAction, GameStatus,
  GameResults, listGames,
  EmptyObj
} from './interface';
import { userFromSession } from './sessionHelperFunctions';
import { checkValidQuiz } from './quizHelperFunctions';
import { validGameId, isValidAction } from './gameHelper';
import {
  questionOpen, questionCountdown, questionClose,
  answerShow, finalResults, endGame
} from './gameStateMach';
import {
  FinalError, INCOMPATIBLE_GAME_STATE, INVALID_GAME,
  MAX_ACTIVATE_GAMES, QUIZ_IS_EMPTY,
} from './errorHandling';

/** Retrieves active and inactive game ids (sorted in ascending order) for a quiz
 *
 * @param {string} session
 * @param {number} quizId
 *
 * @returns {Object} - Id arrays of the active and inactive games
 * @throws {ErrorResponse}
 */
export function adminGamesInfo(session: string, quizId: number): listGames {
  const data = getData();
  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  // Organise active and inactive games into ordered arrays
  const activeGamesList = data.games.filter(game => game.state !== GameState.END &&
    game.quizId === quizId);
  const activeGames: number[] = activeGamesList.map((game: QuizGame) => game.gameId);
  // sorts as numerically ascending
  activeGames.sort((a, b) => a - b);

  const inactiveGamesList = data.games.filter(game => game.state === GameState.END &&
    game.quizId === quizId);
  const inactiveGames: number[] = inactiveGamesList.map((game: QuizGame) => game.gameId);
  inactiveGames.sort((a, b) => a - b);

  return {
    activeGames: activeGames,
    inactiveGames: inactiveGames
  };
}

/** Start a new game for a quiz
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} autoStartNum
 *
 * @returns {Object} - GameId
 * @throws {ErrorResponse}
 */
export function adminQuizGameStart(session: string, quizId: number, autoStartNum: number): GameId {
  const data = getData();
  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  if (autoStartNum > 50) {
    throw new FinalError(INVALID_GAME, 'autoStartNum is a number greater than 50');
  }

  const gamesNotEnded = data.games.filter(game => game.state !== GameState.END &&
    game.quizId === quizId);
  if (gamesNotEnded.length >= 10) {
    throw new FinalError(MAX_ACTIVATE_GAMES,
      '10 games that are not in END state currently exist for this quiz');
  }

  if (quiz.numQuestions === 0) {
    throw new FinalError(QUIZ_IS_EMPTY, 'The quiz does not have any questions in it');
  }

  //  Generate quiz information
  let gameId: GameId;
  if (data.games.length === 0) {
    gameId = { gameId: 1 };
  } else {
    const maxId = Math.max(...data.games.map(game => game.gameId));
    gameId = { gameId: maxId + 1 };
  }

  //  adds quiz data to quizzes
  const newGame: QuizGame = {
    // Quiz
    name: quiz.name,
    description: quiz.description,
    thumbnailUrl: quiz.thumbnailUrl,
    questions: quiz.questions,
    quizId: quiz.quizId,
    ownerId: quiz.ownerId,
    numQuestions: quiz.numQuestions,
    timeLimit: quiz.timeLimit,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,

    // Game
    gameId: gameId.gameId,
    state: GameState.LOBBY,
    autoStartNum: autoStartNum,
    players: [],
    atQuestion: 0,
    answerTimes: {},
    questionResults: [],
    usersRankedByScore: [],
  };

  // add game to quiz and newGame to dataStore
  data.games.push(newGame);
  save(data);
  return gameId;
}

/** Retrieve the status of a game
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} gameId
 *
 * @returns {Object} - info of the current game
 * @throws {ErrorResponse}
 */
export function adminQuizGameStatus(session: string, quizId: number, gameId: number): GameStatus {
  const data = getData();
  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  const game = data.games.find(game => game.gameId === gameId);
  validGameId(game, quizId);

  const gameStatus: GameStatus = {
    state: game.state,
    atQuestion: game.atQuestion,
    players: game.players.map((p) => p.playerName),
    metadata: {
      quizId: quiz.quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numQuestions: quiz.questions.length,
      timeLimit: quiz.timeLimit,
      thumbnailUrl: quiz.thumbnailUrl,
      questions: quiz.questions.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        timeLimit: q.timeLimit,
        points: q.points,
        answerOptions: q.answerOptions.map((answer) => ({
          answerId: answer.answerId,
          answer: answer.answer,
          colour: answer.colour,
          correct: answer.correct,
        })),
        thumbnailUrl: q.thumbnailUrl,
      })),
    }
  };
  return gameStatus;
}

/** Retrieve results of a game
 *
 * @param {string} quizId
 * @param {number} session
 * @param {number} gameId
 *
 * @returns {Object} - Results of the current game
 * @throws {ErrorResponse}
 */
export function adminQuizGameResults(session: string, quizId: number, gameId: number): GameResults {
  const data = getData();
  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  const game = data.games.find(game => game.gameId === gameId);
  validGameId(game, quizId);
  if (game.state !== GameState.FINAL_RESULTS) {
    throw new FinalError('INCOMPATIBLE_GAME_STATE', 'Game is not in FINAL_RESULTS state');
  }

  const gameResults: GameResults = {
    usersRankedByScore: game.usersRankedByScore,
    questionResults: game.questionResults
  };
  return gameResults;
}

/** Change the game state
 *
 * @param {enum} action
 *
 * @returns {Object} - {}
 * @throws {ErrorResponse}
 */
export function changeGameState(
  quizId: number, gameId: number,
  session: string, action: string
): EmptyObj {
  const data = getData();
  const user = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);

  const game = data.games.find(g => g.gameId === gameId);
  checkValidQuiz(quiz, user.userId);
  validGameId(game, quizId);
  isValidAction(game.state, action);

  checkValidQuiz(quiz, user.userId);

  if (action === GameAction.SKIP_COUNTDOWN) {
    questionOpen(game, data);
  }

  if (action === GameAction.NEXT_QUESTION) {
    if (game.atQuestion >= game.numQuestions) {
      throw new FinalError(INCOMPATIBLE_GAME_STATE,
        'Action enum cannot be applied in the current state');
    }
    questionCountdown(game, data);
  }

  if (action === GameAction.GO_TO_ANSWER) {
    if (game.state === GameState.QUESTION_OPEN) {
      questionClose(game, data);
    }
    answerShow(game, data);
  }

  if (action === GameAction.GO_TO_FINAL_RESULTS) {
    finalResults(game, data);
  }

  if (action === GameAction.END) {
    endGame(game, data);
  }
  return {};
}
