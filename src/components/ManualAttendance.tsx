import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function ManualAttendance() {
  const [studentCode, setStudentCode] = useState("");
  const { getStudentByCode } = useAuth();
  const { addAttendance } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = getStudentByCode(studentCode);
    
    if (student) {
      await addAttendance(student.id, student.name, "absent");
      
      // Play absence sound effect
      const audio = new Audio("/sounds/absence-recorded.wav");
      audio.play().catch(e => console.error("Sound play failed:", e));
      
      toast({
        title: "تم تسجيل الغياب",
        description: `تم تسجيل غياب الطالب ${student.name}`
      });
      
      setStudentCode("");
    } else {
      toast({
        variant: "destructive",
        title: "كود غير صالح",
        description: "لم يتم العثور على طالب بهذا الكود"
      });
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            placeholder="أدخل كود الطالب"
            className="inputField w-full"
            required
          />
        </div>
        <button 
          type="submit" 
          className="goldBtn w-full"
          disabled={!studentCode}
        >
          تسجيل الغياب
        </button>
      </form>
    </div>
  );
}
