<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$dbHost = getenv('TODO_DB_HOST') ?: '127.0.0.1';
$dbName = getenv('TODO_DB_NAME') ?: 'todo_app';
$dbUser = getenv('TODO_DB_USER') ?: 'root';
$dbPassword = getenv('TODO_DB_PASSWORD') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $exception) {
    http_response_code(500);
    exit('Could not connect to the todo database. Check config.php settings and import data.sql.');
}

function h($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$users = $pdo->query('SELECT id, name, email FROM users ORDER BY name')->fetchAll();
if (!$users) {
    http_response_code(500);
    exit('No users found. Import the sample records from data.sql.');
}

$requestedUserId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
if ($requestedUserId) {
    $_SESSION['todo_user_id'] = (int) $requestedUserId;
}

$currentUserId = (int) ($_SESSION['todo_user_id'] ?? $users[0]['id']);
$currentUser = null;
foreach ($users as $user) {
    if ((int) $user['id'] === $currentUserId) {
        $currentUser = $user;
        break;
    }
}

if ($currentUser === null) {
    $currentUser = $users[0];
    $currentUserId = (int) $currentUser['id'];
    $_SESSION['todo_user_id'] = $currentUserId;
}
