import {
  clear,
  adminAuthRegister,
  adminAuthLogout,
  adminUserDetails,
  adminAuthLogin,
  makeCustomErrorForTest
} from './reqHelper';

beforeEach(() => {
  clear();
});

test('returns UNAUTHORISED for an invalid session', () => {
  const result = adminAuthLogout('invalidSessionToken');
  expect(result).toStrictEqual(makeCustomErrorForTest(401, 'UNAUTHORISED'));
});

test('successfull logout invalidates session', () => {
  const reg = adminAuthRegister('logout@test.com', 'Password1', 'Logout', 'Logout');
  const session = reg.body.session;
  const result = adminAuthLogout(session);
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const detail = adminUserDetails(session);
  expect(detail).toStrictEqual(makeCustomErrorForTest(401, 'UNAUTHORISED'));
});

test('successfull logout invalidates session of multiple sessions', () => {
  const session1 =
    adminAuthRegister('logout@test.com', 'Password1', 'Logout', 'Logout').body.session;
  const session2 = adminAuthLogin('logout@test.com', 'Password1').body.session;
  const session3 = adminAuthLogin('logout@test.com', 'Password1').body.session;

  const result = adminAuthLogout(session2);
  expect(result.status).toStrictEqual(200);
  expect(result.body).toStrictEqual({});

  const detail2 = adminUserDetails(session2);
  expect(detail2).toStrictEqual(makeCustomErrorForTest(401, 'UNAUTHORISED'));

  const detail1 = adminUserDetails(session1);
  expect(detail1.status).toBe(200);

  const detail3 = adminUserDetails(session3);
  expect(detail3.status).toBe(200);
});
