import {
  QuizGame
} from './interface';
import { FinalError } from './errorHandling';

export function validGameId(game: QuizGame, quizId: number, userId: number) {
  if (!game) {
    throw new FinalError('INVALID_GAME_ID', 'GameId does not refer to a valid game');
  }
  if (game.quizId !== quizId) {
    throw new FinalError('INVALID_GAME_ID', 'Game does not belong to quiz');
  }
  if (game.ownerId !== userId) {
    throw new FinalError('INVALID_GAME_ID', 'Game does not belong to user');
  }
}
