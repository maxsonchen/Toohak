import { Data } from './interface';
import validator from 'validator';
import {
  FinalError, INVALID_EMAIL, INVALID_FIRST_NAME,
  INVALID_LAST_NAME
} from './errorHandling';

// Constants
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string, data: Data) {
  // Loop and see if the email was already used
  if (data.users.some(user => user.email === email)) {
    throw new FinalError(INVALID_EMAIL, 'Email is already used by another user');
  }
  // Check if the email is valid
  if (!validator.isEmail(email)) {
    throw new FinalError(INVALID_EMAIL, 'Is not a valid email');
  }
}

export function validateUpdateEmail(email: string, userId: number, data: Data) {
  // Loop and see if the email was already used, by someone not user
  if (data.users.some(u => u.userId !== userId && u.email === email)) {
    throw new FinalError(INVALID_EMAIL, 'Email is already used by another user');
  }
  // Check if the email is valid
  if (!validator.isEmail(email)) {
    throw new FinalError(INVALID_EMAIL, 'Is not a valid email');
  }
}

export function validateUserName(nameFirst: string, nameLast: string) {
  const regex = /^[a-zA-Z\s\-']+$/; // Valid chars
  // Check if nameFirst contains invalid characters
  if (!regex.test(nameFirst)) {
    throw new FinalError(INVALID_FIRST_NAME,
      'nameFirst includes invalid character(s)');
  }

  // Check if nameFirst is a valid length
  if (nameFirst.length > MAX_NAME_LENGTH || nameFirst.length < MIN_NAME_LENGTH) {
    throw new FinalError(INVALID_FIRST_NAME, 'nameFirst is not a valid length');
  }

  // Check if nameLast contains invalid characters
  if (!regex.test(nameLast)) {
    throw new FinalError(INVALID_LAST_NAME,
      'nameLast includes invalid character(s)');
  }

  // Check if nameLast is a valid length
  if (nameLast.length > MAX_NAME_LENGTH || nameLast.length < MIN_NAME_LENGTH) {
    throw new FinalError(INVALID_LAST_NAME, 'nameLast is not a valid length');
  }
}

export function validatePassword(password: string, error: string) {
  // Check if password is a valid length
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new FinalError(error, 'password is too short');
  }

  // Check if password contains one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasLetter || !hasNumber) {
    throw new FinalError(error,
      'password does not include at least one letter and one number');
  }
}
