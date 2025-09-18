import {
  clear,
  adminAuthRegister,
  adminQuizList,
  adminQuizCreate,
  makeCustomErrorForTest
} from './reqHelper';
import { UNAUTHORISED } from '../errorHandling';

beforeEach(() => {
  clear();
});

describe('adminQuizList', () => {
  test('returns an error for an invalid user session', () => {
    const res = adminQuizList('1nvalidsess10n');
    expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  });

  test('returns empty list when no quizzes exist for a user', () => {
    const session1 = adminAuthRegister('noquiz@example.com', 'Password1', 'First', 'Last');
    const res = adminQuizList(session1.body.session);
    expect(res.status).toStrictEqual(200);
    expect(res.body).toStrictEqual({ quizzes: [] });
  });

  test('correctly list one quiz', () => {
    const session1 = adminAuthRegister('quiz@example.com', 'Password1', 'First', 'Last');
    const quizId1 =
      adminQuizCreate(session1.body.session, 'Quiz Name 1', 'This is the first quiz');
    const res = adminQuizList(session1.body.session);
    expect(res.status).toStrictEqual(200);
    expect(res.body).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1.body.quizId,
          name: 'Quiz Name 1'
        }
      ]
    });
  });

  test('returns only the current user\'s quizzes', () => {
    const session1 = adminAuthRegister('quiz1@example.com', 'Password1', 'First', 'Last');
    const session2 = adminAuthRegister('quiz2@example.com', 'Password1', 'First', 'Last');

    const quizId1 =
      adminQuizCreate(session1.body.session, 'Quiz Name 1', 'This is the first quiz');
    const quizId2 =
      adminQuizCreate(session2.body.session, 'Quiz Name 2', 'This is the second quiz');

    const res1 = adminQuizList(session1.body.session);
    expect(res1.status).toStrictEqual(200);
    expect(res1.body).toStrictEqual({
      quizzes: [
        {
          quizId: quizId1.body.quizId,
          name: 'Quiz Name 1'
        }
      ]
    });
    const res2 = adminQuizList(session2.body.session);
    expect(res2.status).toStrictEqual(200);
    expect(res2.body).toStrictEqual({
      quizzes: [
        {
          quizId: quizId2.body.quizId,
          name: 'Quiz Name 2'
        }
      ]
    });
  });
});
