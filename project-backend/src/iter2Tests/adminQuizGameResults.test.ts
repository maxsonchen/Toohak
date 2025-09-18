import {
  clear, adminAuthRegister,
  adminQuizCreate, adminQuizQuestion,
  adminQuizGameStart, adminQuizGameResults,
  playerJoin, changeGameState,
  playerSubmitAnswers, makeCustomErrorForTest
} from './reqHelper';
import { quizQuestionBody, GameAction } from '../interface';
import { adminQuizInfo } from '../quiz';
import {
  UNAUTHORISED, INCOMPATIBLE_GAME_STATE,
  INVALID_QUIZ_ID, INVALID_GAME_ID
} from '../errorHandling';
jest.setTimeout(12000);

let session1: string, session2: string, quizId: number,
  gameId: number, body: quizQuestionBody, questionId: number,
  playerId: number, playerName: string;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('Mark.S@lumon.com', '5hes_@live!', 'Mark', 'Scout').body.session;
  session2 = adminAuthRegister(
    'Irving.B@lumon.com', 'Wh@ts_f0r_D!nner?', 'Irving', 'Bailiff'
  ).body.session;
  quizId = adminQuizCreate(session1, 'Name', 'Description').body.quizId;
  body = {
    questionBody: {
      question: 'What is Mr. Egans favourite breakfast?',
      timeLimit: 2,
      points: 5,
      answerOptions: [
        { answer: 'Pancakes', correct: false },
        { answer: 'Waffles', correct: false },
        { answer: 'Raw eggs with Milk', correct: true }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  questionId = adminQuizQuestion(session1, quizId, body).body.questionId;
  gameId = adminQuizGameStart(session1, quizId, { autoStartNum: 3 }).body.gameId;
  playerName = 'Helly R';
  playerId = playerJoin({ gameId, playerName }).body.playerId;
});

test('Session is empty', () => {
  const res = adminQuizGameResults('', quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Session does not exist', () => {
  const res = adminQuizGameResults(session1 + 99, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('User does not own quiz', () => {
  const res = adminQuizGameResults(session2, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Quiz does not exist', () => {
  const res = adminQuizGameResults(session1, quizId + 1, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Game does not exist', () => {
  const res = adminQuizGameResults(session1, quizId, gameId + 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_GAME_ID));
});

test('Incompatible game state', async () => {
  // in lobby
  const res = adminQuizGameResults(session1, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session1, quizId, gameId, { action: GameAction.NEXT_QUESTION });
  const res2 = adminQuizGameResults(session1, quizId, gameId);
  expect(res2).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session1, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });
  const res3 = adminQuizGameResults(session1, quizId, gameId);
  expect(res3).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
  await sleep(2000);
  // q closed
  const res4 = adminQuizGameResults(session1, quizId, gameId);
  expect(res4).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session1, quizId, gameId, { action: GameAction.GO_TO_ANSWER });
  const res5 = adminQuizGameResults(session1, quizId, gameId);
  expect(res5).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session1, quizId, gameId, { action: GameAction.END });
  const res6 = adminQuizGameResults(session1, quizId, gameId);
  expect(res6).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

test('Successful return of results', async () => {
  const info = adminQuizInfo(session1, quizId);
  const ansId = info.questions[0].answerOptions[2].answerId;
  changeGameState(session1, quizId, gameId, { action: GameAction.NEXT_QUESTION });
  changeGameState(session1, quizId, gameId, { action: GameAction.SKIP_COUNTDOWN });
  playerSubmitAnswers({ answerIds: [ansId] }, playerId, 1);
  await sleep(2000);
  changeGameState(session1, quizId, gameId, { action: GameAction.GO_TO_FINAL_RESULTS });
  const res = adminQuizGameResults(session1, quizId, gameId);
  expect(res.body).toStrictEqual({
    usersRankedByScore: [
      {
        playerName: 'Helly R',
        score: 5
      }
    ],
    questionResults: [
      {
        questionId: questionId,
        playersCorrect: [
          'Helly R'
        ],
        averageAnswerTime: 0,
        percentCorrect: 100,
      }
    ]
  });
});
