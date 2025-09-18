import { getData, save } from './dataStore';
import {
  QuizId, QuizList, QuizInfo, Quiz,
  QuizQuestionsComplete, QuestionId, QuestionAnswerProperties,
  quizQuestionBody, EmptyObj
} from './interface';
import {
  validQuizName, validQuizDescription, checkValidQuiz, validAnswers,
  validThumbnail, validTime, validQuestion, getRandColour, checkQuestionId,
  activeGameError
} from './quizHelperFunctions';
import { userFromSession } from './sessionHelperFunctions';

/** Provide a list of all quizzes that are
 *  owned by the currently logged in user.
 *
 * @param {string} session
 *
 * @returns {Object} - Info of the current quiz
 * @throws {ErrorResponse}
 */
export function adminQuizList(session: string): { quizzes: QuizList[] } {
  const data = getData();
  const userId = userFromSession(session, data);

  const quizzes = data.quizzes.filter(q => q.ownerId === userId.userId)
    .map(q => ({ quizId: q.quizId, name: q.name }));

  return { quizzes };
}

/**
 * Creates a quiz
 *
 * @param {string} session
 * @param {string} name
 * @param {string} description
 *
 * @returns {QuizId}
 * @throws {ErrorResponse}
 */
export function adminQuizCreate(
  session: string, name: string, description: string
): QuizId {
  //  Retrieve data
  const data = getData();

  const userId = userFromSession(session, data);
  validQuizName(name, userId.userId, data);
  validQuizDescription(description);

  //  Generate quiz information
  let quizId: QuizId;
  if (data.quizzes.length === 0) {
    quizId = { quizId: 1 };
  } else {
    const maxId = Math.max(...data.quizzes.map(quiz => quiz.quizId));
    quizId = { quizId: maxId + 1 };
  }

  const timestamp = Math.floor(Date.now() / 1000);

  //  adds quiz data to quizzes
  const newQuiz: Quiz = {
    quizId: quizId.quizId,
    ownerId: userId.userId,
    name: name,
    description: description,
    timeCreated: timestamp,
    timeLastEdited: timestamp,
    thumbnailUrl: '',
    timeLimit: 0,
    numQuestions: 0,
    questions: [],
  };
  //  adds quiz object to dataStore
  data.quizzes.push(newQuiz);
  save(data);

  return quizId;
}

/**
* Given a particular quiz, permanently remove the quiz.
* @param {string} session
* @param {number} quizId
*
* @returns {EmptyObj} - Empty {}
* @throws {ErrorResponse}
*/
export function adminQuizRemove(
  session: string, quizId: number, isV2: boolean
): EmptyObj {
  //  Retrieve the quiz data
  const data = getData();

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  // v2 functionality
  if (isV2) {
    activeGameError(data.games, quizId);
  }

  //  Remove the quiz from data
  const removeQuiz = data.quizzes.findIndex(quiz => quiz.quizId === quizId);
  data.quizzes.splice(removeQuiz, 1);
  save(data);

  return {};
}

/**
* Get all of the relevant information about the current quiz.
* @param {string} session
* @param {number} quizId
*
* @returns {QuizInfo}
* @throws {ErrorResponse}
*/
export function adminQuizInfo(session: string, quizId: number): QuizInfo {
  const data = getData();

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  const quizInfo: QuizInfo = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    timeLimit: quiz.timeLimit,
    thumbnailUrl: quiz.thumbnailUrl,
    questions: quiz.questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      timeLimit: q.timeLimit,
      points: q.points,
      answerOptions: q.answerOptions.map((answer) => ({
        answerId: answer.answerId,
        answer: answer.answer,
        colour: answer.colour,
        correct: answer.correct,
      })),
      thumbnailUrl: q.thumbnailUrl,
    })),
  };

  return quizInfo;
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} session
 * @param {number} quizId
 * @param {string} name
 *
 * @returns {EmptyObj} - Empty object
 * @throws {ErrorResponse}
 */
export function adminQuizNameUpdate(session: string, quizId: number, name: string
): EmptyObj {
  const data = getData();

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  validQuizName(name, userId.userId, data);

  quiz.name = name;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  save(data);

  return {};
}

/**
* Update the description of the relevant quiz.
*
* @param {string} session
* @param {number} quizId
* @param {string} description
*
* @returns {object} - Empty object
* @throws {ErrorResponse}
*/
export function adminQuizDescriptionUpdate(
  session: string, quizId: number, description: string
): Record<string, never> {
  const data = getData();

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  validQuizDescription(description);

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.description = description;
  save(data);
  return {};
}

/**
* Creates a quiz question for a given quiz.
*
* @param {string} session
* @param {number} quizId
* @param {quizQuestionBody} questionDetails
*
* @returns {number} QuestionId
* @throws {ErrorResponse}
*/
export function adminQuizQuestion(
  session: string, quizId: number, questionDetails: quizQuestionBody): QuestionId {
  const data = getData();
  const question = questionDetails.questionBody.question;
  const points = questionDetails.questionBody.points;
  const answerOptions = questionDetails.questionBody.answerOptions;
  const timelimit = questionDetails.questionBody.timeLimit;
  const thumbnail = questionDetails.questionBody.thumbnailUrl;

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  validQuestion(question, points);
  validAnswers(answerOptions, quiz);
  const newTimeLimit = validTime(timelimit, quiz, 0);
  validThumbnail(thumbnail);

  //  Generate quiz question Id
  let questionId: QuestionId;
  if (quiz.questions.length === 0) {
    questionId = { questionId: 1 };
  } else {
    const maxId = Math.max(...quiz.questions.map(q => q.questionId));
    questionId = { questionId: maxId + 1 };
  }

  // Complete answers with id and colours
  const completedAnswers: QuestionAnswerProperties[] = answerOptions.map((answer, index) => ({
    answerId: questionId.questionId * 100 + index,
    colour: getRandColour(),
    answer: answer.answer,
    correct: answer.correct,
  }));

  // Make quiz question
  const newQuestion: QuizQuestionsComplete = {
    questionId: questionId.questionId,
    question: question,
    timeLimit: timelimit,
    points: points,
    answerOptions: completedAnswers,
    thumbnailUrl: thumbnail,
  };
  quiz.questions.push(newQuestion);
  quiz.numQuestions++;
  quiz.timeLimit = newTimeLimit;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  save(data);

  return questionId;
}

/**
 * Update a particular question from a quiz.
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} questionid
 * @param {quizQuestionBody} questionDetails
 *
 * @returns {EmptyObj} - Empty object
 * @throws {ErrorResponse}
 */
export function adminQuizQuestionUpdate(
  session: string, quizId: number,
  questionid: number, questionDetails: quizQuestionBody
): EmptyObj {
  const data = getData();
  const question = questionDetails.questionBody.question;
  const points = questionDetails.questionBody.points;
  const answerOptions = questionDetails.questionBody.answerOptions;
  const timeLimit = questionDetails.questionBody.timeLimit;
  const thumbnail = questionDetails.questionBody.thumbnailUrl;

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  validAnswers(answerOptions, quiz);
  const newTimeLimit = validTime(timeLimit, quiz, questionid);
  validThumbnail(thumbnail);
  validQuestion(question, points);
  const updateQuestion = quiz.questions.find(q => q.questionId === questionid);
  checkQuestionId(updateQuestion);

  updateQuestion.question = question;
  updateQuestion.timeLimit = timeLimit;
  updateQuestion.points = points;
  updateQuestion.answerOptions = answerOptions.map((answer, index) => ({
    answerId: updateQuestion.questionId * 100 + index,
    colour: getRandColour(),
    answer: answer.answer,
    correct: answer.correct,
  }));
  updateQuestion.thumbnailUrl = thumbnail;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.timeLimit = newTimeLimit;
  save(data);

  return {};
}

/**
* Delete a particular question from a quiz.
*
* @param {string} session
* @param {number} quizId
* @param {number} questionId
*
* @returns {EmptyObj} - Empty object
* @throws {ErrorResponse}
*/
export function adminQuizQuestionDelete(
  session: string, quizId: number, questionId: number, isV2: boolean
): EmptyObj {
  //  Retrieve the quiz data
  const data = getData();

  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);

  //  Check if question exists
  const question: QuizQuestionsComplete = quiz.questions.find(q => q.questionId === questionId);
  checkQuestionId(question);
  // v2 functionality
  if (isV2) {
    activeGameError(data.games, quizId);
  }

  // get new timelimit
  let newTimeLimit = 0;
  for (const question of quiz.questions) {
    if (question.questionId !== questionId) {
      newTimeLimit += question.timeLimit;
    }
  }

  //  Remove the question from quiz
  const removeQuestion = quiz.questions.findIndex(q => q.questionId === questionId);
  quiz.questions.splice(removeQuestion, 1);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.numQuestions--;
  quiz.timeLimit = newTimeLimit;
  save(data);
  return {};
}

/**
* Update the thumbnail of the relevant quiz.
*
* @param {string} session
* @param {number} quizId
* @param {string} thumbnailUrl
* @returns {EmptyObj | ErrorResponse}
* @throws {ErrorResponse}
*/
export function adminQuizThumbnailUpdate(
  session: string, quizId: number, thumbnailUrl: string
): EmptyObj {
  const data = getData();
  const userId = userFromSession(session, data);
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  checkValidQuiz(quiz, userId.userId);
  validThumbnail(thumbnailUrl);

  // Update quiz
  quiz.thumbnailUrl = thumbnailUrl;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  save(data);
  return {};
}
