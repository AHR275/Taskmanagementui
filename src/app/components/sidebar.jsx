import { Calendar, CalendarDays, CalendarRange, CheckSquare, Plus, Edit2, Trash2 ,X } from 'lucide-react';
// import  { Category } from '../App';


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
  isSidebarOpen,
  setIsSidebarOpen
}) {
  return (
    <aside id="side-bar"
    //  className="w-72 border-r border-border bg-card flex flex-col h-full h-screen fixed transform transition-transform duration-500 " 
              
          className={`fixed top-0 left-0 h-screen w-64 bg-card border-r border-border z-30
            transform transition-transform duration-300
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
    style={{zIndex:"3"}}
    >
      <div className="p-6 border-b border-border relative ">
        <h2 className="text-lg font-semibold  "
        style={{maxWidth:"fit-content" , display:"span"}}
        >Sections</h2>
        <button className=" p-1 open-close-sideBar-btns rounded-circle transition-colors absolute"
        style={{maxWidth:"fit-content" , 
          top:"20px", right:"10px"
        }}
        onClick={()=>{
          setIsSidebarOpen(false)
        }}
        >
          <X className="w-5 h-5"/>
        </button>
      </div>


      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Sections */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-2 px-2">Main</h3>
          <div className="space-y-1 grid items-center gap-1">
            {mainSections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSelectSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-2 transition-colors ${
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
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                    isActive
                      ? ' text-primary-foreground'
                      : 'hover:border-2px'
                  }`}
                  style={!isActive?{ backgroundColor:`${category.color}30` }:{ backgroundColor:`${category.color}`}}
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
                  <div className="flex gap-1  group-hover:opacity-100 transition-opacity">
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