const { DatabaseSync } = require('node:sqlite');

function createDatabase(path = process.env.DATABASE_PATH || 'parking.sqlite') {
  const db = new DatabaseSync(path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS parking_spaces (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      vehicle_number TEXT,
      entered_at TEXT
    )
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM parking_spaces').get();
  if (count.count === 0) {
    const insertSpace = db.prepare('INSERT INTO parking_spaces (label) VALUES (?)');
    for (let number = 1; number <= 10; number += 1) {
      insertSpace.run(`Joy ${number}`);
    }
  }

  return db;
}

module.exports = { createDatabase };
