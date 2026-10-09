<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$view = ($_GET['view'] ?? 'personal') === 'shared' ? 'shared' : 'personal';
require __DIR__ . '/actions.php';

if ($view === 'shared') {
    $statement = $pdo->query(
        "SELECT todos.*, users.name AS owner_name
         FROM todos JOIN users ON users.id = todos.owner_id
         WHERE todos.scope = 'shared'
         ORDER BY todos.is_completed ASC, todos.updated_at DESC, todos.id DESC"
    );
} else {
    $statement = $pdo->prepare(
        "SELECT todos.*, users.name AS owner_name
         FROM todos JOIN users ON users.id = todos.owner_id
         WHERE todos.scope = 'personal' AND todos.owner_id = :owner_id
         ORDER BY todos.is_completed ASC, todos.updated_at DESC, todos.id DESC"
    );
    $statement->execute(['owner_id' => $currentUserId]);
}
$todos = $statement->fetchAll();

$requestedTodoId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$selectedTodo = null;
foreach ($todos as $todo) {
    if ($requestedTodoId && (int) $todo['id'] === (int) $requestedTodoId) {
        $selectedTodo = $todo;
        break;
    }
}
if ($selectedTodo === null && $todos) {
    $selectedTodo = $todos[0];
}

$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
$pageTitle = $view === 'shared' ? 'Shared tasks' : 'Personal tasks';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#f7f8fc" />
  <title><?= h($pageTitle) ?> · Taskwell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <script src="register-sw.js" defer></script>
</head>
<body>
  <div class="app-shell">
    <?php require __DIR__ . '/menu-bar.php'; ?>
    <main class="main-content">
      <?php require __DIR__ . '/content.php'; ?>
    </main>
  </div>
</body>
</html>
