# Taskwell Todo App

A small PHP and MySQL todo app with separate Personal and Shared task lists. It is built from reusable PHP files and uses PDO prepared statements for database operations.

Student: Fayyadh Ahmad Zuhri · 5025251225 · Class A

## Requirements

- PHP 8.0 or newer with the PDO MySQL extension
- MySQL 8.0 or MariaDB 10.4 or newer

## Run locally

1. Create the sample database and tables:

   ```sh
   mysql -u root -p < data.sql
   ```

2. If your local MySQL credentials differ from the defaults, set these environment variables before starting PHP:

   ```sh
   export TODO_DB_HOST=127.0.0.1
   export TODO_DB_NAME=todo_app
   export TODO_DB_USER=root
   export TODO_DB_PASSWORD=your-password
   ```

3. Start PHP's local server from this folder:

   ```sh
   php -S localhost:8000
   ```

4. Open <http://localhost:8000>.

The demo profile selector switches between the sample users. Personal tasks are private to the selected profile; Shared tasks appear for every profile. The app remembers the selected profile in the browser session.

## Project files

- `index.php` loads the active task list and composes the page.
- `config.php` connects to MySQL, starts the session, and provides shared helpers.
- `menu-bar.php` renders the Personal and Shared navigation and demo profile switcher.
- `content.php` renders the task list, task editor, and create form.
- `actions.php` handles create, read selection, update, completion toggle, and delete requests.
- `register-sw.js` registers the service worker when the app opens.
- `sw.js` handles service worker lifecycle events and displays incoming push notifications. Sending push messages requires a push subscription and a configured push server.
- `data.sql` creates the database structure and inserts sample users and tasks.
- `style.css` contains the responsive page styling.
