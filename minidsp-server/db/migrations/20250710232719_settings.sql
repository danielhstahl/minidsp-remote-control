-- Add migration script here
CREATE TABLE IF NOT EXISTS settings(
    key INTEGER PRIMARY KEY AUTOINCREMENT,
    require_auth INTEGER not null
);
