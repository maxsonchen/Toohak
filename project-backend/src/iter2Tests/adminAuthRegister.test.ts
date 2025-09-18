import { clear, adminAuthRegister, makeCustomErrorForTest } from './reqHelper';
import {
  INVALID_EMAIL, INVALID_FIRST_NAME, INVALID_LAST_NAME, INVALID_PASSWORD
} from '../errorHandling';

beforeEach(() => {
  clear();
});

test('Register One Valid User', () => {
  const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast');
  expect(res.body).toStrictEqual({ session: expect.any(String) });
  expect(res.status).toBe(200);
});

test('Register Multiple Valid Users with unique sessions', () => {
  const session1 = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast');
  const session2 = adminAuthRegister('foo2@bar.com', 'validPassword123', 'nameFirst', 'nameLast');
  expect(session1.body).toStrictEqual({ session: expect.any(String) });
  expect(session2.body).toStrictEqual({ session: expect.any(String) });
  expect(session1.body.session).not.toStrictEqual(session2.body.session);
  expect(session1.status).toBe(200);
  expect(session2.status).toBe(200);
});

describe('Invalid Emails', () => {
  test('Email address is used by another user', () => {
    const first = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast');
    expect(first.body).toStrictEqual({ session: expect.any(String) });
    expect(first.status).toBe(200);

    const second = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'nameLast');
    expect(second).toStrictEqual(makeCustomErrorForTest(400, INVALID_EMAIL));
  });

  test('Email does not satisfy npm validator.isEmail function', () => {
    const res = adminAuthRegister('foo', 'validPassword123', 'nameFirst', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_EMAIL));
  });
});

describe('First Name Validations', () => {
  test('NameFirst contains invalid characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'invalidName!', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
  });

  test('NameFirst is less than 2 characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'f', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
  });

  test('NameFirst is more than 20 characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'thisIsALongInvalidName',
      'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
  });

  test('NameFirst is 2 characters long', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'do', 'nameLast');
    expect(res.body).toStrictEqual({ session: expect.any(String) });
    expect(res.status).toBe(200);
  });

  test('NameFirst is 20 characters long with a mix of characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', "- this'is ver'Y-lonG",
      'nameLast');
    expect(res.body).toStrictEqual({ session: expect.any(String) });
    expect(res.status).toBe(200);
  });
});

describe('Last Name Validations', () => {
  test('NameLast contains invalid characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'invalidName!');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
  });

  test('NameLast is less than 2 characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'f');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
  });

  test('NameLast is more than 20 characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst',
      'thisIsALongInvalidName');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
  });

  test('NameLast is 2 characters long', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst', 'do');
    expect(res.body).toStrictEqual({ session: expect.any(String) });
    expect(res.status).toBe(200);
  });

  test('NameLast is 20 characters long with a mix of characters', () => {
    const res = adminAuthRegister('foo@bar.com', 'validPassword123', 'nameFirst',
      "- this'is ver'Y-lonG");
    expect(res.body).toStrictEqual({ session: expect.any(String) });
    expect(res.status).toBe(200);
  });
});

describe('Invalid Passwords', () => {
  test('Password is less than 8 characters', () => {
    const res = adminAuthRegister('foo@bar.com', '1nval1d', 'nameFirst', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PASSWORD));
  });

  test('Password does not contain at least one number', () => {
    const res = adminAuthRegister('foo@bar.com', 'invalidPassword', 'nameFirst', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PASSWORD));
  });

  test('Password does not contain at least one letter', () => {
    const res = adminAuthRegister('foo@bar.com', '12345678', 'nameFirst', 'nameLast');
    expect(res).toStrictEqual(makeCustomErrorForTest(400, INVALID_PASSWORD));
  });
});
