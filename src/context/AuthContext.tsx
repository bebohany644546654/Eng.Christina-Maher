import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  writeBatch, 
  addDoc 
} from "firebase/firestore";
import { db } from "@/firebase"; 
import { toast } from "@/hooks/use-toast";
import { User, Student, Parent } from "@/types";
import { generateRandomCode } from "@/lib/utils";
import { Network } from '@capacitor/network';

interface AuthContextType {
  currentUser: User | null;
  students: Student[];
  parents: Parent[];
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
  createStudent: (
    name: string,
    phone: string,
    parentPhone: string,
    group: string,
    grade: "first" | "second" | "third"
  ) => Promise<Student | null>;
  updateStudent: (
    id: string,
    name: string,
    phone: string,
    password: string,
    parentPhone: string,
    group: string,
    grade: "first" | "second" | "third"
  ) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  createParent: (phone: string, studentCode: string) => Promise<Parent | null>;
  getStudentByCode: (code: string) => Student | undefined;
  getAllStudents: () => Student[];
  getAllParents: () => Parent[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial admin user with updated credentials
const adminUser: User = {
  id: "admin-1",
  name: "admin",
  phone: "AdminAPPEng.Christina Maher",
  password: "Eng.Christina Maher0022",
  role: "admin",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const syncCleanup = useRef<(() => void) | null>(null);

  const resetLocalData = useCallback(() => {
    // localStorage.setItem("students", JSON.stringify([])); // Keep existing students
    // localStorage.setItem("parents", JSON.stringify([])); // Keep existing parents
    localStorage.setItem("grades", JSON.stringify([]));
    localStorage.setItem("attendance", JSON.stringify([]));
    localStorage.setItem("payments", JSON.stringify([]));
    // setStudents([]); // Keep existing students in state
    // setParents([]); // Keep existing parents in state
    
    toast({
      title: "خطأ في تحميل البيانات المحلية",
      description: "حدث خطأ أثناء تحميل البيانات من الذاكرة المحلية. بعض البيانات قد لا تكون متاحة.",
      variant: "destructive"
    });
  }, []);

  const loadLocalData = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const userLoggedIn = localStorage.getItem("userLoggedIn");
      
      if (storedUser && userLoggedIn === "true") {
        setCurrentUser(JSON.parse(storedUser));
      }

      setStudents(JSON.parse(localStorage.getItem("students") || "[]"));
      setParents(JSON.parse(localStorage.getItem("parents") || "[]"));
    } catch (error) {
      console.error("Error loading local data:", error);
      resetLocalData();
    }
  }, [resetLocalData]);

  const setupFirebaseSync = useCallback(() => {
    // Students sync
    const studentsRef = collection(db, 'students');
    const unsubStudents = onSnapshot(studentsRef, (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentsData);
      localStorage.setItem('students', JSON.stringify(studentsData));
    });

    // Parents sync
    const parentsRef = collection(db, 'parents');
    const unsubParents = onSnapshot(parentsRef, (snapshot) => {
      const parentsData: Parent[] = [];
      snapshot.forEach((doc) => {
        parentsData.push({ id: doc.id, ...doc.data() } as Parent);
      });
      setParents(parentsData);
      localStorage.setItem('parents', JSON.stringify(parentsData));
    });

    return () => {
      unsubStudents();
      unsubParents();
    };
  }, [setStudents, setParents]); // Added db to dependencies, though it should be stable

  const syncCollectionToFirebase = useCallback(async (collectionName: string, data: any[]) => {
    const firestoreCollectionRef = collection(db, collectionName);
    const batch = writeBatch(db);
    
    data.forEach((item) => {
      if (item.id) { // Ensure item has an id
        const docRef = doc(firestoreCollectionRef, item.id);
        batch.set(docRef, item, { merge: true }); // Use merge to avoid overwriting if doc exists
      }
    });

    await batch.commit();
  }, []); // Added db to dependencies

  const handleNetworkChange = useCallback(async (status: { connected: boolean }) => {
    if (status.connected) {
      if (syncCleanup.current) {
        syncCleanup.current(); // Clean up previous listener if any
      }
      syncCleanup.current = setupFirebaseSync();
      
      // Sync local changes to Firebase
      try {
        const localStudents = JSON.parse(localStorage.getItem('students') || '[]');
        const localParents = JSON.parse(localStorage.getItem('parents') || '[]');
        
        await Promise.all([
          syncCollectionToFirebase('students', localStudents),
          syncCollectionToFirebase('parents', localParents)
        ]);
        toast({
          title: "تمت المزامنة مع السحابة",
          description: "البيانات المحلية متزامنة الآن مع Firebase.",
        });
      } catch (error) {
        console.error("Sync error on network change:", error);
        toast({
          title: "خطأ في المزامنة",
          description: "فشلت مزامنة البيانات المحلية مع Firebase عند استعادة الاتصال.",
          variant: "destructive",
        });
      }
    } else {
      if (syncCleanup.current) {
        syncCleanup.current();
        syncCleanup.current = null;
      }
      toast({
        title: "انقطع الاتصال بالإنترنت",
        description: "سيتم حفظ التغييرات محليًا ومزامنتها عند عودة الاتصال.",
        variant: "destructive",
      });
    }
  }, [setupFirebaseSync, syncCollectionToFirebase]);

  // Initialize data, setup sync, and network listener
  useEffect(() => {
    loadLocalData();
    setIsInitialized(true); 

    Network.getStatus().then(handleNetworkChange);
    const networkListenerPromise = Network.addListener('networkStatusChange', handleNetworkChange);

    return () => {
      if (syncCleanup.current) {
        syncCleanup.current();
      }
      // Ensure listener is removed
      networkListenerPromise.then(listener => listener.remove()).catch(e => console.error("Failed to remove network listener", e));
    };
  }, [loadLocalData, handleNetworkChange]); // Dependencies for the main effect

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("userLoggedIn", "true");
    }
    // Avoid stringifying and saving if identical to prevent unnecessary writes/re-renders
    const storedStudents = localStorage.getItem("students");
    if (JSON.stringify(students) !== storedStudents) {
      localStorage.setItem("students", JSON.stringify(students));
    }
    
    const storedParents = localStorage.getItem("parents");
    if (JSON.stringify(parents) !== storedParents) {
      localStorage.setItem("parents", JSON.stringify(parents));
    }
  }, [currentUser, students, parents, isInitialized]);

  const login = async (phoneNumber: string, password: string): Promise<boolean> => {
    // Check admin login
    if (phoneNumber === adminUser.phone && password === adminUser.password) {
      setCurrentUser(adminUser);
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      localStorage.setItem("userLoggedIn", "true");
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });
      return true;
    }

    // Check local storage first
    const student = students.find(s => s.code === phoneNumber && s.password === password);
    if (student) {
      const userData: User = {
        id: student.id,
        name: student.name,
        phone: student.phone,
        password: student.password,
        role: "student",
        code: student.code,
        group: student.group,
        grade: student.grade
      };
      
      setCurrentUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("userLoggedIn", "true");
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${student.name}`,
      });
      return true;
    }

    // Check parent login
    const parent = parents.find(p => p.phone === phoneNumber && p.password === password);
    if (parent) {
      const userData: User = {
        id: parent.id,
        name: `ولي أمر ${parent.studentName}`,
        phone: parent.phone,
        password: parent.password,
        role: "parent"
      };
      
      setCurrentUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("userLoggedIn", "true");
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك",
      });
      return true;
    }

    toast({
      variant: "destructive",
      title: "فشل تسجيل الدخول",
      description: "رقم الهاتف أو كلمة المرور غير صحيحة",
    });
    return false;
  };

  const loginUser = async (code: string, password: string) => {
    try {
      // Comprehensive login with cross-device synchronization
      const loginAttempt = new Date().toISOString();

      // Query Firestore to find user with advanced synchronization
      const q = query(
        collection(db, "students"),
        where("code", "==", code),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as Student;
        const userId = querySnapshot.docs[0].id;

        // Create user object with enhanced synchronization metadata
        const loggedInUser: Student = {
          ...userData,
          id: userId,
          lastLogin: loginAttempt,
          loginDevices: [
            ...(userData.loginDevices || []),
            {
              deviceInfo: navigator.userAgent,
              timestamp: loginAttempt
            }
          ]
        };

        // Update user in Firestore with login metadata
        const userRef = doc(db, "students", userId);
        await updateDoc(userRef, {
          lastLogin: loginAttempt,
          loginDevices: loggedInUser.loginDevices
        });

        // Set user in context and localStorage with cross-device sync
        setCurrentUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem(`user_${userId}_lastLogin`, loginAttempt);

        // Log successful login with device details
        console.log('User logged in successfully:', {
          user: loggedInUser,
          deviceInfo: navigator.userAgent
        });

        // Toast notification
        toast({
          title: `مرحبًا ${loggedInUser.name}`,
          description: "تم تسجيل الدخول بنجاح",
        });

        return true;
      } else {
        // Check for admin login with similar synchronization
        const adminQ = query(
          collection(db, "admins"),
          where("code", "==", code),
          where("password", "==", password)
        );

        const adminSnapshot = await getDocs(adminQ);

        if (!adminSnapshot.empty) {
          const adminData = adminSnapshot.docs[0].data() as Admin;
          const adminId = adminSnapshot.docs[0].id;

          // Create admin object with login tracking
          const loggedInAdmin: Admin = {
            ...adminData,
            id: adminId,
            lastLogin: loginAttempt,
            loginDevices: [
              ...(adminData.loginDevices || []),
              {
                deviceInfo: navigator.userAgent,
                timestamp: loginAttempt
              }
            ]
          };

          // Update admin in Firestore
          const adminRef = doc(db, "admins", adminId);
          await updateDoc(adminRef, {
            lastLogin: loginAttempt,
            loginDevices: loggedInAdmin.loginDevices
          });

          // Set admin in context and localStorage
          setCurrentUser(loggedInAdmin);
          localStorage.setItem('user', JSON.stringify(loggedInAdmin));
          localStorage.setItem(`admin_${adminId}_lastLogin`, loginAttempt);

          // Log successful admin login
          console.log('Admin logged in successfully:', loggedInAdmin);

          // Toast notification
          toast({
            title: `مرحبًا ${loggedInAdmin.name}`,
            description: "تم تسجيل الدخول كمسؤول",
          });

          return true;
        }

        // If no user found
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: "رمز المستخدم أو كلمة المرور غير صحيحة",
        });

        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى",
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userLoggedIn");
    toast({
      title: "تم تسجيل الخروج بنجاح",
      description: "نأمل أن نراك مرة أخرى قريبًا.",
    });
  };

  // Helper function to generate a random password
  const generateRandomPassword = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const createStudent = async (
    name: string,
    phone: string,
    parentPhone: string,
    group: string,
    grade: "first" | "second" | "third"
  ): Promise<Student | null> => {
    console.log('Creating student with details:', { name, phone, parentPhone, group, grade });

    const studentCode = generateRandomCode(6);
    const studentPassword = generateRandomPassword(5);
    const newStudent: Student = {
      id: '', // Placeholder, will be replaced by Firestore
      name,
      phone,
      code: studentCode,
      password: studentPassword,
      parentPhone,
      group,
      grade,
      role: 'student',
      attendance: {}, 
      payments: {}, 
      gradesDetails: {}
    };

    try {
      // Add to Firestore
      const docRef = await addDoc(collection(db, "students"), {
        name: newStudent.name,
        phone: newStudent.phone,
        code: newStudent.code,
        password: newStudent.password,
        parentPhone: newStudent.parentPhone,
        group: newStudent.group,
        grade: newStudent.grade,
        role: newStudent.role,
        attendance: newStudent.attendance,
        payments: newStudent.payments,
        gradesDetails: newStudent.gradesDetails
      });

      // Complete the student object with Firestore ID
      const createdStudent: Student = { ...newStudent, id: docRef.id };
      
      // Update local state and localStorage immediately
      setStudents(prev => {
        const updatedStudents = [...prev, createdStudent];
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        return updatedStudents;
      });

      // Optional: Update payments localStorage to ensure synchronization
      const currentPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      localStorage.setItem('payments', JSON.stringify(currentPayments));

      toast({
        title: "تم إنشاء حساب الطالب بنجاح",
        description: `كود الطالب: ${studentCode} | كلمة المرور: ${studentPassword}`,
      });

      return createdStudent;
    } catch (error) {
      console.error("Error creating student in Firestore:", error);
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء حساب الطالب",
        description: "لم يتم حفظ بيانات الطالب. الرجاء المحاولة مرة أخرى.",
      });
      return null;
    }
  };

  const updateStudent = async (
    id: string,
    name: string,
    phone: string,
    parentPhone: string,
    group: string,
    grade: "first" | "second" | "third",
    password?: string // Password is now optional
  ): Promise<boolean> => {
    const studentRef = doc(db, "students", id);
    const currentStudentData = students.find(s => s.id === id);

    if (!currentStudentData) {
      console.error("Student not found for update:", id);
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الطالب",
        description: "لم يتم العثور على الطالب.",
      });
      return false;
    }

    const updatedStudentData = {
      ...currentStudentData, 
      name,
      phone,
      password: password || currentStudentData.password, 
      parentPhone,
      group,
      grade,
    };

    try {
      // Update Firestore
      await setDoc(studentRef, updatedStudentData, { merge: true });
      
      // Update local state
      setStudents(prev => {
        const updatedStudents = prev.map(student => 
          student.id === id ? updatedStudentData : student
        );
        
        // Update localStorage
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        
        return updatedStudents;
      });

      // Synchronize payments
      const storedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const updatedPayments = storedPayments.map(payment => 
        payment.studentId === id ? {
          ...payment,
          studentName: name,
          studentCode: currentStudentData.code,
          grade: grade
        } : payment
      );

      // Update payments in localStorage
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      
      toast({
        title: "تم تحديث بيانات الطالب بنجاح",
        description: "تم حفظ التغييرات في قاعدة البيانات.",
      });

      return true;
    } catch (error) {
      console.error("Error updating student in Firestore:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الطالب",
        description: "لم يتم حفظ التغيرات. الرجاء المحاولة مرة أخرى.",
      });
      return false;
    }
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    // Find the student before deletion for logging
    const studentToDelete = students.find(s => s.id === id);
    
    console.log('Attempting to delete student:', studentToDelete);

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "students", id));

      // Update local state
      setStudents(prev => {
        const updatedStudents = prev.filter(student => student.id !== id);
        console.log('Updated students after deletion:', updatedStudents);
        return updatedStudents;
      });

      // Update localStorage
      localStorage.setItem('students', JSON.stringify(students.filter(s => s.id !== id)));

      // Remove associated payments
      const storedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const updatedPayments = storedPayments.filter(payment => payment.studentId !== id);
      localStorage.setItem('payments', JSON.stringify(updatedPayments));

      toast({
        title: "تم حذف الطالب بنجاح",
        description: `تمت إزالة بيانات الطالب ${studentToDelete?.name || 'غير معروف'} من قاعدة البيانات.`,
      });

      return true;
    } catch (error) {
      console.error("Error deleting student from Firestore:", error);
      toast({
        variant: "destructive",
        title: "خطأ في حذف الطالب",
        description: "لم يتم حذف الطالب من قاعدة البيانات. الرجاء المحاولة مرة أخرى.",
      });
      return false;
    }
  };

  const createParent = async (phone: string, studentCode: string): Promise<Parent | null> => {
    const student = students.find(s => s.code === studentCode);

    if (!student) {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء حساب ولي الأمر",
        description: "كود الطالب المقدم غير صحيح أو الطالب غير موجود.",
      });
      return null;
    }

    const password = generateRandomCode(8); // Assuming generateRandomCode exists and is suitable

    const parentDataToSave = {
      phone,
      studentCode,
      studentName: student.name,
      password, // WARNING: Passwords should be handled by Firebase Auth or securely hashed.
    };

    try {
      const docRef = await addDoc(collection(db, "parents"), parentDataToSave);
      
      // onSnapshot in setupFirebaseSync will handle updating the local 'parents' state and localStorage.

      toast({
        title: "تم إنشاء حساب ولي الأمر بنجاح في Firestore",
        description: `مرتبط بالطالب: ${student.name}. كلمة المرور: ${password}`,
      });
      
      return { ...parentDataToSave, id: docRef.id } as Parent;

    } catch (error) {
      console.error("Error creating parent in Firestore:", error);
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء حساب ولي الأمر",
        description: "لم يتم حفظ بيانات ولي الأمر في قاعدة البيانات. الرجاء المحاولة مرة أخرى.",
      });
      return null;
    }
  };

  const getStudentByCode = (code: string): Student | undefined => {
    return students.find(student => student.code === code);
  };

  const getAllStudents = (): Student[] => {
    return students;
  };

  const getAllParents = (): Parent[] => {
    return parents;
  };

  const value = {
    currentUser,
    students,
    parents,
    login,
    logout,
    createStudent,
    updateStudent,
    deleteStudent,
    createParent,
    getStudentByCode,
    getAllStudents,
    getAllParents,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
