export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  status: "present" | "absent";
  lessonNumber: number;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  examName: string;
  score: number;
  totalScore: number;
  date: string;
  lessonNumber: number;
  group: string;
  performanceIndicator: "excellent" | "good" | "average" | "poor";
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  uploadDate: string;
  grade: "first" | "second" | "third";
}

export interface Book {
  id: string;
  title: string;
  url: string;
  uploadDate: string;
  grade: "first" | "second" | "third";
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentPhone: string;
  role: "student";
  grade: "first" | "second" | "third";
  password: string;
  qrCode?: string;
  group?: string;
  code: string;
}

export interface Parent {
  id: string;
  phone: string;
  studentCode: string;
  studentName: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "parent" | "student";
  password?: string;
  grade?: "first" | "second" | "third";
  group?: string;
  code?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  grade: "first" | "second" | "third";
  paidMonths: number;
  lastPayment?: string; // جعل الحقل اختياري
  student: Student;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileData?: string; // Base64 encoded file data
  fileUrl?: string;  // Optional URL for external resources
  fileName?: string;
  fileType?: string;
  gradeLevel: "first" | "second" | "third";
  uploadDate: number;
  type: "book" | "file";
}
