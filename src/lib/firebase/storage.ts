import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

/**
 * Firebase Storage에 파일을 업로드하고 URL을 반환합니다.
 * @param path 저장 경로 (예: 'tournaments/posters/t-123.jpg')
 * @param file 업로드할 파일 객체
 */
export const uploadFile = async (path: string, file: File): Promise<string | null> => {
  if (!storage) {
    console.error("Firebase Storage is not initialized.");
    return null;
  }

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    return null;
  }
};
