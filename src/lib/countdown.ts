export const WEDDING_AT = new Date("2027-01-31T16:00:00-03:00").getTime();

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getCountdownParts(now = Date.now()): CountdownParts {
  const remainingSeconds = Math.floor(
    Math.max(0, WEDDING_AT - now) / 1_000
  );

  return {
    days: Math.floor(remainingSeconds / 86_400),
    hours: Math.floor((remainingSeconds % 86_400) / 3_600),
    minutes: Math.floor((remainingSeconds % 3_600) / 60),
    seconds: remainingSeconds % 60,
  };
}
