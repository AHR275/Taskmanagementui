import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from '@/app/components/sidebar';
import { TaskList } from '@/app/components/task-list';
import { TaskDialog } from '@/app/components/task-dialog';
import { CategoryDialog } from '@/app/components/category-dialog';

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: 'low' | 'medium' | 'high';
  category: string;
  scheduleType: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom';
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:MM format
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'interval';
    interval?: number; // for every N days
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
  };
  reminder?: {
    enabled: boolean;
    beforeMinutes: number;
    recurringInterval?: number; // remind every X minutes
  };
  completed: boolean;
  completedDates: string[]; // ISO date strings for recurring tasks
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'studying', name: 'Studying', color: '#3b82f6', isDefault: false },
    { id: 'working', name: 'Working', color: '#8b5cf6', isDefault: false },
    { id: 'health', name: 'Health', color: '#10b981', isDefault: false },
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Morning Meditation',
      description: 'Meditate for 10 minutes to start the day mindfully',
      difficulty: 'easy',
      importance: 'high',
      category: 'health',
      scheduleType: 'daily',
      dueTime: '07:00',
      recurrence: {
        pattern: 'daily',
      },
      reminder: {
        enabled: true,
        beforeMinutes: 15,
      },
      completed: false,
      completedDates: [],
    },
    {
      id: '2',
      title: 'Complete Project Documentation',
      description: 'Write comprehensive documentation for the new feature',
      difficulty: 'hard',
      importance: 'high',
      category: 'working',
      scheduleType: 'one-time',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '17:00',
      reminder: {
        enabled: true,
        beforeMinutes: 60,
        recurringInterval: 30,
      },
      completed: false,
      completedDates: [],
    },
    {
      id: '3',
      title: 'Study React Patterns',
      description: 'Learn advanced React patterns and best practices',
      difficulty: 'medium',
      importance: 'medium',
      category: 'studying',
      scheduleType: 'custom',
      dueTime: '20:00',
      recurrence: {
        pattern: 'interval',
        interval: 2, // every 2 days
      },
      reminder: {
        enabled: true,
        beforeMinutes: 30,
      },
      completed: false,
      completedDates: [],
    },
  ]);

  const [selectedSection, setSelectedSection] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Track selected date for today section
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
    };
    setTasks([...tasks, newTask]);
    setIsTaskDialogOpen(false);
  };

  const handleEditTask = (task: Omit<Task, 'id'>) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...task, id: editingTask.id } : t));
      setEditingTask(null);
      setIsTaskDialogOpen(false);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const today = new Date().toISOString().split('T')[0];
        const newCompleted = !t.completed;
        const newCompletedDates = newCompleted 
          ? [...t.completedDates, today]
          : t.completedDates.filter(d => d !== today);
        
        return {
          ...t,
          completed: newCompleted,
          completedDates: newCompletedDates,
        };
      }
      return t;
    }));
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleAddCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
      isDefault: false,
    };
    setCategories([...categories, newCategory]);
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = (category: Omit<Category, 'id'>) => {
    if (editingCategory) {
      setCategories(categories.map(c => 
        c.id === editingCategory.id 
          ? { ...category, id: editingCategory.id, isDefault: editingCategory.isDefault } 
          : c
      ));
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    // Don't allow deleting if tasks use this category
    const hasTasks = tasks.some(t => t.category === id);
    if (hasTasks) {
      alert('Cannot delete category with existing tasks. Please reassign or delete the tasks first.');
      return;
    }
    setCategories(categories.filter(c => c.id !== id));
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex">
        {/* Sidebar */}
        <Sidebar
          categories={categories}
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          onAddCategory={() => setIsCategoryDialogOpen(true)}
          onEditCategory={openEditCategoryDialog}
          onDeleteCategory={handleDeleteCategory}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">Task Tracker</h1>
                <p className="text-muted-foreground mt-1">Manage your daily tasks and habits</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-lg bg-secondary hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Task List */}
          <main className="flex-1 overflow-y-auto">
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