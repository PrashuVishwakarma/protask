class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    this.currentFilter = "all";
    this.searchTerm = "";
    this.draggedElement = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.updateStats();
  }

  bindEvents() {
    // Form submission
    document.getElementById("taskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Search functionality
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.render();
    });

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });
  }

  addTask() {
    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("taskDescription").value;
    const priority = document.getElementById("taskPriority").value;
    const category = document.getElementById("taskCategory").value;
    const dueDate = document.getElementById("taskDueDate").value;

    const task = {
      id: Date.now(),
      title,
      description,
      priority,
      category,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.render();
    this.updateStats();
    this.clearForm();
    this.showNotification("Task added successfully!", "success");
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.saveTasks();
    this.render();
    this.updateStats();
    this.showNotification("Task deleted successfully!", "info");
  }

  toggleTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
      this.updateStats();
      this.showNotification(
        task.completed ? "Task completed!" : "Task reopened!",
        task.completed ? "success" : "info"
      );
    }
  }

  editTask(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      document.getElementById("taskTitle").value = task.title;
      document.getElementById("taskDescription").value = task.description;
      document.getElementById("taskPriority").value = task.priority;
      document.getElementById("taskCategory").value = task.category;
      document.getElementById("taskDueDate").value = task.dueDate;

      this.deleteTask(id);
      this.showNotification("Task loaded for editing!", "info");
    }
  }

  getFilteredTasks() {
    let filtered = this.tasks;

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(this.searchTerm) ||
          task.description.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply category/status filter
    if (this.currentFilter !== "all") {
      filtered = filtered.filter((task) => {
        switch (this.currentFilter) {
          case "pending":
            return !task.completed;
          case "completed":
            return task.completed;
          case "overdue":
            return (
              !task.completed &&
              task.dueDate &&
              new Date(task.dueDate) < new Date()
            );
          default:
            return task.category === this.currentFilter;
        }
      });
    }

    return filtered;
  }

  render() {
    const container = document.getElementById("todosContainer");
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = `
                        <div class="empty-state">
                            <h3>No tasks found</h3>
                            <p>Add a new task to get started!</p>
                        </div>
                    `;
      return;
    }

    container.innerHTML = filteredTasks
      .map((task) => this.createTaskHTML(task))
      .join("");

    // Add event listeners for dynamically created elements
    this.addTaskEventListeners();
  }

  createTaskHTML(task) {
    const isOverdue =
      task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const dueDateText = task.dueDate
      ? new Date(task.dueDate).toLocaleString()
      : "No due date";

    return `
                    <div class="todo-item ${task.completed ? "completed" : ""}" 
                         draggable="true" 
                         data-id="${task.id}">
                        <div class="todo-header">
                            <div>
                                <div class="todo-title">${task.title}</div>
                                <div class="todo-description">${
                                  task.description
                                }</div>
                            </div>
                        </div>
                        
                        <div class="todo-meta">
                            <span class="todo-tag priority-${task.priority}">
                                ${task.priority.toUpperCase()} PRIORITY
                            </span>
                            <span class="todo-tag category-${task.category}">
                                ${task.category.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="due-date ${isOverdue ? "overdue" : ""}">
                             <img src="assest/calender.png" alt="Due Date" width="16" height="16" style="vertical-align: middle;" /> ${dueDateText}
                            ${isOverdue ? " (OVERDUE)" : ""}
                        </div>
                        
                        <div class="todo-actions">
                            <button class="action-btn complete-btn" onclick="todoApp.toggleTask(${
                              task.id
                            })">
                                ${task.completed ?'<img src="assest/undo.png" alt="Undo" width="20" height="20" />' : '<img src="assest/checked.png" alt="Complete" width="20" height="20" />'}
                            </button>
                            <button class="action-btn edit-btn" onclick="todoApp.editTask(${
                              task.id
                            })">
                                <img src="assest/edit.png" alt="Edit" width="20" height="20" />
                            </button>
                            <button class="action-btn delete-btn" onclick="todoApp.deleteTask(${
                              task.id
                            })">
                             <img src="assest/delete.png" alt="Delete" width="20" height="20" />
                            </button>
                        </div>
                    </div>
                `;
  }

  addTaskEventListeners() {
    const todoItems = document.querySelectorAll(".todo-item");

    todoItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        this.draggedElement = e.target;
        e.target.classList.add("dragging");
      });

      item.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
        this.draggedElement = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (this.draggedElement && this.draggedElement !== e.target) {
          this.reorderTasks(
            this.draggedElement.dataset.id,
            e.target.dataset.id
          );
        }
      });
    });
  }

  reorderTasks(draggedId, targetId) {
    const draggedIndex = this.tasks.findIndex(
      (task) => task.id === parseInt(draggedId)
    );
    const targetIndex = this.tasks.findIndex(
      (task) => task.id === parseInt(targetId)
    );

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
      this.tasks.splice(targetIndex, 0, draggedTask);
      this.saveTasks();
      this.render();
      this.showNotification("Tasks reordered!", "info");
    }
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const overdue = this.tasks.filter(
      (task) =>
        !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
    ).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("overdueTasks").textContent = overdue;
  }

  clearForm() {
    document.getElementById("taskForm").reset();
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the app
const todoApp = new TodoApp();

// Add some sample data for demonstration
if (todoApp.tasks.length === 0) {
  const sampleTasks = [
    {
      id: 1,
      title: "Complete project proposal",
      description: "Write and submit the Q4 project proposal for client review",
      priority: "high",
      category: "work",
      dueDate: "2025-07-15T09:00",
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Buy groceries",
      description: "Get milk, bread, eggs, and vegetables from the store",
      priority: "medium",
      category: "shopping",
      dueDate: "2025-07-14T18:00",
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Morning workout",
      description: "30-minute cardio session at the gym",
      priority: "low",
      category: "health",
      dueDate: "2025-07-13T07:00",
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ];

  todoApp.tasks = sampleTasks;
  todoApp.saveTasks();
  todoApp.render();
  todoApp.updateStats();
}
