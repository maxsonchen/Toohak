import { getData, save, gameTimers, QUESTION_COUNTDOWN_TIME } from './dataStore';
import { GameState, QuizGame, Data } from './interface';

function clearTimer(gameId: number) {
  if (gameTimers[gameId]) {
    clearTimeout(gameTimers[gameId]);
    delete gameTimers[gameId];
  }
}

export function questionCountdown(game: QuizGame, data: Data) {
  game.state = GameState.QUESTION_COUNTDOWN;
  save(data);
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    const data2 = getData();
    const game2 = data2.games.find(g => g.gameId === game.gameId);
    if (game2 && game2.state === GameState.QUESTION_COUNTDOWN) {
      questionOpen(game2, data2);
    }
    delete gameTimers[game.gameId];
  }, QUESTION_COUNTDOWN_TIME * 1000);
  gameTimers[game.gameId] = timer;
}

export function questionOpen(game: QuizGame, data: Data) {
  clearTimer(game.gameId);
  game.state = GameState.QUESTION_OPEN;

  // Initiase q results data and increase at Q counter
  game.questionOpenTime = Math.round(Date.now() / 1000);
  const qId = game.questions[game.atQuestion].questionId;
  game.atQuestion++;
  game.answerTimes = {};
  game.questionResults.push({
    questionId: qId,
    playersCorrect: [],
    averageAnswerTime: 0,
    percentCorrect: 0,
  });
  save(data);

  const q = game.questions[game.atQuestion - 1];
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    const data2 = getData();
    const game2 = data2.games.find(g => g.gameId === game.gameId);
    if (game2 && game2.state === GameState.QUESTION_OPEN) {
      questionClose(game2, data2);
    }
    delete gameTimers[game.gameId];
  }, q.timeLimit * 1000);
  gameTimers[game.gameId] = timer;
}

export function questionClose(game: QuizGame, data: Data) {
  clearTimer(game.gameId);
  game.state = GameState.QUESTION_CLOSE;

  const qIndex = game.atQuestion - 1;
  const qResults = game.questionResults[qIndex];
  const q = game.questions[qIndex];

  // calculate avg ans time
  const times = Object.values(game.answerTimes);
  if (times.length > 0) {
    qResults.averageAnswerTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  } else {
    qResults.averageAnswerTime = 0;
  }

  // score calc
  let counter = 1;
  for (const playerName of qResults.playersCorrect) {
    const player = game.players.find(p => p.playerName === playerName);
    if (player) {
      const playerScore = Math.round(q.points * (1 / counter));
      player.score += playerScore;
      const ranked = game.usersRankedByScore.find(p => p.playerName === playerName);
      if (ranked) {
        ranked.score += playerScore;
      }
      counter++;
    }
  }

  // percentage correct
  if (game.players.length > 0) {
    qResults.percentCorrect =
      Math.round(qResults.playersCorrect.length / game.players.length * 100);
  } else {
    qResults.percentCorrect = 0;
  }

  // sort players by score
  game.usersRankedByScore.sort((a, b) => b.score - a.score);
  save(data);
}

export function answerShow(game: QuizGame, data: Data) {
  clearTimer(game.gameId);
  game.state = GameState.ANSWER_SHOW;
  save(data);
}

export function finalResults(game: QuizGame, data: Data) {
  clearTimer(game.gameId);
  game.state = GameState.FINAL_RESULTS;
  game.atQuestion = 0;
  save(data);
}

export function endGame(game: QuizGame, data: Data) {
  clearTimer(game.gameId);
  game.state = GameState.END;
  game.atQuestion = 0;
  save(data);
}
