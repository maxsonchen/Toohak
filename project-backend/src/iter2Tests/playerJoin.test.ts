import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion,
  adminQuizGameStart, playerJoin
} from './reqHelper';
import {
  INVALID_PLAYER_NAME, INCOMPATIBLE_GAME_STATE,
  INVALID_GAME_ID,
} from '../errorHandling';
import { quizQuestionBody, GameState } from '../interface';
import { getData, save } from '../dataStore';
jest.setTimeout(12000);

let session1: string, quiz1: number,
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
  game = adminQuizGameStart(session1, quiz1, { autoStartNum: 3 }).body.gameId;
});

describe('Add valid players', () => {
  test('One valid Player', () => {
    const result = playerJoin({ gameId: game, playerName: 'Player One' });
    expect(result.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(result.status).toBe(200);
  });

  test('Multiple valid players', () => {
    playerJoin({ gameId: game, playerName: 'Player One' });
    const result = playerJoin({ gameId: game, playerName: 'Player Two' });
    expect(result.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(result.status).toBe(200);
  });

  test('Valid players with empty strings', () => {
    const result = playerJoin({ gameId: game, playerName: '' });
    expect(result.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(result.status).toBe(200);
    const result2 = playerJoin({ gameId: game, playerName: '' });
    expect(result2.body).toStrictEqual({ playerId: expect.any(Number) });
    expect(result2.status).toBe(200);
  });
});

describe('AutoStart', () => {
  test('Multiple valid players', async () => {
    playerJoin({ gameId: game, playerName: 'Player One' });
    playerJoin({ gameId: game, playerName: 'Player Two' });
    playerJoin({ gameId: game, playerName: 'Player Three' });
    await sleep(1000);
    const data = getData();
    expect(data.games[0].state).toBe('QUESTION_COUNTDOWN');
    await sleep(3000);
    const data2 = getData();
    expect(data2.games[0].state).toBe('QUESTION_OPEN');
    await sleep(3000);
    const data3 = getData();
    expect(data3.games[0].state).toBe('QUESTION_CLOSE');
  });
});

test('INVALID_GAME', () => {
  const res = playerJoin({ gameId: game + 99, playerName: 'Player One' });
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_GAME_ID));
});

test('INCOMPATIBLE_GAME_STATE', () => {
  const data = getData();
  data.games[0].state = GameState.END;
  save(data);
  const res = playerJoin({ gameId: game, playerName: 'Player One' });
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INCOMPATIBLE_GAME_STATE));
});

describe('Invalid player name', () => {
  test('Invalid characters', () => {
    const res = playerJoin({ gameId: game, playerName: '/Pl@yer$ One_*' });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_NAME));
  });

  test('Player already has the same name', () => {
    playerJoin({ gameId: game, playerName: 'Player One' });
    const res = playerJoin({ gameId: game, playerName: 'Player One' });
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PLAYER_NAME));
  });
});
