const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');
const regd_users = express.Router();

const users = [];

const isValid = (username) => !users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some((user) => user.username === username && user.password === password);

//only registered users can login
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const accessToken = jwt.sign(
    { username },
    process.env.JWT_SECRET || 'access',
    { expiresIn: '1h' }
  );
  req.session.authorization = { accessToken, username };
  return res.json({ message: 'User successfully logged in.', accessToken });
});

// Add a book review
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const review = req.body.review ?? req.query.review;

  if (!books[isbn]) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'A non-empty review is required.' });
  }

  const username = req.user.username;
  const replacing = Object.prototype.hasOwnProperty.call(books[isbn].reviews, username);
  books[isbn].reviews[username] = review.trim();

  return res.json({
    message: replacing ? 'Review successfully updated.' : 'Review successfully added.',
    reviews: books[isbn].reviews
  });
});

// Delete only the review belonging to the authenticated user.
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  if (!Object.prototype.hasOwnProperty.call(books[isbn].reviews, username)) {
    return res.status(404).json({ message: 'You do not have a review for this book.' });
  }

  delete books[isbn].reviews[username];
  return res.json({ message: 'Review successfully deleted.' });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
