import { convertTo100 } from "../VolumeCard";
import { expect, test } from 'vitest'
test("convertTo100", () => {
  expect(convertTo100(-127)).toBe(0);
  expect(convertTo100(0)).toBe(100);
});
