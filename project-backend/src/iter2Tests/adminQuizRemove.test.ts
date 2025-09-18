import {
  clear, adminAuthRegister, adminQuizCreate, adminQuizRemove,
  adminQuizList, adminQuizGameStart,
  adminQuizQuestion, makeCustomErrorForTest
} from './reqHelper';
import {
  UNAUTHORISED, ACTIVE_GAME_EXISTS, INVALID_QUIZ_ID,
} from '../errorHandling';
import { quizQuestionBody } from '../interface';

let user1: string, newQuiz1: number, user2: string, questionBody: quizQuestionBody;

// Reset data before each test
beforeEach(() => {
  clear();
  user1 = (adminAuthRegister('foo@bar.com', 'Password1', 'nameFirst', 'nameLast')).body.session;
  newQuiz1 = (adminQuizCreate(user1, 'Quiz 1', 'First Quiz')).body.quizId;
  user2 = (adminAuthRegister('foo2@bar.com', 'Password1', 'nameFirst', 'nameLast')).body.session;
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
  adminQuizQuestion(user1, newQuiz1, questionBody);
  adminQuizQuestion(user1, newQuiz1, questionBody);
});

//  Tests for adminQuizRemove
//  Successful quiz removal
test('successfully remove one quiz', () => {
  const result = adminQuizRemove(user1, newQuiz1, false);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);
});

//  Deleting and adding multiple quizzes
test('removing and adding multiple quizzes v1', () => {
  const newQuiz2 = (adminQuizCreate(user1, 'Quiz 2', 'Second Quiz')).body.quizId;

  let result = adminQuizRemove(user1, newQuiz1, false);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);

  expect(adminQuizCreate(user1, 'Quiz 3', 'Third Quiz').body).toStrictEqual(
    { quizId: expect.any(Number) });

  result = adminQuizRemove(user1, newQuiz2, false);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);

  const list = adminQuizList(user1);
  if ('quizzes' in list) {
    const leftQuizzes = (list.body).quizzes;
    expect(leftQuizzes).toContain('Quiz 3');
    expect(leftQuizzes).not.toContain('Quiz 1');
    expect(leftQuizzes).not.toContain('Quiz 2');
  }
});

test('removing and adding multiple quizzes v2', () => {
  const newQuiz2 = (adminQuizCreate(user1, 'Quiz 2', 'Second Quiz')).body.quizId;

  let result = adminQuizRemove(user1, newQuiz1, true);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);

  expect(adminQuizCreate(user1, 'Quiz 3', 'Third Quiz').body).toStrictEqual(
    { quizId: expect.any(Number) });

  result = adminQuizRemove(user1, newQuiz2, true);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);

  const list = adminQuizList(user1);
  if ('quizzes' in list) {
    const leftQuizzes = (list.body).quizzes;
    expect(leftQuizzes).toContain('Quiz 3');
    expect(leftQuizzes).not.toContain('Quiz 1');
    expect(leftQuizzes).not.toContain('Quiz 2');
  }
});

//  Game still running
test('Any game for this quiz is not in END state', () => {
  const game = adminQuizGameStart(user1, newQuiz1, { autoStartNum: 3 });
  expect(game.body).toStrictEqual({ gameId: expect.any(Number) });
  expect(game.status).toBe(200);
  const result = adminQuizRemove(user1, newQuiz1, true);
  expect(result).toStrictEqual(makeCustomErrorForTest(400, ACTIVE_GAME_EXISTS));
});

//  Invalid user user
test('invalid or empty session', () => {
  const result = adminQuizRemove('Inval1dSess1on', newQuiz1, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

//  Quiz is invalid
test('quiz invalId', () => {
  adminQuizCreate(user1, 'Name', 'Description');
  const result = adminQuizRemove(user1, newQuiz1 + 99, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

//  User does not own quiz
test('quiz not belong to user', () => {
  const result = adminQuizRemove(user2, newQuiz1, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});
