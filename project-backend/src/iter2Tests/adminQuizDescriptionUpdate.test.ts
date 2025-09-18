import {
  clear, adminAuthRegister, adminQuizCreate,
  adminQuizInfo, adminQuizDescriptionUpdate, makeCustomErrorForTest
} from './reqHelper';
import { UNAUTHORISED, INVALID_DESCRIPTION, INVALID_QUIZ_ID } from '../errorHandling';

let session1: string, session2: string, quiz1: number, quiz2: number;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('foo@bar.com', 'Password1', 'nameFirst', 'nameLast').body.session;
  quiz1 = adminQuizCreate(session1, 'Quiz 1', 'First Quiz').body.quizId;

  session2 = adminAuthRegister('foo2@bar.com', 'Password2', 'nameFirst', 'nameLast').body.session;
  quiz2 = adminQuizCreate(session2, 'Quiz 2', 'Second Quiz').body.quizId;
});

test('UserId is not a valid user', () => {
  const res = adminQuizDescriptionUpdate('inval1dSess10n', quiz1, 'Changed description');
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Quiz ID does not refer to a valid quiz', () => {
  const res = adminQuizDescriptionUpdate(session1, quiz1 + 99, 'Changed description');
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Quiz ID does not refer to a quiz that this user owns', () => {
  const res = adminQuizDescriptionUpdate(session1, quiz2, 'Changed description');
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Description is more than 100 characters', () => {
  const longDescription = ('x').repeat(101);
  const res = adminQuizDescriptionUpdate(session1, quiz1, longDescription);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_DESCRIPTION));
});

describe('Description update on multiple quizzes owned by different users', () => {
  test('Valid description update', () => {
    const res = adminQuizDescriptionUpdate(session1, quiz1, 'Changed description');
    expect(res.body).toStrictEqual({});
    expect(res.status).toBe(200);

    const quiz = adminQuizInfo(session1, quiz1).body;
    expect(quiz.description).toBe('Changed description');
  });

  test('Valid empty description update', () => {
    const res = adminQuizDescriptionUpdate(session2, quiz2, '');
    expect(res.body).toStrictEqual({});
    expect(res.status).toBe(200);

    const quiz = adminQuizInfo(session2, quiz2).body;
    expect(quiz.description).toBe('');
  });

  test('Update again to string 100 length', () => {
    const longDescription = ('x').repeat(100);
    const res = adminQuizDescriptionUpdate(session2, quiz2, longDescription);
    expect(res.body).toStrictEqual({});
    expect(res.status).toBe(200);

    const quiz = adminQuizInfo(session2, quiz2).body;
    expect(quiz.description).toBe(longDescription);
  });
});
