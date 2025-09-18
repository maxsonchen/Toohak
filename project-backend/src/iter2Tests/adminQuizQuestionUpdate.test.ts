import {
  clear, adminAuthRegister, adminQuizCreate,
  makeCustomErrorForTest, adminQuizQuestion,
  adminQuizInfo, adminQuizQuestionUpdate
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_QUESTION_ID, INVALID_TIMELIMIT, INVALID_THUMBNAIL,
  INVALID_QUIZ_ID, INVALID_QUESTION, INVALID_ANSWERS
} from '../errorHandling';
import { quizQuestionBody } from '../interface';

let session: string, quizId: number, questionId: number, body: quizQuestionBody;

beforeEach(() => {
  clear();
  session = adminAuthRegister(
    'itsaulgoodman@protonmail.com',
    'Sl1pp1nJ1mmy',
    'Jimmy',
    'McGill'
  ).body.session;
  quizId = adminQuizCreate(session, 'SamoanUniLaw', 'thumbnail').body.quizId;
  body = {
    questionBody: {
      question: 'True or false',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  questionId = adminQuizQuestion(session, quizId, body).body.questionId;
});

test('Session is empty or invalid', () => {
  const res = adminQuizQuestionUpdate('n0t@sess1on', quizId, questionId, body);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('QuizId is invalid or user does not own quiz', () => {
  const res = adminQuizQuestionUpdate(session, quizId + 1, questionId, body);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});
test('QuestionId is not a valid question within this quiz', () => {
  const res = adminQuizQuestionUpdate(session, quizId, questionId + 1, body);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION_ID));
});

test('Question is less than 5 chars', () => {
  const newBody = {
    questionBody: {
      question: 'JMM',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION));
});

test('Question is greater than 50 chars', () => {
  const newBody = {
    questionBody: {
      question: 'X'.repeat(51),
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION));
});

test('Points is less than 1', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 0,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION));
});

test('Points is greater than 10', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 11,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_QUESTION));
});

test('Question has more than 6 answers', () => {
  const newBody = {
    questionBody: {
      question: 'What colour suit should I wear?',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'Red', correct: true },
        { answer: 'Yellow', correct: false },
        { answer: 'Orange', correct: false },
        { answer: 'Blue', correct: false },
        { answer: 'Lime', correct: false },
        { answer: 'Purple', correct: false },
        { answer: 'Pink', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('Question has less than 2 answers', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('Length of any answer is less than 1 char', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: '', correct: true },
        { answer: '', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('Length of any answer is more than 30 chars', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'X'.repeat(31), correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('Duplicate answers', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'True', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('No Correct Answers', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'False', correct: false },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_ANSWERS));
});

test('Time Limit is negative', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: -5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_TIMELIMIT));
});

test('Total Time Limit exceeds 3 minutes', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 10,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const newQuestionId = adminQuizQuestion(session, quizId, newBody).body.questionId;
  const updateBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 180,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, newQuestionId, updateBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_TIMELIMIT));
});

test('ThumbnailUrl is empty', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: ''
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
});

test('ThumbnailUrl has incorrect filetype', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.mp4'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
});

test('ThumbnailUrl does not begin with http:// or https://', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'www://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
});

test('Successful Question Update', () => {
  const newBody = {
    questionBody: {
      question: 'True or False',
      timeLimit: 5,
      points: 1,
      answerOptions: [
        { answer: 'True', correct: true },
        { answer: 'False', correct: false }
      ],
      thumbnailUrl: 'https://photo.png'
    }
  };
  const res = adminQuizQuestionUpdate(session, quizId, questionId, newBody);
  expect(res.status).toStrictEqual(200);
  expect(res.body).toStrictEqual({});

  const quiz = adminQuizInfo(session, quizId);
  expect(quiz.body.questions[0]).toStrictEqual({
    questionId: expect.any(Number),
    question: 'True or False',
    timeLimit: 5,
    points: 1,
    answerOptions: [
      {
        answerId: expect.any(Number),
        colour: expect.any(String),
        answer: 'True',
        correct: true,
      },
      {
        answerId: expect.any(Number),
        colour: expect.any(String),
        answer: 'False',
        correct: false,
      }
    ],
    thumbnailUrl: 'https://photo.png',
  });
});
