export function sumPaidCents(
  values: Array<number | null | undefined>
): number {
  return values.reduce<number>(
    (total, value) =>
      Number.isSafeInteger(value) && (value as number) > 0
        ? total + (value as number)
        : total,
    0
  );
}
