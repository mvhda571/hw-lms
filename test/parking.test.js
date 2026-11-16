const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { createApp } = require('../src/app');
const { createDatabase } = require('../src/database');

let db;
let server;
let baseUrl;

beforeEach(async () => {
  db = createDatabase(':memory:');
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  db.close();
});

test('rejects a second vehicle for an occupied space with the expected message', async () => {
  const firstEntry = await fetch(`${baseUrl}/api/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceId: 1, vehicleNumber: '01 A 123 BC' }),
  });
  assert.equal(firstEntry.status, 201);

  const secondEntry = await fetch(`${baseUrl}/api/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceId: 1, vehicleNumber: '01 B 456 CD' }),
  });
  assert.equal(secondEntry.status, 400);
  assert.deepEqual(await secondEntry.json(), { message: 'Joy band' });
});

test('rejects an empty vehicle number with the expected message', async () => {
  const response = await fetch(`${baseUrl}/api/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceId: 1, vehicleNumber: '  ' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Raqamni kiriting' });
});

test('allows a valid vehicle entry into a free space', async () => {
  const response = await fetch(`${baseUrl}/api/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spaceId: 2, vehicleNumber: '01 C 789 EF' }),
  });

  assert.equal(response.status, 201);
  const data = await response.json();
  assert.equal(data.space.vehicleNumber, '01 C 789 EF');

  const spacesResponse = await fetch(`${baseUrl}/api/spaces`);
  const { spaces } = await spacesResponse.json();
  assert.equal(spaces.find((space) => space.id === 2).vehicleNumber, '01 C 789 EF');
});
