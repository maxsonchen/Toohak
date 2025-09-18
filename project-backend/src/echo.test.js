// Do not delete this file before iteration 3
import { echo } from './echo.js';

test('Test successful echo', () => {
  let result = echo('1');
  expect(result).toBe('1');
  result = echo('abc');
  expect(result).toBe('abc');
});

test('Test invalid echo', () => {
  const res = echo({ echo: 'echo' });

  expect(res).toStrictEqual({ error: 'INVALID_ECHO', message: expect.any(String) });
});
