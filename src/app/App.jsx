import { useState } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { TaskList } from "./components/task-list";
import { TaskDialog } from "./components/task-dialog";
import { CategoryDialog } from "./components/category-dialog";

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [categories, setCategories] = useState([
    { id: "studying", name: "Studying", color: "#3b82f6", isDefault: false },
    { id: "working", name: "Working", color: "#8b5cf6", isDefault: false },
    { id: "health", name: "Health", color: "#10b981", isDefault: false },
  ]);

  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Morning Meditation",
      description: "Meditate for 10 minutes to start the day mindfully",
      difficulty: "easy",
      importance: "high",
      category: "health",
      scheduleType: "daily",
      dueTime: "07:00",
      recurrence: { pattern: "daily" },
      reminder: { enabled: true, beforeMinutes: 15 },
      completed: false,
      completedDates: [],
    },
    // ...rest of initial tasks
  ]);

  const [selectedSection, setSelectedSection] = useState("today");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const toggleTheme = () => {
    setIsDark((v) => !v);
    document.documentElement.classList.toggle("dark");
  };

  const handleAddTask = (task) => {
    const newTask = { ...task, id: Date.now().toString() };
    setTasks((prev) => [...prev, newTask]);
    setIsTaskDialogOpen(false);
  };

  const handleEditTask = (task) => {
    if (!editingTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? { ...task, id: t.id } : t))
    );
    setEditingTask(null);
    setIsTaskDialogOpen(false);
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        const today = new Date().toISOString().split("T")[0];
        const newCompleted = !t.completed;
        const newCompletedDates = newCompleted
          ? [...t.completedDates, today]
          : t.completedDates.filter((d) => d !== today);

        return { ...t, completed: newCompleted, completedDates: newCompletedDates };
      })
    );
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleAddCategory = (category) => {
    const newCategory = { ...category, id: Date.now().toString(), isDefault: false };
    setCategories((prev) => [...prev, newCategory]);
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = (category) => {
    if (!editingCategory) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? { ...category, id: editingCategory.id, isDefault: editingCategory.isDefault }
          : c
      )
    );

    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = (id) => {
    const hasTasks = tasks.some((t) => t.category === id);
    if (hasTasks) {
      alert("Cannot delete category with existing tasks.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const openEditCategoryDialog = (category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar (off-canvas) */}

          <Sidebar 
            isSidebarOpen={isSidebarOpen}
            categories={categories}
            selectedSection={selectedSection}
            setIsSidebarOpen={setIsSidebarOpen}
            onSelectSection={setSelectedSection}
            onAddCategory={() => setIsCategoryDialogOpen(true)}
            onEditCategory={openEditCategoryDialog}
            onDeleteCategory={handleDeleteCategory}
          />
      

        {/* Backdrop */}


        {/* Main */}
        <div
          id="main-div"
          className={`min-h-screen flex flex-col relative z-10
            transform transition-transform duration-300
            ${isSidebarOpen ? "translate-x-64" : "translate-x-0"}
          `}
        >
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 "
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
          {/* Header */}
          <header className="border-b border-border bg-card pl-8 relative z-10">
            <button
              className="p-2  hover:bg-accent transition-colors open-close-sideBar-btns rounded-circle transition-colors absolute"
              style={{ top: "22px", left: "10px" }}
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="px-6 py-6 flex items-center justify-between mr-3">
              <div>
                <h1 className="text-3xl font-semibold">Task Tracker</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your daily tasks and habits
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="p-3 rounded-circle hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Content */}
          <main id="main-container" className="flex-1 overflow-y-auto">
            <TaskList
              tasks={tasks}
              categories={categories}
              selectedSection={selectedSection}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onAddTask={() => setIsTaskDialogOpen(true)}
              onEditTask={openEditDialog}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />
          </main>
        </div>

        {/* Dialogs */}
        <TaskDialog
          isOpen={isTaskDialogOpen}
          onClose={closeTaskDialog}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          initialTask={editingTask || undefined}
          categories={categories}
        />

        <CategoryDialog
          isOpen={isCategoryDialogOpen}
          onClose={closeCategoryDialog}
          onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
          initialCategory={editingCategory || undefined}
        />
      </div>
    </div>
  );
}
