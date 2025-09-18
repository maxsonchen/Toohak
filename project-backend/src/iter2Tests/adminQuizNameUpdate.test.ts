import { QuizList } from '../interface';
import {
  clear,
  adminAuthRegister,
  adminQuizCreate,
  adminQuizNameUpdate,
  adminQuizList,
  makeCustomErrorForTest
} from './reqHelper';
import {
  UNAUTHORISED, DUPLICATE_QUIZ_NAME,
  INVALID_QUIZ_NAME, INVALID_QUIZ_ID
} from '../errorHandling';

let session1: string, session2: string, quiz1: number, quiz2: number;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister(
    'blank@protonmail.com',
    'psswrd123',
    'Greg',
    'Hirsch'
  ).body.session;
  session2 = adminAuthRegister(
    'notblank@protonmail.com', 'psswrd123', 'Tom', 'Wambsgans').body.session;
  quiz1 = adminQuizCreate(session1, 'quiz1', 'quizDes').body.quizId;
  quiz2 = adminQuizCreate(session2, 'Quiz 2', 'QuizDes').body.quizId;
});

test('Test if user session is invalid', () => {
  const idNotExist = adminQuizNameUpdate('Inval1dSessi0n', quiz1, 'newName');
  expect(idNotExist).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  const idBlank = adminQuizNameUpdate('', quiz1, 'newName');
  expect(idBlank).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Test if quiz id is invalid', () => {
  const idNotExist = adminQuizNameUpdate(session1, quiz1 + 1, 'newName');
  expect(idNotExist).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
  const idBlank = adminQuizNameUpdate(session1, NaN, 'newName');
  expect(idBlank).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Test if quiz does not belong to user', () => {
  const wronguser = adminQuizNameUpdate(session1, quiz2, 'newName');
  expect(wronguser).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Test if quiz name has invalid characters', () => {
  const invalidChar = adminQuizNameUpdate(session1, quiz1, 'D!sgu$t!ng Br0th3rs!');
  expect(invalidChar).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
});

test('Test if quiz name is too short', () => {
  const shortName = adminQuizNameUpdate(session1, quiz1, 'um');
  expect(shortName).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
});

test('Test if quiz name is too long', () => {
  const name = ('e').repeat(31);
  const longName = adminQuizNameUpdate(session1, quiz1, name);
  expect(longName).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUIZ_NAME));
});

test('Test if quiz name already exists', () => {
  const newQuiz = adminQuizCreate(session1, 'Quiz2', 'quizDes');
  const sameName = adminQuizNameUpdate(session1, newQuiz.body.quizId, 'Quiz2');
  expect(sameName).toStrictEqual(makeCustomErrorForTest(400, DUPLICATE_QUIZ_NAME));
});

test('Test if function updates name', () => {
  const result = adminQuizNameUpdate(session1, quiz1, 'validName');
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const quizzes = adminQuizList(session1);
  expect(quizzes.status).toStrictEqual(200);

  const updatedQuiz = quizzes.body.quizzes.find((q: QuizList) => q.quizId === quiz1);
  expect(updatedQuiz.name).toBe('validName');
});
