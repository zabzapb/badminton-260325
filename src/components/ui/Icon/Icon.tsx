import React from "react";
/**
 * Component: Icon
 * 아이콘 컴포넌트 시스템
 *
 * 이미지 참고: 라운드 스트로크 스타일의 라인 아이콘 세트
 * ViewBox: 24x24 | Style: Stroke, Round Caps & Joins
 */

export type IconName =
    | "home"
    | "search"
    | "people"
    | "person-add"
    | "person"
    | "chat"
    | "heart"
    | "calendar"
    | "bell"
    | "location"
    | "phone"
    | "close"
    | "navigation"
    | "logout"
    | "settings"
    | "globe"
    | "clock"
    | "document"
    | "card"
    | "gallery"
    | "camera"
    | "message"
    | "shield"
    | "edit"
    | "grid"
    | "list"
    | "menu"
    | "refresh"
    | "mail"
    | "mic"
    | "trend-up"
    | "video"
    | "alert"
    | "info"
    | "wrench"
    | "filter"
    | "more"
    | "star"
    | "check"
    | "arrow-right"
    | "arrow-left"
    | "arrow-down"
    | "arrow-up"
    | "plus"
    | "trophy"
    | "trash"
    | "upload"
    | "spreadsheet"
    | "repeat"
    | "copy"
    | "plus-circle"
    | "check-circle";

export interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
    style?: React.CSSProperties;
    "aria-label"?: string;
    "aria-hidden"?: boolean | "true" | "false";
}

/* ── SVG Path 정의 (24x24 viewBox, Stroke 기반) ── */
const ICON_PATHS: Record<IconName, string> = {
    // 홈
    home: "M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1V10.5z",

    // 검색
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35",

    // 그룹·사람들
    people:
        "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm7 0a3 3 0 113-3 3 3 0 01-3 3m5 10v-2a4 4 0 00-3-3.87",

    // 사람 추가
    "person-add":
        "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m8 5v6m3-3h-6",

    // 사람 (단일)
    person: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8",

    // 채팅
    chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",

    // 하트
    heart:
        "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",

    // 캘린더
    calendar:
        "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",

    // 벨 (알림)
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0",

    // 위치
    location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",

    // 전화
    phone:
        "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",

    // 닫기 X
    close: "M18 6L6 18M6 6l12 12",

    // 내비게이션 (종이비행기)
    navigation: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",

    // 로그아웃
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9",

    // 설정 (톱니바퀴)
    settings:
        "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1V12a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",

    // 글로브
    globe:
        "M12 2a10 10 0 110 20A10 10 0 0112 2zm0 0c-2.76 0-5 4.48-5 10s2.24 10 5 10 5-4.48 5-10S14.76 2 12 2zM2 12h20",

    // 시계
    clock: "M12 2a10 10 0 110 20A10 10 0 0112 2zm0 6v4l3 3",

    // 문서
    document:
        "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1v5h5M9 13h6M9 17h4",

    // 카드·결제
    card: "M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zM1 10h22",

    // 갤러리·이미지
    gallery:
        "M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h3L10 3h4l2 2h3a2 2 0 012 2v12zM12 17a4 4 0 100-8 4 4 0 000 8z",

    // 카메라
    camera:
        "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z",

    // 메시지 말풍선
    message:
        "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",

    // 쉴드·보안
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm0-13v4m0 2v.5",

    // 연필·수정
    edit:
        "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",

    // 그리드·앱
    grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z",

    // 리스트
    list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",

    // 메뉴 (햄버거)
    menu: "M3 12h18M3 6h18M3 18h18",

    // 새로고침
    refresh:
        "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",

    // 메일
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm18 2l-10 7L2 6",

    // 마이크
    mic: "M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3zm-1 19v3m-4-3a7 7 0 0014 0H7",

    // 트렌드 상승
    "trend-up": "M23 6l-9.5 9.5-5-5L1 18m22-12h-6m6 0v6",

    // 비디오
    video: "M23 7l-7 5 7 5V7zM1 5h13a2 2 0 012 2v10a2 2 0 01-2 2H1V5z",

    // 경고
    alert: "M12 22a10 10 0 110-20 10 10 0 010 20zm0-14v4m0 4h.01",

    // 정보
    info: "M12 22a10 10 0 110-20 10 10 0 010 20zm0-10v5m0-8h.01",

    // 렌치
    wrench:
        "M14.7 6.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-.29-.29M19.36 4.64a9 9 0 11-12.72 12.72L4.5 17.5a6.5 6.5 0 008.16.43l4.1-4.1a6.5 6.5 0 00.43-8.16l-.83 2.83z",

    // 필터
    filter: "M4 6h16M7 12h10M10 18h4",

    // 더보기 (세로 점 3개)
    more: "M12 5h.01M12 12h.01M12 19h.01",

    // 별
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",

    // 체크
    check: "M20 6L9 17l-5-5",

    // 화살표 오른쪽
    "arrow-right": "M5 12h14m-7-7l7 7-7 7",

    // 화살표 왼쪽
    "arrow-left": "M19 12H5m7-7l-7 7 7 7",

    // 화살표 아래
    "arrow-down": "M6 9l6 6 6-6",

    // 화살표 위
    "arrow-up": "M18 15l-6-6-6 6",

    // 플러스
    plus: "M12 5v14m-7-7h14",

    // 트로피
    trophy:
        "M8 21h8m-4-4v4M5 3H3v5a5 5 0 005 5 5 5 0 005-5V3H5zm14 0h-2v5a5 5 0 01-3 4.58",

    // 휴지통
    trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6",

    // 업로드
    upload: "M12 3v12m-5-5l5-5 5 5M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4",
    spreadsheet: "M3 3h18v18H3V3zm18 6H3m18 6H3m6-12v18",
    repeat: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
    copy: "M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
    "plus-circle": "M12 22a10 10 0 110-20 10 10 0 010 20zm0-15v10m-5-5h10",
    "check-circle": "M12 22a10 10 0 110-20 10 10 0 010 20zm-5-10l3.5 3.5L17 8",
};

/* ── Icon 컴포넌트 ── */
export function Icon({
    name,
    size = 24,
    color = "currentColor",
    strokeWidth = 1.75,
    className = "",
    style,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHidden = true,
}: IconProps) {
    const path = ICON_PATHS[name];

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`icon icon--${name} ${className}`}
            style={style}
            aria-label={ariaLabel}
            aria-hidden={!!ariaHidden}
            focusable="false"
        >
            <path d={path} />
        </svg>
    );
}
