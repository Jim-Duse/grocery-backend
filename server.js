require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


// ================= AUTH MIDDLEWARE =================
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
};


// ================= AUTH ROUTES =================

// Register
app.post('/auth/register', async (req, res) => {
  const { email, display_name, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO users (email, display_name, password_hash) VALUES ($1,$2,$3)',
    [email, display_name, hash]
  );

  res.status(201).json({ message: 'User registered' });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT id, email, display_name, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (!result.rows.length) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

// Who is logged in
app.get('/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});


// ================= GROCERY ROUTES =================

// Get items
app.get('/items', auth, async (req, res) => {
  const items = await pool.query(
    'SELECT * FROM grocery_items ORDER BY name ASC'
  );
  res.json(items.rows);
});

// Add item
app.post('/items', auth, async (req, res) => {
  const { name, quantity } = req.body;

  await pool.query(
    'INSERT INTO grocery_items (name, quantity, updated_by) VALUES ($1,$2,$3)',
    [name, quantity, req.user.display_name]
  );

  res.status(201).json({ message: 'Item added' });
});

// Update item
app.put('/items/:id', auth, async (req, res) => {
  const { name, quantity, status } = req.body;

  await pool.query(
    `UPDATE grocery_items
     SET 
      name = COALESCE($1, name),
      quantity = COALESCE($2, quantity),
      status = COALESCE($3, status),
      updated_by = $4,
      updated_at = NOW()
     WHERE id = $5`,
    [name, quantity, status, req.user.display_name, req.params.id]
  );

  res.json({ message: 'Item updated' });
});

// Delete item
app.delete('/items/:id', auth, async (req, res) => {
  await pool.query(
    'DELETE FROM grocery_items WHERE id = $1',
    [req.params.id]
  );

  res.json({ message: 'Item deleted' });
});


app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
