import { getData, save } from './dataStore';
import {
  UserId,
  UserDetailsResponse,
  UserProperties, Session,
  EmptyObj
} from './interface';
import { getSessionToken, userFromSession } from './sessionHelperFunctions';
import {
  validateEmail, validateUpdateEmail, validateUserName,
  validatePassword,
} from './authHelperFunctions';
import {
  FinalError, INVALID_CREDENTIALS, INVALID_NEW_PASSWORD,
  INVALID_OLD_PASSWORD, INVALID_PASSWORD
} from './errorHandling';
import { createHash } from 'crypto';

/** Register a user with an email, password and names then return
 *  their userId value
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {UserId}
 * @throws {ErrorResponse}
 */
export function adminAuthRegister(
  email: string, password: string, nameFirst: string, nameLast: string
): Session {
  const data = getData();

  validateEmail(email, data);
  validateUserName(nameFirst, nameLast);
  validatePassword(password, INVALID_PASSWORD);

  const hashedPassword = createHash('Sha256').update(password).digest('hex');

  // Generate the userId and set it to be nth created user
  const userId: UserId = { userId: data.users.length + 1 };

  // make a new session for the user
  const newSession: Session = { session: getSessionToken() };

  // create user and push to user data struct
  const newUser: UserProperties = {
    userId: userId.userId,
    nameFirst: nameFirst,
    nameLast: nameLast,
    password: hashedPassword,
    email: email,
    usedPasswords: [hashedPassword],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    sessions: [newSession],
  };
  data.users.push(newUser);
  save(data);

  return newSession;
}

/** Given a registered user's email and password return their userId
 *  value
 * @param {string} email
 * @param {string} password
 * @returns {Object}
 */
export function adminAuthLogin(email: string, password: string): Session {
  // Check if the email is a valid user
  const data = getData();

  const user = data.users.find(u => u.email === email);
  if (!user) {
    throw new FinalError(INVALID_CREDENTIALS, 'Email address does not exist');
  }

  const hashedPassword = createHash('Sha256').update(password).digest('hex');

  if (user.password !== hashedPassword) {
    // Increase the failed passwords amount
    user.numFailedPasswordsSinceLastLogin++;
    save(data);
    throw new FinalError(INVALID_CREDENTIALS, 'Password is incorrect');
  }

  // Reset the failed password amount
  user.numFailedPasswordsSinceLastLogin = 0;
  // Increase the amount of successful logins
  user.numSuccessfulLogins++;

  // make a new session for the user
  const newSession: Session = { session: getSessionToken() };
  user.sessions.push(newSession);
  save(data);

  return newSession;
}

/** Given an admin user's session return details about the user. "name"
 *  is the first and last name concated with a single space between them
 *
 * @param {number} session
 * @returns {Object}
 */
export function adminUserDetails(session: string): UserDetailsResponse {
  const data = getData();
  const user = userFromSession(session, data);

  // Return userDetails
  return {
    user: {
      userId: user.userId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin
    }
  };
}

/** Given an admin user's session and a set of properties,
 *  update the properties of this logged in admin user.
 *
 * @param {number} session
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @return {object}
 *
 */
export function adminUserDetailsUpdate(
  session: string,
  email: string,
  nameFirst: string,
  nameLast: string
): EmptyObj {
  const data = getData();

  const user = userFromSession(session, data);
  validateUpdateEmail(email, user.userId, data);

  // Return error if the new email is already associated with another userId
  // if (data.users.some(u => u.userId !== userId.userId && u.email === email)) {
  //   throw new FinalError('INVALID_EMAIL', 'Email is currently used by another user');
  // }
  validateUserName(nameFirst, nameLast);

  // Updated user data
  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  save(data);

  return {};
}

/** Given details relating to a password change,
 * update the password of a logged in user.
 *
 * @param {number} session
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {object}
 */
export function adminUserPasswordUpdate(session: string, oldPassword: string, newPassword: string
): EmptyObj {
  const data = getData();
  // Get user from session
  const user = userFromSession(session, data);

  const hashedOldPassword = createHash('Sha256').update(oldPassword).digest('hex');

  if (user.password !== hashedOldPassword) {
    throw new FinalError(INVALID_OLD_PASSWORD,
      'Old Password is not the correct old password');
  }

  const hashedNewPassword = createHash('Sha256').update(newPassword).digest('hex');

  if (hashedOldPassword === hashedNewPassword) {
    throw new FinalError(INVALID_NEW_PASSWORD,
      'New Password is the same as the old password');
  }

  if (user.usedPasswords.includes(hashedNewPassword, 0)) {
    throw new FinalError(INVALID_NEW_PASSWORD,
      'New Password has already been used before by this user');
  }

  validatePassword(newPassword, INVALID_NEW_PASSWORD);

  user.usedPasswords.push(user.password);
  user.password = hashedNewPassword;
  save(data);

  return {};
}

/**
 * Logs out an admin user who has an active user session
 * @param {string} session
 * @returns {{}} on success or ErrorResponse on failure
 */
export function adminAuthLogout(session: string): EmptyObj {
  const data = getData();
  const user = userFromSession(session, data);

  user.sessions = user.sessions.filter(s => s.session !== session);
  save(data);
  return {};
}
