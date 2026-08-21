const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const databasePath =
  process.env.DATABASE_PATH || "./data/pathforge.db";

const absoluteDatabasePath = path.resolve(databasePath);

fs.mkdirSync(path.dirname(absoluteDatabasePath), {
  recursive: true
});

const db = new Database(absoluteDatabasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    domain_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    learn_url TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY(domain_id)
      REFERENCES domains(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prerequisites (
    certification_id TEXT NOT NULL,
    prerequisite_id TEXT NOT NULL,

    PRIMARY KEY (
      certification_id,
      prerequisite_id
    ),

    FOREIGN KEY(certification_id)
      REFERENCES certifications(id)
      ON DELETE CASCADE,

    FOREIGN KEY(prerequisite_id)
      REFERENCES certifications(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS completed_certifications (
    user_id TEXT NOT NULL,
    certification_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
      user_id,
      certification_id
    ),

    FOREIGN KEY(user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY(certification_id)
      REFERENCES certifications(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cert_domain
  ON certifications(domain_id);

  CREATE INDEX IF NOT EXISTS idx_prereq_cert
  ON prerequisites(certification_id);

  CREATE INDEX IF NOT EXISTS idx_completed_user
  ON completed_certifications(user_id);
`);

module.exports = db;
