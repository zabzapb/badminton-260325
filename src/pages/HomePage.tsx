import { useState } from 'react';
import { generateNaverAuthUrl } from '@/services/auth/naverProvider';
import './HomePage.css';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleNaverLogin = () => {
    setIsLoading(true);
    try {
      // Generate secure OAuth URL and redirect
      const url = generateNaverAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Naver login failed to initiate:', error);
      setIsLoading(false);
      alert('네이버 로그인 초기화 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="home-root">
      <div className="home-center">

        {/* 로고 */}
        <div className="home-logo" aria-label="한콕두콕 로고">
          <img
            src="/logo-hkdk.png"
            alt="한콕두콕 (HANCOCK TWOCOCK)"
            className="home-logo__img"
            draggable={false}
          />
        </div>

        {/* 서브타이틀 */}
        <p className="home-subtitle">
          Han-Cock Two-Cock Badminton Open Club<br />
          Player Profile Registration System
        </p>

        {/* 네이버 로그인 버튼 */}
        <button
          className={`btn-naver ${isLoading ? 'btn-naver--loading' : ''}`}
          id="btn-naver-login"
          onClick={handleNaverLogin}
          disabled={isLoading}
          aria-label="네이버 계정으로 로그인"
        >
          {isLoading ? (
            <div className="spinner-small" />
          ) : (
            <>
              <NaverN />
              <span>네이버 로그인</span>
            </>
          )}
        </button>

        <p className="home-notice">
          Powered by @zabzapb | Contact: zabzap.lab@gmail.com
        </p>

      </div>
    </div>
  );
}

function NaverN() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="white"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
    </svg>
  );
}
