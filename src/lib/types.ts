/**
 * Shared Type Definitions
 */

export interface UserProfile {
  id: string;
  realName: string;
  nickname?: string;
  gender: "M" | "F";
  birthYear?: number;
  birthDate?: string; // 추가: 생년월일 (YYYY-MM-DD)
  level?: string;
  club?: string;
  phone: string;
  tshirtGender?: string;
  tshirtSize?: string;
  avatarUrl?: string;
  avatarChangeCount?: number;
  participationCount?: number; // [추가] 대회 참가 횟수
  isVerified?: boolean;
  isManager?: boolean;
  isMaster?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  registeredBy?: string;
  pendingLinkId?: string; // [추가] 운영자 승인 대기 중인 기존 계정 ID
  // Metadata for edit tracking
  originalRealName?: string;
  originalGender?: string;
  originalPhone?: string;
}

export interface TournamentApplication {
  id: string;
  tournamentId: string;
  userId: string;
  category: string;
  group: string;
  tournamentBaseYear: number;   // 대회의 기준 연도 스냅샷
  ageGroupId: string;           // 선택된 연령대 객체의 고유 ID
  appliedAge: number;           // 신청자 본인의 신청 시점 나이 (baseYear - birthYear)
  appliedGrade: string;         // 신청자 본인의 신청 시점 급수
  partnerAppliedAge?: number;   // 파트너의 신청 시점 나이 (복식인 경우)
  partnerAppliedGrade?: string; // 파트너의 신청 시점 급수 (복식인 경우)
  partnerId?: string | null;
  partnerInfo?: {
    type: "member" | "unverified";
    id?: string;
    realName: string;
    phone: string;
    gender?: string;
    avatarUrl?: string;
    tshirtSize?: string;
    birthYear?: number;
    level?: string;
  };
  applicantInfo?: any; // Added applicantInfo property
  status: "pending" | "partner_required" | "waiting_partner" | "confirmed" | "cancelled" | "rejected";

  createdAt: string;
  updatedAt?: string;
}

export interface Tournament {
  id: string;
  name: string;
  baseYear: number; // [추가] 대회의 기준 연도
  eventDate?: string;
  eventDates?: string[];
  deadline: string;
  venue: string;
  status: "open" | "closed" | "registered";
  fee?: string;
  feeSingles?: string;
  feeDoubles?: string;
  account?: {
    bank: string;
    accountNumber: string;
    owner: string;
  };
  categories?: any[];
  ageGroups?: any[];
  categoryMatrix?: Record<string, string[]>;
  confirmedSegments?: any[];
  files?: any[];
  managerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
    id?: string;
    userId: string; // 알림을 받을 사람
    type: "alert" | "warning" | "info"; // 시각적 구분을 위한 타입
    message: string;
    tournamentId?: string;
    isRead: boolean;
    createdAt: string;
}
