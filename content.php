<header class="topbar">
  <div class="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong><?= h($pageTitle) ?></strong></div>
  <div class="topbar-user"><span class="avatar"><?= h(strtoupper(substr($currentUser['name'], 0, 1))) ?></span><span><?= h($currentUser['name']) ?></span></div>
</header>

<section class="page-content" aria-labelledby="page-title">
  <div class="page-heading">
    <div>
      <p class="eyebrow"><?= $view === 'shared' ? 'MADE TOGETHER' : 'YOUR SPACE' ?></p>
      <h1 id="page-title"><?= h($pageTitle) ?><span class="heading-count"><?= count($todos) ?></span></h1>
      <p class="page-subtitle"><?= $view === 'shared' ? 'A shared list for your team to stay in sync.' : 'Keep your next steps clear and moving.' ?></p>
    </div>
    <div class="date-chip"><span class="date-icon" aria-hidden="true">▦</span><?= h(date('l, F j')) ?></div>
  </div>

  <?php if ($flash): ?>
    <div class="flash-message <?= h($flash['type'] ?? 'success') ?>" role="status"><?= h($flash['message'] ?? '') ?></div>
  <?php endif; ?>

  <div class="content-grid">
    <section class="panel task-panel" aria-labelledby="tasks-heading">
      <div class="panel-heading">
        <div><h2 id="tasks-heading">Tasks</h2><p><?= count($todos) ?> <?= count($todos) === 1 ? 'task' : 'tasks' ?> in this list</p></div>
        <span class="panel-menu" aria-hidden="true">•••</span>
      </div>

      <ul class="todo-list">
        <?php if (!$todos): ?>
          <li class="empty-state"><span class="empty-icon" aria-hidden="true">✓</span><strong>Nothing on the list yet</strong><span>Add a task to get started.</span></li>
        <?php endif; ?>
        <?php foreach ($todos as $todo): ?>
          <?php $isSelected = $selectedTodo && (int) $selectedTodo['id'] === (int) $todo['id']; ?>
          <li class="todo-item <?= $isSelected ? 'selected' : '' ?> <?= (int) $todo['is_completed'] === 1 ? 'is-complete' : '' ?>">
            <form method="post" action="index.php" class="toggle-form">
              <input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>" />
              <input type="hidden" name="action" value="toggle" />
              <input type="hidden" name="todo_id" value="<?= h($todo['id']) ?>" />
              <input type="hidden" name="view" value="<?= h($view) ?>" />
              <button class="check-button <?= (int) $todo['is_completed'] === 1 ? 'checked' : '' ?>" type="submit" aria-label="<?= (int) $todo['is_completed'] === 1 ? 'Mark ' . h($todo['title']) . ' as pending' : 'Mark ' . h($todo['title']) . ' as complete' ?>">
                <?php if ((int) $todo['is_completed'] === 1): ?><span aria-hidden="true">✓</span><?php endif; ?>
              </button>
            </form>
            <a class="todo-link" href="index.php?view=<?= h($view) ?>&amp;user_id=<?= h($currentUserId) ?>&amp;id=<?= h($todo['id']) ?>">
              <span class="todo-title"><?= h($todo['title']) ?></span>
              <?php if ($view === 'shared'): ?><span class="todo-owner">Added by <?= h($todo['owner_name']) ?></span><?php endif; ?>
            </a>
            <span class="priority priority-<?= h($todo['priority']) ?>"><?= h(ucfirst($todo['priority'])) ?></span>
          </li>
        <?php endforeach; ?>
      </ul>

      <form class="new-task-form" method="post" action="index.php">
        <input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>" />
        <input type="hidden" name="action" value="create" />
        <input type="hidden" name="view" value="<?= h($view) ?>" />
        <label class="sr-only" for="new-title">Task title</label>
        <span class="add-mark" aria-hidden="true">+</span>
        <input id="new-title" name="title" type="text" maxlength="180" placeholder="Add a task..." required />
        <label class="sr-only" for="new-priority">Task priority</label>
        <select id="new-priority" class="new-priority-select" name="priority" aria-label="Task priority">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
        <button class="add-button" type="submit">Add task</button>
      </form>
    </section>

    <div class="detail-column">
      <?php if ($selectedTodo): ?>
        <section class="panel detail-panel" aria-labelledby="detail-heading">
          <div class="panel-heading detail-heading">
            <div><h2 id="detail-heading">Task details</h2><p>Update the details or remove this task.</p></div>
            <span class="detail-spark" aria-hidden="true">✳</span>
          </div>

          <form class="detail-form" method="post" action="index.php">
            <input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>" />
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="todo_id" value="<?= h($selectedTodo['id']) ?>" />
            <input type="hidden" name="view" value="<?= h($view) ?>" />
            <label for="edit-title">Title</label>
            <input id="edit-title" name="title" type="text" maxlength="180" value="<?= h($selectedTodo['title']) ?>" required />

            <div class="detail-meta">
              <div><label for="edit-priority">Priority</label>
                <select id="edit-priority" name="priority">
                  <?php foreach (['low' => 'Low', 'medium' => 'Medium', 'high' => 'High'] as $value => $label): ?>
                    <option value="<?= h($value) ?>" <?= $selectedTodo['priority'] === $value ? 'selected' : '' ?>><?= h($label) ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div><span class="field-label">Status</span>
                <span class="status-pill <?= (int) $selectedTodo['is_completed'] === 1 ? 'complete' : '' ?>"><span></span><?= (int) $selectedTodo['is_completed'] === 1 ? 'Completed' : 'In progress' ?></span>
              </div>
            </div>

            <label for="edit-description">Description</label>
            <textarea id="edit-description" name="description" rows="5" maxlength="5000" placeholder="Add a few details about this task..."><?= h($selectedTodo['description']) ?></textarea>

            <div class="detail-actions">
              <button class="primary-button" type="submit">Save changes <span aria-hidden="true">→</span></button>
            </div>
          </form>

          <div class="task-record"><span>Created by <?= h($selectedTodo['owner_name']) ?></span><span>Updated <?= h(date('M j', strtotime($selectedTodo['updated_at']))) ?></span></div>
          <form class="delete-form" method="post" action="index.php">
            <input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>" />
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="todo_id" value="<?= h($selectedTodo['id']) ?>" />
            <input type="hidden" name="view" value="<?= h($view) ?>" />
            <button type="submit">Delete task</button>
          </form>
        </section>
      <?php else: ?>
        <section class="panel blank-detail"><span class="empty-icon" aria-hidden="true">✳</span><h2>Your task details</h2><p>Select a task from the list to view and edit it.</p></section>
      <?php endif; ?>

      <section class="tip-card">
        <span class="tip-icon" aria-hidden="true">✦</span>
        <div><strong><?= $view === 'shared' ? 'Good work is shared.' : 'Small steps add up.' ?></strong><p><?= $view === 'shared' ? 'Everyone in your workspace can see and update shared tasks.' : 'Pick one task and give it your focus today.' ?></p></div>
      </section>
    </div>
  </div>
</section>
