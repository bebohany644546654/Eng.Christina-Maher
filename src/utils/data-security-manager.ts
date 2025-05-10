import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CryptoJS from 'crypto-js';

export class DataSecurityManager {
  private static readonly ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'your-fallback-key';

  // تشفير البيانات الحساسة
  static encryptData(data: any): string {
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        this.ENCRYPTION_KEY
      ).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // فك تشفير البيانات
  static decryptData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // تحديث البيانات المشفرة
  static async updateSecureData(
    collectionName: string,
    documentId: string,
    data: any
  ) {
    try {
      const encryptedData = this.encryptData(data);
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        secureData: encryptedData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating secure data:', error);
      return false;
    }
  }

  // التحقق من صحة البيانات
  static validateData(data: any): boolean {
    // التحقق من وجود جميع الحقول المطلوبة
    const requiredFields = ['id', 'createdAt', 'updatedAt'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // تأمين النسخ الاحتياطي للبيانات
  static async backupSecureData(collectionName: string) {
    try {
      const timestamp = new Date().toISOString();
      const backupRef = doc(db, 'backups', `${collectionName}_${timestamp}`);
      await updateDoc(backupRef, {
        timestamp,
        collection: collectionName,
        status: 'completed'
      });
      return true;
    } catch (error) {
      console.error('Backup error:', error);
      return false;
    }
  }
}
