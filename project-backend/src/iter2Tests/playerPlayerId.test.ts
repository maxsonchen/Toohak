import {
  clear, adminAuthRegister, adminQuizCreate, adminQuizQuestion,
  adminQuizGameStart, playerJoin, getPlayerStatus, makeCustomErrorForTest
} from './reqHelper';
import { quizQuestionBody } from '../interface';

let session: string, quiz: number, questionBody: quizQuestionBody, game: number;

beforeEach(() => {
  clear();

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
  game = adminQuizGameStart(session, quiz, { autoStartNum: 3 }).body.gameId;
});

test('Invalid player id', () => {
  const res = getPlayerStatus(-1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, 'INVALID_PLAYER_ID'));
});

test('Valid Player Id and Return Type', () => {
  const playerid = playerJoin({ gameId: game, playerName: 'Player 2' }).body.playerId;
  const result = getPlayerStatus(playerid);
  expect(result.body).toStrictEqual({
    state: expect.any(String),
    numQuestions: expect.any(Number),
    atQuestion: expect.any(Number)
  });

  expect(result.status).toBe(200);
});
