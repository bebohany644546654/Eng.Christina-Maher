
import React from "react";
import { Avatar } from "@/components/ui/avatar";

export function Logo() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="h-16 w-16 flex items-center justify-center">
        <Avatar className="h-16 w-16 border-2 border-physics-gold">
          <img 
            src="/lovable-uploads/05c76ed8-a195-4223-8d12-9d9dda7c397e.png" 
            alt="Eng.Christina Maher" 
            className="h-16 w-16 object-cover rounded-full"
          />
        </Avatar>
      </div>
      <h1 className="text-2xl font-bold text-physics-gold mr-3 font-tajawal">Eng.Christina Maher</h1>
    </div>
  );
}
