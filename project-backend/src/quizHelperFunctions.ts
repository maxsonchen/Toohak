import {
  Quiz, QuestionAnswer,
  Data, QuizQuestionsComplete,
  QuizGame, GameState
} from './interface';
import {
  FinalError, INVALID_QUIZ_NAME, DUPLICATE_QUIZ_NAME,
  INVALID_DESCRIPTION, INVALID_QUIZ_ID, INVALID_QUESTION_ID,
  INVALID_QUESTION, INVALID_ANSWERS, INVALID_TIMELIMIT,
  INVALID_THUMBNAIL, ACTIVE_GAME_EXISTS,
} from './errorHandling';

// Constants
const MIN_QUIZ_NAME_LENGTH = 3;
const MAX_QUIZ_NAME_LENGTH = 30;
const MAX_QUIZ_DESCRIPTION_LENGTH = 100;
const MAX_QUESTION_LENGTH = 50;
const MIN_QUESTION_LENGTH = 5;
const MAX_POINTS = 10;
const MIN_POINTS = 1;
const MAX_ANSWERS = 6;
const MIN_ANSWERS = 2;
const MAX_ANSWER_LENGTH = 30;
const MIN_ANSWER_LENGTH = 1;
const MIN_TIME_LIMIT = 1;
const MAX_TIME_LIMIT = 180;
const COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];

export function validQuizName(name: string, userId: number, data: Data) {
  const regex = /^[a-zA-Z0-9\s]+$/; // Regex for alid chars

  // Check if quiz name contains invalid characters or is not in specified length
  if (!regex.test(name) || name.length < MIN_QUIZ_NAME_LENGTH ||
      name.length > MAX_QUIZ_NAME_LENGTH) {
    throw new FinalError(INVALID_QUIZ_NAME,
      'Quiz name should be between 3 & 30 characters and only include alphanumeric characters');
  }

  //  Check quiz name doesn't already exist
  if (data.quizzes.some(quiz => quiz.name === name && quiz.ownerId === userId)) {
    throw new FinalError(DUPLICATE_QUIZ_NAME,
      'Quiz name already exists for this user');
  }
}

export function validQuizDescription(description: string) {
  //  Check quiz description is valid
  if (description.length > MAX_QUIZ_DESCRIPTION_LENGTH) {
    throw new FinalError(INVALID_DESCRIPTION,
      'Quiz description should be less than 100 characters');
  }
}

export function checkValidQuiz(quiz: Quiz | undefined, userId: number) {
  if (!quiz) {
    throw new FinalError(INVALID_QUIZ_ID, 'QuizId does not refer to a valid quiz');
  }

  if (quiz.ownerId !== userId) {
    throw new FinalError(INVALID_QUIZ_ID, 'Quiz not owned by user');
  }
}

//  Given a question, determines if the question exists
export function checkQuestionId(question: QuizQuestionsComplete) {
  if (!question) {
    throw new FinalError(INVALID_QUESTION_ID,
      'QuestionId does not refer to a valid question in this quiz');
  }
}

export function validQuestion(question: string, points: number) {
  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    throw new FinalError(INVALID_QUESTION, 'Invalid question length');
  }

  if (points < MIN_POINTS || points > MAX_POINTS) {
    throw new FinalError(INVALID_QUESTION, 'Invalid number of points');
  }
}

export function validAnswers(answerOptions: QuestionAnswer[], quiz: Quiz) {
  if (answerOptions.length < MIN_ANSWERS || answerOptions.length > MAX_ANSWERS) {
    throw new FinalError(INVALID_ANSWERS, 'Answer options must be between 2 and 6');
  }

  if (answerOptions.some(
    answer => answer.answer.length < MIN_ANSWER_LENGTH ||
    answer.answer.length > MAX_ANSWER_LENGTH)
  ) {
    throw new FinalError(INVALID_ANSWERS, 'An answer option is an invalid length');
  }

  if (!answerOptions.some(answer => answer.correct)) {
    throw new FinalError(INVALID_ANSWERS, 'No answer is correct');
  }

  for (const answer of answerOptions) {
    for (const answer2 of answerOptions) {
      if (answer.answer === answer2.answer && answer !== answer2) {
        throw new FinalError(INVALID_ANSWERS, 'Duplicate answer options');
      }
    }
  }
}

export function validTime(timelimit: number, quiz: Quiz, questionid: number): number {
  if (timelimit < MIN_TIME_LIMIT) {
    throw new FinalError(INVALID_TIMELIMIT, 'Timelimit is not positive');
  }

  let time = timelimit;
  for (const question of quiz.questions) {
    if (question.questionId !== questionid) {
      time += question.timeLimit;
    }
  }
  if (time > MAX_TIME_LIMIT) {
    throw new FinalError(INVALID_TIMELIMIT, 'Total time is over 3 mins');
  }
  return time;
}

export function validThumbnail(thumbnail: string) {
  if (thumbnail === '') {
    throw new FinalError(INVALID_THUMBNAIL, 'Thumbnail cannot be empty');
  }
  const startsWithHttp = thumbnail.startsWith('http://') || thumbnail.startsWith('https://');
  const endsWithImageExt = /\.(jpg|jpeg|png)$/i.test(thumbnail);
  if (!startsWithHttp || !endsWithImageExt) {
    throw new FinalError(INVALID_THUMBNAIL, 'Thumbnail is not a valid image or url');
  }
}

export function getRandColour(): string {
  return COLOURS[Math.floor(Math.random() * COLOURS.length)];
}

// from the list of games, determine if a quiz has running games and return error
export function activeGameError(games: QuizGame[], quizId: number) {
  const gamesNotEnded = games.filter(game => game.state !== GameState.END &&
      game.quizId === quizId);
  if (gamesNotEnded.length > 0) {
    throw new FinalError(ACTIVE_GAME_EXISTS, 'A game is still running for this quiz');
  }
}
