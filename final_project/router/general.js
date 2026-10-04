const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const isValid = require('./auth_users.js').isValid;
const users = require('./auth_users.js').users;
const public_users = express.Router();

// Axios normally talks to a remote HTTP API.  For this small lab the catalog is
// in memory, so a data URL gives the four requested methods real Axios promises
// without making the server call itself recursively over HTTP.
const getCatalog = async () => {
  const catalogUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(books))}`;
  const response = await axios.get(catalogUrl);
  const payload = Buffer.isBuffer(response.data)
    ? response.data.toString('utf8')
    : response.data;
  return typeof payload === 'string' ? JSON.parse(payload) : payload;
};

const getAllBooks = async () => getCatalog();

const getBookByISBN = async (isbn) => {
  const catalog = await getCatalog();
  return catalog[isbn];
};

const getBooksByAuthor = async (author) => {
  const catalog = await getCatalog();
  const query = author.toLowerCase();
  return Object.fromEntries(
    Object.entries(catalog).filter(([, book]) => book.author.toLowerCase().includes(query))
  );
};

const getBooksByTitle = async (title) => {
  const catalog = await getCatalog();
  const query = title.toLowerCase();
  return Object.fromEntries(
    Object.entries(catalog).filter(([, book]) => book.title.toLowerCase().includes(query))
  );
};

public_users.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered. Now you can login.' });
});

// Get the book list available in the shop
public_users.get('/', async (req, res) => {
  try {
    return res.json(await getAllBooks());
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve the book catalog.' });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return book
      ? res.json(book)
      : res.status(404).json({ message: 'Book not found.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve the book.' });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
  try {
    const matches = await getBooksByAuthor(req.params.author);
    return Object.keys(matches).length
      ? res.json(matches)
      : res.status(404).json({ message: 'No books found for that author.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search by author.' });
  }
});

// Get all books based on title
public_users.get('/title/:title', async (req, res) => {
  try {
    const matches = await getBooksByTitle(req.params.title);
    return Object.keys(matches).length
      ? res.json(matches)
      : res.status(404).json({ message: 'No books found with that title.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search by title.' });
  }
});

//  Get book review
public_users.get('/review/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return book
      ? res.json(book.reviews)
      : res.status(404).json({ message: 'Book not found.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve reviews.' });
  }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
