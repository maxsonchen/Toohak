import {
  clear,
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestion,
  adminQuizGameStart,
  playerJoin,
  changeGameState,
  playerSubmitAnswers,
  playerFinalResults,
  makeCustomErrorForTest,
} from './reqHelper';
import {
  INCOMPATIBLE_GAME_STATE,
  INVALID_PLAYER_ID,
} from '../errorHandling';
import { GameAction } from '../interface';

jest.setTimeout(20000);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let session: string;
let quizId: number;
let gameId: number;
let playerId: number;
let answerId: number;
let correctAnswerId: number;

beforeEach(async () => {
  await clear();

  const registerRes = await adminAuthRegister('test2@test.com', 'Passing312', 'First', 'Last');
  expect(registerRes.status).toBe(200);
  session = registerRes.body.session;

  const createQuizRes = await adminQuizCreate(session, 'Quiz', 'Info');
  expect(createQuizRes.status).toBe(200);
  quizId = createQuizRes.body.quizId;

  const questionBody = {
    questionBody: {
      question: 'What is 1+1?',
      timeLimit: 1,
      points: 1,
      answerOptions: [
        { answer: '2', correct: true },
        { answer: '3', correct: false },
      ],
      thumbnailUrl: 'http://test.com/img.jpg',
    },
  };

  const questionRes = await adminQuizQuestion(session, quizId, questionBody);
  expect(questionRes.status).toBe(200);
  answerId = questionRes.body.questionId;
  correctAnswerId = answerId * 100;

  const startGameRes = await adminQuizGameStart(session, quizId, { autoStartNum: 1 });
  expect(startGameRes.status).toBe(200);
  gameId = startGameRes.body.gameId;

  const joinRes = await playerJoin({ gameId, playerName: 'P2' });
  expect(joinRes.status).toBe(200);
  playerId = joinRes.body.playerId;
});

test('Returns INVALID_PLAYER_ID for non-existent player', async () => {
  const res = await playerFinalResults(9999);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_ID));
});

test('Returns INCOMPATIBLE_GAME_STATE if not in FINAL_RESULTS', async () => {
  const res = await playerFinalResults(playerId);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

test('Returns correct shape after full game flow with correct answer', async () => {
  // advance to QUESTION_OPEN (skip countdown)
  await changeGameState(session, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });

  // submit correct answer
  const submitRes = await playerSubmitAnswers({ answerIds: [correctAnswerId] }, playerId, 1);
  expect(submitRes.status).toBe(200);
  expect(submitRes.body).toStrictEqual({});

  // go to answer show
  await changeGameState(session, quizId, gameId, { action: GameAction.GO_TO_ANSWER });
  await sleep(100);

  // go to final results
  await changeGameState(session, quizId, gameId, { action: GameAction.GO_TO_FINAL_RESULTS });
  await sleep(100);

  const res = await playerFinalResults(playerId);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    usersRankedByScore: [
      {
        playerName: 'P2',
        score: 1
      }
    ],
    questionResults: [
      {
        questionId: answerId,
        playersCorrect: [
          'P2'
        ],
        averageAnswerTime: 0,
        percentCorrect: 100,
      }
    ],
  });
});
