import {
  clear,
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestion,
  adminQuizGameStart,
  playerJoin,
  playerSubmitAnswers,
  changeGameState,
  playerQuestionResults,
  makeCustomErrorForTest,
} from './reqHelper';
import {
  INVALID_PLAYER_ID,
  INVALID_POSITION,
  INCOMPATIBLE_GAME_STATE,
} from '../errorHandling';
import { GameAction } from '../interface';

jest.setTimeout(20000);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let session: string;
let quizId: number;
let gameId: number;
let playerId: number;
let answerId: number;
let correctAnswerId: number;

beforeEach(async () => {
  await clear();

  const registerRes = await adminAuthRegister('test@test.com', 'Passing312', 'First', 'Last');
  expect(registerRes.status).toBe(200);
  session = registerRes.body.session;

  const createQuizRes = await adminQuizCreate(session, 'Quiz', 'Info');
  expect(createQuizRes.status).toBe(200);
  quizId = createQuizRes.body.quizId;

  const questionBody = {
    questionBody: {
      question: 'What is 2+2?',
      timeLimit: 1,
      points: 1,
      answerOptions: [
        { answer: '4', correct: true },
        { answer: '3', correct: false },
      ],
      thumbnailUrl: 'http://test.com/img.jpg',
    },
  };

  const questionRes = await adminQuizQuestion(session, quizId, questionBody);
  expect(questionRes.status).toBe(200);
  answerId = questionRes.body.questionId;
  correctAnswerId = answerId * 100;

  const startGameRes = await adminQuizGameStart(session, quizId, { autoStartNum: 1 });
  expect(startGameRes.status).toBe(200);
  gameId = startGameRes.body.gameId;

  const joinRes = await playerJoin({ gameId, playerName: 'P1' });
  expect(joinRes.status).toBe(200);
  playerId = joinRes.body.playerId;
});

test('Returns INVALID_PLAYER_ID for non-existent player', async () => {
  const res = await playerQuestionResults(9999, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_ID));
});

test('Returns INCOMPATIBLE_GAME_STATE if game not in ANSWER_SHOW', async () => {
  const res = await playerQuestionResults(playerId, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

test('Returns INVALID_POSITION when questionPosition is invalid', async () => {
  await changeGameState(session, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });
  await sleep(100);
  await changeGameState(session, quizId, gameId, { action: GameAction.GO_TO_ANSWER });

  const res = await playerQuestionResults(playerId, 2); // invalid position
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));
});

test('Returns correct shape after ANSWER_SHOW with correct answer (100%)', async () => {
  await changeGameState(session, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });
  await sleep(100);

  const submitRes = await playerSubmitAnswers({ answerIds: [correctAnswerId] }, playerId, 1);
  expect(submitRes.status).toBe(200);
  expect(submitRes.body).toStrictEqual({});
  await sleep(1000);

  await changeGameState(session, quizId, gameId, { action: GameAction.GO_TO_ANSWER });
  await sleep(100);

  const res = await playerQuestionResults(playerId, 1);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    questionId: answerId,
    playersCorrect: [
      'P1'
    ],
    averageAnswerTime: 0,
    percentCorrect: 100,
  });

  expect(res.body.playersCorrect.length).toBe(1);
  expect(res.body.percentCorrect).toBe(100);
});

test('Returns correct shape after ANSWER_SHOW with incorrect answer (0%)', () => {
  changeGameState(session, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });

  // Use a wrong-but-existing answer ID. Based on your mapping, correctAnswerId = questionId * 100,
  // so the other option is +1.
  const wrongAnswerId = correctAnswerId + 1;

  const submitRes = playerSubmitAnswers({ answerIds: [wrongAnswerId] }, playerId, 1);
  expect(submitRes.status).toBe(200);
  expect(submitRes.body).toStrictEqual({});

  changeGameState(session, quizId, gameId, { action: GameAction.GO_TO_ANSWER });

  const res = playerQuestionResults(playerId, 1);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    questionId: answerId,
    playersCorrect: [],
    averageAnswerTime: 0,
    percentCorrect: 0,
  });

  expect(res.body.playersCorrect.length).toBe(0);
  expect(res.body.percentCorrect).toBe(0);
});
