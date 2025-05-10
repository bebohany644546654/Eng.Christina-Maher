
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomCode(length = 6): string {
  const characters = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getGradeDisplay(grade: "first" | "second" | "third"): string {
  switch (grade) {
    case "first":
      return "الصف الأول الثانوي";
    case "second":
      return "الصف الثاني الثانوي";
    case "third":
      return "الصف الثالث الثانوي";
    default:
      return "";
  }
}

export function getLessonDisplay(lessonNumber: number): string {
  switch (lessonNumber) {
    case 1: return "الحصة الأولى";
    case 2: return "الحصة الثانية";
    case 3: return "الحصة الثالثة";
    case 4: return "الحصة الرابعة";
    case 5: return "الحصة الخامسة";
    case 6: return "الحصة السادسة";
    case 7: return "الحصة السابعة";
    case 8: return "الحصة الثامنة";
    default: return `الحصة ${lessonNumber}`;
  }
}

export function countLessons(studentId: string): number {
  // Get attendance records for this student from localStorage
  const attendanceStr = localStorage.getItem("attendance");
  if (!attendanceStr) return 0;
  
  try {
    const attendance = JSON.parse(attendanceStr);
    const studentAttendance = attendance.filter((a: any) => a.studentId === studentId);
    return studentAttendance.length > 8 ? 8 : studentAttendance.length;
  } catch (error) {
    console.error("Error counting lessons:", error);
    return 0;
  }
}
