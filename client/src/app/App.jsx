import { createContext, use, useState } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { Sidebar } from "./components/sidebar";
import { TaskList } from "./components/task-list";
import { TaskDialog } from "./components/task-dialog";
import { CategoryDialog } from "./components/category-dialog";
// import SignUp from "./components/singUp";
import Register from "./components/register";
import IsAuth from "./js/Auth";
import { getCategories, getTasks } from "./js/userData";
import { useEffect ,useContext} from "react";
// import { getCategories } from "./js/Auth";
export const SidebarContext = createContext(null);


export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isUser,setIsUser]=useState(false)
  const [user,setUser]=useState({
    id:'',
    username:'',
    email:'', 
    name:'',
    avatar_url:''
  })
  const [categories,setCategories]= useState([{}])
  const [tasks,setTasks]=useState([{}]);

  const [isCategoriesUpdated,setIsCategoriesUpdated]=useState(true);
  const [isTasksUpdated,setIsTasksUpdated]=useState(true);


  async function checkAuth() {

    const [isAuthed, userinfo ] = await IsAuth();
    if(isAuthed){

      setIsUser(true);
      setUser(userinfo);
    }

  }
  useEffect(() => {

    checkAuth();
  }, []);

useEffect(() => {
  if (!isUser) return;

  (async () => {
    console.log(user);

    const categoriesInfo = await getCategories(user.id);
    const tasksInfo = await getTasks(user.id);
    setCategories(categoriesInfo ?? []);
    setTasks(tasksInfo ?? []);
    console.log("categoriesInfo :>" , categoriesInfo);
    console.log("taslsInfo :>" , tasksInfo);
  })();
  setIsCategoriesUpdated(true);
  setIsTasksUpdated(true);
}, [isUser, user.id,isCategoriesUpdated,isTasksUpdated]);

  // const [categories, setCategories] = useState([
  //   { id: "studying", name: "Studying", color: "#3b82f6", isDefault: false },
  //   { id: "working", name: "Working", color: "#8b5cf6", isDefault: false },
  //   { id: "health", name: "Health", color: "#10b981", isDefault: false },
  // ]);


  // const [tasks, setTasks] = useState([
  //   {
  //     id: "1",
  //     title: "Morning Meditation",
  //     description: "Meditate for 10 minutes to start the day mindfully",
  //     difficulty: "easy",
  //     importance: "high",
  //     category: "health",
  //     scheduleType: "daily",
  //     dueTime: "07:00",
  //     recurrence: { pattern: "daily" },
  //     reminder: { enabled: true, beforeMinutes: 15 },
  //     completed: false,
  //     completedDates: [],
  //   },
  //   // ...rest of initial tasks
  // ]);

  const [selectedSection, setSelectedSection] = useState("today");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSignupDialogOpen,setIsSignupDialogOpen]= useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const toggleTheme = () => {
    setIsDark((v) => !v);
    document.documentElement.classList.toggle("dark");
  };

  
    const handleAddTask = async (task) => {
      task.user_id= user.id; 
      try {
        const res = await fetch("http://localhost:5122/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // important for auth
          body: JSON.stringify(task),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Create task failed:", data);
          return;
        }

        console.log("Task created:", data);

        // optional: update local state instead of reload
        // window.location.reload();
        setIsTasksUpdated(false);
      } catch (err) {
        console.error("Submit task error:", err);
      }

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

  const closeSignupDialog= () =>{
    setIsSignupDialogOpen(false);
  };
  const onAddCategory=()=>{
    if(isUser)setIsCategoryDialogOpen(true);
    else setIsSignupDialogOpen(true);
    
  }
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

  const handleDeleteCategory = async (id) => {
    // e.preventDefault();
    // if (!name.trim()) return;
    try{
 

        // const id= initialCategory.id;
        // const body = { name, color};
        const res = await fetch(`http://localhost:5122/categories/delete/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrors(data.CategoryErrors || {});
          return;
        }
        // console.log("Success:", data);

      
     setIsCategoriesUpdated(false);
          // onClose();
      // window.location.reload();
    } 
    catch (err) {
            console.error("Fetch failed:", err);
    }
       
    setIsCategoriesUpdated(false)
  
  };

  const openEditCategoryDialog = (category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const handleLogout= async(e)=>{
    e.preventDefault();
    try{

            const res = await fetch("http://localhost:5122/users/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
           
        });

        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
            console.log("Login failed:", data);
            return;
        }
        
        console.log("Login success:", data);
    }catch(err){
        console.error(err.message);
    }
    window.location.reload();
  };


  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground overflow-hidden ">
        {/* {console.log(categories) } */}
        {/* Sidebar (off-canvas) */}
          <SidebarContext.Provider value={{
            isSidebarOpen:isSidebarOpen,
            categories:categories,
            selectedSection:selectedSection,
            setIsSidebarOpen:setIsSidebarOpen,
            onSelectSection:setSelectedSection,
            onEditCategory:openEditCategoryDialog,
            onDeleteCategory:handleDeleteCategory,
            onAddCategory:onAddCategory,
            isCategoriesUpdated:isCategoriesUpdated,
            setIsCategoriesUpdated:setIsCategoriesUpdated,

          }}>

            <Sidebar 
        
            />
          </SidebarContext.Provider>
      

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
          <header className=" bg-background pl-8 relative z-10">
            <button
              className="p-2  hover:bg-accent transition-colors open-close-sideBar-btns rounded-circle transition-colors absolute"
              style={{ top: "22px", left: "10px" }}
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="px-6 pb-1 pt-6 flex items-center justify-between mr-3">
              <div>
                <h1 className="text-3xl font-semibold">Task Tracker</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your daily tasks and habits {user.name!==''?<span 
                  className=" font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                    , {user.name}
                    </span>:null}
                </p>
              </div>


              <div className="flex flex-row gap-3 px-2 py-1 justify-content">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-circle hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 max-w-5 max-h-5" /> : <Moon className="w-5 h-5 max-w-5 max-h-5" />}
              </button>

              {!isUser?
                <button 
                className="p-3 rounded-2 hover:bg-accent transition-colors"
                aria-label="show dialog"
                onClick={()=>setIsSignupDialogOpen(true)}

              >
                Register
              </button>
              :
              <>
             
                <button 
                className="p-3 rounded-2 hover:bg-accent transition-colors"
                aria-label="show dialog"
                onClick={handleLogout}

              >
                Log out
              </button>

              <img src={user.avatar_url}
              className="rounded-circle w-[50px] h-[50px]
               border-border border border-size-[1px]"
              />
               </>

            }
              </div>
            </div>
          </header>

          {/* Content */}
          <main id="main-container" className="flex-1 overflow-y-auto ovverflow-x-hidden">
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
          user_id={user.id}
          setIsCategoriesUpdated={setIsCategoriesUpdated}
        />
        <Register  isOpen={isSignupDialogOpen} onClose={closeSignupDialog}  isSignin={true}></Register>
      </div>

    </div>

    
  );

}
