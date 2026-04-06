import { collection, getDocs, query, where, doc, getDoc, or, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { addData, removeData } from "./firestore";

import { TournamentApplication } from "../types";
export type { TournamentApplication };

const COLLECTION_APPLICATIONS = "applications";

// [Phase 3] 카테고리 기호 매핑 (교차 검증 시 "남복" === "MD" 대응 용도)
const CAT_MAP: Record<string, string[]> = {
  "MD": ["남복", "MD"],
  "남복": ["남복", "MD"],
  "WD": ["여복", "WD"],
  "여복": ["여복", "WD"],
  "XD": ["혼복", "XD"],
  "혼복": ["혼복", "XD"],
  "MS": ["남단", "MS", "단식", "S"],
  "WS": ["여단", "WS", "단식", "S"],
  "단식": ["남단", "MS", "여단", "WS", "단식", "S"],
};

// 표준 카테고리 코드 반환 (ID 생성 시 일관성 유지)
export const getStandardCategoryCode = (cat: string) => {
    if (["남복", "MD"].includes(cat)) return "MD";
    if (["여복", "WD"].includes(cat)) return "WD";
    if (["혼복", "XD"].includes(cat)) return "XD";
    if (["남단", "MS"].includes(cat)) return "MS";
    if (["여단", "WS"].includes(cat)) return "WS";
    if (["단식", "S"].includes(cat)) return "S";
    return cat;
};

export const applyForTournament = async (application: TournamentApplication) => {
  try {
    const stdCat = getStandardCategoryCode(application.category);
    const groupSuffix = (application.group || "").replace(/\s+/g, "");
    const compositeId = application.id || `${application.tournamentId}_${application.userId}_${stdCat}_${groupSuffix}`;
    
    // 1. [방어적 설계] 동일 종목(카테고리 + 그룹) 내 중복 등록 체크
    const catSearchList = CAT_MAP[application.category] || [application.category];
    const q = query(
      collection(db, COLLECTION_APPLICATIONS), 
      where("tournamentId", "==", application.tournamentId), 
      where("category", "in", catSearchList),
      where("group", "==", application.group) // [추가] 정확한 그룹까지 매칭 확인
    );
    const snapshot = await getDocs(q);
    
    const participantsInCat = new Set<string>();
    snapshot.docs.forEach(docSnap => {
      if (docSnap.id === compositeId) return; 
      
      const data = docSnap.data();
      if (data.status !== "cancelled" && data.status !== "rejected") {
        if (data.userId) participantsInCat.add(data.userId);
        if (data.partnerId) participantsInCat.add(data.partnerId);
      }
    });

    if (participantsInCat.has(application.userId)) {
      throw new Error(`이미 해당 종목(${application.category} ${application.group})에 등록되어 있습니다.`);
    }
    if (application.partnerId && participantsInCat.has(application.partnerId)) {
      throw new Error("선택한 파트너가 이미 해당 종목에 등록되어 있습니다.");
    }

    const result = await addData(COLLECTION_APPLICATIONS, compositeId, {
      ...application,
      category: application.category, 
      id: compositeId,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, id: compositeId };
  } catch (error: any) {
    console.error("Error applying for tournament:", error);
    return { success: false, error: error.message };
  }
};


// [Phase 3] 파트너 하차 (Soft Disconnect) 로직
export const optOutPartner = async (applicationId: string) => {
  try {
    const appRef = doc(db, COLLECTION_APPLICATIONS, applicationId);
    await updateDoc(appRef, {
      status: "cancelled", // [수정] 하차 시 파트너 대기가 아닌 전체 취소로 변경
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error opting out partner:", error);
    return { success: false, error: error.message };
  }
};

export const getApplicationsByUser = async (userId: string) => {
// ... (rest of the functions)
  try {
    const q = query(
      collection(db, COLLECTION_APPLICATIONS), 
      or(
        where("userId", "==", userId),
        where("partnerId", "==", userId)
      )
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
};

export const getApplicationsByTournament = async (tournamentId: string) => {
  try {
    const q = query(collection(db, COLLECTION_APPLICATIONS), where("tournamentId", "==", tournamentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching tournament applications:", error);
    return [];
  }
};

export const deleteApplication = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_APPLICATIONS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // 결제가 완료되었거나 대회가 확정된 상태라면 사용자 직접 삭제 불가 (운영자 예외 처리 필요)
      if ((data as any).paymentStatus === "completed" || data.status === "confirmed") {
        throw new Error("결제가 완료되거나 확정된 신청 건은 직접 삭제할 수 없습니다. 관리자에게 문의하세요.");
      }
    }
    
    return await removeData(COLLECTION_APPLICATIONS, id);
  } catch (error: any) {
    console.error("Error deleting application:", error);
    return { success: false, error: error.message };
  }
};

// [System] 신청취소 (Cancel) - Hard Delete가 아닌 상태값 변경
export const cancelApplication = async (applicationId: string) => {
  try {
    const appRef = doc(db, COLLECTION_APPLICATIONS, applicationId);
    await updateDoc(appRef, {
      status: "cancelled",
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling application:", error);
    return { success: false, error: error.message };
  }
};

// [N+1 쿼리 최적화] 여러 대회의 신청 내역을 in 쿼리로 한 번에 조회
export const getApplicationsForTournaments = async (tournamentIds: string[]) => {
  if (!tournamentIds || tournamentIds.length === 0) return [];
  try {
    const apps: any[] = [];
    const chunks = [];
    // Firestore 'in' limitation is 30
    for (let i = 0; i < tournamentIds.length; i += 30) {
      chunks.push(tournamentIds.slice(i, i + 30));
    }
    
    for (const chunk of chunks) {
      const q = query(
        collection(db, COLLECTION_APPLICATIONS), 
        where("tournamentId", "in", chunk)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => apps.push({ id: doc.id, ...doc.data() }));
    }
    return apps;
  } catch (error) {
    console.error("Error fetching chunked applications:", error);
    return [];
  }
};
// [System] 입금 확인 상태 변경
export const updatePaymentStatus = async (applicationId: string, paymentStatus: "pending" | "confirmed") => {
  try {
    const appRef = doc(db, COLLECTION_APPLICATIONS, applicationId);
    const updates: any = {
      paymentStatus,
      updatedAt: new Date().toISOString()
    };
    
    // [Phase 3] 관리자가 입금 확인 시, 파트너 승인 여부와 관계없이 '참가 확정'으로 강제 전환
    if (paymentStatus === "confirmed") {
        updates.status = "confirmed";
    }

    await updateDoc(appRef, updates);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    return { success: false, error: error.message };
  }
};

// [System] 상태 변경 (Status Update)
export const updateApplicationStatus = async (applicationId: string, status: string) => {
  try {
    const appRef = doc(db, COLLECTION_APPLICATIONS, applicationId);
    await updateDoc(appRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating application status:", error);
    return { success: false, error: error.message };
  }
};
// [System] Migrate applications from one user ID to another (Used for account merging)
export const migrateUserApplications = async (fromId: string, toId: string) => {
    try {
        const q = query(
            collection(db, COLLECTION_APPLICATIONS),
            or(
                where("userId", "==", fromId),
                where("partnerId", "==", fromId)
            )
        );
        const snapshot = await getDocs(q);
        let count = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const updates: any = {};
            if (data.userId === fromId) updates.userId = toId;
            if (data.partnerId === fromId) updates.partnerId = toId;
            
            await updateDoc(doc(db, COLLECTION_APPLICATIONS, docSnap.id), updates);
            count++;
        }
        return { success: true, count };
    } catch (error: any) {
        console.error("Error migrating applications:", error);
        return { success: false, error: error.message };
    }
};
