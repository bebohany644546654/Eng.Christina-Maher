import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { cacheContent, getCachedData, clearUserCache } from './cache-manager';

const BATCH_SIZE = 500; // Maximum number of users to process in one batch
const USER_CACHE_PREFIX = 'user_';
const CLASS_CACHE_PREFIX = 'class_';

interface UserData {
  uid: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  grade?: string;
  activeClasses?: string[];
  lastActive?: number;
}

export class UserManager {
  // Create or update user with optimized batch operations
  static async updateUser(userData: UserData) {
    try {
      const userRef = doc(db, 'users', userData.uid);
      await setDoc(userRef, {
        ...userData,
        lastActive: Date.now()
      }, { merge: true });

      // Update cache
      cacheContent(`${USER_CACHE_PREFIX}${userData.uid}`, userData, false);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Get user data with caching
  static async getUserData(uid: string) {
    // Check cache first
    const cachedData = getCachedData(`${USER_CACHE_PREFIX}${uid}`);
    if (cachedData) return cachedData;

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
      
      if (userSnap.empty) return null;

      const userData = userSnap.docs[0].data() as UserData;
      cacheContent(`${USER_CACHE_PREFIX}${uid}`, userData, false);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Batch process users (for large operations)
  static async batchProcessUsers(operation: (userData: UserData) => Promise<void>) {
    const batch = writeBatch(db);
    let count = 0;

    try {
      const usersQuery = query(collection(db, 'users'), limit(BATCH_SIZE));
      const snapshot = await getDocs(usersQuery);

      for (const doc of snapshot.docs) {
        const userData = doc.data() as UserData;
        await operation(userData);
        count++;

        if (count >= BATCH_SIZE) {
          await batch.commit();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      return true;
    } catch (error) {
      console.error('Error in batch processing:', error);
      return false;
    }
  }

  // Add user to class with proper caching
  static async addUserToClass(uid: string, classId: string) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        activeClasses: arrayUnion(classId)
      });

      // Update class cache
      clearUserCache(uid);
      return true;
    } catch (error) {
      console.error('Error adding user to class:', error);
      return false;
    }
  }

  // Remove user from class
  static async removeUserFromClass(uid: string, classId: string) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        activeClasses: arrayRemove(classId)
      });

      // Update caches
      clearUserCache(uid);
      return true;
    } catch (error) {
      console.error('Error removing user from class:', error);
      return false;
    }
  }
}
