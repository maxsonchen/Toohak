import {
  clear, adminAuthRegister,
  adminQuizCreate, adminQuizInfo,
  makeCustomErrorForTest
} from './reqHelper';
import { UNAUTHORISED, INVALID_QUIZ_ID } from '../errorHandling';

let session1: string, quiz1: number, session2: string, quiz2: number;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('foo@bar.com', 'validPassword123', 'Jeff', 'Besos').body.session;
  quiz1 = adminQuizCreate(session1, 'My Quiz', '1531 testing').body.quizId;
  session2 = adminAuthRegister('foo2@bar.com', 'validPassword123', 'Elon', 'Musk').body.session;
  quiz2 = adminQuizCreate(session2, 'Another Quiz', 'More testing!').body.quizId;
});

test('Session is not a valid user', () => {
  const res = adminQuizInfo('1nvalidSess10n', quiz1);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('QuizId does not refer to a valid quiz', () => {
  const res = adminQuizInfo(session1, quiz1 + 99);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Quiz ID does not refer to a quiz that this user owns', () => {
  const res1 = adminQuizInfo(session2, quiz1);
  expect(res1).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));

  const res2 = adminQuizInfo(session1, quiz2);
  expect(res2).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Valid quizIds and userIds', () => {
  const res1 = adminQuizInfo(session1, quiz1);
  expect(res1.body).toStrictEqual({
    quizId: quiz1,
    name: 'My Quiz',
    timeCreated: expect.any(Number),
    timeLastEdited: expect.any(Number),
    description: '1531 testing',
    numQuestions: 0,
    thumbnailUrl: '',
    timeLimit: 0,
    questions: [],
  });
  expect(res1.status).toBe(200);

  const res2 = adminQuizInfo(session2, quiz2);
  expect(res2.body).toStrictEqual({
    quizId: quiz2,
    name: 'Another Quiz',
    timeCreated: expect.any(Number),
    timeLastEdited: expect.any(Number),
    description: 'More testing!',
    numQuestions: 0,
    thumbnailUrl: '',
    timeLimit: 0,
    questions: [],
  });
  expect(res2.status).toBe(200);
});
