import {
  clear,
  adminAuthRegister,
  adminQuizCreate,
  adminQuizThumbnail,
  adminQuizInfo,
  makeCustomErrorForTest
} from './reqHelper';
import { UNAUTHORISED, INVALID_THUMBNAIL, INVALID_QUIZ_ID } from '../errorHandling';
let session: string;
let quizId: number;

beforeEach(() => {
  clear();
  session = adminAuthRegister(
    'testemail@gmail.com',
    'StrongPassword123',
    'Greg',
    'Bobkin').body.session;
  quizId = adminQuizCreate(session, 'New Quiz', 'With Thumbnail').body.quizId;
});

describe('adminQuizThumbnail Valid Case', () => {
  test('Successfully updates quiz thumbnail', () => {
    const thumbnail = 'http://google.com/some/image/path.jpg';
    const res = adminQuizThumbnail(session, quizId, thumbnail);
    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({});

    const quiz = adminQuizInfo(session, quizId);
    expect(quiz.body.thumbnailUrl).toBe(thumbnail);
  });
});

describe('adminQuizThumbnail Invalid Case', () => {
  test('Empty string thumbnail', () => {
    const res = adminQuizThumbnail(session, quizId, '');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });

  test('Invalid file extension', () => {
    const thumbnail = 'http://google.com/some/image/path.bmp';
    const res = adminQuizThumbnail(session, quizId, thumbnail);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });

  test('Invalid thumbnail (not URL)', () => {
    const thumbnail = 'ftp://google.com/some/image/path.jpg';
    const res = adminQuizThumbnail(session, quizId, thumbnail);
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_THUMBNAIL));
  });

  test('Invalid session', () => {
    const thumbnail = 'http://google.com/some/image/path.jpg';
    const res = adminQuizThumbnail('invalid.session', quizId, thumbnail);
    expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
  });

  test('Invalid quizId', () => {
    const thumbnail = 'http://google.com/some/image/path.jpg';
    const res = adminQuizThumbnail(session, quizId + 999, thumbnail);
    expect(res).toStrictEqual(makeCustomErrorForTest(403, INVALID_QUIZ_ID));
  });
});
