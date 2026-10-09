<header class="topbar">
  <div class="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong><?= h($pageTitle) ?></strong></div>
  <div class="topbar-user"><span class="avatar" aria-hidden="true"><?= h(strtoupper(substr($currentUser['name'], 0, 1))) ?></span><span><?= h($currentUser['name']) ?></span></div>
</header>

<section class="page-content" aria-labelledby="page-title">
  <div class="page-heading">
    <div>
      <p class="eyebrow"><?= $view === 'shared' ? 'MADE TOGETHER' : 'YOUR SPACE' ?></p>
      <h1 id="page-title"><?= h($pageTitle) ?><span class="heading-count" id="task-count" aria-label="0 tasks">0</span></h1>
      <p class="page-subtitle"><?= $view === 'shared' ? 'A shared list for your team to stay in sync.' : 'Keep your next steps clear and moving.' ?></p>
    </div>
    <div class="date-chip"><span class="date-icon" aria-hidden="true">▦</span><?= h(date('l, F j')) ?></div>
  </div>

  <div class="app-notice" id="app-status" role="status" aria-live="polite" aria-atomic="true" hidden></div>

  <div class="content-grid">
    <section class="panel task-panel" aria-labelledby="tasks-heading">
      <div class="panel-heading">
        <div><h2 id="tasks-heading">Tasks</h2><p id="task-list-summary">Loading your tasks…</p></div>
        <span class="panel-menu" aria-hidden="true">•••</span>
      </div>

      <ul class="todo-list" id="todo-list" aria-label="Task list" aria-busy="true">
        <li class="loading-state">Loading tasks…</li>
      </ul>

      <form class="new-task-form" id="create-form" method="post" action="index.php" aria-label="Add a task">
        <div class="quick-add-row">
          <span class="add-mark" aria-hidden="true">+</span>
          <label class="sr-only" for="new-title">Task title</label>
          <input id="new-title" name="title" type="text" maxlength="180" placeholder="Add a task…" autocomplete="off" required />
          <label class="sr-only" for="new-priority">Task priority</label>
          <select id="new-priority" class="new-priority-select" name="priority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
          <button class="add-button" type="submit">Add task</button>
        </div>

        <details class="optional-task-fields">
          <summary>Add description, photo, or reminder</summary>
          <div class="optional-fields-inner">
            <label for="new-description">Description <span class="optional-label">(optional)</span></label>
            <textarea id="new-description" name="description" rows="3" maxlength="5000" placeholder="Add a few details about this task…"></textarea>

            <label for="new-reminder">Reminder time <span class="optional-label">(optional)</span></label>
            <input id="new-reminder" name="reminderAt" type="datetime-local" aria-describedby="reminder-help" />
            <p class="field-help" id="reminder-help">Reminders appear while this app is open, or when you open it after the reminder time. Enable browser notifications in the sidebar.</p>

            <div data-photo-mount="create"></div>
          </div>
        </details>
      </form>
    </section>

    <div class="detail-column">
      <section class="panel detail-panel" id="task-details" aria-labelledby="detail-heading" tabindex="-1">
        <div class="panel-heading detail-heading">
          <div><h2 id="detail-heading">Task details</h2><p id="detail-subtitle">Select a task to view or edit it.</p></div>
          <span class="detail-spark" aria-hidden="true">✳</span>
        </div>
        <div id="detail-body">
          <div class="blank-detail"><span class="empty-icon" aria-hidden="true">✳</span><p>Choose a task from the list to see its details.</p></div>
        </div>
      </section>

      <section class="tip-card" aria-label="Taskwell tip">
        <span class="tip-icon" aria-hidden="true">✦</span>
        <div><strong><?= $view === 'shared' ? 'Good work is shared.' : 'Small steps add up.' ?></strong><p><?= $view === 'shared' ? 'Everyone in this browser workspace can see and update shared tasks.' : 'Pick one task and give it your focus today.' ?></p></div>
      </section>
    </div>
  </div>
</section>

<template id="photo-field-template">
  <fieldset class="photo-field" data-photo-field>
    <legend>Task image <span class="optional-label">(optional)</span></legend>
    <div class="photo-controls">
      <label class="file-picker">Choose or take an image
        <input type="file" accept="image/*" capture="environment" data-photo-file />
      </label>
      <button class="secondary-button" type="button" data-camera-start>Use camera</button>
      <button class="secondary-button" type="button" data-camera-capture hidden>Capture photo</button>
      <button class="secondary-button" type="button" data-camera-stop hidden>Close camera</button>
    </div>
    <video class="camera-preview" data-camera-video playsinline muted aria-label="Live camera preview" hidden></video>
    <img class="photo-preview" alt="Task image preview" hidden />
    <button class="text-button" type="button" data-photo-remove hidden>Remove image</button>
    <p class="field-help camera-status" data-camera-status role="status" aria-live="polite"></p>
  </fieldset>
</template>
