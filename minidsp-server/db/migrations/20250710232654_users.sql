-- Add migration script here
CREATE TABLE IF NOT EXISTS users
(
    key INTEGER PRIMARY KEY AUTOINCREMENT,
    public_key TEXT not null
);
