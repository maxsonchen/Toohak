import { getData, gameTimers } from '../dataStore';
import {
  clear, adminAuthRegister,
  adminQuizCreate, adminQuizQuestion,
  adminQuizGameStart, playerJoin
} from './reqHelper';

beforeEach(() => {
  clear();
});

test('Test if user data has been reset', () => {
  adminAuthRegister('blank@protonmail.com', 'psswrd123', 'First', 'Last');
  const result = clear();
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});
  // If clear does not reset data, then an error should return instead of a userId.
  const checkClear = adminAuthRegister('blank@protonmail.com', 'psswrd123', 'First', 'Last');
  expect(checkClear.status).toStrictEqual(200);
  expect(checkClear.body).toStrictEqual({ session: expect.any(String) });
});

test('Test if quiz data has been reset', () => {
  const session = adminAuthRegister('blank@protonmail.com', 'psswrd123', 'First', 'Last');
  adminQuizCreate(session.body.session, 'QuizName', 'QuizDescription');
  const result = clear();
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});
  const newSession = adminAuthRegister('blank@protonmail.com', 'psswrd123', 'First', 'Last');
  // If clear does not reset data, then the same quizName should cause an error,
  // if not then quizId will be returned.
  const checkClear = adminQuizCreate(
    newSession.body.session,
    'QuizName',
    'DifferentQuizDescription'
  );
  expect(checkClear.status).toStrictEqual(200);
  expect(checkClear.body).toStrictEqual({ quizId: expect.any(Number) });
});

test('Test if game data has been reset', () => {
  const session1 = adminAuthRegister('foo@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  const quiz1 = adminQuizCreate(session1, 'Quiz', 'Description').body.quizId;
  const questionBody = {
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
  adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
  const result = clear();
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const data = getData();
  expect(data.games.length).toStrictEqual(0);
});

test('Test if timers are removed', () => {
  const session1 = adminAuthRegister('foo@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  const quiz1 = adminQuizCreate(session1, 'Quiz', 'Description').body.quizId;
  const questionBody = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 3,
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
  const game = adminQuizGameStart(session1, quiz1, { autoStartNum: 1 }).body.gameId;
  playerJoin({ gameId: game, playerName: 'Player One' });

  clear();
  expect(gameTimers).toStrictEqual({});
});
