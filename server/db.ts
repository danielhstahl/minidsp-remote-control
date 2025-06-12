"use strict";
import { DatabaseSync } from "node:sqlite";

const DATABASE_NAME = "minidsp";
const USER_TABLE = "users";
const APP_SETTINGS_TABLE = "settings";

export const setupDatabase = (databaseName: string = DATABASE_NAME) => {
  const database = new DatabaseSync(databaseName, {
    readOnly: false,
    open: true,
  });
  database.exec(`
    CREATE TABLE IF NOT EXISTS ${USER_TABLE}(
      key INTEGER PRIMARY KEY AUTOINCREMENT,
      public_key TEXT
    ) STRICT
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS ${APP_SETTINGS_TABLE}(
      key INTEGER PRIMARY KEY AUTOINCREMENT,
      require_auth INTEGER
    ) STRICT
  `);
  return database;
};
export const createUser = (database: DatabaseSync, publicKey: string) => {
  const insert = database.prepare(
    `INSERT INTO ${USER_TABLE} (public_key) VALUES (?)`
  );
  const { lastInsertRowid } = insert.run(publicKey);
  return { key: lastInsertRowid as number, publicKey };
};

export const updateUser = (
  database: DatabaseSync,
  publicKey: string,
  userId: string
) => {
  const insert = database.prepare(
    `UPDATE ${USER_TABLE} set public_key=? where key=?`
  );
  insert.run(publicKey, parseInt(userId));
  return { key: userId, publicKey };
};

export const getSettings = (database: DatabaseSync) => {
  const result = database
    .prepare(`SELECT key, require_auth from ${APP_SETTINGS_TABLE}`)
    .get();
  if (result) {
    const { key, require_auth: requireAuth } = result;
    return { key, requireAuth: requireAuth === 1 };
  }
  return undefined;
};
export const setSettings = (database: DatabaseSync, requireAuth: boolean) => {
  const requireAuthInt = requireAuth ? 1 : 0;
  const insert = database.prepare(
    `UPDATE ${APP_SETTINGS_TABLE} SET require_auth=?;`
  );
  insert.run(requireAuthInt);
};

export const setDefaultSettings = (database: DatabaseSync) => {
  const result = getSettings(database);
  if (!result) {
    const insert = database.prepare(
      `INSERT INTO ${APP_SETTINGS_TABLE} (require_auth) VALUES (?)` //don't require auth by default
    );
    insert.run(0);
  }
};
interface User {
  key: string;
  publicKey: string;
}
export const getAllUsers = (database: DatabaseSync) => {
  const userList: User[] = [
    ...database.prepare(`SELECT key, public_key from ${USER_TABLE}`).iterate(),
  ].map<User>((v) => ({
    key: v.key as string,
    publicKey: v.public_key as string,
  }));
  return userList.reduce<Record<string, string>>(
    (aggr: Record<string, string>, curr: User) => ({
      ...aggr,
      [curr.key]: curr.publicKey,
    }),
    {}
  );
};
