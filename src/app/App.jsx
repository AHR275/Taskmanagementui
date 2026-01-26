import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from './components/sidebar';
import { TaskList } from './components/task-list';
import { TaskDialog } from './components/task-dialog';
import { CategoryDialog } from './components/category-dialog';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  
  // Removed <Category[]> type generic
  const [categories, setCategories] = useState([
    { id: 'studying', name: 'Studying', color: '#3b82f6', isDefault: false },
    { id: 'working', name: 'Working', color: '#8b5cf6', isDefault: false },
    { id: 'health', name: 'Health', color: '#10b981', isDefault: false },
  ]);
  
  // Removed <Task[]> type generic
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Morning Meditation',
      description: 'Meditate for 10 minutes to start the day mindfully',
      difficulty: 'easy',
      importance: 'high',
      category: 'health',
      scheduleType: 'daily',
      dueTime: '07:00',
      recurrence: { pattern: 'daily' },
      reminder: { enabled: true, beforeMinutes: 15 },
      completed: false,
      completedDates: [],
    },
    // ... rest of initial tasks
  ]);

  // Removed all <string>, <Task | null>, etc.
  const [selectedSection, setSelectedSection] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Removed type annotations from all function parameters
  const handleAddTask = (task) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
    };
    setTasks([...tasks, newTask]);
    setIsTaskDialogOpen(false);
  };

  const handleEditTask = (task) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...task, id: editingTask.id } : t));
      setEditingTask(null);
      setIsTaskDialogOpen(false);
    }
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleToggleComplete = (id) => {
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

  const openEditDialog = (task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleAddCategory = (category) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
      isDefault: false,
    };
    setCategories([...categories, newCategory]);
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = (category) => {
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

  const handleDeleteCategory = (id) => {
    const hasTasks = tasks.some(t => t.category === id);
    if (hasTasks) {
      alert('Cannot delete category with existing tasks.');
      return;
    }
    setCategories(categories.filter(c => c.id !== id));
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
    <div className={isDark ? 'dark' : ''}>
      {/* ... rest of the JSX remains the same ... */}
    </div>
  );
}