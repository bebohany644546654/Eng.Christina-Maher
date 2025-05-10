import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// مدير البيانات التعليمية المتكامل
export class EducationalDataManager {
  // إدارة الكتب
  static async addBook(bookData: any, file: File) {
    try {
      const bookRef = doc(collection(db, 'books'));
      const storageRef = ref(storage, `books/${bookRef.id}_${file.name}`);
      
      // رفع الملف
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // حفظ بيانات الكتاب
      await setDoc(bookRef, {
        ...bookData,
        fileUrl: downloadURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        id: bookRef.id
      });
      
      return bookRef.id;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }

  // إدارة الفيديوهات
  static async addVideo(videoData: any) {
    try {
      const videoRef = doc(collection(db, 'videos'));
      await setDoc(videoRef, {
        ...videoData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        id: videoRef.id
      });
      
      return videoRef.id;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  }

  // إدارة المدفوعات
  static async addPayment(paymentData: any) {
    try {
      const paymentRef = doc(collection(db, 'payments'));
      await setDoc(paymentRef, {
        ...paymentData,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        id: paymentRef.id
      });

      // تحديث سجل الطالب
      await updateDoc(doc(db, 'students', paymentData.studentId), {
        lastPayment: serverTimestamp(),
        paymentStatus: 'paid'
      });

      return paymentRef.id;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // إدارة الحضور
  static async recordAttendance(attendanceData: any) {
    try {
      const attendanceRef = doc(collection(db, 'attendance'));
      await setDoc(attendanceRef, {
        ...attendanceData,
        timestamp: serverTimestamp(),
        id: attendanceRef.id
      });

    // تحديث إحصائيات الحضور للطالب
      const studentRef = doc(db, 'students', attendanceData.studentId);
      await updateDoc(studentRef, {
        lastAttendance: serverTimestamp(),
        totalAttendance: attendanceData.present ? increment(1) : increment(0)
      });

      return attendanceRef.id;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  // إدارة الدرجات
  static async addGrade(gradeData: any) {
    try {
      const gradeRef = doc(collection(db, 'grades'));
      await setDoc(gradeRef, {
        ...gradeData,
        timestamp: serverTimestamp(),
        id: gradeRef.id
      });

      // تحديث متوسط درجات الطالب
      const studentRef = doc(db, 'students', gradeData.studentId);
      const studentGrades = await getDocs(
        query(
          collection(db, 'grades'),
          where('studentId', '==', gradeData.studentId)
        )
      );

      let totalGrade = 0;
      studentGrades.forEach(doc => {
        totalGrade += doc.data().grade || 0;
      });

      await updateDoc(studentRef, {
        averageGrade: totalGrade / (studentGrades.size || 1),
        lastGradeUpdate: serverTimestamp()
      });

      return gradeRef.id;
    } catch (error) {
      console.error('Error adding grade:', error);
      throw error;
    }
  }

  // إدارة بيانات أولياء الأمور
  static async addParent(parentData: any) {
    try {
      const parentRef = doc(collection(db, 'parents'));
      await setDoc(parentRef, {
        ...parentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        id: parentRef.id
      });

      // ربط الوالد بالطلاب
      if (parentData.studentIds && parentData.studentIds.length) {
        const batch = writeBatch(db);
        parentData.studentIds.forEach((studentId: string) => {
          const studentRef = doc(db, 'students', studentId);
          batch.update(studentRef, {
            parentId: parentRef.id
          });
        });
        await batch.commit();
      }

      return parentRef.id;
    } catch (error) {
      console.error('Error adding parent:', error);
      throw error;
    }
  }

  // استرجاع تقارير الأداء
  static async getPerformanceReport(studentId: string) {
    try {
      const [grades, attendance, payments] = await Promise.all([
        getDocs(query(collection(db, 'grades'), where('studentId', '==', studentId))),
        getDocs(query(collection(db, 'attendance'), where('studentId', '==', studentId))),
        getDocs(query(collection(db, 'payments'), where('studentId', '==', studentId)))
      ]);

      return {
        grades: grades.docs.map(doc => doc.data()),
        attendance: attendance.docs.map(doc => doc.data()),
        payments: payments.docs.map(doc => doc.data())
      };
    } catch (error) {
      console.error('Error getting performance report:', error);
      throw error;
    }
  }
}
