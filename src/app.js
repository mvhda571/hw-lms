const express = require('express');
const path = require('node:path');

function createApp(db) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/cars', (req, res) => {
    const rows = db.prepare('SELECT id, data FROM cars ORDER BY id').all();
    const cars = rows.map((row) => ({ ...JSON.parse(row.data), id: row.id }));

    res.json({ cars });
  });

  app.post('/api/cars', (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Mashina JSON obyekt bo‘lishi kerak' });
    }

    const result = db.prepare('INSERT INTO cars (data) VALUES (?)')
      .run(JSON.stringify(req.body));
    const car = { ...req.body, id: Number(result.lastInsertRowid) };

    return res.status(201).json(car);
  });

  app.get('/api/cars/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    const row = db.prepare('SELECT id, data FROM cars WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    return res.json({ ...JSON.parse(row.data), id: row.id });
  });

  app.put('/api/cars/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Mashina JSON obyekt bo‘lishi kerak' });
    }

    const result = db.prepare('UPDATE cars SET data = ? WHERE id = ?')
      .run(JSON.stringify(req.body), id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    return res.json({ ...req.body, id });
  });

  app.delete('/api/cars/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    const result = db.prepare('DELETE FROM cars WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Mashina topilmadi' });
    }

    return res.status(204).end();
  });

  app.get('/api/spaces', (req, res) => {
    const spaces = db.prepare(`
      SELECT id, label, vehicle_number AS vehicleNumber, entered_at AS enteredAt
      FROM parking_spaces
      ORDER BY id
    `).all();

    res.json({ spaces });
  });

  app.post('/api/entries', (req, res) => {
    const vehicleNumber = typeof req.body?.vehicleNumber === 'string'
      ? req.body.vehicleNumber.trim()
      : '';

    if (!vehicleNumber) {
      return res.status(400).json({ message: 'Raqamni kiriting' });
    }

    const spaceId = Number(req.body?.spaceId);
    if (!Number.isInteger(spaceId) || spaceId < 1) {
      return res.status(400).json({ message: 'Joyni tanlang' });
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      const space = db.prepare(`
        SELECT id, label, vehicle_number AS vehicleNumber
        FROM parking_spaces
        WHERE id = ?
      `).get(spaceId);

      if (!space) {
        db.exec('ROLLBACK');
        return res.status(404).json({ message: 'Joy topilmadi' });
      }

      if (space.vehicleNumber) {
        db.exec('ROLLBACK');
        return res.status(400).json({ message: 'Joy band' });
      }

      const enteredAt = new Date().toISOString();
      db.prepare(`
        UPDATE parking_spaces
        SET vehicle_number = ?, entered_at = ?
        WHERE id = ?
      `).run(vehicleNumber, enteredAt, spaceId);
      db.exec('COMMIT');

      return res.status(201).json({
        message: 'Mashina muvaffaqiyatli kiritildi',
        space: { id: space.id, label: space.label, vehicleNumber, enteredAt },
      });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  });

  return app;
}

module.exports = { createApp };
