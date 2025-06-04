const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Set up DB
const db = new sqlite3.Database('./database.db');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve HTML
app.get('/', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send("Error fetching posts.");
    }
    let postsHTML = rows.map(post => `
      <div class="post">
        <p>${post.content}</p>
        <span>${new Date(post.created_at).toLocaleString()}</span>
      </div>
    `).join('');
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });
});

// API to get posts
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Handle new post
app.post('/post', (req, res) => {
  const content = req.body.content;
  if (!content) return res.redirect('/');
  db.run('INSERT INTO posts (content) VALUES (?)', [content], err => {
    if (err) return res.status(500).send("DB insert failed");
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
