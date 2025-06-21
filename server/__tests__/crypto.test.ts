import {
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
      description: "No auth required, access is permitted",
    });
  });
  it("returns not authenticated if auth required", async () => {
    assert.deepEqual(await noAuthStrategy(() => ({ requireAuth: true })), {
      isAuthenticated: false,
      description: "Auth required",
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
      mockVerify,
    );
    assert.deepEqual(result, {
      isAuthenticated: true,
      description: "Authentication succeeded with private key strategy",
    });
  });
  it("returns not authenticated if header isn't correct", async () => {
    const mockVerify = mock.fn((v1, v2, v3) => Promise.resolve(true));
    const result = await privateKeyStrategy(
      "helloworld",
      "mypublickey",
      "stringToSign",
      mockVerify,
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
      mockVerify,
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
    assert.deepEqual(result, {
      isAuthenticated: true,
      description: "Authentication succeeded with API Key",
    });
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