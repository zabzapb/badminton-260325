import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  DocumentData,
  WithFieldValue
} from "firebase/firestore";
import { db } from "./config";

/**
 * Universal Firestore helper functions
 */

/**
 * [Sanitization] Firestore does not accept undefined values.
 * This utility removes undefined keys from the payload to prevent 'invalid-argument' errors.
 */
export const sanitizeForFirestore = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      // Handle nested objects if necessary (shallow for now but safe for root fields)
      sanitized[key] = sanitizeForFirestore(sanitized[key]);
    }
  });
  return sanitized;
};

export const addData = async <T extends WithFieldValue<DocumentData>>(
  collectionName: string, 
  id: string, 
  data: T
) => {
  try {
    const docRef = doc(db, collectionName, id);
    // [Strict Sanitization] Remove undefined fields before writing to DB
    const sanitizedData = sanitizeForFirestore(data);
    await setDoc(docRef, sanitizedData, { merge: true });
    return { success: true, id };
  } catch (error) {
    console.error(`Error adding data to ${collectionName}:`, error);
    return { success: false, error };
  }
};

export const getData = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: "Document not found" };
  } catch (error) {
    console.error(`Error getting data from ${collectionName}:`, error);
    return { success: false, error };
  }
};

export const queryData = async (
  collectionName: string, 
  field: string, 
  value: any
) => {
  try {
    const q = query(collection(db, collectionName), where(field, "==", value));
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: results };
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    return { success: false, error };
  }
};

export const removeData = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return { success: false, error };
  }
};
