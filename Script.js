document.addEventListener("DOMContentLoaded", () => {
  const todoList = document.getElementById("todoList");
  const todoCount = document.getElementById("todoCount");
  const detailTitle = document.getElementById("detailTitle");
  const detailDescription = document.getElementById("detailDescription");
  const detailStatus = document.getElementById("detailStatus");
  const addTodoForm = document.getElementById("addTodoForm");
  const titleInput = document.getElementById("title");
  const priorityInput = document.getElementById("priority");

  let nextId = todoList.children.length + 1;

  // Update the task count badge at the top of the list
  function updateCount() {
    todoCount.textContent = todoList.children.length;
  }

  // Fill the "Todo details" panel with data from the given <li>
  function showDetail(li) {
    const label = li.querySelector("label");
    const checkbox = li.querySelector('input[type="checkbox"]');
    const isDone = checkbox.checked;

    detailTitle.textContent = label.textContent;
    detailDescription.textContent =
      li.dataset.description || "Belum ada deskripsi untuk tugas ini.";
    detailStatus.textContent = isDone ? "Completed" : "Pending";
    detailStatus.classList.toggle("pending", !isDone);
  }

  // Mark one <li> as selected and show its detail
  function selectTodo(li) {
    todoList
      .querySelectorAll("li.selected")
      .forEach((item) => item.classList.remove("selected"));
    li.classList.add("selected");
    showDetail(li);
  }

  // Build a new <li> element for a todo
  function createTodoItem(title, priority) {
    const id = nextId++;

    const li = document.createElement("li");
    li.dataset.priority = priority;
    li.dataset.id = String(id);
    li.dataset.description = "Belum ada deskripsi untuk tugas ini.";
    li.tabIndex = 0;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `todo-${id}`;

    const label = document.createElement("label");
    label.htmlFor = `todo-${id}`;
    label.textContent = title;

    li.append(checkbox, label);
    return li;
  }

  // Click on a task -> select it (unless the click was on the checkbox itself)
  todoList.addEventListener("click", (event) => {
    const li = event.target.closest("li");
    if (!li) return;

    if (event.target.matches('input[type="checkbox"]')) {
      // Checkbox toggled: just refresh the detail panel if this item is open
      if (li.classList.contains("selected")) showDetail(li);
      return;
    }

    selectTodo(li);
  });

  // Keyboard support: Enter or Space selects the focused task
  todoList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const li = event.target.closest("li");
    if (!li) return;
    event.preventDefault();
    selectTodo(li);
  });

  // Add a new todo from the form
  addTodoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }

    const li = createTodoItem(title, priorityInput.value);
    todoList.appendChild(li);

    updateCount();
    selectTodo(li);

    addTodoForm.reset();
    priorityInput.value = "medium";
    titleInput.focus();
  });

  updateCount();
});