/**
 * @file BandEscapeGuard.tsx
 * @description Naver Band In-App Browser Detection & Pre-emptive Escape Strategy.
 * Enforces stable authentication by guiding users to external standard browsers.
 */

import React, { useEffect, useState } from 'react';

interface BandEscapeGuardProps {
  children: React.ReactNode;
}

const BandEscapeGuard: React.FC<BandEscapeGuardProps> = ({ children }) => {
  const [isBandInApp, setIsBandInApp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isBand = ua.includes('band');
    const isAos = ua.includes('android');

    if (isBand) {
      setIsBandInApp(true);
      setIsAndroid(isAos);

      // [Operational Efficiency] Android intent: Force open in Chrome after 0.5s
      if (isAos) {
        const targetUrl = "player.nstove.com"; // Clean Entry Point
        const intentUrl = `intent://${targetUrl}#Intent;scheme=http;package=com.android.chrome;end;`;
        
        const timer = setTimeout(() => {
          window.location.href = intentUrl;
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // [Resilience] Manual URL copy for iOS or failed auto-redirects
  const handleCopyCleanUrl = async () => {
    const cleanUrl = "https://player.nstove.com"; // [Correction] Prefer HTTPS
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (error) {
      console.error("ERR_SYS_CLIPBOARD: ", error);
      alert(`클립보드 복사 실패. 아래 주소를 직접 복사해 주세요.\n${cleanUrl}`);
    }
  };

  // 1. Pass-through for standard browsers
  if (!isBandInApp) {
    return <>{children}</>;
  }

  // 2. Pre-emptive Defense UI for Band In-App
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>⚠️ 브라우저 접속 안내</h3>
      <p style={styles.description}>
        네이버 밴드 앱에서는 보안 정책으로 인해<br/>
        원활한 로그인을 지원하지 않습니다.<br/>
        {isAndroid ? "잠시 후 안전한 크롬 브라우저로 자동 이동합니다." : "아래 버튼을 눌러 안전한 브라우저(Safari)에서 열어주세요."}
      </p>

      <button 
        onClick={handleCopyCleanUrl} 
        style={{ 
            ...styles.copyButton, 
            backgroundColor: copied ? '#4CAF50' : '#FF6B3D' // Using Accent Orange (Identity)
        }}
      >
        {copied ? "✓ 주소 복사 완료! Safari에 붙여넣으세요" : "안전한 접속 주소 복사하기"}
      </button>

      <div style={styles.microGuide}>
        또는 우측 하단 [⋮] &gt; '다른 브라우저로 열기' 선택
      </div>
    </div>
  );
};

// UI/UX specification mapping
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '28px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    textAlign: 'center',
    border: '1px solid #EEEEEE',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    margin: '16px auto',
    maxWidth: '340px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#000000',
    margin: '0 0 16px 0'
  },
  description: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: '1.6',
    marginBottom: '20px'
  },
  copyButton: {
    width: '100%',
    padding: '16px 0',
    color: '#FFFFFF',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  microGuide: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#999999'
  }
};

export default BandEscapeGuard;
