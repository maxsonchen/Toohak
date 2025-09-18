import { UserProperties, Data } from './interface';
import { v4 as uuidv4 } from 'uuid';
import { FinalError, UNAUTHORISED } from './errorHandling';

export function getSessionToken(): string {
  return uuidv4();
}

export function userFromSession(session: string, data: Data): UserProperties {
  const user = data.users.find(u => u.sessions.some(s => s.session === session));
  if (!user) {
    throw new FinalError(UNAUTHORISED, 'Session is empty or invalid');
  }
  return user;
}
