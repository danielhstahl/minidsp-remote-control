import { base64ToBuffer, bufferToBase64 } from "../keyCreation";
test("base64AndBack", async () => {
  const myString = "SGVsbG8sIHdvcmxkLg=="; //hello world in base64
  const initResult = await base64ToBuffer(myString);
  const endResult = await bufferToBase64(initResult);
  expect(myString).toEqual(endResult);
});
