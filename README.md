# Taskwell Todo App

Taskwell is a static HTML, CSS, and JavaScript todo app. It does not need PHP, MySQL, or a database server. Tasks and attached images are stored in IndexedDB in the current browser. Theme and selected demo profile preferences are stored in `localStorage`.

## Run locally

From this project folder, start a simple local web server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser. Stop the server with `Control-C` when you are done. Camera access and service workers need a secure context; `localhost` works for local development, while a hosted site needs HTTPS.

## App features

- Personal and Shared task views with three demo profiles.
- Add, edit, complete, and delete tasks. Data persists in browser IndexedDB.
- Add task descriptions, select or capture a task image, and set a reminder time.
- Choose light or dark theme. The preference is saved in `localStorage`.
- Service worker notifications for reminders. Grant browser notification permission with **Enable reminders**. Due reminders are checked while the app is open and when it is reopened. Notifications while the browser is fully closed require a push subscription and a push server, which this static app does not include.
- Keyboard skip link, visible focus styles, labeled controls, and live status messages.

The demo profiles and initial sample tasks are included in `script.js`. The Personal and Shared views are demonstrations in the same browser; they do not sync with another device. Clearing this site's browser data removes tasks and images created in that browser. The starter tasks will be added again the next time the app initializes its local storage.

## Project files

- `index.html` contains the app interface.
- `script.js` handles task storage, demo profiles, camera capture, theme, and reminders.
- `style.css` contains the responsive styles and accessibility states.
- `sw.js` handles service worker lifecycle and notification clicks.
