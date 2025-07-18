import { base64ToBuffer, bufferToBase64Raw, convertToPemKeyAndBase64 } from "../keyCreation";
import { test, expect } from 'vitest'
test("base64AndBack", async () => {
  const myString = "SGVsbG8sIHdvcmxkLg=="; //hello world in base64
  const initResult = await base64ToBuffer(myString);
  const endResult = await bufferToBase64Raw(initResult);
  expect(myString).toEqual(endResult);
});

test("convertToPemb64", () => {
  expect(atob(convertToPemKeyAndBase64("12345678"))).toEqual("-----BEGIN PUBLIC KEY-----\n12345678\n-----END PUBLIC KEY-----")
})