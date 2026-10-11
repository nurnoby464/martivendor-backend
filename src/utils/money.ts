// utils/money.ts
export const round2 = (n: number): number => Math.round(n * 100) / 100;

// floating point safe comparison (৳0.01 tolerance)
export const isClose = (a: number, b: number, tolerance = 0.01): boolean =>
  Math.abs(a - b) <= tolerance;