import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion,
  adminQuizGameStart, adminGamesInfo, changeGameState
} from './reqHelper';
import { UNAUTHORISED, INVALID_QUIZ_ID } from '../errorHandling';
import { quizQuestionBody, GameAction } from '../interface';

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

// correctly returns a list of multiple gameId's
describe('successfully returns different combinations of entries in games list', () => {
  test('correctly returns empty games list', () => {
    const result = adminGamesInfo(session1, quiz1);
    expect(result.body).toStrictEqual(
      { activeGames: [], inactiveGames: [] }
    );
    expect(result.status).toBe(200);
  });

  test('correctly returns games list', () => {
    adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
    adminQuizGameStart(session1, quiz1, { autoStartNum: 5 });
    adminQuizGameStart(session1, quiz1, { autoStartNum: 7 });
    const result = adminGamesInfo(session1, quiz1);
    expect(result.body).toStrictEqual(
      {
        activeGames: [expect.any(Number), expect.any(Number), expect.any(Number)],
        inactiveGames: []
      }
    );
    expect(result.status).toBe(200);
  });
  /// ///// Test when update game state function is implemented /////////
  test('correctly returns games list with inactive games', () => {
    const game1 = adminQuizGameStart(session1, quiz1, { autoStartNum: 3 }).body.gameId;
    const game2 = adminQuizGameStart(session1, quiz1, { autoStartNum: 5 }).body.gameId;
    adminQuizGameStart(session1, quiz1, { autoStartNum: 7 });
    changeGameState(session1, quiz1, game1, { action: GameAction.END });
    changeGameState(session1, quiz1, game2, { action: GameAction.END });

    const result = adminGamesInfo(session1, quiz1);
    expect(result.body).toStrictEqual(
      {
        activeGames: [expect.any(Number)],
        inactiveGames: [expect.any(Number), expect.any(Number)]
      }
    );
    expect(result.status).toBe(200);
  });
});

// tests error codes
describe('Invalid session', () => {
  test('Empty session', () => {
    try {
      adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
      adminGamesInfo('', quiz1);
    } catch (err) {
      expect(err).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
    }
  });

  test('Session does not exist', () => {
    try {
      adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
      adminGamesInfo(session1 + 99, quiz1);
    } catch (err) {
      expect(err).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
    }
  });
});

describe('Invalid quiz', () => {
  test('Quiz does not exist', () => {
    try {
      adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
      adminGamesInfo(session1, quiz1 + 999);
    } catch (err) {
      expect(err).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
    }
  });

  test('Quiz does not belog to session', () => {
    try {
      adminQuizGameStart(session1, quiz1, { autoStartNum: 3 });
      adminGamesInfo(session2, quiz1);
    } catch (err) {
      expect(err).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
    }
  });
});
