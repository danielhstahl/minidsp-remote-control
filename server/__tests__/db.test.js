const fs = require("fs");
const {
  getAllUsers,
  setDefaultSettings,
  setSettings,
  getSettings,
  updateUser,
  createUser,
  setupDatabase,
} = require("../db");

const removeAll = (databaseName) => {
  //remove SQLite database if exists
  try {
    fs.unlinkSync(databaseName);
  } catch (err) {
    console.error("An error occurred:", err);
  }
};

describe("settingsDatabase", () => {
  const db = setupDatabase("mydbtest1");
  beforeAll(() => {
    removeAll("mydbtest1");
  });
  afterAll(() => {
    db.close();
    removeAll("mydbtest1");
  });

  test("getSettings", () => {
    const settings = getSettings(db);
    expect(settings).toBeUndefined();
  });
  test("getSettings after default", () => {
    setDefaultSettings(db);
    const settings = getSettings(db);
    expect(settings).toEqual({ key: 1, requireAuth: false });
  });
});
describe("usersDatabase", () => {
  const db = setupDatabase("mydbtest2");
  beforeAll(() => {
    removeAll("mydbtest2");
  });
  afterAll(() => {
    db.close();
    removeAll("mydbtest2");
  });

  test("getUsers", () => {
    const users = getAllUsers(db);
    expect(users).toEqual({});
  });
  test("getUsers after creation", () => {
    const user = createUser(db, "mypublickey");
    expect(user).toEqual({ key: 1, publicKey: "mypublickey" });
    const users = getAllUsers(db);
    expect(users).toEqual({ 1: "mypublickey" });
  });
  test("updateUser after creation", () => {
    const user = createUser(db, "mypublickey2");
    expect(user).toEqual({ key: 2, publicKey: "mypublickey2" });
    let users = getAllUsers(db);
    expect(users).toEqual({ 1: "mypublickey", 2: "mypublickey2" });
    const { key, publicKey } = updateUser(db, "mypublickey3", 2);
    expect({ key, publicKey }).toEqual({ key: 2, publicKey: "mypublickey3" });
    users = getAllUsers(db);
    expect(users).toEqual({ 1: "mypublickey", 2: "mypublickey3" });
  });
});
