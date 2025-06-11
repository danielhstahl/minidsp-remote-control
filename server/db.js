const { DatabaseSync } = require("node:sqlite");

const DATABASE_NAME = "minidsp";
const USER_TABLE = "users";
const APP_SETTINGS_TABLE = "settings";

const setupDatabase = (databaseName = DATABASE_NAME) => {
  const database = new DatabaseSync(databaseName);
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
const createUser = (database, publicKey) => {
  const insert = database.prepare(
    `INSERT INTO ${USER_TABLE} (public_key) VALUES (?)`
  );
  const { lastInsertRowid } = insert.run(publicKey);
  return { key: lastInsertRowid, publicKey };
};

const updateUser = (database, publicKey, userId) => {
  const insert = database.prepare(
    `UPDATE ${USER_TABLE} set public_key= ? where key = ?`
  );
  insert.run(publicKey, parseInt(userId));
  return { key: userId, publicKey };
};

const getSettings = (database) => {
  const result = database
    .prepare(`SELECT key, require_auth from ${APP_SETTINGS_TABLE}`)
    .get();
  if (result) {
    const { key, require_auth: requireAuth } = result;
    return { key, requireAuth: requireAuth === 1 };
  }
  return undefined;
};
const setSettings = (database, requireAuth) => {
  const requireAuthInt = requireAuth ? 1 : 0;
  const insert = database.prepare(
    `UPDATE ${APP_SETTINGS_TABLE} SET require_auth=?;`
  );
  insert.run(requireAuthInt);
};

const setDefaultSettings = (database) => {
  const result = getSettings(database);
  if (!result) {
    const insert = database.prepare(
      `INSERT INTO ${APP_SETTINGS_TABLE} (require_auth) VALUES (?)` //don't require auth by default
    );
    insert.run(0);
  }
};

const getAllUsers = (database) => {
  return database
    .prepare(`SELECT key, public_key from ${USER_TABLE}`)
    .iterate()
    .reduce(
      (aggr, curr) => ({
        ...aggr,
        [curr.key]: curr.public_key,
      }),
      {}
    );
};

module.exports = {
  getAllUsers,
  setDefaultSettings,
  setSettings,
  getSettings,
  updateUser,
  createUser,
  setupDatabase,
};
