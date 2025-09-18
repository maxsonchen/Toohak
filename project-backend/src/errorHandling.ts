// CONSTANTS FOR ERROR HANDLING

// Status codes
export const BAD_REQUEST = 400;
export const STATUS_UNAUTHORISED = 401;
export const FORBIDDEN = 403;
export const INTERNAL_SERVER_ERROR = 500;
export const OK = 200;

// Error 400
export const INVALID_EMAIL = 'INVALID_EMAIL';
export const INVALID_FIRST_NAME = 'INVALID_FIRST_NAME';
export const INVALID_LAST_NAME = 'INVALID_LAST_NAME';
export const INVALID_PASSWORD = 'INVALID_PASSWORD';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const INVALID_OLD_PASSWORD = 'INVALID_OLD_PASSWORD';
export const INVALID_NEW_PASSWORD = 'INVALID_NEW_PASSWORD';

export const INVALID_QUIZ_NAME = 'INVALID_QUIZ_NAME';
export const DUPLICATE_QUIZ_NAME = 'DUPLICATE_QUIZ_NAME';
export const INVALID_DESCRIPTION = 'INVALID_DESCRIPTION';
export const INVALID_THUMBNAIL = 'INVALID_THUMBNAIL';
export const INVALID_QUESTION = 'INVALID_QUESTION';
export const INVALID_ANSWERS = 'INVALID_ANSWERS';
export const INVALID_TIMELIMIT = 'INVALID_TIMELIMIT';
export const INVALID_QUESTION_ID = 'INVALID_QUESTION_ID';
export const INVALID_ANSWER_IDS = 'INVALID_ANSWER_IDS';

export const INVALID_PLAYER_ID = 'INVALID_PLAYER_ID';
export const INVALID_GAME = 'INVALID_GAME';
export const MAX_ACTIVATE_GAMES = 'MAX_ACTIVATE_GAMES';
export const QUIZ_IS_EMPTY = 'QUIZ_IS_EMPTY';
export const ACTIVE_GAME_EXISTS = 'ACTIVE_GAME_EXISTS';
export const INVALID_GAME_ID = 'INVALID_GAME_ID';
export const INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME';
export const INCOMPATIBLE_GAME_STATE = 'INCOMPATIBLE_GAME_STATE';
export const INVALID_ACTION = 'INVALID_ACTION';
export const INVALID_POSITION = 'INVALID_POSITION';

// Error 401
export const UNAUTHORISED = 'UNAUTHORISED';

// Error 403
export const INVALID_QUIZ_ID = 'INVALID_QUIZ_ID';

// MAPPING ERROR CODES TO STATUS CODES
export const errorStatusCodeMap: { [key: string]: number } = {
  // 400 Bad Request errors
  INVALID_EMAIL: BAD_REQUEST,
  INVALID_FIRST_NAME: BAD_REQUEST,
  INVALID_LAST_NAME: BAD_REQUEST,
  INVALID_PASSWORD: BAD_REQUEST,
  INVALID_CREDENTIALS: BAD_REQUEST,
  INVALID_OLD_PASSWORD: BAD_REQUEST,
  INVALID_NEW_PASSWORD: BAD_REQUEST,

  INVALID_QUIZ_NAME: BAD_REQUEST,
  DUPLICATE_QUIZ_NAME: BAD_REQUEST,
  INVALID_DESCRIPTION: BAD_REQUEST,
  INVALID_THUMBNAIL: BAD_REQUEST,
  INVALID_QUESTION: BAD_REQUEST,
  INVALID_ANSWERS: BAD_REQUEST,
  INVALID_TIMELIMIT: BAD_REQUEST,
  INVALID_QUESTION_ID: BAD_REQUEST,
  INVALID_ANSWER_IDS: BAD_REQUEST,

  INVALID_PLAYER_ID: BAD_REQUEST,
  INVALID_GAME: BAD_REQUEST,
  MAX_ACTIVATE_GAMES: BAD_REQUEST,
  QUIZ_IS_EMPTY: BAD_REQUEST,
  ACTIVE_GAME_EXISTS: BAD_REQUEST,
  INVALID_GAME_ID: BAD_REQUEST,
  INVALID_PLAYER_NAME: BAD_REQUEST,
  INCOMPATIBLE_GAME_STATE: BAD_REQUEST,
  INVALID_ACTION: BAD_REQUEST,
  INVALID_POSITION: BAD_REQUEST,

  // 401 Unauthorised
  UNAUTHORISED: STATUS_UNAUTHORISED,

  // 403 Forbidden
  INVALID_QUIZ_ID: FORBIDDEN,
} as const;

// Iteration 2 error logic
/**
 * Sends a JSON-formatted error response with the appropriate HTTP status code.
 * If the error is known (e.g., validation or business logic errors), responds with 400 Bad Request.
 * Should be modified to return 401 and 403 as required.
 * Otherwise, responds with 500 Internal Server Error.
 *
 * Will be modified as part of iteration3
 *
 * @param result An object representing the error, containing an error code and message.
 * @param res The Express response object used to send the HTTP response.
 */
// export function errorHandler(result: ErrorResponse, res: Response) {
//   if (
//     result.error === INVALID_EMAIL ||
//     result.error === INVALID_FIRST_NAME ||
//     result.error === INVALID_LAST_NAME ||
//     result.error === INVALID_PASSWORD ||
//     result.error === INVALID_CREDENTIALS ||
//     result.error === INVALID_OLD_PASSWORD ||
//     result.error === INVALID_NEW_PASSWORD ||
//     result.error === INVALID_QUIZ_NAME ||
//     result.error === DUPLICATE_QUIZ_NAME ||
//     result.error === INVALID_DESCRIPTION ||
//     result.error === INVALID_THUMBNAIL ||
//     result.error === INVALID_QUESTION ||
//     result.error === INVALID_ANSWERS ||
//     result.error === INVALID_TIMELIMIT ||
//     result.error === INVALID_QUESTION_ID
//   ) {
//     res.status(400).json(result);
//   } else if (result.error === UNAUTHORISED) {
//     res.status(401).json(result);
//   } else if (result.error === INVALID_QUIZ_ID) {
//     res.status(403).json(result);
//   } else {
//     res.status(500).json({
//       error: 'YOU_MESSED_UP',
//       message: 'unexpected error occurred.'
//     });
//   }
// }

// export function hasError(obj: any): obj is ErrorResponse {
//   return obj && typeof obj.error === 'string' && typeof obj.message === 'string';
// }

// Iteration 3 Throw error logic

export class FinalError extends Error {
  statusCode?: number;
  error: string;

  constructor(error: string, message: string, statusCode?: number) {
    super(message);
    this.error = error;
    this.statusCode = statusCode;
  }
}
