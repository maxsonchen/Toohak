import {
  clear,
  adminAuthRegister,
  adminUserDetails,
  adminUserDetailsUpdate,
  makeCustomErrorForTest
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_EMAIL,
  INVALID_FIRST_NAME, INVALID_LAST_NAME,
} from '../errorHandling';

beforeEach(() => {
  clear();
});

test('Returns UNAUTHORISED for invalid session', () => {
  const res = adminUserDetailsUpdate(
    'invalidSession',
    'changed@gmail.com',
    'Changed',
    'Changed'
  );
  expect(res).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Returns INVALID_EMAIL for invalid email format', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'invalidEmail', 'Invalid', 'Invalid');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_EMAIL));
});

test('Returns INVALID_EMAIL for duplicate email', () => {
  adminAuthRegister('existing@example.com', 'PaSsW0rd12', 'Existing', 'Existing');
  const session =
    adminAuthRegister('current@example.com', 'PaSsW0rd12', 'Current', 'Current');
  const result =
    adminUserDetailsUpdate(session.body.session, 'existing@example.com', 'Existing', 'Existing');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_EMAIL));
});

test('Returns INVALID_FIRST_NAME for invalid characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com', 'Invald?', 'Name');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
});

test('Returns INVALID_FIRST_NAME for first name less than two characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com', 'o', 'enough');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
});

test('Returns INVALID_FIRST_NAME for first name more than 20 characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com',
    'thisContainsMoreThanTwenty', 'enough');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_FIRST_NAME));
});

test('Returns INVALID_LAST_NAME for invalid characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com', 'Name', 'Invald?');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
});

test('Returns INVALID_LAST_NAME for last name less than two characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com', 'enough', 'o');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
});

test('Returns INVALID_LAST_NAME for last name more than 20 characters', () => {
  const session = adminAuthRegister('valid@example.com', 'PaSsW0rd12', 'Valid', 'Valid');
  const result = adminUserDetailsUpdate(session.body.session, 'new@example.com',
    'enough', 'thisContainsMoreThanTwenty');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_LAST_NAME));
});

test('Has the correct return type', () => {
  const session =
    adminAuthRegister('original@gmail.com', 'PaSsW0rd12', 'Original', 'Original');
  const updated =
    adminUserDetailsUpdate(session.body.session, 'changed@gmail.com', 'Changed', 'Changed');
  expect(updated.status).toStrictEqual(200);
  expect(updated.body).toStrictEqual({});
});

test('Correctly updates user details', () => {
  const session =
    adminAuthRegister('original@gmail.com', 'PaSsW0rd12', 'Original', 'Original');
  const result = adminUserDetailsUpdate(session.body.session, 'changed@gmail.com',
    'Changed', 'Changed');
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const userInfo = adminUserDetails(session.body.session);
  expect(userInfo.body).toStrictEqual({
    user: {
      userId: 1,
      name: 'Changed Changed',
      email: 'changed@gmail.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 0,
    }
  });
});

test('Correctly updates user details but same email', () => {
  const session =
    adminAuthRegister('original@gmail.com', 'PaSsW0rd12', 'Original', 'Original');
  const result = adminUserDetailsUpdate(session.body.session, 'original@gmail.com',
    'Changed', 'Changed');
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const userInfo = adminUserDetails(session.body.session);
  expect(userInfo.body).toStrictEqual({
    user: {
      userId: 1,
      name: 'Changed Changed',
      email: 'original@gmail.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 0,
    }
  });
});
