import { quizQuestionBody } from '../interface';
import {
  clear, adminAuthRegister, adminQuizCreate, adminQuizQuestion,
  makeCustomErrorForTest, adminQuizQuestionDelete, adminQuizInfo,
  adminQuizGameStart
} from './reqHelper';
import {
  UNAUTHORISED, ACTIVE_GAME_EXISTS,
  INVALID_QUESTION_ID, INVALID_QUIZ_ID,
} from '../errorHandling';

// declare variables
let user1: string, user2: string, quiz1: number, question1: number, question2: number;
let questionBody: quizQuestionBody;

// Set up data before each test with a user
beforeEach(() => {
  clear();
  user1 =
    adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast').body.session;
  user2 =
    adminAuthRegister('foo2@bar.com', 'validPassword123', 'nameFirst', 'nameLast').body.session;
  quiz1 = adminQuizCreate(user1, 'Quiz', 'Description').body.quizId;
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
  question1 = adminQuizQuestion(user1, quiz1, questionBody).body.questionId;
  question2 = adminQuizQuestion(user1, quiz1, questionBody).body.questionId;
});

// Tests for adminQuizQuestionDelete
test('Successfully Deletes a quiz question v1', () => {
  const result = adminQuizQuestionDelete(user1, quiz1, question1, false);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);
});

test('Successfully Deletes a quiz question v2', () => {
  const result = adminQuizQuestionDelete(user1, quiz1, question1, true);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);
});

test('Successfully Deletes multiple quiz questions', () => {
  const result = adminQuizQuestionDelete(user1, quiz1, question1, false);
  expect(result.body).toStrictEqual({});
  expect(result.status).toStrictEqual(200);

  // makes 3rd question and deletes 2nd
  const question3 =
    adminQuizQuestion(user1, quiz1, questionBody).body;
  const result2 = adminQuizQuestionDelete(user1, quiz1, question2, false);
  expect(result2.body).toStrictEqual({});
  expect(result2.status).toStrictEqual(200);

  // Check question 3 is the remaining question, and it the only one in array
  const qInfo = adminQuizInfo(user1, quiz1);
  expect(qInfo.body.questions[0].questionId).toStrictEqual(question3.questionId);
  expect(qInfo.body.numQuestions).toStrictEqual(1);
});

//  Game still running
test('Any game for this quiz is not in END state', () => {
  const game = adminQuizGameStart(user1, quiz1, { autoStartNum: 3 });
  expect(game.body).toStrictEqual({ gameId: expect.any(Number) });
  expect(game.status).toBe(200);
  const result = adminQuizQuestionDelete(user1, quiz1, question1, true);
  expect(result).toStrictEqual(makeCustomErrorForTest(400, ACTIVE_GAME_EXISTS));
});

//  Invalid question Id
test('quiz invalId', () => {
  const result = adminQuizQuestionDelete(user1, quiz1, question1 + 99, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION_ID));
});

//  Invalid user user
test('invalid or empty session', () => {
  const result = adminQuizQuestionDelete('Inval1dSess1on', quiz1, question1, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

//  Quiz is invalid
test('quiz invalId', () => {
  const result = adminQuizQuestionDelete(user1, quiz1 + 99, question1, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

//  User does not own quiz
test('quiz not belong to user', () => {
  const result = adminQuizQuestionDelete(user2, quiz1, question1, false);
  expect(result).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});
