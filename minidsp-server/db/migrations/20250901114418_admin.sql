-- Add migration script here
CREATE TABLE IF NOT EXISTS admin
(
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashed_password TEXT NOT NULL
);
