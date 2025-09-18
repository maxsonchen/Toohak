import {
  clear,
  adminAuthRegister,
  adminUserPasswordUpdate,
  adminAuthLogin,
  makeCustomErrorForTest
} from './reqHelper';
import {
  UNAUTHORISED, INVALID_OLD_PASSWORD, INVALID_NEW_PASSWORD,
} from '../errorHandling';

// clear data before each test.
beforeEach(() => {
  clear();
});

test('Test if user session is invalid', () => {
  // if id doesnt exist in data, expect an error
  const idNotExist = adminUserPasswordUpdate('invalidsession', 'oldpsswrd', 'newpsswrd');
  expect(idNotExist).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));

  // if id is undefined, expect an error
  const idBlank = adminUserPasswordUpdate('', 'oldpsswrd', 'newpsswrd');
  expect(idBlank).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Test if existing password does not match with oldPassword', () => {
  const session = adminAuthRegister('email@protonmail.com', 'psswrd123', 'John', 'Locke');
  const result = adminUserPasswordUpdate(session.body.session, 'password123', 'strongpassword1234');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_OLD_PASSWORD));
});

test('Test if old password is different to new password', () => {
  const session = adminAuthRegister('email@protonmail.com', 'psswrd123', 'Kate', 'Austen');
  const result = adminUserPasswordUpdate(session.body.session, 'psswrd123', 'psswrd123');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if new password was used before', () => {
  const session = adminAuthRegister('email@protonmail.com', 'psswrd123', 'Kate', 'Austen');
  adminUserPasswordUpdate(session.body.session, 'psswrd123', 'newPsswrd123');
  const result = adminUserPasswordUpdate(session.body.session, 'newPsswrd123', 'psswrd123');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if new password is more than 8 characters', () => {
  const session = adminAuthRegister('email@protonmail.com', 'psswrd123', 'Sawyer', 'Ford');
  const result = adminUserPasswordUpdate(session.body.session, 'psswrd123', 'lt8');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if new password has one number', () => {
  const session =
    adminAuthRegister('email@protonmail.com', 'psswrd123', 'Jack', 'Shepard');
  const result = adminUserPasswordUpdate(session.body.session, 'psswrd123', 'superstrongpassword');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if new password has one letter', () => {
  const session =
    adminAuthRegister('email@protonmail.com', 'psswrd123', 'Jack', 'Shepard');
  const result = adminUserPasswordUpdate(session.body.session, 'psswrd123', 'superstrongpassword');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if new password has one letter', () => {
  const session =
    adminAuthRegister('email@protonmail.com', 'psswrd123', 'Hurley', 'Reyes');
  const result = adminUserPasswordUpdate(session.body.session, 'psswrd123', '4815162342');
  expect(result).toStrictEqual(makeCustomErrorForTest(400, INVALID_NEW_PASSWORD));
});

test('Test if password updates successfully', () => {
  const session = adminAuthRegister('email@protonmail.com', 'oldpass123', 'Ana', 'Lucia');
  const result = adminUserPasswordUpdate(session.body.session, 'oldpass123', 'newpass123');
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  // Test if new password is accepted
  const loginResult = adminAuthLogin('email@protonmail.com', 'newpass123');
  expect(loginResult.body).toHaveProperty('session');
});
