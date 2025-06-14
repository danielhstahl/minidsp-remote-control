import {
  getAllUsers,
  setDefaultSettings,
  getSettings,
  updateUser,
  createUser,
  setupDatabase,
  setSettings,
} from "../db.ts";
import { describe, it, after } from "node:test";
import assert from "node:assert";
describe("settingsDatabase", () => {
  const db = setupDatabase(":memory:");
  after(() => {
    db.close();
  });

  it("gets settings", () => {
    const settings = getSettings(db);
    assert.equal(settings, undefined);
  });
  it("gets settings after default", () => {
    setDefaultSettings(db);
    const settings = getSettings(db);
    assert.deepEqual(settings, { key: 1, requireAuth: false });
  });
  it("sets settings", () => {
    setDefaultSettings(db);
    setSettings(db, true);
    const settings = getSettings(db);
    assert.deepEqual(settings, { key: 1, requireAuth: true });
  });
});
describe("usersDatabase", () => {
  const db = setupDatabase(":memory:");
  after(() => {
    db.close();
  });

  it("gets users", () => {
    const users = getAllUsers(db);
    assert.deepEqual(users, {});
  });
  it("gets users after creation", () => {
    const user = createUser(db, "mypublickey");
    assert.deepEqual(user, { key: 1, publicKey: "mypublickey" });
    const users = getAllUsers(db);
    assert.deepEqual(users, { 1: "mypublickey" });
  });
  it("updates user after creation", () => {
    const user = createUser(db, "mypublickey2");
    assert.deepEqual(user, { key: 2, publicKey: "mypublickey2" });
    let users = getAllUsers(db);
    assert.deepEqual(users, { 1: "mypublickey", 2: "mypublickey2" });
    const { key, publicKey } = updateUser(db, "mypublickey3", "2");
    assert.deepEqual({ key, publicKey }, { key: 2, publicKey: "mypublickey3" });
    users = getAllUsers(db);
    assert.deepEqual(users, { 1: "mypublickey", 2: "mypublickey3" });
  });
});
