/**
 * Returns a random timeout between 5 and 12 seconds.
 * Result is in milliseconds.
 */
export function getRandomTimeout(): number {
  const min = 5_000;
  const max = 12_000;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns true most of the time.
 * Probability:
 *   true  = 80%
 *   false = 20%
 */
export function getRandomSuccess(): boolean {
  return Math.random() < 0.8;
}

