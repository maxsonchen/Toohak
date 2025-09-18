// data struct type
export interface Data {
  users: UserProperties[],
  quizzes: Quiz[],
  games: QuizGame[],
}

// Other
export interface ErrorResponse {
  error: string;
  message: string;
}

export interface Session {
  session: string;
}

export type EmptyObj = Record<string, never>;

// Authentication and User Interfaces
export interface UserId {
  userId: number;
}

export interface UserDetails extends UserId {
  name: string;
  email: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface UserDetailsResponse {
  user: UserDetails;
}

export interface UserProperties extends UserId {
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string;
  usedPasswords: string[];
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  sessions: Session[];
}

// Quiz Interfaces
export interface QuizId {
  quizId: number;
}

export interface QuizList extends QuizId {
  name: string;
}

// Adding question handling
export interface AllQuizDetails extends QuizList {
  numQuestions: number;
  timeLimit: number;
  thumbnailUrl: string;
}

export interface QuestionId {
  questionId: number;
}

export interface QuestionAnswer {
  answer: string;
  correct: boolean;
}

export interface QuestionAnswerProperties extends QuestionAnswer {
  answerId: number;
  colour: string;
}

export interface QuizQuestions extends QuestionId {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: QuestionAnswer[];
  thumbnailUrl: string;
}

export interface QuizQuestionsComplete extends QuestionId{
  questionId: number;
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: QuestionAnswerProperties[];
  thumbnailUrl: string;
}

// Interface for input for questionBody
export interface quizQuestionBody {
  questionBody: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: QuestionAnswer[];
    thumbnailUrl: string;
  }
}

// Gen Quiz Params
export interface QuizInfo extends AllQuizDetails {
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  questions: QuizQuestionsComplete[];
}

export interface Quiz extends QuizInfo {
  ownerId: number;
}

// Enums for iteration 3 game logic
export enum GameState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END',
}

export enum GameAction {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END',
}

// Game Interfaces
export interface listGames {
    activeGames: number[],
    inactiveGames: number[]
}

export interface PlayerId {
  playerId: number;
}
export interface userScoreDetails {
  playerName: string;
  score: number;
}

export interface questionResults {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface QuizGame extends Quiz {
  gameId: number;
  state: GameState;
  autoStartNum: number;
  players: Player[];
  atQuestion: number;
  questionOpenTime?: number;
  answerTimes: { [playerId: number]: number };
  questionResults: questionResults[];
  usersRankedByScore: userScoreDetails[];
}

export interface GameResults {
  usersRankedByScore: userScoreDetails[];
  questionResults: questionResults[];
}

export interface GameId {
  gameId: number;
}

export interface Player extends PlayerId {
  score: number;
  playerName: string;
}

export interface playerQuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl: string;
  points: number;
  answerOptions: {
    answerId: number,
    answer: string,
    colour: string
  }[];
}

export interface GameStatus {
  state: GameState;
  atQuestion: number;
  players: string[];
  metadata: QuizInfo;
}
