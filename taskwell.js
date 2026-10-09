(() => {
  'use strict';

  const app = document.getElementById('app-shell');
  const bootstrapElement = document.getElementById('taskwell-bootstrap');
  if (!app || !bootstrapElement) return;

  let bootstrap;
  try {
    bootstrap = JSON.parse(bootstrapElement.textContent || '{}');
  } catch {
    bootstrap = {};
  }

  const currentUserId = Number(app.dataset.userId);
  const currentUser = (bootstrap.users || []).find((user) => Number(user.id) === currentUserId);
  const currentView = app.dataset.view === 'shared' ? 'shared' : 'personal';
  const listElement = document.getElementById('todo-list');
  const detailBody = document.getElementById('detail-body');
  const detailSubtitle = document.getElementById('detail-subtitle');
  const taskCount = document.getElementById('task-count');
  const taskListSummary = document.getElementById('task-list-summary');
  const appStatus = document.getElementById('app-status');
  const createForm = document.getElementById('create-form');
  const photoTemplate = document.getElementById('photo-field-template');
  const photoBlobs = new WeakMap();
  const cameraStreams = new WeakMap();
  let databasePromise;
  let tasks = [];
  let selectedId = new URL(window.location.href).searchParams.get('id');
  let checkingReminders = false;

  function announce(message, type = '') {
    appStatus.textContent = message;
    appStatus.hidden = !message;
    appStatus.className = `app-notice${type ? ` ${type}` : ''}`;
    appStatus.setAttribute('role', type === 'error' ? 'alert' : 'status');
    appStatus.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
  }

  function openDatabase() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('This browser does not support IndexedDB.'));
    }
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open('taskwell-local-data', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('todos')) {
          const todoStore = database.createObjectStore('todos', { keyPath: 'id' });
          todoStore.createIndex('scope', 'scope', { unique: false });
          todoStore.createIndex('ownerId', 'ownerId', { unique: false });
        }
        if (!database.objectStoreNames.contains('metadata')) {
          database.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error('Could not open local task storage.'));
      request.onblocked = () => reject(new Error('Close other Taskwell tabs, then reload this page.'));
    });

    return databasePromise;
  }

  function normalizeTimestamp(value) {
    const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
    const date = new Date(normalized || Date.now());
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function seededTask(row) {
    return {
      id: String(row.id),
      title: String(row.title || ''),
      description: String(row.description || ''),
      priority: ['low', 'medium', 'high'].includes(row.priority) ? row.priority : 'medium',
      scope: row.scope === 'shared' ? 'shared' : 'personal',
      completed: Number(row.is_completed) === 1,
      ownerId: Number(row.owner_id),
      ownerName: String(row.owner_name || ''),
      image: null,
      reminderAt: null,
      remindedAt: null,
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    };
  }

  async function initializeTasks() {
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(['todos', 'metadata'], 'readwrite');
      const metadata = transaction.objectStore('metadata');
      const seedStatus = metadata.get('seeded-from-sql-v1');

      seedStatus.onsuccess = () => {
        if (!seedStatus.result?.value) {
          const store = transaction.objectStore('todos');
          (bootstrap.todos || []).forEach((row) => store.put(seededTask(row)));
          metadata.put({ key: 'seeded-from-sql-v1', value: true });
        }
      };
      seedStatus.onerror = () => reject(seedStatus.error || new Error('Could not read local task storage.'));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not initialize local task storage.'));
      transaction.onabort = () => reject(transaction.error || new Error('Local task storage was unavailable.'));
    });
    return getAllTasks();
  }

  async function getAllTasks() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction('todos', 'readonly').objectStore('todos').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Could not read tasks.'));
    });
  }

  async function saveTask(task) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('todos', 'readwrite');
      transaction.objectStore('todos').put(task);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not save this task.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not save this task.'));
    });
  }

  async function removeTask(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('todos', 'readwrite');
      transaction.objectStore('todos').delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not delete this task.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not delete this task.'));
    });
  }

  function visibleTasks() {
    return tasks
      .filter((task) => currentView === 'shared'
        ? task.scope === 'shared'
        : task.scope === 'personal' && Number(task.ownerId) === currentUserId)
      .sort((first, second) => Number(first.completed) - Number(second.completed)
        || String(second.updatedAt || '').localeCompare(String(first.updatedAt || ''))
        || String(first.title).localeCompare(String(second.title)));
  }

  function updateSelectionInUrl(id) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('id', id);
    else url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
  }

  function formatDate(value) {
    if (!value) return '';
    const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function toDateTimeLocal(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  function renderList() {
    const filtered = visibleTasks();
    taskCount.textContent = String(filtered.length);
    taskCount.setAttribute('aria-label', `${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`);
    taskListSummary.textContent = `${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'} in this list`;

    if (selectedId && !filtered.some((task) => task.id === selectedId)) selectedId = null;
    if (!selectedId && filtered.length) selectedId = filtered[0].id;
    updateSelectionInUrl(selectedId);

    if (!filtered.length) {
      listElement.innerHTML = '<li class="empty-state"><span class="empty-icon" aria-hidden="true">✓</span><strong>Nothing on the list yet</strong><span>Add a task to get started.</span></li>';
      listElement.setAttribute('aria-busy', 'false');
      renderDetails(null);
      return;
    }

    listElement.innerHTML = filtered.map((task) => {
      const completed = Boolean(task.completed);
      const title = escapeHTML(task.title);
      const id = escapeHTML(task.id);
      const reminder = task.reminderAt ? `<span class="todo-reminder">Reminder: ${escapeHTML(formatDate(task.reminderAt))}</span>` : '';
      const owner = currentView === 'shared' ? `<span class="todo-owner">Added by ${escapeHTML(task.ownerName || 'Workspace member')}</span>` : '';
      const current = selectedId === task.id ? ' aria-current="true"' : '';
      return `<li class="todo-item${selectedId === task.id ? ' selected' : ''}${completed ? ' is-complete' : ''}">
        <button class="check-button${completed ? ' checked' : ''}" type="button" data-toggle-task="${id}" aria-label="Mark ${title} as ${completed ? 'in progress' : 'complete'}" aria-pressed="${completed}">${completed ? '<span aria-hidden="true">✓</span>' : ''}</button>
        <a class="todo-link" href="#task-details" data-select-task="${id}"${current}>
          <span class="todo-title">${title}</span>${owner}${reminder}
        </a>
        <span class="priority priority-${escapeHTML(task.priority)}">${escapeHTML(task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}</span>
      </li>`;
    }).join('');
    listElement.setAttribute('aria-busy', 'false');
    renderDetails(filtered.find((task) => task.id === selectedId) || null);
  }

  function disposePhotoField(form) {
    if (!form) return;
    const video = form.querySelector('video[data-camera-video]');
    const stream = video && cameraStreams.get(video);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (video) {
      video.srcObject = null;
      cameraStreams.delete(video);
    }
    const preview = form.querySelector('.photo-preview');
    if (preview?.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
  }

  function mountPhotoField(form, initialImage = null) {
    const mount = form.querySelector('[data-photo-mount]');
    if (!mount || !photoTemplate) return;
    mount.replaceChildren(photoTemplate.content.cloneNode(true));
    photoBlobs.set(form, initialImage || null);
    if (initialImage) showPhotoPreview(form, initialImage);
  }

  function showPhotoPreview(form, imageBlob) {
    const preview = form.querySelector('.photo-preview');
    const removeButton = form.querySelector('[data-photo-remove]');
    const fileInput = form.querySelector('[data-photo-file]');
    if (!preview) return;

    if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
    delete preview.dataset.objectUrl;
    photoBlobs.set(form, imageBlob || null);
    if (imageBlob) {
      const objectUrl = URL.createObjectURL(imageBlob);
      preview.src = objectUrl;
      preview.dataset.objectUrl = objectUrl;
      preview.alt = `Image attached to ${form.querySelector('[name="title"]')?.value.trim() || 'this task'}`;
      preview.hidden = false;
      if (removeButton) removeButton.hidden = false;
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
      if (removeButton) removeButton.hidden = true;
    }
    if (fileInput) fileInput.value = '';
  }

  function photoStatus(form, message) {
    const status = form.querySelector('[data-camera-status]');
    if (status) status.textContent = message;
  }

  function stopCamera(form) {
    const video = form.querySelector('video[data-camera-video]');
    if (!video) return;
    const stream = cameraStreams.get(video);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    video.hidden = true;
    cameraStreams.delete(video);
    const captureButton = form.querySelector('[data-camera-capture]');
    const stopButton = form.querySelector('[data-camera-stop]');
    if (captureButton) captureButton.hidden = true;
    if (stopButton) stopButton.hidden = true;
  }

  async function startCamera(form) {
    const video = form.querySelector('video[data-camera-video]');
    if (!video) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      photoStatus(form, 'Camera access is unavailable here. Use the image picker instead.');
      return;
    }

    stopCamera(form);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      cameraStreams.set(video, stream);
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      form.querySelector('[data-camera-capture]').hidden = false;
      form.querySelector('[data-camera-stop]').hidden = false;
      photoStatus(form, 'Camera ready. Capture a photo when you are ready.');
    } catch (error) {
      stopCamera(form);
      const message = error?.name === 'NotAllowedError'
        ? 'Camera permission was denied. You can still choose an image file.'
        : 'Could not open the camera. You can still choose an image file.';
      photoStatus(form, message);
    }
  }

  async function capturePhoto(form) {
    const video = form.querySelector('video[data-camera-video]');
    if (!video?.videoWidth || !video.videoHeight) {
      photoStatus(form, 'Wait for the camera preview, then capture again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      photoStatus(form, 'This browser could not prepare the photo. Try the image picker instead.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!imageBlob) {
      photoStatus(form, 'The photo could not be captured. Try the image picker instead.');
      return;
    }
    showPhotoPreview(form, imageBlob);
    stopCamera(form);
    photoStatus(form, 'Photo captured and ready to save with this task.');
  }

  function renderDetails(task) {
    const previousForm = detailBody.querySelector('[data-edit-form]');
    disposePhotoField(previousForm);
    if (!task) {
      detailSubtitle.textContent = 'Select a task to view or edit it.';
      detailBody.innerHTML = '<div class="blank-detail"><span class="empty-icon" aria-hidden="true">✳</span><p>Choose a task from the list to see its details.</p></div>';
      return;
    }

    detailSubtitle.textContent = task.completed ? 'This task is complete.' : 'Update the details or remove this task.';
    const priorities = ['low', 'medium', 'high'].map((priority) => `<option value="${priority}"${task.priority === priority ? ' selected' : ''}>${priority.charAt(0).toUpperCase()}${priority.slice(1)}</option>`).join('');
    const created = formatDate(task.createdAt);
    const owner = escapeHTML(task.ownerName || currentUser?.name || 'Workspace member');
    detailBody.innerHTML = `<form class="detail-form" data-edit-form data-task-id="${escapeHTML(task.id)}" method="post" action="index.php" aria-label="Edit selected task">
        <label for="edit-title">Title</label>
        <input id="edit-title" name="title" type="text" maxlength="180" value="${escapeHTML(task.title)}" required />

        <div class="detail-meta">
          <div><label for="edit-priority">Priority</label><select id="edit-priority" name="priority">${priorities}</select></div>
          <div><span class="field-label">Status</span><span class="status-pill${task.completed ? ' complete' : ''}"><span aria-hidden="true"></span>${task.completed ? 'Completed' : 'In progress'}</span></div>
        </div>

        <label for="edit-description">Description <span class="optional-label">(optional)</span></label>
        <textarea id="edit-description" name="description" rows="4" maxlength="5000" placeholder="Add a few details about this task…">${escapeHTML(task.description)}</textarea>

        <label for="edit-reminder">Reminder time <span class="optional-label">(optional)</span></label>
        <input id="edit-reminder" name="reminderAt" type="datetime-local" value="${escapeHTML(toDateTimeLocal(task.reminderAt))}" aria-describedby="edit-reminder-help" />
        <p class="field-help" id="edit-reminder-help">This browser checks reminders while the app is open and when it is reopened.</p>

        <div data-photo-mount="edit"></div>
        <div class="detail-actions"><button class="primary-button" type="submit">Save changes <span aria-hidden="true">→</span></button></div>
      </form>
      <div class="task-record"><span>Created by ${owner}</span><span>${created ? `Created ${escapeHTML(created)}` : ''}</span></div>
      <div class="delete-form"><button class="danger-button" type="button" data-delete-task="${escapeHTML(task.id)}">Delete task</button></div>`;
    mountPhotoField(detailBody.querySelector('[data-edit-form]'), task.image || null);
  }

  async function reloadAndRender() {
    listElement.setAttribute('aria-busy', 'true');
    try {
      tasks = await getAllTasks();
      renderList();
    } catch (error) {
      listElement.setAttribute('aria-busy', 'false');
      throw error;
    }
  }

  function createId() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function readReminder(form, existingTask = null) {
    const field = form.elements.reminderAt;
    if (!field.value) return { value: null, error: '' };
    const value = field.valueAsNumber;
    if (!Number.isFinite(value)) return { value: null, error: 'Enter a valid reminder time.' };
    if (value <= Date.now() && value !== Number(existingTask?.reminderAt)) {
      return { value, error: 'Choose a reminder time in the future.' };
    }
    return { value, error: '' };
  }

  async function handleFormSubmit(form) {
    if (!form.reportValidity()) return;
    const titleField = form.elements.title;
    if (!titleField.value.trim()) {
      titleField.setCustomValidity('Enter a task title.');
      titleField.reportValidity();
      titleField.addEventListener('input', () => titleField.setCustomValidity(''), { once: true });
      return;
    }
    const isEdit = form.hasAttribute('data-edit-form');
    const existingTask = isEdit ? tasks.find((task) => task.id === form.dataset.taskId) : null;
    if (isEdit && !existingTask) {
      announce('This task is no longer available. Reload the page and try again.', 'error');
      return;
    }

    const reminder = readReminder(form, existingTask);
    if (reminder.error) {
      form.elements.reminderAt.setCustomValidity(reminder.error);
      form.elements.reminderAt.reportValidity();
      form.elements.reminderAt.addEventListener('input', () => form.elements.reminderAt.setCustomValidity(''), { once: true });
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton?.disabled) return;
    if (submitButton) submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const now = new Date().toISOString();
    const reminderChanged = Number(reminder.value) !== Number(existingTask?.reminderAt);
    const task = {
      ...(existingTask || {}),
      id: existingTask?.id || createId(),
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      priority: ['low', 'medium', 'high'].includes(form.elements.priority.value) ? form.elements.priority.value : 'medium',
      scope: existingTask?.scope || currentView,
      completed: Boolean(existingTask?.completed),
      ownerId: Number(existingTask?.ownerId || currentUserId),
      ownerName: existingTask?.ownerName || currentUser?.name || 'Workspace member',
      image: photoBlobs.get(form) || null,
      reminderAt: reminder.value,
      remindedAt: reminderChanged ? null : (existingTask?.remindedAt || null),
      createdAt: existingTask?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveTask(task);
      selectedId = task.id;
      await reloadAndRender();
      if (isEdit) {
        announce('Task changes saved.');
        detailBody.querySelector('#edit-title')?.focus();
      }
      else {
        createForm.reset();
        disposePhotoField(createForm);
        showPhotoPreview(createForm, null);
        announce('Task added to this browser.');
        createForm.elements.title.focus();
      }
      await checkDueReminders();
    } catch (error) {
      announce(error?.name === 'QuotaExceededError'
        ? 'Browser storage is full. Remove a large image or delete some tasks and try again.'
        : 'Could not save this task in browser storage.', 'error');
    } finally {
      form.removeAttribute('aria-busy');
      if (submitButton) submitButton.disabled = false;
    }
  }

  function reminderPageUrl(task) {
    const url = new URL(window.location.href);
    url.searchParams.set('view', task.scope === 'shared' ? 'shared' : 'personal');
    url.searchParams.set('user_id', String(task.ownerId || currentUserId));
    url.searchParams.set('id', task.id);
    url.hash = 'task-details';
    return url.href;
  }

  async function checkDueReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted' || checkingReminders) return;
    checkingReminders = true;
    try {
      tasks = await getAllTasks();
      const now = Date.now();
      const dueTasks = tasks.filter((task) => !task.completed && task.reminderAt
        && Number(task.reminderAt) <= now && !task.remindedAt);
      if (!dueTasks.length) return;

      const registration = await window.taskwellServiceWorkerReady;
      if (!registration) return;
      for (const task of dueTasks) {
        await registration.showNotification(`Task reminder: ${task.title}`, {
          body: task.description || 'It is time to work on this task.',
          tag: `taskwell-reminder-${task.id}`,
          data: { url: reminderPageUrl(task) },
        });
        task.remindedAt = now;
        await saveTask(task);
      }
      tasks = await getAllTasks();
    } catch {
      announce('A reminder could not be displayed. Check your browser notification settings.', 'error');
    } finally {
      checkingReminders = false;
    }
  }

  async function enableReminders() {
    if (!('Notification' in window)) {
      announce('This browser does not support notifications.', 'error');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      announce('This browser does not support service workers.', 'error');
      return;
    }
    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
      if (permission !== 'granted') {
        announce('Notifications were not enabled. You can change this in your browser site settings.', 'error');
        return;
      }
      const registration = await window.taskwellServiceWorkerReady;
      if (!registration) throw new Error('The service worker could not be registered.');
      const label = document.querySelector('[data-reminder-label]');
      if (label) label.textContent = 'Reminders enabled';
      announce('Browser reminders are enabled. Add a reminder time to a task.');
      await checkDueReminders();
    } catch {
      announce('Could not enable notifications. Open this app on localhost or HTTPS and try again.', 'error');
    }
  }

  function setTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    const button = document.getElementById('theme-toggle');
    const label = button?.querySelector('[data-theme-label]');
    if (button) button.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    if (label) label.textContent = nextTheme === 'dark' ? 'Use light mode' : 'Use dark mode';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', nextTheme === 'dark' ? '#101722' : '#f7f8fc');
  }

  function initializeTheme() {
    let savedTheme = null;
    try {
      savedTheme = window.localStorage.getItem('taskwell-theme');
    } catch {
      // Use the system preference when local storage is unavailable.
    }
    const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || preferredTheme);
    const reminderLabel = document.querySelector('[data-reminder-label]');
    if ('Notification' in window && Notification.permission === 'granted' && reminderLabel) {
      reminderLabel.textContent = 'Reminders enabled';
    }
  }

  function onChange(event) {
    const target = event.target;
    if (target.matches('[data-photo-file]')) {
      const form = target.closest('form');
      const file = target.files?.[0];
      if (!form || !file) return;
      if (!file.type.startsWith('image/')) {
        target.value = '';
        photoStatus(form, 'Choose an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        target.value = '';
        photoStatus(form, 'Choose an image smaller than 10 MB.');
        return;
      }
      stopCamera(form);
      showPhotoPreview(form, file);
      photoStatus(form, 'Image selected and ready to save with this task.');
    }
  }

  function onClick(event) {
    const target = event.target;
    const cameraStart = target.closest('[data-camera-start]');
    const cameraCapture = target.closest('[data-camera-capture]');
    const cameraStop = target.closest('[data-camera-stop]');
    const photoRemove = target.closest('[data-photo-remove]');
    const toggleButton = target.closest('[data-toggle-task]');
    const selectLink = target.closest('[data-select-task]');
    const deleteButton = target.closest('[data-delete-task]');

    if (cameraStart || cameraCapture || cameraStop || photoRemove) {
      const form = target.closest('form');
      if (!form) return;
      if (cameraStart) void startCamera(form);
      if (cameraCapture) void capturePhoto(form);
      if (cameraStop) {
        stopCamera(form);
        photoStatus(form, 'Camera closed.');
      }
      if (photoRemove) {
        stopCamera(form);
        showPhotoPreview(form, null);
        photoStatus(form, 'Task image removed.');
      }
      return;
    }

    if (toggleButton) {
      const task = tasks.find((item) => item.id === toggleButton.dataset.toggleTask);
      if (!task) return;
      const toggledId = task.id;
      task.completed = !task.completed;
      task.updatedAt = new Date().toISOString();
      task.remindedAt = task.completed ? (task.remindedAt || Date.now()) : null;
      void saveTask(task).then(async () => {
        await reloadAndRender();
        Array.from(app.querySelectorAll('[data-toggle-task]'))
          .find((button) => button.dataset.toggleTask === toggledId)?.focus();
        announce(task.completed ? 'Task marked complete.' : 'Task marked in progress.');
      })
        .catch(() => announce('Could not update the task.', 'error'));
      return;
    }

    if (selectLink) {
      event.preventDefault();
      selectedId = selectLink.dataset.selectTask;
      renderList();
      document.getElementById('task-details').focus();
      return;
    }

    if (deleteButton) {
      const task = tasks.find((item) => item.id === deleteButton.dataset.deleteTask);
      if (!task || !window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
      const id = task.id;
      void removeTask(id).then(async () => {
        tasks = await getAllTasks();
        selectedId = null;
        renderList();
        announce('Task deleted.');
        (app.querySelector('[data-select-task]') || createForm.elements.title).focus();
      }).catch(() => announce('Could not delete the task.', 'error'));
      return;
    }

    if (target.closest('#theme-toggle')) {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      try {
        window.localStorage.setItem('taskwell-theme', nextTheme);
      } catch {
        announce('Theme changed for this visit. Browser storage could not save your preference.', 'error');
      }
      return;
    }

    if (target.closest('#enable-reminders')) void enableReminders();
  }

  function onSubmit(event) {
    const form = event.target;
    if (form === createForm || form.matches('[data-edit-form]')) {
      event.preventDefault();
      void handleFormSubmit(form);
    }
  }

  async function startApp() {
    if (!currentUser) {
      announce('The selected profile is unavailable. Reload the page and choose a profile.', 'error');
      listElement.setAttribute('aria-busy', 'false');
      return;
    }
    mountPhotoField(createForm);
    app.addEventListener('click', onClick);
    app.addEventListener('change', onChange);
    app.addEventListener('submit', onSubmit);
    document.getElementById('user_id')?.closest('form')?.addEventListener('change', (event) => {
      if (event.target.matches('#user_id')) event.target.form.requestSubmit();
    });
    window.addEventListener('pagehide', () => {
      document.querySelectorAll('[data-camera-video]').forEach((video) => {
        const stream = cameraStreams.get(video);
        if (stream) stream.getTracks().forEach((track) => track.stop());
      });
    });
    initializeTheme();

    try {
      tasks = await initializeTasks();
      renderList();
      announce('Tasks loaded from this browser.');
      await checkDueReminders();
      window.setInterval(() => { void checkDueReminders(); }, 15000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void checkDueReminders();
      });
      window.addEventListener('focus', () => { void checkDueReminders(); });
    } catch (error) {
      listElement.setAttribute('aria-busy', 'false');
      listElement.innerHTML = '<li class="empty-state"><strong>Local task storage is unavailable</strong><span>Enable browser storage, then reload this page.</span></li>';
      announce(error?.message || 'Could not load local task storage.', 'error');
    }
  }

  void startApp();
})();
