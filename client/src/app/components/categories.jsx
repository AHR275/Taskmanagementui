import { useState,useEffect } from "react";
import { Plus } from "lucide-react"
import ListGroup from "./baseComps/listGroup";

export default function Categories({categories,onSelectSection,onEdititem,onDeleteitem,onAddCategory,selectedSection}){
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
                <ListGroup items={categories} 
                onSelectSection={onSelectSection} onEdititem={onEdititem}
                selectedSection={selectedSection} onDeleteitem={onDeleteitem}/>
          </div>
        </div>


    )
}