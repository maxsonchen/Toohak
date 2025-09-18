// Import dependant functions
import { clear, adminAuthRegister, adminQuizCreate, makeCustomErrorForTest } from './reqHelper';
import {
  UNAUTHORISED, DUPLICATE_QUIZ_NAME,
  INVALID_QUIZ_NAME, INVALID_DESCRIPTION,
} from '../errorHandling';
// declare variables
let session1: string;

// Set up data before each test with a user
beforeEach(() => {
  clear();
  session1 =
    adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast').body.session;
});

// Tests for adminQuizCreate
// Successful quiz creation
test('Successfully creates two new quizzes', () => {
  const newQuiz = adminQuizCreate(session1, 'Quiz', 'Description');
  expect(newQuiz.body).toStrictEqual({ quizId: expect.any(Number) });
  expect(newQuiz.status).toStrictEqual(200);
  const newQuiz2 = adminQuizCreate(session1, 'Interesting Name 2', 'Interesting Description');
  expect(newQuiz2.body).toStrictEqual({ quizId: expect.any(Number) });
  expect(newQuiz2.status).toStrictEqual(200);
});

// Invalid Session error
test('Invalid session', () => {
  const newQuiz = adminQuizCreate('wrongInvalidSession', 'Name', 'Description');
  expect(newQuiz).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

// Invalid quiz name
describe('Quiz name inavlid', () => {
  test('Quiz name less than 3 characters', () => {
    const newQuiz = adminQuizCreate(session1, 'Qu', 'Description');
    expect(newQuiz).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
  });

  test('Quiz name greater than 30 characters', () => {
    const longName = ('x').repeat(31);
    const newQuiz = adminQuizCreate(session1, longName, 'Description');
    expect(newQuiz).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
  });

  // Invalid quiz name characters
  test('Name includes invalid characters', () => {
    const newQuiz = adminQuizCreate(session1, 'Quiz$$$', 'Description');
    expect(newQuiz).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
  });

  // Duplicate quiz name
  test('Quiz name is a duplicate of another quiz', () => {
    adminQuizCreate(session1, 'Quiz1', 'First quiz');
    const newQuiz = adminQuizCreate(session1, 'Quiz1', 'Description');
    expect(newQuiz).toStrictEqual(makeCustomErrorForTest(400, DUPLICATE_QUIZ_NAME));
  });
});

// Invalid quiz description
test('Description too long', () => {
  const longDescription = ('x').repeat(101);
  const newQuiz = adminQuizCreate(session1, 'Name', longDescription);
  expect(newQuiz).toStrictEqual(makeCustomErrorForTest(400, INVALID_DESCRIPTION));
});
