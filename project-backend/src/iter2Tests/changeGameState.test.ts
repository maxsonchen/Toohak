import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion,
  adminQuizGameStatus, adminQuizGameStart, changeGameState,
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_QUIZ_ID, INCOMPATIBLE_GAME_STATE,
  INVALID_GAME_ID, INVALID_ACTION,
} from '../errorHandling';
import { quizQuestionBody, GameAction, GameState } from '../interface';
jest.setTimeout(12000);

let session1: string, session2: string, quiz1: number, quiz2: number,
  questionBody: quizQuestionBody, game: number;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('foo@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  quiz1 = adminQuizCreate(session1, 'Quiz', 'Description').body.quizId;
  questionBody = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 1,
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
  game = adminQuizGameStart(session1, quiz1, { autoStartNum: 2 }).body.gameId;

  session2 = adminAuthRegister('foo2@bar.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  quiz2 = adminQuizCreate(session2, 'Quiz2', 'Description').body.quizId;
  questionBody = {
    questionBody: {
      question: 'Who is the old Monarch of England?',
      timeLimit: 3,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: false
        }, {
          answer: 'Queen Elizabeth',
          correct: true
        },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  };
  adminQuizQuestion(session2, quiz2, questionBody);
  adminQuizGameStart(session2, quiz2, { autoStartNum: 2 });
});

describe('Invalid game, session & quiz', () => {
  test('Invalid game', () => {
    const res = changeGameState(session1, quiz1, game + 99, { action: GameAction.NEXT_QUESTION });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_GAME_ID));
  });

  test('Invalid session', () => {
    const res = changeGameState(session1 + 1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  });

  test('Invalid quiz', () => {
    const res = changeGameState(session1, quiz2, game, { action: GameAction.NEXT_QUESTION });
    expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));

    const res2 = changeGameState(session1, quiz1 + 99, game, { action: GameAction.NEXT_QUESTION });
    expect(res2).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
  });
});

describe('Invalid action', () => {
  test('Invalid state', () => {
    const res = changeGameState(session1, quiz1, game, { action: 'INVALID_ACTION' });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ACTION));
  });
});

describe('Invalid state', () => {
  test('Invalid state', () => {
    const res = changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_FINAL_RESULTS });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
  });

  test('Edge case - out of questions', async() => {
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    await sleep(2000);
    const res = changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
  });
});

describe('Next Question', () => {
  test('Next Question', () => {
    const result = changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    expect(adminQuizGameStatus(
      session1, quiz1, game).body.state
    ).toStrictEqual(GameState.QUESTION_COUNTDOWN);
  });
});

describe('Skip Countdown', () => {
  test('Skip Countdown', () => {
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    const result = changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    expect(
      adminQuizGameStatus(session1, quiz1, game).body.state).toStrictEqual(GameState.QUESTION_OPEN);
  });
});

describe('Go to answers', () => {
  test('Go to answers', async() => {
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    await sleep(2000);
    const result = changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    expect(
      adminQuizGameStatus(session1, quiz1, game).body.state).toStrictEqual(GameState.ANSWER_SHOW);
  });
});

describe('Go to final results', () => {
  test('Go to final results', async() => {
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    await sleep(2000);
    const result = changeGameState(session1, quiz1,
      game, { action: GameAction.GO_TO_FINAL_RESULTS });
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    expect(
      adminQuizGameStatus(session1, quiz1, game).body.state).toStrictEqual(GameState.FINAL_RESULTS);
  });
});

describe('Go to end', () => {
  test('Go to end', () => {
    const result = changeGameState(session1, quiz1, game, { action: GameAction.END });
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    expect(adminQuizGameStatus(session1, quiz1, game).body.state).toStrictEqual(GameState.END);
  });
});
