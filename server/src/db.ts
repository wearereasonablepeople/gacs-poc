import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.ts";

export type SubmissionRow = {
  id: string;
  created_at: string;
  email: string;
  answers_json: string;
  score_overall: number | null;
  answered_count: number;
  allowed_count: number;
  advice: string;
};

let db: Database.Database;

export function getDb() {
  if (db) return db;
  const dir = path.dirname(path.resolve(config.databasePath));
  fs.mkdirSync(dir, { recursive: true });
  db = new Database(config.databasePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      email TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      score_overall INTEGER,
      answered_count INTEGER NOT NULL,
      allowed_count INTEGER NOT NULL,
      advice TEXT NOT NULL
    );
  `);
  return db;
}

export function insertSubmission(row: SubmissionRow) {
  getDb()
    .prepare(
      `INSERT INTO submissions
        (id, created_at, email, answers_json, score_overall, answered_count, allowed_count, advice)
       VALUES
        (@id, @created_at, @email, @answers_json, @score_overall, @answered_count, @allowed_count, @advice)`,
    )
    .run(row);
}
