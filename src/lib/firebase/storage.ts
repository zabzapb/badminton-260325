import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

/**
 * File 객체를 Base64 Data URL로 변환 (이미지일 경우 최적화 압축)
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200; // 최대 해상도 1200px 제한
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82); // 82% 품질 압축
          resolve(dataUrl);
        };
        img.onerror = () => {
          // 이미지 변환 실패 시 일반 readAsDataURL 폴백
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Firebase Storage에 파일을 업로드하고 URL을 반환합니다.
 * Storage 오류 또는 타임아웃 발생 시 안전하게 Data URL 폴백으로 전환됩니다.
 */
export const uploadFile = async (path: string, file: File): Promise<string | null> => {
  if (!storage) {
    console.warn("⚠️ Firebase Storage가 초기화되지 않았습니다. Data URL 폴백 모드로 전환합니다.");
    try {
      return await fileToDataUrl(file);
    } catch {
      return null;
    }
  }

  // 4초 타임아웃 설정 (무한 대기 방지)
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.warn("⏱️ Firebase Storage 업로드 시간 초과. Data URL 폴백 모드로 전환합니다.");
      resolve(null);
    }, 4000);
  });

  const uploadPromise = (async () => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.warn("⚠️ Firebase Storage 업로드 실패 (CORS 또는 권한 에러):", error);
      return null;
    }
  })();

  const result = await Promise.race([uploadPromise, timeoutPromise]);
  
  if (result) {
    return result;
  }

  // Storage 업로드 실패 또는 타임아웃 시 Data URL 폴백 사용
  try {
    console.log("🔄 Data URL 직렬화 폴백 실행 중...");
    const fallbackUrl = await fileToDataUrl(file);
    return fallbackUrl;
  } catch (fallbackError) {
    console.error("❌ Data URL 변환 실패:", fallbackError);
    return null;
  }
};
