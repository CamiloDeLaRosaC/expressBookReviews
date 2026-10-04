const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../index.js');
const {
  getAllBooks,
  getBookByISBN,
  getBooksByAuthor,
  getBooksByTitle
} = require('../router/general.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('the four Axios catalog methods return the expected books', async () => {
  const catalog = await getAllBooks();
  assert.equal(Object.keys(catalog).length, 10);
  assert.equal((await getBookByISBN('1')).title, 'Things Fall Apart');
  assert.deepEqual(Object.keys(await getBooksByAuthor('jane austen')), ['8']);
  assert.deepEqual(Object.keys(await getBooksByTitle('pride and prejudice')), ['8']);
});

test('a user can register, login, add, update, and delete only their own review', async () => {
  const username = `reader-${Date.now()}`;
  let response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'test-password' })
  });
  assert.equal(response.status, 201);

  response = await fetch(`${baseUrl}/customer/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'test-password' })
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';', 1)[0];

  response = await fetch(`${baseUrl}/customer/auth/review/1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ review: 'First version' })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reviews[username], 'First version');

  response = await fetch(`${baseUrl}/customer/auth/review/1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ review: 'Updated version' })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reviews[username], 'Updated version');

  response = await fetch(`${baseUrl}/customer/auth/review/1`, {
    method: 'DELETE',
    headers: { cookie }
  });
  assert.equal(response.status, 200);
});

test('protected review routes reject requests without a session', async () => {
  const response = await fetch(`${baseUrl}/customer/auth/review/1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ review: 'Must not be stored' })
  });
  assert.equal(response.status, 401);
});
