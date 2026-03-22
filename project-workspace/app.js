class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const todoInput = document.getElementById('todoInput');

        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (text) {
            const todo = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.todos.unshift(todo);
            this.saveToLocalStorage();
            this.render();
            input.value = '';
            input.focus();
        }
    }

    toggleTodo(id) {
        this.todos = this.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.saveToLocalStorage();
        this.render();
    }

    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('deleting');
            setTimeout(() => {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveToLocalStorage();
                this.render();
            }, 300);
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        this.renderTodos();
        this.updateStats();
        this.updateEmptyState();
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="todoApp.toggleTodo(${todo.id})"></div>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            todoList.appendChild(li);
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const todoList = document.getElementById('todoList');
        
        if (this.getFilteredTodos().length === 0) {
            emptyState.style.display = 'block';
            todoList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            todoList.style.display = 'block';
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const todoApp = new TodoApp();