-- Add migration script here
CREATE TABLE IF NOT EXISTS devices
(
    device_ip TEXT NOT NULL PRIMARY KEY,
    is_allowed INTEGER NOT NULL
);
