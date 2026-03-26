/**
 * Browser detection utility for In-App browsers.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent.toLowerCase();
  
  // Detection for major Korean In-App browsers and general ones
  return (
    ua.includes('naver') || 
    ua.includes('band') || 
    ua.includes('kakaotalk') || 
    ua.includes('line') ||
    ua.includes('iphone') && ua.includes('fban') || // Facebook In-App
    ua.includes('iphone') && ua.includes('fbav') || // Facebook In-App
    ua.includes('instagram') 
  );
}

/**
 * Attempts to force open the current URL in an external browser.
 * Note: This works differently across platforms and may not be 100% reliable 
 * without backend-side user-agent sniffing redirects.
 */
export function openInExternalBrowser(): void {
  const url = window.location.href;
  
  // Specific scheme for some apps (e.g., KakaoTalk)
  if (navigator.userAgent.match(/KAKAOTALK/i)) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    return;
  }
  
  // General fallback for others - usually guides users to "Open in Browser" in the app menu
  alert('현재 브라우저에서는 로그인이 원활하지 않을 수 있습니다. 우측 상단의 "..." 메뉴를 클릭하여 "다른 브라우저로 열기"를 선택해 주세요.');
}
