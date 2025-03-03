document.addEventListener('DOMContentLoaded', () => {
  const noteTextarea = document.getElementById('note');
  const saveBtn = document.getElementById('saveBtn');
  const savedNotesDiv = document.getElementById('savedNotes');
  const themeToggle = document.getElementById('themeToggle');
  const filterImportantBtn = document.getElementById('filterImportantBtn');
  const categorySelect = document.getElementById('category');
  const filterCategory = document.getElementById('filterCategory');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Modal de edición y confirmación de eliminación
  const editModal = document.getElementById('editModal');
  const deleteConfirmation = document.getElementById('deleteConfirmation');
  const closeModalBtn = document.querySelector('.close-modal');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const editNoteContent = document.getElementById('editNoteContent');
  const editNoteCategory = document.getElementById('editNoteCategory');

  let isDarkTheme = false;
  let showOnlyImportant = false;
  let selectedCategory = 'all';
  let currentPage = 0;
  const notesPerPage = 6; // 3 columnas x 2 filas = 6 notas por página
  let currentNoteId = null; // Para manejar la nota actual en edición/eliminación

  // Cargar notas guardadas al iniciar
  loadNotes();

  // Guardar nota
  saveBtn.addEventListener('click', () => {
    const noteContent = noteTextarea.value.trim();
    if (noteContent) {
      const category = categorySelect.value;
      saveNote(noteContent, category);
      noteTextarea.value = '';
      loadNotes();
    } else {
      alert('Por favor, escribe algo antes de guardar.');
    }
  });

  // Cambiar tema
  themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
  });

  // Filtrar notas importantes
  filterImportantBtn.addEventListener('click', () => {
    showOnlyImportant = !showOnlyImportant;
    filterImportantBtn.classList.toggle('active', showOnlyImportant);
    currentPage = 0; // Reiniciar la paginación al aplicar filtros
    loadNotes();
  });

  // Filtrar por categoría
  filterCategory.addEventListener('change', () => {
    selectedCategory = filterCategory.value;
    currentPage = 0; // Reiniciar la paginación al aplicar filtros
    loadNotes();
  });

  // Paginación: Anterior
  prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      loadNotes();
    }
  });

  // Paginación: Siguiente
  nextBtn.addEventListener('click', () => {
    const totalNotes = getFilteredNotes().length;
    if ((currentPage + 1) * notesPerPage < totalNotes) {
      currentPage++;
      loadNotes();
    }
  });

  // Guardar en localStorage
  function saveNote(content, category) {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    const note = {
      id: Date.now().toString(), // ID único para cada nota
      content,
      category,
      important: false,
      date: new Date().toLocaleString(),
    };
    notes.push(note);
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  // Obtener notas filtradas
  function getFilteredNotes() {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    if (showOnlyImportant) {
      notes = notes.filter((note) => note.important);
    }
    if (selectedCategory !== 'all') {
      notes = notes.filter((note) => note.category === selectedCategory);
    }
    return notes;
  }

  // Cargar notas desde localStorage
  function loadNotes() {
    savedNotesDiv.innerHTML = '';
    const notes = getFilteredNotes();
    const startIndex = currentPage * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    const paginatedNotes = notes.slice(startIndex, endIndex);

    paginatedNotes.forEach((note) => {
      const noteElement = document.createElement('div');
      noteElement.classList.add('note-item');
      if (note.important) {
        noteElement.classList.add('important');
      }

      const noteContent = document.createElement('div');
      noteContent.classList.add('note-content');
      noteContent.innerHTML = `
        <span>${note.content}</span>
        <div class="note-date">${note.date}</div>
        <div class="note-category ${note.category.toLowerCase().replace(/ /g, '-')}">Categoría: ${note.category}</div>
      `;

      const noteActions = document.createElement('div');
      noteActions.classList.add('note-actions');

      const favoriteBtn = document.createElement('button');
      favoriteBtn.classList.add('favorite-btn');
      favoriteBtn.textContent = note.important ? '⭐' : '☆';
      favoriteBtn.addEventListener('click', () => toggleImportant(note.id));

      const editBtn = document.createElement('button');
      editBtn.classList.add('edit-btn');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => openEditModal(note.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', () => openDeleteConfirmation(note.id));

      noteActions.appendChild(favoriteBtn);
      noteActions.appendChild(editBtn);
      noteActions.appendChild(deleteBtn);
      noteElement.appendChild(noteContent);
      noteElement.appendChild(noteActions);
      savedNotesDiv.appendChild(noteElement);
    });

    // Habilitar/deshabilitar botones de paginación
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = (currentPage + 1) * notesPerPage >= notes.length;
  }

  // Marcar/desmarcar como importante
  function toggleImportant(noteId) {
    let notes = JSON.parse(localStorage.getItem('notes'));
    const noteIndex = notes.findIndex((note) => note.id === noteId);
    if (noteIndex !== -1) {
      notes[noteIndex].important = !notes[noteIndex].important;
      localStorage.setItem('notes', JSON.stringify(notes));
      loadNotes();
    }
  }

  // Abrir modal de edición
  function openEditModal(noteId) {
    const notes = JSON.parse(localStorage.getItem('notes'));
    const note = notes.find((note) => note.id === noteId);
    if (note) {
      currentNoteId = noteId;
      editNoteContent.value = note.content;
      editNoteCategory.value = note.category;
      editModal.style.display = 'flex';
    }
  }

  // Guardar cambios en la nota editada
  saveEditBtn.addEventListener('click', () => {
    const content = editNoteContent.value.trim();
    const category = editNoteCategory.value;

    if (content && category) {
      let notes = JSON.parse(localStorage.getItem('notes'));
      const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex].content = content;
        notes[noteIndex].category = category;
        localStorage.setItem('notes', JSON.stringify(notes));
        loadNotes();
        editModal.style.display = 'none';
      }
    }
  });

  // Cerrar modal de edición
  closeModalBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  // Abrir confirmación de eliminación
  function openDeleteConfirmation(noteId) {
    currentNoteId = noteId;
    deleteConfirmation.style.display = 'flex';
  }

  // Confirmar eliminación
  confirmDeleteBtn.addEventListener('click', () => {
    let notes = JSON.parse(localStorage.getItem('notes'));
    notes = notes.filter((note) => note.id !== currentNoteId);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    deleteConfirmation.style.display = 'none';
  });

  // Cancelar eliminación
  cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirmation.style.display = 'none';
  });
});