import {
  getData, save,
  gameTimers,
} from './dataStore';

/**
 * Reset the state of the application back to the start.
 *
 * @returns {object} - Empty object
 */
export function clear(): Record<string, never> {
  const data = getData();
  data.users = [];
  data.quizzes = [];
  data.games = [];
  save(data);

  // Clear all Timers
  for (const gameId in gameTimers) {
    clearTimeout(gameTimers[gameId]);
    delete gameTimers[gameId];
  }
  return {};
}
