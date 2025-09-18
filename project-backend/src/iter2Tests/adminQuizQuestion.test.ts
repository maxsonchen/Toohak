import {
  clear, adminAuthRegister, adminQuizCreate, makeCustomErrorForTest,
  adminQuizQuestion, adminQuizInfo
} from './reqHelper';
import { quizQuestionBody } from '../interface';
import {
  UNAUTHORISED, INVALID_TIMELIMIT, INVALID_THUMBNAIL,
  INVALID_QUIZ_ID, INVALID_QUESTION, INVALID_ANSWERS,
} from '../errorHandling';

const COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];

let session: string, quizId: number;

beforeEach(() => {
  clear();
  session =
    adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast').body.session;
  quizId = adminQuizCreate(session, 'My Animal Quiz', '1531 testing').body.quizId;
});

test('Session is not a valid user', () => {
  const qbody: quizQuestionBody = {
    questionBody: {
      question: 'Dog or Cat?',
      timeLimit: 10,
      points: 2,
      answerOptions: [
        { answer: 'Dog', correct: true },
        { answer: 'Cat', correct: false }
      ],
      thumbnailUrl: 'https://imageofadog.jpg'
    }
  };
  const res = adminQuizQuestion('1nvalidSess10n', quizId, qbody);
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('QuizId does not refer to a valid quiz', () => {
  const qbody: quizQuestionBody = {
    questionBody: {
      question: 'Dog or Cat?',
      timeLimit: 10,
      points: 2,
      answerOptions: [
        { answer: 'Dog', correct: true },
        { answer: 'Cat', correct: false }
      ],
      thumbnailUrl: 'https://imageofadog.jpg'
    }
  };
  const res = adminQuizQuestion(session, quizId + 99, qbody);
  expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
});

describe('Invalid question', () => {
  test('Too short', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Hi!',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_QUESTION));
  });

  test('Too long', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: '?'.repeat(51),
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_QUESTION));
  });

  test('Points < 1', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 0,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_QUESTION));
  });

  test('Points > 10', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 11,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_QUESTION));
  });
});

describe('Invalid answers', () => {
  test('Too few answers', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });

  test('Too many answers', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Too many?',
        timeLimit: 10,
        points: 2,
        answerOptions: [
          { answer: '1', correct: true }, { answer: '2', correct: false },
          { answer: '3', correct: false }, { answer: '4', correct: false },
          { answer: '5', correct: false }, { answer: '6', correct: false },
          { answer: '7', correct: false }
        ],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });

  test('Answer too short', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: '', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });

  test('Answer too long', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [
          { answer: 'dog'.repeat(31), correct: true },
          { answer: 'Cat', correct: false }
        ],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });

  test('Duplicate answers', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Dog', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });

  test('No correct answer', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: false }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_ANSWERS));
  });
});

describe('Invalid timelimit', () => {
  test('Time limit is zero', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 0,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_TIMELIMIT));
  });

  test('Time exceeds 3mins', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 180,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };
    adminQuizQuestion(session, quizId, qbody);

    const final: quizQuestionBody = {
      questionBody: {
        question: 'Too long now?',
        timeLimit: 1,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.jpg'
      }
    };

    expect(adminQuizQuestion(session, quizId, final)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_TIMELIMIT));
  });
});

describe('Invalid thumbnail', () => {
  test('Empty string thumbnail', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: ''
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });

  test('Invalid file extension', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'https://imageofadog.notright'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });

  test('Invalid URL format', () => {
    const qbody: quizQuestionBody = {
      questionBody: {
        question: 'Dog or Cat?',
        timeLimit: 10,
        points: 2,
        answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
        thumbnailUrl: 'ftp://imageofadog.jpg'
      }
    };
    expect(adminQuizQuestion(session, quizId, qbody)).toStrictEqual(
      makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });
});

test('Create a valid quiz question', () => {
  const qbody: quizQuestionBody = {
    questionBody: {
      question: 'Dog or Cat?',
      timeLimit: 20,
      points: 5,
      answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
      thumbnailUrl: 'https://imageofadog.jpeg'
    }
  };
  const res = adminQuizQuestion(session, quizId, qbody);
  expect(res.body).toStrictEqual({ questionId: expect.any(Number) });
  expect(res.status).toBe(200);

  const quiz = adminQuizInfo(session, quizId);
  expect(quiz.body.numQuestions).toBe(1);
  expect(quiz.body.questions[0]).toStrictEqual({
    questionId: expect.any(Number),
    question: 'Dog or Cat?',
    timeLimit: 20,
    points: 5,
    answerOptions: [
      { answerId: expect.any(Number), answer: 'Dog', colour: expect.any(String), correct: true },
      { answerId: expect.any(Number), answer: 'Cat', colour: expect.any(String), correct: false }
    ],
    thumbnailUrl: 'https://imageofadog.jpeg',
  });

  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[0].colour);
  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[1].colour);
});

test('Create multiple valid quiz questions', () => {
  const qbody: quizQuestionBody = {
    questionBody: {
      question: 'Dog or Cat?',
      timeLimit: 20,
      points: 5,
      answerOptions: [{ answer: 'Dog', correct: true }, { answer: 'Cat', correct: false }],
      thumbnailUrl: 'https://imageofadog.jpeg'
    }
  };
  const res = adminQuizQuestion(session, quizId, qbody);
  expect(res.body).toStrictEqual({ questionId: expect.any(Number) });
  expect(res.status).toBe(200);

  const qbody2: quizQuestionBody = {
    questionBody: {
      question: 'Cat or Dog?',
      timeLimit: 30,
      points: 7,
      answerOptions: [{ answer: 'Cat', correct: true }, { answer: 'Dog', correct: false }],
      thumbnailUrl: 'https://imageofacat.jpeg'
    }
  };

  const res2 = adminQuizQuestion(session, quizId, qbody2);
  expect(res2.body).toStrictEqual({ questionId: expect.any(Number) });
  expect(res2.status).toBe(200);

  const quiz = adminQuizInfo(session, quizId);
  expect(quiz.body.numQuestions).toBe(2);
  expect(quiz.body.questions[0]).toStrictEqual({
    questionId: expect.any(Number),
    question: 'Dog or Cat?',
    timeLimit: 20,
    points: 5,
    answerOptions: [
      { answerId: expect.any(Number), answer: 'Dog', colour: expect.any(String), correct: true },
      { answerId: expect.any(Number), answer: 'Cat', colour: expect.any(String), correct: false }
    ],
    thumbnailUrl: 'https://imageofadog.jpeg',
  });
  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[0].colour);
  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[1].colour);

  expect(quiz.body.questions[1]).toStrictEqual({
    questionId: expect.any(Number),
    question: 'Cat or Dog?',
    timeLimit: 30,
    points: 7,
    answerOptions: [
      { answerId: expect.any(Number), answer: 'Cat', colour: expect.any(String), correct: true },
      { answerId: expect.any(Number), answer: 'Dog', colour: expect.any(String), correct: false }
    ],
    thumbnailUrl: 'https://imageofacat.jpeg',
  });
  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[0].colour);
  expect(COLOURS).toContain(quiz.body.questions[0].answerOptions[1].colour);
});
