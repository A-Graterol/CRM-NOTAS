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

// Middleware para manejar errores de la base de datos
const handleDatabaseError = (err, res) => {
  console.error('Error en la base de datos:', err);
  res.status(500).json({ error: 'Error en la base de datos' });
};

// Obtener todas las notas con filtros opcionales
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
    if (err) return handleDatabaseError(err, res);
    res.json(rows);
  });
});

// Guardar una nueva nota
app.post('/api/notes', (req, res) => {
  const { content, category } = req.body;

  if (!content || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: content y category' });
  }

  const query = 'INSERT INTO notes (content, category) VALUES (?, ?)';
  db.run(query, [content, category], function (err) {
    if (err) return handleDatabaseError(err, res);
    res.json({ id: this.lastID, content, category });
  });
});

// Editar una nota existente
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;

  if (!content || !category) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: content y category' });
  }

  const query = 'UPDATE notes SET content = ?, category = ? WHERE id = ?';
  db.run(query, [content, category, id], (err) => {
    if (err) return handleDatabaseError(err, res);
    res.json({ id, content, category });
  });
});

// Eliminar una nota
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM notes WHERE id = ?';
  db.run(query, [id], (err) => {
    if (err) return handleDatabaseError(err, res);
    res.json({ message: 'Nota eliminada correctamente' });
  });
});

// Actualizar el campo 'important' de una nota
app.patch('/api/notes/:id/important', (req, res) => {
  const { id } = req.params;
  const { important } = req.body;

  if (typeof important !== 'boolean') {
    return res.status(400).json({ error: 'El campo important debe ser un booleano' });
  }

  const query = 'UPDATE notes SET important = ? WHERE id = ?';
  db.run(query, [important, id], (err) => {
    if (err) return handleDatabaseError(err, res);
    res.json({ id, important });
  });
});

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`Frontend disponible en http://localhost:${PORT}`);
});