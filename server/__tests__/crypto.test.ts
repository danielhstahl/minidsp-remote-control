import {
  //auth,
  betterAuth,
  noAuthStrategy,
  privateKeyStrategy,
  basicAuthStrategy,
} from "../crypto.ts";
import { describe, it, mock } from "node:test";
import assert from "node:assert";

describe("noAuthStrategy", () => {
  it("returns authenticated if no auth required", async () => {
    assert.deepEqual(await noAuthStrategy(() => ({ requireAuth: false })), {
      isAuthenticated: true,
      description: "",
    });
  });
  it("returns not authenticated if auth required", async () => {
    assert.deepEqual(await noAuthStrategy(() => ({ requireAuth: true })), {
      isAuthenticated: false,
      description: "",
    });
  });
});
describe("privateKeyStrategy", () => {
  it("returns authenticated if gets through verify", async () => {
    const mockVerify = mock.fn((v1, v2, v3) => Promise.resolve(true));
    const result = await privateKeyStrategy(
      "Bearer helloworld",
      "mypublickey",
      "stringToSign",
      mockVerify
    );
    assert.deepEqual(result, { isAuthenticated: true, description: "" });
  });
  it("returns not authenticated if header isn't correct", async () => {
    const mockVerify = mock.fn((v1, v2, v3) => Promise.resolve(true));
    const result = await privateKeyStrategy(
      "helloworld",
      "mypublickey",
      "stringToSign",
      mockVerify
    );
    assert.deepEqual(result, {
      isAuthenticated: false,
      description: "Bearer token not properly formatted",
    });
  });
  it("returns not authenticated if verify fails", async () => {
    const mockVerify = mock.fn((v1, v2, v3) => Promise.resolve(false));
    const result = await privateKeyStrategy(
      "Bearer helloworld",
      "mypublickey",
      "stringToSign",
      mockVerify
    );
    assert.deepEqual(result, {
      isAuthenticated: false,
      description: "Authentication Failed",
    });
  });
});

describe("basicKeyStrategy", () => {
  it("returns authenticated if it equals key", async () => {
    const key = Buffer.from(":helloworld").toString("base64");
    const result = await basicAuthStrategy(`Basic ${key}`, "helloworld");
    assert.deepEqual(result, { isAuthenticated: true, description: "" });
  });
  it("returns not authenticated if header isn't correct", async () => {
    const key = Buffer.from(":helloworld").toString("base64");
    const result = await basicAuthStrategy(`${key}`, "helloworld");
    assert.deepEqual(result, {
      isAuthenticated: false,
      description: "Basic token not properly formatted",
    });
  });
  it("returns not authenticated if verify fails", async () => {
    const key = Buffer.from(":helloworld").toString("base64");
    const result = await basicAuthStrategy(`Basic ${key}`, "helloworld2");
    assert.deepEqual(result, {
      isAuthenticated: false,
      description: "Authentication Failed",
    });
  });
});

describe("betterAuth", () => {
  it("returns isAuthenticated if one of the strategies authenticates", async () => {
    const mock1 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: false, description: "" })
    );
    const mock2 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: true, description: "" })
    );
    const mock3 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: false, description: "helloworld" })
    );
    const result = await betterAuth(mock1, mock2, mock3);
    assert.deepEqual(result, { isAuthenticated: true, description: "" });
  });
  it("returns not authenticated if all the strategies fails", async () => {
    const mock1 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: false, description: "" })
    );
    const mock2 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: false, description: "" })
    );
    const mock3 = mock.fn(() =>
      Promise.resolve({ isAuthenticated: false, description: "helloworld" })
    );
    const result = await betterAuth(mock1, mock2, mock3);
    assert.deepEqual(result, {
      isAuthenticated: false,
      description: "helloworld",
    });
  });
});
/*
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
});*/
