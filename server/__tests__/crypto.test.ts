import { auth } from "../crypto.ts";
import { describe, it, mock } from "node:test";
import assert from "node:assert";

describe("auth", () => {
  it("returns immediately if no auth required ", async () => {
    const getSettings = () => ({ requireAuth: false });
    const mockRequest = {};
    const mockReply = {
      send: mock.fn((x) => x),
      code: mock.fn((x) => x),
    };
    const mockVerify = mock.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    assert.equal(
      await auth(
        // @ts-ignore
        mockRequest,
        mockReply,
        getSettings,
        mockVerify,
        mockUserObj,
        mockStringToSign
      ),
      undefined
    );
    assert.equal(mockReply.send.mock.calls.length, 0);
    assert.equal(mockReply.code.mock.calls.length, 0);
    assert.equal(mockVerify.mock.calls.length, 0);
  });
  it("returns 403 if bearer not correct", async () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "hello",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: mock.fn((x) => x),
      code: mock.fn((x) => x),
    };
    const mockVerify = mock.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    await auth(
      // @ts-ignore
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );
    assert.equal(mockReply.send.mock.calls.length, 1);
    assert.equal(mockReply.code.mock.calls.length, 1);
    assert.equal(mockVerify.mock.calls.length, 0);

    assert.equal(
      mockReply.send.mock.calls[0].arguments[0],
      "Bearer token not properly formatted"
    );
    assert.equal(mockReply.code.mock.calls[0].arguments[0], 403);
  });
  it("returns 403 if verification fails", async () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "Bearer 1515",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: mock.fn((x) => x),
      code: mock.fn((x) => x),
    };
    const mockVerify = mock.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    await auth(
      // @ts-ignore
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );
    assert.equal(mockReply.send.mock.calls.length, 1);
    assert.equal(mockReply.code.mock.calls.length, 1);
    assert.equal(mockVerify.mock.calls.length, 1);

    assert.equal(
      mockReply.send.mock.calls[0].arguments[0],
      "Authentication Failed"
    );
    assert.equal(mockReply.code.mock.calls[0].arguments[0], 403);
    assert.equal(mockVerify.mock.calls[0].arguments[0], "1515");
    //for some reason it thinks this is of length 1
    // @ts-ignore
    assert.equal(mockVerify.mock.calls[0].arguments[1], "key");
  });
  it("returns undefined if verification succeeds", async () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "Bearer 1515",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: mock.fn((x) => x),
      code: mock.fn((x) => x),
    };
    const mockVerify = mock.fn((x) => true);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    await auth(
      // @ts-ignore
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );

    assert.equal(mockReply.send.mock.calls.length, 0);
    assert.equal(mockReply.code.mock.calls.length, 0);
    assert.equal(mockVerify.mock.calls.length, 1);
    assert.equal(mockVerify.mock.calls[0].arguments[0], "1515");
    //for some reason it thinks this is of length 1
    // @ts-ignore
    assert.equal(mockVerify.mock.calls[0].arguments[1], "key");
  });
});
