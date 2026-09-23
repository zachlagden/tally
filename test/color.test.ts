import { test, expect } from "vitest";
import { contrastOnBlack, readableColor } from "../src/util/color.js";
import { LANGUAGES } from "../src/languages.js";

test("every language colour is readable on a dark terminal", () => {
  for (const lang of LANGUAGES) {
    expect(contrastOnBlack(readableColor(lang.color)), lang.id).toBeGreaterThanOrEqual(4.5);
  }
});

test("colours that are already readable are left alone", () => {
  expect(readableColor("#f1e05a")).toBe("#f1e05a");
  expect(readableColor("#3178c6")).toBe("#3178c6");
});

test("near-black JSON grey is lightened but stays grey", () => {
  const lightened = readableColor("#292929");
  expect(lightened).not.toBe("#292929");
  expect(new Set([lightened.slice(1, 3), lightened.slice(3, 5), lightened.slice(5, 7)]).size).toBe(1);
});
