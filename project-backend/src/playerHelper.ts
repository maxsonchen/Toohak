import { Data, QuizGame } from './interface';
import {
  FinalError, INVALID_PLAYER_ID,
  INVALID_POSITION
} from './errorHandling';

export function genRandName(game: QuizGame) {
  const pick = (chars: string, n: number) =>
    [...chars].sort(() => Math.random() - 0.5).slice(0, n).join('');
  let playerName = pick('abcdefghijklmnopqrstuvwxyz', 5) + pick('0123456789', 3);

  do {
    playerName = pick('abcdefghijklmnopqrstuvwxyz', 5) + pick('0123456789', 3);
  } while (game.players.find(player => player.playerName === playerName));

  return playerName;
}

export function GameFromPlayerId(playerId: number, data: Data) {
  // returns the game containing the unique player
  const game = data.games.find(game => game.players.some(pId => pId.playerId === playerId));
  if (!game) {
    throw new FinalError(INVALID_PLAYER_ID, 'PlayerId does not exist');
  }
  return game;
}

export function positionCheck(questionPosition: number, game: QuizGame) {
  if (questionPosition > game.questions.length || questionPosition <= 0) {
    throw new FinalError(INVALID_POSITION, 'Invalid question postion for this game');
  }

  if (questionPosition !== game.atQuestion) {
    throw new FinalError(INVALID_POSITION, 'Game is not currently on this question');
  }
}

export function checkDuplicates(arr: number[]) {
  const n = arr.length;

  // Create a Set to store the unique elements
  const set = new Set();

  for (let i = 0; i < n; i++) {
    if (set.has(arr[i])) { return true; } else { set.add(arr[i]); }
  }
  return false;
}
