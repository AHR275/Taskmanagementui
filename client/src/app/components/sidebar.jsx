import { Calendar, CalendarDays, CalendarRange, CheckSquare,X } from 'lucide-react';
import { useEffect , useContext} from 'react';
import Categories from './categories';
import { SidebarContext } from '../App'; 
// import  { Category } from '../App';



const mainSections = [
  { id: 'today', name: 'Today Tasks', icon: Calendar },
  { id: 'weekly', name: 'Weekly Tasks', icon: CalendarDays },
  { id: 'monthly', name: 'Monthly Tasks', icon: CalendarRange },
  { id: 'monthlyRate', name: 'Monthly Rate', icon: CalendarRange },
  { id: 'undone', name: 'Undone Tasks', icon: CheckSquare },
];

export function Sidebar({

}) {
  const {
 
    selectedSection,
    onSelectSection,

    isSidebarOpen,
    setIsSidebarOpen,
  } = useContext(SidebarContext);
//   useEffect(() => {
//   fetch("http://localhost:4000/health")
//     .then(res => res.json())
//     .then(data => console.log("BACKEND:", data))
//     .catch(err => console.error("ERROR:", err));
// }, []);
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
          <Categories 

          ></Categories>
      </div>
    </aside>
  );
}