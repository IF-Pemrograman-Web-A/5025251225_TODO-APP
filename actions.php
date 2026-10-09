<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    return;
}

$view = ($_POST['view'] ?? 'personal') === 'shared' ? 'shared' : 'personal';
$postedToken = (string) ($_POST['csrf_token'] ?? '');
$taskId = filter_input(INPUT_POST, 'todo_id', FILTER_VALIDATE_INT);
$taskId = $taskId ? (int) $taskId : null;

if (!hash_equals((string) $_SESSION['csrf_token'], $postedToken)) {
    set_flash('Your session expired. Please try again.', 'error');
    redirect_to($view, $currentUserId, $taskId);
}

$action = (string) ($_POST['action'] ?? '');
$priorityValues = ['low', 'medium', 'high'];

try {
    if ($action === 'create') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $priority = (string) ($_POST['priority'] ?? 'medium');

        if ($title === '' || strlen($title) > 180) {
            set_flash('Enter a title of 1 to 180 characters.', 'error');
            redirect_to($view, $currentUserId);
        }
        if (!in_array($priority, $priorityValues, true)) {
            $priority = 'medium';
        }

        $statement = $pdo->prepare(
            'INSERT INTO todos (title, description, priority, scope, owner_id)
             VALUES (:title, :description, :priority, :scope, :owner_id)'
        );
        $statement->execute([
            'title' => $title,
            'description' => $description,
            'priority' => $priority,
            'scope' => $view,
            'owner_id' => $currentUserId,
        ]);

        $newId = (int) $pdo->lastInsertId();
        set_flash('Task added.');
        redirect_to($view, $currentUserId, $newId);
    }

    if ($action === 'update' || $action === 'toggle' || $action === 'delete') {
        $allowedTask = $pdo->prepare(
            "SELECT id FROM todos
             WHERE id = :id AND scope = :scope
               AND (scope = 'shared' OR owner_id = :owner_id)"
        );
        $allowedTask->execute([
            'id' => $taskId,
            'scope' => $view,
            'owner_id' => $currentUserId,
        ]);

        if (!$taskId || !$allowedTask->fetch()) {
            set_flash('That task is no longer available.', 'error');
            redirect_to($view, $currentUserId);
        }

        if ($action === 'update') {
            $title = trim((string) ($_POST['title'] ?? ''));
            $description = trim((string) ($_POST['description'] ?? ''));
            $priority = (string) ($_POST['priority'] ?? 'medium');
            if ($title === '' || strlen($title) > 180) {
                set_flash('Enter a title of 1 to 180 characters.', 'error');
                redirect_to($view, $currentUserId, $taskId);
            }
            if (!in_array($priority, $priorityValues, true)) {
                $priority = 'medium';
            }

            $statement = $pdo->prepare(
                'UPDATE todos SET title = :title, description = :description,
                    priority = :priority, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'title' => $title,
                'description' => $description,
                'priority' => $priority,
                'id' => $taskId,
            ]);
            set_flash('Task updated.');
        } elseif ($action === 'toggle') {
            $statement = $pdo->prepare(
                'UPDATE todos SET is_completed = 1 - is_completed,
                    updated_at = CURRENT_TIMESTAMP WHERE id = :id'
            );
            $statement->execute(['id' => $taskId]);
            set_flash('Task status updated.');
        } else {
            $statement = $pdo->prepare('DELETE FROM todos WHERE id = :id');
            $statement->execute(['id' => $taskId]);
            set_flash('Task deleted.');
            $taskId = null;
        }

        redirect_to($view, $currentUserId, $taskId);
    }
} catch (PDOException $exception) {
    set_flash('The database could not save that change. Please try again.', 'error');
    redirect_to($view, $currentUserId, $taskId);
}

set_flash('Choose a valid task action.', 'error');
redirect_to($view, $currentUserId, $taskId);
