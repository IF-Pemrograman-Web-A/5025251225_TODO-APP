# Taskwell Todo App

A small PHP and MySQL todo app with separate Personal and Shared task lists. On first use in a browser, sample tasks are copied from MySQL into IndexedDB. New tasks, edits, reminders, completion status, and captured images stay in IndexedDB in that browser.

Student: Fayyadh Ahmad Zuhri · 5025251225 · Class A

## Requirements

- PHP 8.0 or newer with the PDO MySQL extension
- MySQL 8.0 or MariaDB 10.4 or newer
- A modern browser with IndexedDB, notifications, service workers, and camera support

## Run locally

1. Create the sample database and tables:

   ```sh
   mysql -u root < data.sql
   ```

   If your MySQL root account has a password, use `mysql -u root -p < data.sql` and enter that password when prompted.

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

The demo profile selector switches between the sample users. Personal and Shared tasks are stored in this browser, so they do not sync to another device. The app remembers the selected profile in the browser session. Theme preference is stored in `localStorage`. Clearing this site's browser data removes locally created tasks and images; the sample tasks are copied from MySQL again on the next visit.

Camera access requires permission and a secure context. `localhost` works for local development; deployed sites need HTTPS. Reminder notifications require browser permission and are checked while the app is open, plus when it is reopened after a reminder time. Background notifications while the browser is closed need a push subscription and a push server, which are not configured in this sample.

## Project files

- `index.php` loads the active task list and composes the page.
- `config.php` connects to MySQL, starts the session, and provides shared helpers.
- `menu-bar.php` renders the Personal and Shared navigation and demo profile switcher.
- `content.php` renders the task list, task editor, and create form.
- `taskwell.js` handles IndexedDB task storage, browser reminders, theme preference, and camera capture.
- `register-sw.js` registers the service worker when the app opens.
- `sw.js` handles service worker lifecycle events and notification clicks.
- `data.sql` creates the database structure and inserts sample users and tasks.
- `style.css` contains the responsive page styling.
