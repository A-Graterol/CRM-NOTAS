const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Conectar a la base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos SQLite');

  // Crear la tabla `notes` si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      important BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Obtener todas las notas
app.get('/api/notes', (req, res) => {
  const { category, important } = req.query;
  let query = 'SELECT * FROM notes';
  const params = [];

  if (category && category !== 'all') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (important === 'true') {
    query += params.length ? ' AND important = 1' : ' WHERE important = 1';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error al obtener las notas:', err);
      return res.status(500).json({ error: 'Error al obtener las notas' });
    }
    res.json(rows);
  });
});

// Guardar una nueva nota
app.post('/api/notes', (req, res) => {
  const { content, category } = req.body;
  if (!content || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const query = 'INSERT INTO notes (content, category) VALUES (?, ?)';
  db.run(query, [content, category], function (err) {
    if (err) {
      console.error('Error al guardar la nota:', err);
      return res.status(500).json({ error: 'Error al guardar la nota' });
    }
    res.json({ id: this.lastID, content, category });
  });
});

// Editar una nota
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;
  if (!content || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const query = 'UPDATE notes SET content = ?, category = ? WHERE id = ?';
  db.run(query, [content, category, id], (err) => {
    if (err) {
      console.error('Error al editar la nota:', err);
      return res.status(500).json({ error: 'Error al editar la nota' });
    }
    res.json({ id, content, category });
  });
});

// Eliminar una nota
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM notes WHERE id = ?';
  db.run(query, [id], (err) => {
    if (err) {
      console.error('Error al eliminar la nota:', err);
      return res.status(500).json({ error: 'Error al eliminar la nota' });
    }
    res.json({ message: 'Nota eliminada correctamente' });
  });
});

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`Frontend disponible en http://localhost:${PORT}`);
});