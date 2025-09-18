import { QuizGame, GameState, GameAction } from './interface';
import {
  FinalError, INCOMPATIBLE_GAME_STATE,
  INVALID_GAME_ID, INVALID_ACTION,
} from './errorHandling';

export function validGameId(game: QuizGame, quizId: number) {
  if (!game) {
    throw new FinalError(INVALID_GAME_ID, 'GameId does not refer to a valid game');
  }
}

export function isValidAction(state: GameState, action: string) {
  const actionEnum = GameAction[action as keyof typeof GameAction];

  if (!Object.values(GameAction).includes(actionEnum)) {
    throw new FinalError(INVALID_ACTION, 'Action provided is not a valid Action enum');
  }

  const validActions = validMovesMap[state];
  if (!validActions.includes(actionEnum)) {
    throw new FinalError(INCOMPATIBLE_GAME_STATE,
      'Action enum cannot be applied in the current state');
  }
}

export const validMovesMap: { [key in GameState]: GameAction[] } = {
  LOBBY: [GameAction.END, GameAction.NEXT_QUESTION],

  QUESTION_COUNTDOWN: [GameAction.END, GameAction.SKIP_COUNTDOWN],

  QUESTION_OPEN: [GameAction.END, GameAction.GO_TO_ANSWER],

  QUESTION_CLOSE: [
    GameAction.END,
    GameAction.GO_TO_FINAL_RESULTS,
    GameAction.GO_TO_ANSWER,
    GameAction.NEXT_QUESTION,
  ],

  ANSWER_SHOW: [
    GameAction.END,
    GameAction.GO_TO_FINAL_RESULTS,
    GameAction.NEXT_QUESTION,
  ],

  FINAL_RESULTS: [GameAction.END],

  END: [],
} as const;
