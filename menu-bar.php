<aside class="sidebar" aria-label="Workspace navigation">
  <a class="brand" href="index.php?view=personal&amp;user_id=<?= h($currentUserId) ?>" aria-label="Taskwell home">
    <span class="brand-icon" aria-hidden="true">✓</span>
    <span>Taskwell<small>Team workspace</small></span>
  </a>

  <div class="sidebar-label">WORKSPACE</div>
  <nav class="primary-nav" aria-label="Task views">
    <a class="nav-link <?= $view === 'personal' ? 'active' : '' ?>"
       href="index.php?view=personal&amp;user_id=<?= h($currentUserId) ?>"
       <?= $view === 'personal' ? 'aria-current="page"' : '' ?>>
      <span class="nav-icon" aria-hidden="true">◷</span> Personal
      <?php if ($view === 'personal'): ?><span class="nav-dot" aria-hidden="true"></span><?php endif; ?>
    </a>
    <a class="nav-link <?= $view === 'shared' ? 'active' : '' ?>"
       href="index.php?view=shared&amp;user_id=<?= h($currentUserId) ?>"
       <?= $view === 'shared' ? 'aria-current="page"' : '' ?>>
      <span class="nav-icon shared-icon" aria-hidden="true">◎</span> Shared
      <?php if ($view === 'shared'): ?><span class="nav-dot" aria-hidden="true"></span><?php endif; ?>
    </a>
  </nav>

  <div class="sidebar-tools" aria-label="App preferences and reminders">
    <button class="tool-button" id="theme-toggle" type="button" aria-pressed="false">
      <span aria-hidden="true">◐</span><span data-theme-label>Use dark mode</span>
    </button>
    <button class="tool-button" id="enable-reminders" type="button">
      <span aria-hidden="true">♧</span><span data-reminder-label>Enable reminders</span>
    </button>
  </div>

  <div class="sidebar-spacer"></div>
  <form class="profile-switcher" method="get" action="index.php">
    <input type="hidden" name="view" value="<?= h($view) ?>" />
    <label for="user_id">Demo profile</label>
    <select id="user_id" name="user_id" aria-label="Demo profile">
      <?php foreach ($users as $user): ?>
        <option value="<?= h($user['id']) ?>" <?= (int) $user['id'] === $currentUserId ? 'selected' : '' ?>><?= h($user['name']) ?></option>
      <?php endforeach; ?>
    </select>
  </form>
  <div class="sidebar-footnote"><span class="online-dot" aria-hidden="true"></span> Tasks saved in this browser</div>
</aside>
