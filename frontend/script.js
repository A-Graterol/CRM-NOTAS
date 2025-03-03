document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
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

  // Variables de estado
  let isDarkTheme = false;
  let showOnlyImportant = false;
  let selectedCategory = 'all';
  let currentPage = 0;
  const notesPerPage = 6; // 3 columnas x 2 filas = 6 notas por página
  let currentNoteId = null; // Para manejar la nota actual en edición/eliminación

  // Cargar notas al iniciar
  loadNotes();

  // Event Listeners
  saveBtn.addEventListener('click', saveNoteHandler);
  themeToggle.addEventListener('click', toggleTheme);
  filterImportantBtn.addEventListener('click', toggleImportantFilter);
  filterCategory.addEventListener('change', changeCategoryFilter);
  prevBtn.addEventListener('click', goToPreviousPage);
  nextBtn.addEventListener('click', goToNextPage);
  saveEditBtn.addEventListener('click', saveEditedNote);
  closeModalBtn.addEventListener('click', closeEditModal);
  confirmDeleteBtn.addEventListener('click', deleteNote);
  cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);

  // Función para guardar una nueva nota
  async function saveNoteHandler() {
    const noteContent = noteTextarea.value.trim();
    if (noteContent) {
      const category = categorySelect.value;
      await saveNote(noteContent, category);
      noteTextarea.value = '';
      loadNotes();
    } else {
      alert('Por favor, escribe algo antes de guardar.');
    }
  }

  // Función para cambiar el tema
  function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
  }

  // Función para alternar el filtro de notas importantes
  function toggleImportantFilter() {
    showOnlyImportant = !showOnlyImportant;
    filterImportantBtn.classList.toggle('active', showOnlyImportant);
    currentPage = 0; // Reiniciar la paginación al aplicar filtros
    loadNotes();
  }

  // Función para cambiar el filtro de categoría
  function changeCategoryFilter() {
    selectedCategory = filterCategory.value;
    currentPage = 0; // Reiniciar la paginación al aplicar filtros
    loadNotes();
  }

  // Función para ir a la página anterior
  function goToPreviousPage() {
    if (currentPage > 0) {
      currentPage--;
      loadNotes();
    }
  }

  // Función para ir a la página siguiente
  function goToNextPage() {
    const totalNotes = getFilteredNotes().length;
    if ((currentPage + 1) * notesPerPage < totalNotes) {
      currentPage++;
      loadNotes();
    }
  }

  // Función para guardar una nota en la base de datos
  async function saveNote(content, category) {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
      if (!response.ok) throw new Error('Error al guardar la nota');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la nota');
    }
  }

  // Función para obtener notas filtradas desde la API
  async function getFilteredNotes() {
    try {
      const response = await fetch(
        `/api/notes?category=${selectedCategory}&important=${showOnlyImportant}`
      );
      if (!response.ok) throw new Error('Error al obtener las notas');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  // Función para cargar y mostrar las notas
  async function loadNotes() {
    savedNotesDiv.innerHTML = '';
    const notes = await getFilteredNotes();
    const startIndex = currentPage * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    const paginatedNotes = notes.slice(startIndex, endIndex);

    paginatedNotes.forEach((note) => {
      const noteElement = createNoteElement(note);
      savedNotesDiv.appendChild(noteElement);
    });

    // Habilitar/deshabilitar botones de paginación
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = (currentPage + 1) * notesPerPage >= notes.length;
  }

  // Función para crear un elemento de nota
  function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note-item');
    if (note.important) noteElement.classList.add('important');

    const noteContent = document.createElement('div');
    noteContent.classList.add('note-content');
    noteContent.innerHTML = `
      <span>${note.content}</span>
      <div class="note-date">${new Date(note.created_at).toLocaleString()}</div>
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
    editBtn.addEventListener('click', () => openEditModal(note));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => openDeleteConfirmation(note.id));

    noteActions.append(favoriteBtn, editBtn, deleteBtn);
    noteElement.append(noteContent, noteActions);
    return noteElement;
  }

  // Función para marcar/desmarcar una nota como importante
  async function toggleImportant(noteId) {
    try {
      const notes = await getFilteredNotes();
      const note = notes.find((note) => note.id === noteId);
      const response = await fetch(`/api/notes/${noteId}/important`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ important: !note.important }),
      });
      if (!response.ok) throw new Error('Error al actualizar la nota');
      loadNotes();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la nota');
    }
  }

  // Función para abrir el modal de edición
  function openEditModal(note) {
    currentNoteId = note.id;
    editNoteContent.value = note.content;
    editNoteCategory.value = note.category;
    editModal.style.display = 'flex';
  }

  // Función para guardar los cambios en la nota editada
  async function saveEditedNote() {
    const content = editNoteContent.value.trim();
    const category = editNoteCategory.value;

    if (content && category) {
      try {
        const response = await fetch(`/api/notes/${currentNoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, category }),
        });
        if (!response.ok) throw new Error('Error al editar la nota');
        loadNotes();
        editModal.style.display = 'none';
      } catch (error) {
        console.error('Error:', error);
        alert('Error al editar la nota');
      }
    }
  }

  // Función para cerrar el modal de edición
  function closeEditModal() {
    editModal.style.display = 'none';
  }

  // Función para abrir la confirmación de eliminación
  function openDeleteConfirmation(noteId) {
    currentNoteId = noteId;
    deleteConfirmation.style.display = 'flex';
  }

  // Función para eliminar una nota
  async function deleteNote() {
    try {
      const response = await fetch(`/api/notes/${currentNoteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la nota');
      loadNotes();
      deleteConfirmation.style.display = 'none';
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la nota');
    }
  }

  // Función para cerrar la confirmación de eliminación
  function closeDeleteConfirmation() {
    deleteConfirmation.style.display = 'none';
  }
});