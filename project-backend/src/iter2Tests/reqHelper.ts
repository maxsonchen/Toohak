import request, { HttpVerb } from 'sync-request-curl';
import { port, url } from '../config.json';
import { quizQuestionBody } from '../interface';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5000;

export const makeCustomErrorForTest = (status: number, errorType: string) => ({
  status,
  body: {
    error: errorType,
    message: expect.any(String)
  }
});

const requestHelper = (
  method: HttpVerb,
  path: string,
  payload: object,
  session?: string
) => {
  let query = {};
  let body = {};

  const options: {
    timeout: number;
    headers: Record<string, string>;
    json?: object;
    qs?: object;
  } = {
    timeout: TIMEOUT_MS,
    headers: session ? { session } : {},
  };

  if (['PUT', 'POST'].includes(method)) {
    body = payload;
    options.json = body;
  } else {
    // GET/DELETE
    query = payload;
    options.qs = query;
  }

  const res = request(method, SERVER_URL + path, options);

  return {
    body: JSON.parse(res.body.toString()),
    status: res.statusCode
  };
};

// Auth
export function adminAuthRegister(
  email: string, password: string,
  nameFirst: string, nameLast: string
) {
  return requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast });
}

export function adminAuthLogin(email: string, password: string) {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password });
}

export function adminAuthLogout(session: string) {
  return requestHelper('POST', '/v1/admin/auth/logout', {}, session);
}

export function adminUserDetails(session: string) {
  return requestHelper('GET', '/v1/admin/user/details', {}, session);
}

export function adminUserDetailsUpdate(
  session: string, email: string,
  nameFirst: string, nameLast: string
) {
  return requestHelper('PUT', '/v1/admin/user/details', { email, nameFirst, nameLast }, session);
}

export function adminUserPasswordUpdate(session: string, oldPassword: string, newPassword: string) {
  return requestHelper('PUT', '/v1/admin/user/password', { oldPassword, newPassword }, session);
}

// Quiz
export function adminQuizList(session: string) {
  return requestHelper('GET', '/v1/admin/quiz/list', {}, session);
}

export function adminQuizCreate(session: string, name: string, description: string) {
  return requestHelper('POST', '/v1/admin/quiz', { name, description }, session);
}

export function adminQuizRemove(session: string, quizId: number, isV2: boolean) {
  if (isV2) {
    return requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, {}, session);
  }
  return requestHelper('DELETE', `/v1/admin/quiz/${quizId}`, {}, session);
}

export function adminQuizInfo(session: string, quizId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}`, {}, session);
}

export function adminQuizNameUpdate(session: string, quizId: number, name: string) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/name`, { name }, session);
}

export function adminQuizDescriptionUpdate(session: string, quizId: number, description: string) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/description`, { description }, session);
}

export function adminQuizThumbnail(session: string, quizId: number, thumbnailUrl: string) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/thumbnail`, { thumbnailUrl }, session);
}

export function adminQuizQuestion(session: string, quizId: number, questionBody: quizQuestionBody) {
  return requestHelper('POST', `/v1/admin/quiz/${quizId}/question`, questionBody, session);
}

export function adminQuizQuestionUpdate(
  session: string,
  quizId: number,
  questionId: number,
  body: quizQuestionBody
) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/question/${questionId}`, body, session);
}

export function adminQuizQuestionDelete(
  session: string,
  quizId: number,
  questionId: number,
  isV2: boolean
) {
  if (isV2) {
    return requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, session);
  }
  return requestHelper('DELETE', `/v1/admin/quiz/${quizId}/question/${questionId}`, {}, session);
}

// Game
export function adminGamesInfo(session: string, quizId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/games`, {}, session);
}
export function adminQuizGameStart(session: string, quizId: number, body: {autoStartNum: number}) {
  return requestHelper('POST', `/v1/admin/quiz/${quizId}/game/start`, body, session);
}
export function adminQuizGameStatus(session: string, quizId: number, gameId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/game/${gameId}`, {}, session);
}
export function adminQuizGameResults(session: string, quizId: number, gameId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/game/${gameId}/results`, {}, session);
}
export function changeGameState(
  session: string, quizId: number, gameId: number, body: {action: string}
) {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/game/${gameId}`, body, session);
}

// Player
export function playerJoin(body: {gameId: number, playerName: string}) {
  return requestHelper('POST', '/v1/player/join', body);
}

export function getQuestionPosition(playerid: number, questionposition: number) {
  return requestHelper('GET', `/v1/player/${playerid}/question/${questionposition}`, {});
}

export function getPlayerStatus(playerid: number) {
  return requestHelper('GET', `/v1/player/${playerid}`, {});
}

export function playerSubmitAnswers(
  body: {answerIds: number[]},
  playerId: number,
  questionPosition: number
) {
  return requestHelper('PUT', `/v1/player/${playerId}/question/${questionPosition}/answer`, body);
}

export function playerQuestionResults(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}/results`, {});
}

export async function playerFinalResults(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/results`, {});
}

// Other
export function clear() {
  return requestHelper('DELETE', '/v1/clear', {});
}
