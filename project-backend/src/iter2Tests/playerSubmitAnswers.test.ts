import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion, changeGameState,
  adminQuizGameStart, playerJoin, playerSubmitAnswers, adminQuizInfo
} from './reqHelper';
import {
  INVALID_PLAYER_ID, INVALID_POSITION,
  INCOMPATIBLE_GAME_STATE, INVALID_ANSWER_IDS,
} from '../errorHandling';
import { quizQuestionBody, GameAction } from '../interface';
jest.setTimeout(12000);

let session1: string, quiz1: number,
  questionBody: quizQuestionBody, game: number,
  player1: number, q1Ans: number, q2Ans: number,
  q2Ans1: number, q2Ans2: number, q2Ans3: number;

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
  q1Ans = adminQuizInfo(session1, quiz1).body.questions[0].answerOptions[0].answerId;
  q2Ans = adminQuizInfo(session1, quiz1).body.questions[0].answerOptions[1].answerId;

  questionBody = {
    questionBody: {
      question: 'Who is not the Monarch of England?',
      timeLimit: 3,
      points: 3,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: false
        }, {
          answer: 'Queen Elizabeth',
          correct: true
        }, {
          answer: 'Donald Crumpet',
          correct: true
        },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  };
  adminQuizQuestion(session1, quiz1, questionBody);
  q2Ans1 = adminQuizInfo(session1, quiz1).body.questions[1].answerOptions[0].answerId;
  q2Ans2 = adminQuizInfo(session1, quiz1).body.questions[1].answerOptions[1].answerId;
  q2Ans3 = adminQuizInfo(session1, quiz1).body.questions[1].answerOptions[2].answerId;

  game = adminQuizGameStart(session1, quiz1, { autoStartNum: 3 }).body.gameId;
  player1 = playerJoin({ gameId: game, playerName: 'Player One' }).body.playerId;
  // move the game to the 'QUESTION_OPEN STATE' for each test
  changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
  changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
});

// Tests for valid inputs
describe('Valid input tests', () => {
  test('Correctly Answers the First Question', async() => {
    await sleep(1000);
    const result = playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Answers the question wrong', async() => {
    await sleep(1000);
    const result = playerSubmitAnswers({ answerIds: [q2Ans] }, player1, 1);
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Answers the question wrong', async() => {
    await sleep(1000);
    const result = playerSubmitAnswers({ answerIds: [q2Ans, q1Ans] }, player1, 1);
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Answers the question right then wrong', async() => {
    await sleep(1000);
    playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
    const result = playerSubmitAnswers({ answerIds: [q2Ans] }, player1, 1);
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Answers the question wrong then right', async() => {
    await sleep(1000);
    playerSubmitAnswers({ answerIds: [q2Ans] }, player1, 1);
    const result = playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
    expect(result.body).toStrictEqual({});
    expect(result.status).toBe(200);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Multiple Questions and answers all right choices', async() => {
    await sleep(1000);
    playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    await sleep(2000);
    playerSubmitAnswers({ answerIds: [q2Ans2, q2Ans3] }, player1, 2);
    await sleep(1000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });

  test('Multiple Questions and answers all wrong choices', async() => {
    await sleep(1000);
    playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
    await sleep(2000);
    changeGameState(session1, quiz1, game, { action: GameAction.NEXT_QUESTION });
    changeGameState(session1, quiz1, game, { action: GameAction.SKIP_COUNTDOWN });
    await sleep(2000);
    playerSubmitAnswers({ answerIds: [q2Ans1] }, player1, 2);
    await sleep(1000);
    changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  });
});

test('Player ID does not exist', () => {
  const res = playerSubmitAnswers({ answerIds: [q1Ans] }, player1 + 99, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_ID));
});

describe('incorrect question position', () => {
  // valid game state but question position doesn't exist in quiz
  test('question position is not valid for the game this player is in', () => {
    const res = playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 100);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));

    const res2 = playerSubmitAnswers({ answerIds: [q1Ans] }, player1, -100);
    expect(res2).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));
  });

  // attempting to answer for question position 2 (which exists) while on 1st question
  test('game is not currently on this question', () => {
    const res = playerSubmitAnswers({ answerIds: [q2Ans2] }, player1, 2);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));
  });
});

test('Submit answers in wrong game state', async() => {
  // move to ANSWER_SHOW state (incompatible)
  await sleep(3500);
  changeGameState(session1, quiz1, game, { action: GameAction.GO_TO_ANSWER });
  const res = playerSubmitAnswers({ answerIds: [q1Ans] }, player1, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

describe('invalid answer IDs', () => {
  test('Answer IDs are not valid for this particular question', () => {
    const res = playerSubmitAnswers({ answerIds: [-1] }, player1, 1);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWER_IDS));
  });

  test('There are duplicate answer IDs provided', () => {
    const res = playerSubmitAnswers({ answerIds: [q1Ans, q1Ans] }, player1, 1);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWER_IDS));
  });

  test('Less than 1 answer ID was submitted', () => {
    const res = playerSubmitAnswers({ answerIds: [] }, player1, 1);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWER_IDS));
  });
});
