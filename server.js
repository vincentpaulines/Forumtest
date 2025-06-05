const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create in-memory DB or temporary file DB
const db = new sqlite3.Database('temp.db', (err) => {
  if (err) console.error("Error opening database", err);
  else console.log("Database created.");
});

// Load schema from .sql file
const schema = fs.readFileSync('./schema.sql', 'utf8');
db.exec(schema, (err) => {
  if (err) {
    console.error("Error initializing schema", err);
  } else {
    console.log("Database initialized from schema.sql");
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/post', (req, res) => {
  const content = req.body.content;
  if (!content) return res.redirect('/');
  db.run('INSERT INTO posts (content) VALUES (?)', [content], err => {
    if (err) return res.status(500).send("DB insert failed");
    res.redirect('/');
  });
});

app.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send("Error deleting post");
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
