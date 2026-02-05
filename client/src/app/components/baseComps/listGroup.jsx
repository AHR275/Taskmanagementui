import { useEffect,useState,useContext, Children } from "react";
import { SidebarContext } from "../../App";
import {  Edit2, Trash2 } from "lucide-react"

export default function ListGroup({children}){
    const {

      selectedSection,
      onEditCategory, 
     onDeleteCategory,
      onSelectSection,
      

    } = useContext(SidebarContext);
    const items= children;
    // console.log("items:catego :=> ", items);
    const content =items.length>=1? items.map((item) => {
              const isActive = selectedSection === item.id;
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                    isActive
                      ? ' text-primary-foreground'
                      : 'hover:border-2px'
                  }`}
                  style={!isActive?{ backgroundColor:`${item.color}30` }:{ backgroundColor:`${item.color}`}}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <button
                    onClick={() => onSelectSection(item.id)}
                    className="flex-1 text-left truncate"
                  >
                    {item.name}
                  </button>
                  <div className="flex gap-1  group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditCategory(item)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                      aria-label="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(item.id)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }):null; 
    return (<>
      {content}
       
            </>
    )
}