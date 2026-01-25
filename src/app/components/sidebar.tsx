import { Calendar, CalendarDays, CalendarRange, CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Category } from '@/app/App';

interface SidebarProps {
  categories: Category[];
  selectedSection: string;
  onSelectSection: (section: string) => void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const mainSections = [
  { id: 'today', name: 'Today Tasks', icon: Calendar },
  { id: 'weekly', name: 'Weekly Tasks', icon: CalendarDays },
  { id: 'monthly', name: 'Monthly Tasks', icon: CalendarRange },
  { id: 'monthlyRate', name: 'Monthly Rate', icon: CalendarRange },
  { id: 'undone', name: 'Undone Tasks', icon: CheckSquare },
];

export function Sidebar({
  categories,
  selectedSection,
  onSelectSection,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: SidebarProps) {
  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col h-screen">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Sections</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Sections */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-2 px-2">Main</h3>
          <div className="space-y-1">
            {mainSections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSelectSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Categories */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm text-muted-foreground">Categories</h3>
            <button
              onClick={onAddCategory}
              className="p-1 hover:bg-secondary rounded transition-colors"
              aria-label="Add category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((category) => {
              const isActive = selectedSection === category.id;
              return (
                <div
                  key={category.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <button
                    onClick={() => onSelectSection(category.id)}
                    className="flex-1 text-left truncate"
                  >
                    {category.name}
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditCategory(category)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                      aria-label="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category.id)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}