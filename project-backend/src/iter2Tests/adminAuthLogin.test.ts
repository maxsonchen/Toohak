import {
  clear, adminAuthRegister,
  adminAuthLogin, makeCustomErrorForTest
} from './reqHelper';
import {
  INVALID_CREDENTIALS,
} from '../errorHandling';

beforeEach(() => {
  clear();
});

// Tests for adminAuthLogin
test('Email Address is empty', () => {
  // Create a test user
  adminAuthRegister('jackdaniel@gmail.com', 'MiamiMagic1', 'Jack', 'Daniels');

  // Test empty email
  const noEmail = adminAuthLogin('', 'MiamiMagic1');
  expect(noEmail).toStrictEqual(makeCustomErrorForTest(400, INVALID_CREDENTIALS));
});

test('Email Address not found', () => {
  // Create a test user
  adminAuthRegister('jackdaniel@gmail.com', 'MiamiMagic1', 'Jack', 'Daniels');

  // Test non-existing email
  const noEmail = adminAuthLogin('abracadabra@gmail.com', 'MiamiMagic1');
  expect(noEmail).toStrictEqual(makeCustomErrorForTest(400, INVALID_CREDENTIALS));
});

test('Password is not correct', () => {
  // Create a test user
  adminAuthRegister('jackdaniel@gmail.com', 'MiamiMagic1', 'Jack', 'Daniels');

  // Test wrong password
  const wrongPassword = adminAuthLogin('jackdaniel@gmail.com', 'MiamiMagic2');
  expect(wrongPassword).toStrictEqual(makeCustomErrorForTest(400, INVALID_CREDENTIALS));
});

test('Valid Credentials', () => {
  // Create a test user
  const session1 = adminAuthRegister('jackdaniel@gmail.com', 'MiamiMagic1', 'Jack', 'Daniels');

  // Test valid password and email
  const validEntry = adminAuthLogin('jackdaniel@gmail.com', 'MiamiMagic1');
  expect(validEntry.body).toEqual({ session: expect.any(String) });
  expect(validEntry.status).toBe(200);

  // session is different to register one
  expect(session1.body.session).not.toEqual(validEntry.body.session);
});

test('Multiple sessions for the same user', () => {
  // Register the user
  adminAuthRegister('jackdaniel@gmail.com', 'MiamiMagic1', 'Jack', 'Daniels');

  // Login twice
  const session1 = adminAuthLogin('jackdaniel@gmail.com', 'MiamiMagic1').body;
  const session2 = adminAuthLogin('jackdaniel@gmail.com', 'MiamiMagic1').body;

  // Both should return different session tokens
  expect(session1).toEqual({ session: expect.any(String) });
  expect(session2).toEqual({ session: expect.any(String) });
  expect(session1.session).not.toEqual(session2.session);
});
