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

test('supports the car CRUD flow and returns 404 after deletion', async () => {
  const car = { brand: 'Chevrolet', model: 'Cobalt', year: 2024, price: 15000000 };
  const createResponse = await fetch(`${baseUrl}/api/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(car),
  });

  assert.equal(createResponse.status, 201);
  const createdCar = await createResponse.json();
  assert.equal(typeof createdCar.id, 'number');
  assert.deepEqual(
    Object.fromEntries(Object.entries(createdCar).filter(([key]) => key !== 'id')),
    car,
  );

  const listResponse = await fetch(`${baseUrl}/api/cars`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).cars, [createdCar]);

  const updatedCar = { ...car, price: 16000000 };
  const updateResponse = await fetch(`${baseUrl}/api/cars/${createdCar.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCar),
  });
  assert.equal(updateResponse.status, 200);
  assert.deepEqual(await updateResponse.json(), { ...updatedCar, id: createdCar.id });

  const deleteResponse = await fetch(`${baseUrl}/api/cars/${createdCar.id}`, {
    method: 'DELETE',
  });
  assert.equal(deleteResponse.status, 204);

  const missingCarResponse = await fetch(`${baseUrl}/api/cars/${createdCar.id}`);
  assert.equal(missingCarResponse.status, 404);
});

test('returns 404 for the misspelled car collection URL', async () => {
  const response = await fetch(`${baseUrl}/api/cras`);
  assert.equal(response.status, 404);
});
