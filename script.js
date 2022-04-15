const TODOS = "TODOS";
class Todo {
  constructor(id, title = "") {
    this.id = id;
    this.title = title.trim();
  }
}

class DataChangeEvent {
  constructor() {
    this._listeners = [];
  }

  subscribe(..._listeners) {
    this._listeners = [...this._listeners, ..._listeners];
  }

  emit(data) {
    this._listeners.forEach((listener) => listener(data));
  }
}

class TodoService {
  _todos;

  constructor(todos = []) {
    this._init();
    this.dataChangeEvent = new DataChangeEvent();

    if (!this._todos?.length) {
      this._todos = todos;
      this._commit();
    }
  }

  getTodos() {
    return [...this._todos];
  }

  addTodo(title = "") {
    if (!this._todos.some((t) => !t.title)) {
      this._todos = [...this._todos, new Todo(this._generateId(), title)];
      this._commit();
    } else {
      throw new Error("EMPTY ELEMENT");
    }
  }

  editTodo(id, title) {
    if (!title) throw new Error("EMPTY TITLE");
    const todos = [...this._todos];
    todos[this._getIndex(id)].title = title.trim();
    this._todos = todos;
    this._commit();
  }

  deleteTodo(id) {
    this._todos = this._todos.filter((t) => t.id !== id);

    this._commit();
  }

  sortTodos(direction = true) {
    const todos = [...this._todos]
      .filter((t) => t.title)
      .sort((t1, t2) =>
        t1.title.toUpperCase() > t2.title.toUpperCase() ? 1 : -1
      );
    if (!direction) todos.reverse();
    this._todos = todos;
    this._commit();
  }

  _init() {
    this._todos = JSON.parse(localStorage.getItem(TODOS) || "[]");
  }

  _commit() {
    localStorage.setItem(TODOS, JSON.stringify(this._todos));
    this.dataChangeEvent.emit();
  }

  _generateId() {
    return this._todos?.length
      ? [...this._todos].sort((t1, t2) => t2.id - t1.id)[0].id + 1
      : 1;
  }

  _getIndex(id) {
    const index = this._todos.findIndex((t) => t.id === id);

    if (index !== -1) {
      return index;
    }

    throw new Error(`There are no such todo with ${id} id.`);
  }
}

class DOMManipulator {
  _service;

  constructor(service) {
    this._service = service;
    this._init();
  }

  _init() {
    this._todoList = this._getElement("#todo-list");

    this._addBtn = this._getElement("#add-btn");
    this._addBtn.addEventListener("click", (_) => this._itemsAdd());

    this._sortBtn = this._getElement("#sort-btn");
    this._sortBtn.addEventListener("click", (_) => this._itemsSort());
    this._sortDir = true;

    this._service.dataChangeEvent.subscribe(() => this.displayTodos());

    this.displayTodos();
  }

  displayTodos() {
    const todos = this._service.getTodos();
    const items = todos.map((t) => {
      const item = document.createElement("li");
      const todoInput = document.createElement("input");
      todoInput.value = t.title;
      todoInput.addEventListener("change", (e) =>
        this._itemsEdit(t.id, e.target.value)
      );
      item.append(todoInput);

      const delBtn = document.createElement("button");
      delBtn.classList.add("del-btn");
      delBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#C4C4C4"/>
            <path d="M6 6L14 14" stroke="#C4C4C4"/>
            <path d="M6 14L14 6" stroke="#C4C4C4"/>
            </svg>
            `;
      delBtn.addEventListener("click", (_) => this._itemsDelete(t.id));
      item.append(delBtn);
      return item;
    });

    this._todoList.innerHTML = "";
    this._todoList.append(...items);
  }

  _itemsEdit(id, title) {
    try {
      this._service.editTodo(id, title);
    } catch (error) {
      this._showError(error.message);
    }
  }

  _itemsAdd() {
    try {
      this._service.addTodo();
      this._sortDir = true;
    } catch (error) {
      this._showError(error.message);
    }
  }

  _itemsDelete(id) {
    this._service.deleteTodo(id);
  }

  _itemsSort() {
    this._service.sortTodos(this._sortDir);
    this._sortDir = !this._sortDir;

    if (this._sortDir) {
      this._sortBtn.innerHTML = `<svg width="25" height="15" viewBox="0 0 25 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" width="2.5" height="12.5" fill="#C4C4C4"/>
            <rect x="10" y="3.75" width="2.5" height="7.5" transform="rotate(-90 10 3.75)" fill="#C4C4C4"/>
            <rect x="10" y="8.75" width="2.5" height="10" transform="rotate(-90 10 8.75)" fill="#C4C4C4"/>
            <rect x="10" y="13.75" width="2.5" height="15" transform="rotate(-90 10 13.75)" fill="#C4C4C4"/>
            <path d="M3.75 15L0.502405 10.3125L6.9976 10.3125L3.75 15Z" fill="#C4C4C4"/>
            </svg>
            `;
    } else {
      this._sortBtn.innerHTML = `<svg width="25" height="15" viewBox="0 0 25 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="15" width="2.5" height="12.5" transform="rotate(-180 5 15)" fill="#C4C4C4"/>
            <rect x="10" y="3.75" width="2.5" height="7.5" transform="rotate(-90 10 3.75)" fill="#C4C4C4"/>
            <rect x="10" y="8.75" width="2.5" height="10" transform="rotate(-90 10 8.75)" fill="#C4C4C4"/>
            <rect x="10" y="13.75" width="2.5" height="15" transform="rotate(-90 10 13.75)" fill="#C4C4C4"/>
            <path d="M3.75 6.55671e-07L6.99759 4.6875L0.502404 4.6875L3.75 6.55671e-07Z" fill="#C4C4C4"/>
            </svg>
            `;
    }
  }

  _showError(message) {
    alert(message);
  }

  _getElement(selector) {
    const element = document.querySelector(selector);

    if (element) {
      return element;
    }
    throw new Error(`There are no such element : ${selector}.`);
  }
}

const manipulator = new DOMManipulator(new TodoService([{ id: 1, title: "" }]));