import { describe, expect, it } from "vitest";
import {
  extractValueFromFormData,
  createFormDataFromValue,
} from "../fetcherUtils";

describe("extractValueFromFormData", () => {
  it("gets data from formData if it exists", () => {
    const formData = new FormData();
    formData.append("hello", JSON.stringify({ hi: "world" }));
    expect(extractValueFromFormData(formData, "hello", {})).toEqual({
      hi: "world",
    });
  });
  it("gets default if it doesnt exist", () => {
    expect(
      extractValueFromFormData(undefined, "hello", { hi: "goodbye" }),
    ).toEqual({ hi: "goodbye" });
  });
});

describe("createFormDataFromValue", () => {
  it("gets creates from object", () => {
    const formData = createFormDataFromValue("hello", { hi: "world" });
    expect(formData.get("hello")).toEqual(JSON.stringify({ hi: "world" }));
  });
});

describe("both", () => {
  it("gets creates and extracts", () => {
    const formData = createFormDataFromValue("hello", { hi: "world" });
    const result = extractValueFromFormData(formData, "hello", {});
    expect(result).toEqual({ hi: "world" });
  });
});
