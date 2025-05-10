import { createContext, useContext, useState, useEffect } from "react";
import { Attendance, Grade, Video, Book, Student } from "@/types";
import { showNotification } from '../components/Notifications';
import { useDataPersistence } from '@/hooks/use-data-persistence';
import { toast } from "@/hooks/use-toast";
import { 
  Firestore, collection, query, getDocs, doc, writeBatch,
  updateDoc, deleteDoc, setDoc, onSnapshot, addDoc, serverTimestamp 
} from "firebase/firestore";
import { db, isOnline } from "@/firebase";
import { 
  collection, query, getDocs, doc, 
  updateDoc, deleteDoc, setDoc, onSnapshot, addDoc, serverTimestamp 
} from "firebase/firestore";
import { ref, onValue, set, get } from "firebase/database";
import { Network } from '@capacitor/network';
import { showNotification } from '../components/Notifications';

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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const savedAttendance = localStorage.getItem('attendance');
    return savedAttendance ? JSON.parse(savedAttendance) : [];
  });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<FileResource[]>(() => {
    const savedFiles = localStorage.getItem('localFiles');
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  const [resources, setResources] = useState<Resource[]>(() => {
    const savedResources = localStorage.getItem('localResources');
    return savedResources ? JSON.parse(savedResources) : [];
  });

  // Initialize data from local storage and setup Firebase sync
  useEffect(() => {
    // Load initial data from localStorage
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

    // Setup Firebase real-time sync
    const setupFirebaseSync = () => {
      // Attendance sync
      const attendanceRef = collection(db, 'attendance');
      const unsubAttendance = onSnapshot(attendanceRef, (snapshot) => {
        const attendanceData: Attendance[] = [];
        snapshot.forEach((doc) => {
          attendanceData.push({ id: doc.id, ...doc.data() } as Attendance);
        });
        setAttendance(attendanceData);
        localStorage.setItem('attendance', JSON.stringify(attendanceData));
      });

      // Grades sync
      const gradesRef = collection(db, 'grades');
      const unsubGrades = onSnapshot(gradesRef, (snapshot) => {
        const gradesData: Grade[] = [];
        snapshot.forEach((doc) => {
          gradesData.push({ id: doc.id, ...doc.data() } as Grade);
        });
        setGrades(gradesData);
        localStorage.setItem('grades', JSON.stringify(gradesData));
      });

      // Similar patterns for videos, books, and payments...
      
      return () => {
        unsubAttendance();
        unsubGrades();
        // Cleanup other listeners...
      };
    };

    // Load local data first
    loadLocalData();

    // Setup network status listener
    let syncCleanup: (() => void) | null = null;
    
    const handleNetworkChange = async (status: { connected: boolean }) => {
      if (status.connected) {
        // We're online - setup Firebase sync
        toast({
          title: "متصل بالإنترنت",
          description: "جاري مزامنة البيانات...",
        });
        syncCleanup = setupFirebaseSync();
        
        // Sync local changes to Firebase
        try {
          const localAttendance = JSON.parse(localStorage.getItem('attendance') || '[]');
          const localGrades = JSON.parse(localStorage.getItem('grades') || '[]');
          // ... sync other data
          
          await Promise.all([
            syncDataToFirebase('attendance', localAttendance),
            syncDataToFirebase('grades', localGrades),
            // ... sync other collections
          ]);
          
          toast({
            title: "تمت المزامنة",
            description: "تم مزامنة جميع البيانات بنجاح",
          });
        } catch (error) {
          console.error("Sync error:", error);
          toast({
            variant: "destructive",
            title: "خطأ في المزامنة",
            description: "حدث خطأ أثناء مزامنة البيانات",
          });
        }
      } else {
        // We're offline - cleanup Firebase listeners
        toast({
          variant: "destructive",
          title: "غير متصل",
          description: "سيتم حفظ التغييرات محلياً حتى عودة الاتصال",
        });
        if (syncCleanup) {
          syncCleanup();
          syncCleanup = null;
        }
      }
    };

    // Initial network check and listener setup
    Network.getStatus().then(handleNetworkChange);
    const networkListener = Network.addListener('networkStatusChange', handleNetworkChange);

    return () => {
      if (syncCleanup) syncCleanup();
      networkListener.remove();
    };
  }, []);

  const syncDataToFirebase = async (collection: string, data: any[]) => {
    const collectionRef = collection(db, collection);
    const batch = db.batch();
    
    data.forEach((item) => {
      const docRef = doc(collectionRef, item.id);
      batch.set(docRef, item);
    });

    await batch.commit();
  };

  const saveResource = async (type: string, file: File, grade: string, title: string) => {
    try {
      // ...existing storage logic...
      showNotification.info('جاري رفع الملف... 📤');
      
      // After successful upload
      showNotification.uploaded();
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification.error('حدث خطأ أثناء رفع الملف ❌');
      throw error;
    }
  };

  const updateBook = async (bookId: string, updates: any) => {
    try {
      showNotification.info('جاري حفظ التغييرات... 💾');
      await updateDoc(doc(db, "books", bookId), updates);
      showNotification.saved();
    } catch (error) {
      console.error('Error updating book:', error);
      showNotification.error('حدث خطأ أثناء حفظ التغييرات ❌');
      throw error;
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      showNotification.warning('جاري حذف الكتاب... 🗑️');
      await deleteDoc(doc(db, "books", bookId));
      showNotification.success('تم حذف الكتاب بنجاح');
    } catch (error) {
      console.error('Error deleting book:', error);
      showNotification.error('حدث خطأ أثناء حذف الكتاب ❌');
      throw error;
    }
  };

  const saveGrade = async (grade: any) => {
    try {
      showNotification.info('جاري حفظ الدرجة... 📝');
      await addDoc(collection(db, "grades"), {
        ...grade,
        createdAt: serverTimestamp()
      });
      showNotification.success('تم حفظ الدرجة بنجاح 🎯');
    } catch (error) {
      console.error('Error saving grade:', error);
      showNotification.error('حدث خطأ أثناء حفظ الدرجة ❌');
      throw error;
    }
  };

  const value = {
    attendance,
    grades,
    videos,
    books,
    payments,
    files,
    resources,
    saveResource,
    updateBook,
    deleteBook,
    saveGrade
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
