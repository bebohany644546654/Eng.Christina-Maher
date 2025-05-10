import React, { createContext, ReactNode, useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { Attendance, Grade, Video, Book, Student } from "@/types";
import { showNotification } from '../components/Notifications';
import { useDataPersistence } from '@/hooks/use-data-persistence';
import { toast } from "@/hooks/use-toast";
import { db, isOnline } from "@/firebase";
import { 
  collection, query, getDocs, doc, writeBatch,
  updateDoc, deleteDoc, setDoc, onSnapshot, addDoc, serverTimestamp,
  CollectionReference, DocumentReference
} from "firebase/firestore";
import { ref, onValue, set, get } from "firebase/database";
import { Network } from '@capacitor/network';

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: "first" | "second" | "third";
  paidMonths: number;
  monthlyFee: number;
  totalPaid: number;
  lastPayment: string;
  status: "متأخر" | "حالي" | "مدفوع مقدماً";
}

interface FileResource {
  id: string;
  title: string;
  description: string;
  fileData: string; // Base64 encoded file data
  fileType: string;
  fileName: string;
  gradeLevel: "first" | "second" | "third";
  uploadDate: number;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  fileData?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  gradeLevel: "first" | "second" | "third";
  uploadDate: number;
  type: "book" | "file";
}

interface DataContextType {
  attendance: Attendance[];
  grades: Grade[];
  videos: Video[];
  books: Book[];
  payments: Payment[];
  files: FileResource[];
  resources: Resource[];
  
  // Attendance methods
  addAttendance: (studentId: string, studentName: string, status: "present" | "absent") => void;
  getStudentAttendance: (studentId: string) => Attendance[];
  getAttendanceByGrade: (grade: "first" | "second" | "third") => Attendance[];
  getStudentLessonCount: (studentId: string) => number;
  deleteAttendance: (recordId: string, studentName: string) => void;
  
  // Grades methods
  addGrade: (studentId: string, studentName: string, examName: string, score: number, totalScore: number, lessonNumber: number, group: string) => void;
  getStudentGrades: (studentId: string) => Grade[];
  getGradesByGradeLevel: (grade: "first" | "second" | "third") => Grade[];
  deleteGrade: (gradeId: string) => void;
  updateGrade: (gradeId: string, gradeData: Omit<Grade, "id" | "date">) => void;
  
  // Videos methods
  addVideo: (title: string, videoId: string, grade: "first" | "second" | "third") => Promise<boolean>;
  updateVideo: (id: string, title: string, url: string, grade: "first" | "second" | "third", thumbnailUrl?: string) => void;
  deleteVideo: (id: string) => void;
  getVideosByGrade: (grade: "first" | "second" | "third") => Video[];
  getAllVideos: () => Video[];
  updateVideoViews: (videoId: string) => void;
  saveVideo: (title: string, url: string, grade: string) => boolean;
  
  // Books methods
  addBook: (title: string, url: string, grade: "first" | "second" | "third") => void;
  updateBook: (id: string, title: string, url: string, grade: "first" | "second" | "third") => void;
  deleteBook: (id: string) => void;
  getBooksByGrade: (grade: "first" | "second" | "third") => Book[];
  getAllBooks: () => Book[];

  // Payments methods
  addPayment: (studentId: string, months: number) => void;
  getStudentPayments: (studentId: string) => Payment[];
  getAllPayments: () => Payment[];
  updatePaymentStatus: (studentId: string) => void;

  // File methods
  saveFile: (title: string, description: string, file: File, gradeLevel: "first" | "second" | "third") => Promise<void>;
  getFilesByGrade: (gradeLevel: "first" | "second" | "third") => FileResource[];
  deleteFile: (fileId: string) => void;

  // Resource methods
  saveResource: (
    title: string, 
    description: string, 
    file: File | null,
    fileUrl: string | null,
    gradeLevel: "first" | "second" | "third",
    type: "book" | "file"
  ) => Promise<void>;
  getResourcesByGrade: (gradeLevel: "first" | "second" | "third") => Resource[];
  deleteResource: (resourceId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<FileResource[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [students, setStudents] = useState<Student[]>(
    JSON.parse(localStorage.getItem('students') || '[]')
  );

  const addAttendance = useCallback((studentId: string, studentName: string, status: "present" | "absent") => {
    const newAttendance: Attendance = {
      id: Math.random().toString(),
      studentId,
      studentName,
      status,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      lessonNumber: 1 // Default lesson number, adjust as needed
    };
    setAttendance(prev => [...prev, newAttendance]);
  }, []);

  const getStudentAttendance = useCallback((studentId: string): Attendance[] => {
    return attendance.filter(a => a.studentId === studentId);
  }, [attendance]);

  const getAttendanceByGrade = useCallback((grade: "first" | "second" | "third"): Attendance[] => {
    // Note: Attendance doesn't have a grade field, so this might need to be adjusted
    return attendance;
  }, [attendance]);

  const getStudentLessonCount = useCallback((studentId: string): number => {
    return attendance.filter(a => a.studentId === studentId).length;
  }, [attendance]);

  const deleteAttendance = useCallback((recordId: string, studentName: string) => {
    setAttendance(prev => prev.filter(a => a.id !== recordId));
  }, []);

  const saveGrade = useCallback((grade: Grade) => {
    setGrades(prev => [...prev, grade]);
  }, []);

  const updateBook = useCallback((bookId: string, updates: any) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, ...updates } : b));
  }, []);

  const deleteBook = useCallback((bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  }, []);

  const saveResource = useCallback(async (
    title: string, 
    description: string, 
    file: File | null,
    fileUrl: string | null,
    gradeLevel: "first" | "second" | "third",
    type: "book" | "file"
  ): Promise<void> => {
    const newResource: Resource = {
      id: Math.random().toString(),
      title,
      description,
      gradeLevel,
      type,
      uploadDate: Date.now(),
      fileUrl,
      fileName: file?.name,
      fileType: file?.type
    };

    setResources(prev => [...prev, newResource]);
  }, []);

  const deleteResource = useCallback((resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
  }, []);

  const getResourcesByGrade = useCallback((gradeLevel: "first" | "second" | "third"): Resource[] => {
    return resources.filter(r => r.gradeLevel === gradeLevel);
  }, [resources]);

  const saveFile = useCallback(async (
    title: string, 
    description: string, 
    file: File, 
    gradeLevel: "first" | "second" | "third"
  ): Promise<void> => {
    const newFile: FileResource = {
      id: Math.random().toString(),
      title,
      description,
      fileData: await file.text(),
      fileType: file.type,
      fileName: file.name,
      gradeLevel,
      uploadDate: Date.now()
    };

    setFiles(prev => [...prev, newFile]);
  }, []);

  const getFilesByGrade = useCallback((gradeLevel: "first" | "second" | "third"): FileResource[] => {
    return files.filter(f => f.gradeLevel === gradeLevel);
  }, [files]);

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const addPayment = useCallback((studentId: string, months: number) => {
    try {
      console.log('Adding payment - Input:', { studentId, months });
      console.log('Current students:', students);

      const student = students.find(s => s.id === studentId);
      if (!student) {
        console.error('Student not found:', studentId);
        alert(`خطأ: لم يتم العثور على الطالب (${studentId})`);
        return null;
      }

      const monthlyFee = 100;
      const newPayment: Payment = {
        id: `payment_${Date.now()}_${studentId}`,
        studentId,
        studentName: student.name,
        studentCode: student.code,
        grade: student.grade,
        paidMonths: months,
        monthlyFee,
        totalPaid: months * monthlyFee,
        lastPayment: new Date().toISOString(),
        status: months > 0 ? 'حالي' : 'متأخر'
      };

      console.log('New payment object:', newPayment);

      // Retrieve current payments, ensuring it's an array
      const storedPayments = localStorage.getItem('payments');
      const currentPayments = storedPayments ? JSON.parse(storedPayments) : [];

      // Remove any existing payments for this student
      const filteredPayments = currentPayments.filter(p => p.studentId !== studentId);

      // Add new payment
      const updatedPayments = [...filteredPayments, newPayment];

      console.log('Current payments:', currentPayments);
      console.log('Updated payments:', updatedPayments);

      // Save to localStorage and update state
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      setPayments(updatedPayments);

      console.log('Payments after setting:', payments);

      return newPayment;
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('حدث خطأ أثناء إضافة الدفعة');
      return null;
    }
  }, [students]);

  const getAllPayments = useCallback(() => {
    console.log('Getting all payments');
    console.log('Payments:', payments);
    return payments;
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  const contextValue = useMemo<DataContextType>(() => ({
    attendance,
    grades,
    videos,
    books,
    payments,
    files,
    resources,
    addAttendance,
    getStudentAttendance,
    getAttendanceByGrade,
    getStudentLessonCount,
    deleteAttendance,
    saveGrade,
    updateBook,
    deleteBook,
    saveResource,
    deleteResource,
    getResourcesByGrade,
    saveFile,
    getFilesByGrade,
    deleteFile,
    addPayment,
    // Placeholder methods to complete DataContextType
    addGrade: () => {},
    getStudentGrades: () => [],
    getGradesByGradeLevel: () => [],
    deleteGrade: () => {},
    updateGrade: () => {},
    addVideo: async () => false,
    updateVideo: () => {},
    deleteVideo: () => {},
    getVideosByGrade: () => [],
    getAllVideos: () => [],
    updateVideoViews: () => {},
    saveVideo: () => false,
    addBook: () => {},
    getBooksByGrade: () => [],
    getAllBooks: () => [],
    getStudentPayments: () => [],
    getAllPayments: () => payments,
    updatePaymentStatus: () => {}
  }), [
    attendance, grades, videos, books, payments, files, resources,
    addAttendance, getStudentAttendance, getAttendanceByGrade, 
    getStudentLessonCount, deleteAttendance, saveGrade, 
    saveResource, deleteResource, 
    getResourcesByGrade, saveFile, getFilesByGrade, deleteFile
  ]);

  useEffect(() => {
    const loadLocalData = () => {
      try {
        setAttendance(JSON.parse(localStorage.getItem('attendance') || '[]'));
        setGrades(JSON.parse(localStorage.getItem('grades') || '[]'));
        setVideos(JSON.parse(localStorage.getItem('videos') || '[]'));
        setBooks(JSON.parse(localStorage.getItem('books') || '[]'));
        setPayments(JSON.parse(localStorage.getItem('payments') || '[]'));
        setFiles(JSON.parse(localStorage.getItem('localFiles') || '[]'));
        setResources(JSON.parse(localStorage.getItem('localResources') || '[]'));
      } catch (error) {
        console.error("Error loading local data:", error);
      }
    };

    loadLocalData();
  }, []);

  // Synchronize payments with students
  useEffect(() => {
    if (students.length === 0) return;

    const storedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    // Update payments to reflect current student data
    const updatedPayments = storedPayments.map((payment) => {
      const student = students.find(s => s.id === payment.studentId);
      
      if (student) {
        return {
          ...payment,
          studentName: student.name,
          studentCode: student.code,
          grade: student.grade
        };
      }
      
      return payment;
    });

    // Remove payments for deleted students
    const validPayments = updatedPayments.filter((payment) => 
      students.some(s => s.id === payment.studentId)
    );

    // Only update if there are changes
    if (validPayments.length !== storedPayments.length) {
      localStorage.setItem('payments', JSON.stringify(validPayments));
      setPayments(validPayments);
    }
  }, [students]);

  useEffect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('grades', JSON.stringify(grades));
    localStorage.setItem('videos', JSON.stringify(videos));
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('localFiles', JSON.stringify(files));
    localStorage.setItem('localResources', JSON.stringify(resources));
  }, [attendance, grades, videos, books, payments, files, resources]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
