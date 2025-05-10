import React, { createContext, useContext, useState, useEffect } from "react";
import { Attendance, Grade, Video, Book, Student } from "@/types";
import { toast } from "@/hooks/use-toast";
import { db, isOnline } from "@/firebase"; // Updated import path, rtdb might not be needed directly if not used
import { 
  collection, query, getDocs, doc, 
  updateDoc, deleteDoc, setDoc, onSnapshot 
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

  // Update existing methods to work with both local storage and Firebase
  const addAttendance = async (studentId: string, studentName: string, status: "present" | "absent") => {
    try {
      const newAttendance = {
        id: `attendance-${Date.now()}`,
        studentId,
        studentName,
        status,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        lessonNumber: getStudentLessonCount(studentId) + 1
      };

      // Update local state and storage
      const updatedAttendance = [...attendance, newAttendance];
      setAttendance(updatedAttendance);
      localStorage.setItem('attendance', JSON.stringify(updatedAttendance));

      // If online, sync to Firebase
      if (isOnline) {
        await setDoc(doc(db, 'attendance', newAttendance.id), newAttendance);
      }

      // Play sound and show notification
      const audio = status === 'present' 
        ? new Audio("/attendance-present.mp3") 
        : new Audio("/attendance-absent.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Sound play failed:", e));

      toast({
        title: "تم تسجيل الحضور",
        description: `تم تسجيل ${status === 'present' ? 'حضور' : 'غياب'} الطالب ${studentName}`,
      });

    } catch (error) {
      console.error("Error adding attendance:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الحضور"
      });
    }
  };

  const getStudentAttendance = (studentId: string): Attendance[] => {
    return attendance.filter(record => record.studentId === studentId);
  };

  const getAttendanceByGrade = (grade: "first" | "second" | "third"): Attendance[] => {
    return attendance;
  };

  const getStudentLessonCount = (studentId: string): number => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    return studentAttendance.length > 8 ? 8 : studentAttendance.length;
  };

  const deleteAttendance = (recordId: string, studentName: string) => {
    setAttendance(prev => prev.filter(record => record.id !== recordId));
    
    toast({
      title: "تم حذف سجل الحضور",
      description: `تم حذف سجل حضور الطالب ${studentName}`,
      variant: "destructive"
    });
  };

  const addGrade = async (
    studentId: string, 
    studentName: string, 
    examName: string, 
    score: number, 
    totalScore: number,
    lessonNumber: number,
    group: string
  ) => {
    try {
      // التحقق من صحة البيانات
      if (!studentId?.trim() || !studentName?.trim() || !examName?.trim()) {
        toast({
          variant: "destructive",
          title: "خطأ في البيانات",
          description: "جميع الحقول مطلوبة. تأكد من إدخال جميع البيانات بشكل صحيح",
        });
        return false;
      }

      // التحقق من صحة الدرجات
      if (isNaN(score) || isNaN(totalScore)) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "يجب إدخال أرقام صحيحة للدرجات",
        });
        return false;
      }

      if (score < 0 || totalScore <= 0 || score > totalScore) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "تأكد من صحة الدرجات المدخلة. يجب أن تكون الدرجة المحصلة أقل من أو تساوي الدرجة الكلية",
        });
        return false;
      }

      if (lessonNumber < 1 || lessonNumber > 8) {
        toast({
          variant: "destructive",
          title: "خطأ في رقم الحصة",
          description: "رقم الحصة يجب أن يكون بين 1 و 8",
        });
        return false;
      }

      // التحقق من عدم وجود درجة مسجلة مسبقاً
      const existingGrade = grades.find(g => 
        g.studentId === studentId && 
        g.examName === examName &&
        g.lessonNumber === lessonNumber
      );

      if (existingGrade) {
        toast({
          variant: "destructive",
          title: "درجة موجودة",
          description: `يوجد درجة مسجلة مسبقاً للطالب ${studentName} في ${examName} للحصة ${lessonNumber}`,
        });
        return false;
      }

      // حساب مؤشر الأداء
      const percentage = (score / totalScore) * 100;
      let performanceIndicator: "excellent" | "good" | "average" | "poor" = "average";
      
      if (percentage >= 85) performanceIndicator = "excellent";
      else if (percentage >= 70) performanceIndicator = "good";
      else if (percentage >= 50) performanceIndicator = "average";
      else performanceIndicator = "poor";
      
      const newGrade: Grade = {
        id: `grade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        studentName,
        examName,
        score,
        totalScore,
        date: new Date().toISOString(),
        lessonNumber,
        group,
        performanceIndicator
      };

      // تحديث البيانات وحفظها
      try {
        const updatedGrades = [...grades, newGrade];
        setGrades(updatedGrades);
        localStorage.setItem("grades", JSON.stringify(updatedGrades));
        
        // تشغيل صوت النجاح
        try {
          const audio = new Audio("/grade-added.mp3");
          audio.volume = 0.5;
          await audio.play();
        } catch (soundError) {
          console.error("Failed to play sound:", soundError);
        }
        
        toast({
          title: "تم إضافة الدرجة",
          description: `تم إضافة درجة ${examName} للطالب ${studentName}`,
        });
        
        return true;
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء حفظ الدرجة في التخزين المحلي. تأكد من وجود مساحة كافية",
        });
        return false;
      }
    } catch (error) {
      console.error("Error adding grade:", error);
      toast({
        variant: "destructive",
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء إضافة الدرجة. الرجاء المحاولة مرة أخرى",
      });
      return false;
    }
  };

  const getStudentGrades = (studentId: string): Grade[] => {
    return grades.filter(grade => grade.studentId === studentId);
  };

  const getGradesByGradeLevel = (grade: "first" | "second" | "third"): Grade[] => {
    // Get all students of this grade level from localStorage
    const students = JSON.parse(localStorage.getItem("students") || "[]");
    const gradeStudents = students.filter((student: Student) => student.grade === grade);
    const gradeStudentIds = gradeStudents.map((student: Student) => student.id);
    
    // Filter grades to only include students from this grade level
    return grades.filter(grade => gradeStudentIds.includes(grade.studentId));
  };

  const deleteGrade = (gradeId: string) => {
    setGrades(prev => prev.filter(grade => grade.id !== gradeId));
    toast({
      title: "تم حذف الدرجة",
      description: "تم حذف الدرجة بنجاح",
    });
  };

  const updateGrade = (gradeId: string, gradeData: Partial<Grade>) => {
    setGrades(prev => prev.map(grade => 
      grade.id === gradeId 
        ? { ...grade, ...gradeData, updatedAt: new Date().toISOString() } 
        : grade
    ));
    toast({
      title: "تم تحديث الدرجة",
      description: "تم تحديث الدرجة بنجاح",
    });
  };

  const addVideo = async (title: string, url: string, grade: "first" | "second" | "third") => {
    try {
      // استخراج معرف الفيديو من الرابط
      let videoId = '';
      try {
        const urlPattern = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
        const match = url.match(urlPattern);
        videoId = match ? match[1] : url;
        
        // إذا كان URL كاملاً، نحاول تحليله
        if (!videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
          const urlObj = new URL(url);
          if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
          } else if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.includes('/embed/')) {
              videoId = urlObj.pathname.split('/embed/')[1];
            } else if (urlObj.pathname.includes('/shorts/')) {
              videoId = urlObj.pathname.split('/shorts/')[1];
            } else if (urlObj.pathname.includes('/v/')) {
              videoId = urlObj.pathname.split('/v/')[1];
            } else {
              const searchParams = new URLSearchParams(urlObj.search);
              videoId = searchParams.get('v') || '';
            }
          }
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }

      // التحقق من صحة معرف الفيديو
      if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        throw new Error("معرف الفيديو غير صالح");
      }

      const newVideo = {
        id: `video-${Date.now()}`,
        title,
        videoId,
        url, // حفظ الرابط الأصلي
        grade,
        uploadDate: new Date().toISOString(),
        views: 0,
        lastViewed: null
      };

      const updatedVideos = [...videos, newVideo];
      setVideos(updatedVideos);
      
      // حفظ في localStorage
      localStorage.setItem('videos', JSON.stringify(updatedVideos));

      // تشغيل صوت النجاح
      const audio = new Audio("/item-added.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Sound play failed:", e));

      toast({
        title: "تم إضافة الفيديو",
        description: `تم إضافة فيديو ${title} بنجاح`,
      });

      return true;
    } catch (error) {
      console.error("Error adding video:", error);
      throw error;
    }
  };

  const updateVideo = (id: string, title: string, url: string, grade: "first" | "second" | "third" = "first", thumbnailUrl?: string) => {
    // Ensure URL is suitable for direct playback
    let processedUrl = url;
    
    // Convert to direct links if not already
    if (url.includes('drive.google.com') && !url.includes('download')) {
      const fileId = url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        processedUrl = `https://drive.google.com/uc?export=download&id=${fileId[0]}`;
      }
    }
    
    setVideos(prev => 
      prev.map(video => 
        video.id === id 
          ? { ...video, title, url: processedUrl, grade, thumbnailUrl } 
          : video
      )
    );
    
    // Play sound effect
    const audio = new Audio("/item-updated.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
    
    toast({
      title: "تم تحديث الفيديو",
      description: `تم تحديث فيديو ${title} بنجاح`,
    });
  };
  
  const deleteVideo = (id: string) => {
    const updatedVideos = videos.filter(video => video.id !== id);
    setVideos(updatedVideos);

    // Save the updated list to localStorage
    try {
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
    } catch (error) {
      console.error("Error saving videos to localStorage after deletion:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ المحلي",
        description: "لم يتم حفظ التغيير بعد الحذف في التخزين المحلي.",
      });
      // Optional: revert state if local storage save fails?
      // setVideos(videos); // Revert to previous state
      // return; // Stop execution if save fails
    }
    
    // Play sound effect
    const audio = new Audio("/item-deleted.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
    
    toast({
      title: "تم حذف الفيديو",
      description: "تم حذف الفيديو بنجاح",
    });
    
    // TODO: Add Firebase deletion logic here if needed when online
    // if (isOnline()) { ... delete from Firestore ... }
  };

  const getVideosByGrade = (grade: "first" | "second" | "third"): Video[] => {
    return videos.filter(video => video.grade === grade);
  };
  
  const getAllVideos = (): Video[] => {
    try {
      // محاولة استرجاع الفيديوهات من localStorage
      const savedVideos = localStorage.getItem('videos');
      if (savedVideos) {
        return JSON.parse(savedVideos);
      }
      return videos;
    } catch (error) {
      console.error("Error getting videos:", error);
      return videos;
    }
  };

  const updateVideoViews = (videoId: string) => {
    setVideos(prev => prev.map(video => {
      if (video.id === videoId) {
        return {
          ...video,
          lastViewed: new Date().toISOString()
        };
      }
      return video;
    }));
  };

  const saveVideo = (title: string, url: string, grade: string) => {
    try {
      const videos = getAllVideos();
      const newVideo = {
        id: Date.now().toString(),
        title,
        url,
        grade,
        uploadDate: new Date().toISOString()
      };
      
      videos.push(newVideo);
      localStorage.setItem('videos', JSON.stringify(videos));
      return true;
    } catch (error) {
      console.error('Error saving video:', error);
      return false;
    }
  };

  const addBook = (title: string, url: string, grade: "first" | "second" | "third" = "first") => {
    // Process URL for direct download if needed
    let processedUrl = url;
    
    // Convert to direct links if not already
    if (url.includes('drive.google.com') && !url.includes('download')) {
      const fileId = url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        processedUrl = `https://drive.google.com/uc?export=download&id=${fileId[0]}`;
      }
    }
    
    const newBook: Book = {
      id: `book-${Date.now()}`,
      title,
      url: processedUrl,
      uploadDate: new Date().toISOString(),
      grade
    };

    setBooks(prev => [...prev, newBook]);
    
    // Play sound effect
    const audio = new Audio("/item-added.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
    
    toast({
      title: "تم إضافة الكتاب",
      description: `تم إضافة كتاب ${title} بنجاح`,
    });
  };
  
  const updateBook = (id: string, title: string, url: string, grade: "first" | "second" | "third") => {
    // Process URL for direct download if needed
    let processedUrl = url;
    
    // Convert to direct links if not already
    if (url.includes('drive.google.com') && !url.includes('download')) {
      const fileId = url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        processedUrl = `https://drive.google.com/uc?export=download&id=${fileId[0]}`;
      }
    }
    
    setBooks(prev => 
      prev.map(book => 
        book.id === id 
          ? { ...book, title, url: processedUrl, grade } 
          : book
      )
    );
    
    // Play sound effect
    const audio = new Audio("/item-updated.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
    
    toast({
      title: "تم تحديث الكتاب",
      description: `تم تحديث كتاب ${title} بنجاح`,
    });
  };
  
  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(book => book.id !== id));
    
    // Play sound effect
    const audio = new Audio("/item-deleted.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed:", e));
    
    toast({
      title: "تم حذف الكتاب",
      description: "تم حذف الكتاب بنجاح",
    });
  };

  const getBooksByGrade = (grade: "first" | "second" | "third"): Book[] => {
    return books.filter(book => book.grade === grade);
  };
  
  const getAllBooks = (): Book[] => {
    try {
      return JSON.parse(localStorage.getItem("books") || "[]");
    } catch (error) {
      console.error("Error getting books:", error);
      return [];
    }
  };

  const addPayment = (studentId: string, months: number) => {
    const student = JSON.parse(localStorage.getItem("students") || "[]").find((s: Student) => s.id === studentId);
    if (!student) return;

    const monthlyFee = 300; // يمكن تغيير هذه القيمة حسب الحاجة
    const existingPayment = payments.find(p => p.studentId === studentId);
    const today = new Date().toISOString().split('T')[0];

    if (existingPayment) {
      const updatedPayment = {
        ...existingPayment,
        paidMonths: existingPayment.paidMonths + months,
        totalPaid: existingPayment.totalPaid + (months * monthlyFee),
        lastPayment: today,
      };

      setPayments(prev => prev.map(p => 
        p.id === existingPayment.id ? updatedPayment : p
      ));

      toast({
        title: "تم تحديث المدفوعات",
        description: `تم تسجيل دفع ${months} شهر للطالب ${student.name}`,
      });
    } else {
      const newPayment: Payment = {
        id: `payment-${Date.now()}`,
        studentId,
        studentName: student.name,
        studentCode: student.code,
        grade: student.grade,
        paidMonths: months,
        monthlyFee,
        totalPaid: months * monthlyFee,
        lastPayment: today,
        status: "حالي"
      };

      setPayments(prev => [...prev, newPayment]);

      toast({
        title: "تم تسجيل المدفوعات",
        description: `تم تسجيل دفع ${months} شهر للطالب ${student.name}`,
      });
    }

    updatePaymentStatus(studentId);
  };

  const getStudentPayments = (studentId: string): Payment[] => {
    return payments.filter(payment => payment.studentId === studentId);
  };

  const getAllPayments = (): Payment[] => {
    return payments;
  };

  const updatePaymentStatus = (studentId: string) => {
    const payment = payments.find(p => p.studentId === studentId);
    if (!payment) return;

    const today = new Date();
    const lastPayment = new Date(payment.lastPayment);
    const monthsDiff = (today.getMonth() - lastPayment.getMonth()) + 
                      (12 * (today.getFullYear() - lastPayment.getFullYear()));

    let newStatus: "متأخر" | "حالي" | "مدفوع مقدماً";
    if (monthsDiff > payment.paidMonths) {
      newStatus = "متأخر";
    } else if (monthsDiff < 0) {
      newStatus = "مدفوع مقدماً";
    } else {
      newStatus = "حالي";
    }

    if (payment.status !== newStatus) {
      setPayments(prev => prev.map(p => 
        p.id === payment.id ? { ...p, status: newStatus } : p
      ));
    }
  };

  const saveFile = async (
    title: string,
    description: string,
    file: File,
    gradeLevel: "first" | "second" | "third"
  ) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string;
          const newFile: FileResource = {
            id: crypto.randomUUID(),
            title,
            description,
            fileData,
            fileType: file.type,
            fileName: file.name,
            gradeLevel,
            uploadDate: Date.now()
          };

          const updatedFiles = [...files, newFile];
          setFiles(updatedFiles);
          localStorage.setItem('localFiles', JSON.stringify(updatedFiles));
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const getFilesByGrade = (gradeLevel: "first" | "second" | "third") => {
    return files.filter(file => file.gradeLevel === gradeLevel);
  };

  const deleteFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem('localFiles', JSON.stringify(updatedFiles));
  };

  const saveResource = async (
    title: string,
    description: string,
    file: File | null,
    fileUrl: string | null,
    gradeLevel: "first" | "second" | "third",
    type: "book" | "file"
  ) => {
    try {
      let fileData = null;
      let fileName = null;
      let fileType = null;

      if (file) {
        fileData = await convertFileToBase64(file);
        fileName = file.name;
        fileType = file.type;
      }

      const newResource: Resource = {
        id: crypto.randomUUID(),
        title,
        description,
        fileData: fileData || undefined,
        fileUrl: fileUrl || undefined,
        fileName,
        fileType,
        gradeLevel,
        uploadDate: Date.now(),
        type
      };

      const updatedResources = [...resources, newResource];
      setResources(updatedResources);
      localStorage.setItem('localResources', JSON.stringify(updatedResources));
    } catch (error) {
      console.error('Error saving resource:', error);
      throw error;
    }
  };

  const getResourcesByGrade = (gradeLevel: "first" | "second" | "third") => {
    return resources.filter(resource => resource.gradeLevel === gradeLevel);
  };

  const deleteResource = (resourceId: string) => {
    const updatedResources = resources.filter(r => r.id !== resourceId);
    setResources(updatedResources);
    localStorage.setItem('localResources', JSON.stringify(updatedResources));
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const value = {
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
    addGrade,
    getStudentGrades,
    getGradesByGradeLevel,
    deleteGrade,
    updateGrade,
    addVideo,
    updateVideo,
    deleteVideo,
    getVideosByGrade,
    getAllVideos,
    updateVideoViews,
    saveVideo,
    addBook,
    updateBook,
    deleteBook,
    getBooksByGrade,
    getAllBooks,
    addPayment,
    getStudentPayments,
    getAllPayments,
    updatePaymentStatus,
    saveFile,
    getFilesByGrade,
    deleteFile,
    saveResource,
    getResourcesByGrade,
    deleteResource
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
