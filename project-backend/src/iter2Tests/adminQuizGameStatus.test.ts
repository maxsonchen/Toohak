import {
  clear, adminAuthRegister,
  adminQuizCreate, adminQuizQuestion,
  adminQuizGameStart, adminQuizGameStatus,
  makeCustomErrorForTest
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_QUIZ_ID,
  INVALID_GAME_ID
} from '../errorHandling';

import { quizQuestionBody } from '../interface';
import { adminQuizInfo } from '../quiz';
import { playerJoin } from '../player';

let
  session1: string,
  session2: string,
  quizId: number,
  gameId: number,
  body: quizQuestionBody,
  qId: number,
  playerName: string;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister(
    'samsepi0l@protonmail.com', 'Mr.R0b0t', 'Elliot', 'Anderson'
  ).body.session;
  session2 = adminAuthRegister(
    'WhiteRose@protonmail.com', 'T1me_2_G0', 'Zhi', 'Zhang'
  ).body.session;
  quizId = adminQuizCreate(session1, 'Name', 'Description').body.quizId;
  body = {
    questionBody: {
      question: 'Who is Elliot',
      timeLimit: 5,
      points: 5,
      answerOptions: [
        { answer: 'Mr. Robot', correct: true },
        { answer: 'The Mastermind', correct: true }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  qId = adminQuizQuestion(session1, quizId, body).body.questionId;
  gameId = adminQuizGameStart(session1, quizId, { autoStartNum: 3 }).body.gameId;
  playerName = 'Vera';
  playerJoin(gameId, playerName);
});

test('Session is empty', () => {
  const res = adminQuizGameStatus('', quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Session does not exist', () => {
  const res = adminQuizGameStatus(session1 + 99, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('User does not own quiz', () => {
  const res = adminQuizGameStatus(session2, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Quiz does not exist', () => {
  const res = adminQuizGameStatus(session1, quizId + 1, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Game does not exist', () => {
  const res = adminQuizGameStatus(session1, quizId, gameId + 1);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_GAME_ID));
});

test('Game does not belong to user', () => {
  const res = adminQuizGameStatus(session2, quizId, gameId);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

test('Successful status check', () => {
  const res = adminQuizGameStatus(session1, quizId, gameId);
  const info = adminQuizInfo(session1, quizId);
  const ansId1 = info.questions[0].answerOptions[0].answerId;
  const ansColour1 = info.questions[0].answerOptions[0].colour;
  const ansId2 = info.questions[0].answerOptions[1].answerId;
  const ansColour2 = info.questions[0].answerOptions[1].colour;
  expect(res.body).toStrictEqual({
    state: 'LOBBY',
    atQuestion: 0,
    players: [playerName],
    metadata: {
      quizId,
      name: 'Name',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Description',
      numQuestions: 1,
      questions: [
        {
          questionId: qId,
          question: 'Who is Elliot',
          timeLimit: 5,
          points: 5,
          thumbnailUrl: 'https://photo.png',
          answerOptions: [
            { answerId: ansId1, answer: 'Mr. Robot', colour: ansColour1, correct: true },
            { answerId: ansId2, answer: 'The Mastermind', colour: ansColour2, correct: true }
          ]
        }
      ],
      timeLimit: 5,
      thumbnailUrl: ''
    }
  });
  expect(res.status).toBe(200);
});
