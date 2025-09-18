import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion,
  adminQuizGameStart, adminGamesInfo
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_QUIZ_ID, INVALID_GAME,
  MAX_ACTIVATE_GAMES, QUIZ_IS_EMPTY
} from '../errorHandling';
import { quizQuestionBody } from '../interface';

let session1: string, session2: string, quiz1: number, questionBody: quizQuestionBody;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('foo@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  session2 = adminAuthRegister('foo2@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  quiz1 = adminQuizCreate(session1, 'Quiz', 'Description').body.quizId;
  questionBody = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        }, {
          answer: 'Queen Elizabeth',
          correct: false
        },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  };
  adminQuizQuestion(session1, quiz1, questionBody);
});

test('Start a valid game', () => {
  const result = adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  expect(result.body).toStrictEqual({ gameId: expect.any(Number) });
  expect(result.status).toBe(200);
  expect(adminGamesInfo(session1, quiz1).body).toStrictEqual({
    activeGames: [result.body.gameId],
    inactiveGames: [],
  });
});

describe('Invalid session', () => {
  test('Empty session', () => {
    const res = adminQuizGameStart('', quiz1, { autoStartNum: 3 });
    expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  });

  test('Session does not exist', () => {
    const res = adminQuizGameStart(session1 + 99, quiz1, { autoStartNum: 3 });
    expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  });
});

describe('Invalid quiz', () => {
  test('Quiz does not exist', () => {
    const res = adminQuizGameStart(session1, quiz1 + 99, { autoStartNum: 3 });
    expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
  });

  test('Quiz does not belog to session', () => {
    const res = adminQuizGameStart(session2, quiz1, { autoStartNum: 3 });
    expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
  });
});

test('INVALID_GAME', () => {
  const res = adminQuizGameStart(session1, quiz1, { autoStartNum: 51 });
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_GAME));
});

test('MAX_ACTIVATE_GAMES', () => {
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });

  const res = adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  expect(res).toStrictEqual(makeCustomErrorForTest(400, MAX_ACTIVATE_GAMES));
});

test('QUIZ_IS_EMPTY', () => {
  const quiz2 = adminQuizCreate(session1, 'New Quiz', 'No Qs').body.quizId;
  const res = adminQuizGameStart(session1, quiz2, { autoStartNum: 3 });
  expect(res).toStrictEqual(makeCustomErrorForTest(400, QUIZ_IS_EMPTY));
});
