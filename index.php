<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$view = ($_GET['view'] ?? 'personal') === 'shared' ? 'shared' : 'personal';
$statement = $pdo->query(
    "SELECT todos.*, users.name AS owner_name
     FROM todos JOIN users ON users.id = todos.owner_id
     ORDER BY todos.is_completed ASC, todos.updated_at DESC, todos.id DESC"
);
$bootstrap = [
    'todos' => $statement->fetchAll(),
    'users' => $users,
    'currentUserId' => $currentUserId,
    'view' => $view,
];
$pageTitle = $view === 'shared' ? 'Shared tasks' : 'Personal tasks';
?>
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#f7f8fc" />
  <meta name="color-scheme" content="light dark" />
  <title><?= h($pageTitle) ?> · Taskwell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <script src="register-sw.js" defer></script>
  <script src="taskwell.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div class="app-shell" id="app-shell" data-view="<?= h($view) ?>" data-user-id="<?= h($currentUserId) ?>">
    <?php require __DIR__ . '/menu-bar.php'; ?>
    <main class="main-content" id="main-content" tabindex="-1">
      <?php require __DIR__ . '/content.php'; ?>
    </main>
  </div>
  <script id="taskwell-bootstrap" type="application/json"><?= json_encode(
      $bootstrap,
      JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE
  ) ?: '{}' ?></script>
</body>
</html>
