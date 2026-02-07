import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// import  { Category } from '../App';
const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export function CategoryDialog({ isOpen, onClose, onSubmit, initialCategory , user_id,setIsCategoriesUpdated,
  handleAddCategory, handleEditCategory
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState("#8b5cf6");
  const [errors,setErrors]=useState({})

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setColor(initialCategory.color);
    } else {
      setName('');
      setColor("#8b5cf6");
    }
  }, [initialCategory, isOpen]);

    const handleSubmit = async(e) => {
      e.preventDefault();
      if (!name.trim()) return;
      try{
        if(!initialCategory){
          return await handleAddCategory(name,color,user_id);
  
        }else{
          return await handleEditCategory(initialCategory,name,color);
  
        }
       setIsCategoriesUpdated(false);
            // onClose();
        // window.location.reload();
      } 
      catch (err) {
              console.error("Fetch failed:", err);
      }
  
      onClose();
          
    };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {initialCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="block mb-2">
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            {/* <label className="block mb-2">Color</label>
            <input type="color" value={color} className="">
              {/* {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    color === presetColor ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                  }`}
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))} 
            </input> */}

            <label htmlFor="exampleColorInput" className="form-label">Color picker</label>
            <input type="color" className="form-control form-control-color" id="category-color-input" value={color} title="Choose your color"
            onChange={(e)=>{
              setColor(e.target.value)
            }}
            ></input>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              {initialCategory ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}