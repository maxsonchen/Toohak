// Import the functions for testing
import {
  clear, adminAuthRegister, adminAuthLogin,
  adminUserDetails, makeCustomErrorForTest
} from './reqHelper';
import { UNAUTHORISED } from '../errorHandling';
let session1: string;

beforeEach(() => {
  clear();
  session1 = adminAuthRegister('test1@gmail.com', 'Password123', 'Oscar', 'Knee').body.session;
});

// Tests for adminUserDetails
test('Returns UNAUTHORISED for invalid sessions', () => {
  const result = adminUserDetails('invalidSession');
  expect(result).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));

  const result2 = adminUserDetails('');
  expect(result2).toStrictEqual(makeCustomErrorForTest(401, UNAUTHORISED));
});

test('Valid update, returns 200 and updates info', () => {
  const result = adminUserDetails(session1);

  expect(result.body).toStrictEqual({
    user: {
      userId: 1,
      name: 'Oscar Knee',
      email: 'test1@gmail.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 0
    }
  });
  expect(result.status).toStrictEqual(200);
});

test('Returns correct user details after multiple user registers', () => {
  const session2 =
    adminAuthRegister('test2@gmail.com', 'Password123', 'Susan', 'Smith').body.session;
  const result = adminUserDetails(session2);
  expect(result.body).toStrictEqual({
    user: {
      userId: 2,
      email: 'test2@gmail.com',
      name: 'Susan Smith',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 0
    }
  });
});

test('Returns correct user details after failed login & then a successful login', () => {
  adminAuthLogin('test1@gmail.com', 'Password1234');
  const result = adminUserDetails(session1);
  expect(result.body).toStrictEqual({
    user: {
      userId: 1,
      email: 'test1@gmail.com',
      name: 'Oscar Knee',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 1
    }
  });

  const session2 = adminAuthLogin('test1@gmail.com', 'Password123').body.session;
  const result2 = adminUserDetails(session2);
  expect(result2.body).toStrictEqual({
    user: {
      userId: 1,
      email: 'test1@gmail.com',
      name: 'Oscar Knee',
      numSuccessfulLogins: 2,
      numFailedPasswordsSinceLastLogin: 0
    }
  });

  expect(session1).not.toStrictEqual(session2);
});

test('Returns correct user details after multiple logins', () => {
  const session2 =
    adminAuthLogin('test1@gmail.com', 'Password123').body.session;

  const result = adminUserDetails(session1);
  expect(result.body).toStrictEqual({
    user: {
      userId: 1,
      email: 'test1@gmail.com',
      name: 'Oscar Knee',
      numSuccessfulLogins: 2,
      numFailedPasswordsSinceLastLogin: 0
    }
  });

  const result2 = adminUserDetails(session2);
  expect(result2.body).toStrictEqual({
    user: {
      userId: 1,
      email: 'test1@gmail.com',
      name: 'Oscar Knee',
      numSuccessfulLogins: 2,
      numFailedPasswordsSinceLastLogin: 0
    }
  });

  expect(session1).not.toStrictEqual(session2);
});
