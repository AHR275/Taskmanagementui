import { useState,useEffect,useContext } from "react";

import { Plus } from "lucide-react"
import ListGroup from "./baseComps/listGroup";
import { SidebarContext } from "../App";


export default function Categories(){


    const {

        onAddCategory,
        categories
        
    }=useContext(SidebarContext)
    return (
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
          
          
                <ListGroup>
                  {categories}
                </ListGroup>
          
         
          </div>
        </div>


    )
}