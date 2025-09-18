import {
  clear, adminAuthRegister, adminQuizCreate,
  adminQuizQuestion, adminQuizGameStart, playerJoin,
  getQuestionPosition, makeCustomErrorForTest, changeGameState
} from './reqHelper';
import {
  INVALID_PLAYER_ID, INVALID_POSITION,
  INCOMPATIBLE_GAME_STATE
} from '../errorHandling';
import { GameAction, quizQuestionBody } from '../interface';
jest.setTimeout(12000);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let session: string, quiz: number, questionBody: quizQuestionBody, game: number,
  player1: number;

beforeEach(async () => {
  clear();
  await sleep(100);

  session = adminAuthRegister('test@test.com', 'validPassword123',
    'nameFirst', 'nameLast').body.session;
  quiz = adminQuizCreate(session, 'Quiz', 'Description').body.quizId;

  questionBody = {
    questionBody: {
      question: 'What is the best food?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Pork',
          correct: true
        }, {
          answer: 'Snails',
          correct: false
        },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  };

  adminQuizQuestion(session, quiz, questionBody);
  adminQuizQuestion(session, quiz, questionBody);

  game = adminQuizGameStart(session, quiz, { autoStartNum: 3 }).body.gameId;
  player1 = playerJoin({ gameId: game, playerName: 'Player 1' }).body.playerId;
});

test('Invalid player ID', () => {
  const res = getQuestionPosition(-50, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_ID));
});

test('Invalid Position - Question is not in game', async () => {
  changeGameState(session, quiz, game, { action: GameAction.NEXT_QUESTION });
  changeGameState(session, quiz, game, { action: GameAction.SKIP_COUNTDOWN });

  const res = getQuestionPosition(player1, -1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));
});

test('Invalid Position - Game is not on question', async () => {
  changeGameState(session, quiz, game, { action: GameAction.NEXT_QUESTION });
  changeGameState(session, quiz, game, { action: GameAction.SKIP_COUNTDOWN });

  const res = getQuestionPosition(player1, 2);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_POSITION));
});

test('Incompatible Game State', async () => {
  // IN LOBBY
  const res = getQuestionPosition(player1, 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session, quiz, game, { action: GameAction.NEXT_QUESTION });
  const res2 = getQuestionPosition(player1, 1);
  expect(res2).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session, quiz, game, { action: GameAction.SKIP_COUNTDOWN });
  changeGameState(session, quiz, game, { action: GameAction.GO_TO_ANSWER });
  changeGameState(session, quiz, game, { action: GameAction.GO_TO_FINAL_RESULTS });
  const res3 = getQuestionPosition(player1, 1);
  expect(res3).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));

  changeGameState(session, quiz, game, { action: GameAction.END });
  const res4 = getQuestionPosition(player1, 1);
  expect(res4).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

test('Successful approach', async () => {
  changeGameState(session, quiz, game, { action: GameAction.NEXT_QUESTION });
  changeGameState(session, quiz, game, { action: GameAction.SKIP_COUNTDOWN });
  const result = getQuestionPosition(player1, 1);

  expect(result.body).toStrictEqual({
    questionId: expect.any(Number),
    question: 'What is the best food?',
    timeLimit: 4,
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
    points: 5,
    answerOptions: [
      {
        answerId: expect.any(Number),
        answer: 'Pork',
        colour: expect.any(String),
      },
      {
        answerId: expect.any(Number),
        answer: 'Snails',
        colour: expect.any(String),
      }
    ]
  });
  expect(result.status).toBe(200);
});
