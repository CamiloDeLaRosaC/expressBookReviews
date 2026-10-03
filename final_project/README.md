# Book Review API

Express practice project with public book lookup endpoints and session-backed JWT
authentication for user-owned reviews.

## Install and run

```bash
npm install
npm start
```

The server listens on `PORT` when set, otherwise port `5000`.

## Routes

- `GET /` — all books
- `GET /isbn/:isbn` — book by ISBN
- `GET /author/:author` — books by author (case-insensitive partial match)
- `GET /title/:title` — books by title (case-insensitive partial match)
- `GET /review/:isbn` — reviews for a book
- `POST /register` — register with JSON `username` and `password`
- `POST /customer/login` — login and establish a session
- `PUT /customer/auth/review/:isbn` — add/update the logged-in user's review
- `DELETE /customer/auth/review/:isbn` — delete the logged-in user's review

For authenticated cURL requests, save the login cookie with `-c cookies.txt` and
send it on later requests with `-b cookies.txt`.
