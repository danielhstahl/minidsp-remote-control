const { auth } = require("../crypto");

describe("auth", () => {
  test("it returns immediately if no auth required ", () => {
    const getSettings = () => ({ requireAuth: false });
    const mockRequest = {};
    const mockReply = {
      send: jest.fn((x) => x),
      code: jest.fn((x) => x),
    };
    const mockVerify = jest.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    expect(
      auth(mockRequest, mockReply, getSettings, mockUserObj, mockStringToSign)
    ).toBeUndefined();
    expect(mockReply.send.mock.calls).toHaveLength(0);
    expect(mockReply.code.mock.calls).toHaveLength(0);
    expect(mockVerify.mock.calls).toHaveLength(0);
  });
  test("it returns 403 if bearer not correct", () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "hello",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: jest.fn((x) => x),
      code: jest.fn((x) => x),
    };
    const mockVerify = jest.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    auth(
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );
    expect(mockReply.send.mock.calls).toHaveLength(1);
    expect(mockReply.code.mock.calls).toHaveLength(1);
    expect(mockVerify.mock.calls).toHaveLength(0);

    expect(mockReply.send.mock.calls[0][0]).toBe(
      "Bearer token not properly formatted"
    );
    expect(mockReply.code.mock.calls[0][0]).toBe(403);
  });
  test("it returns 403 if verification fails", () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "Bearer 1515",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: jest.fn((x) => x),
      code: jest.fn((x) => x),
    };
    const mockVerify = jest.fn((x) => false);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    auth(
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );
    expect(mockReply.send.mock.calls).toHaveLength(1);
    expect(mockReply.code.mock.calls).toHaveLength(1);
    expect(mockVerify.mock.calls).toHaveLength(1);

    expect(mockReply.send.mock.calls[0][0]).toBe("Authentication Failed");
    expect(mockReply.code.mock.calls[0][0]).toBe(403);
    expect(mockVerify.mock.calls[0][0]).toBe("1515");
    expect(mockVerify.mock.calls[0][1]).toBe("key");
  });
  test("it returns undefined if verification succeeds", () => {
    const getSettings = () => ({ requireAuth: true });
    const mockRequest = {
      headers: {
        authorization: "Bearer 1515",
        "x-user-id": "2",
      },
    };
    const mockReply = {
      send: jest.fn((x) => x),
      code: jest.fn((x) => x),
    };
    const mockVerify = jest.fn((x) => true);
    const mockUserObj = { 2: "key" };
    const mockStringToSign = "stringToSign";
    auth(
      mockRequest,
      mockReply,
      getSettings,
      mockVerify,
      mockUserObj,
      mockStringToSign
    );
    expect(mockReply.send.mock.calls).toHaveLength(0);
    expect(mockReply.code.mock.calls).toHaveLength(0);
    expect(mockVerify.mock.calls).toHaveLength(1);
    expect(mockVerify.mock.calls[0][0]).toBe("1515");
    expect(mockVerify.mock.calls[0][1]).toBe("key");
  });
});
