/**
 * Naver OAuth 2.0 Provider
 * Authentication URL generation and CSRF protection.
 * Optimized for In-App Browsers (Band, Kakao, etc.) via Persistent State Fallback.
 */

import { NAVER_CONFIG } from '@/config/auth.config';
import { isInAppBrowser } from '@/utils/browser';

const STATE_KEY = 'hctc_naver_oauth_state';

/**
 * Generates and stores a unique CSRF state token.
 * Uses both SessionStorage (primary) and LocalStorage (backup) for In-App resilience.
 */
function generateState(): string {
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  const state = array.join('-');
  
  // Use session for standard security
  sessionStorage.setItem(STATE_KEY, state);
  
  // Backup to LocalStorage if we detect an In-App browser to survive context restarts
  if (isInAppBrowser()) {
    localStorage.setItem(STATE_KEY, state);
    localStorage.setItem(`${STATE_KEY}_expiry`, (Date.now() + 10 * 60 * 1000).toString()); // 10 min TTL
  }
  
  return state;
}

/**
 * Generates the full Naver Authentication URL.
 */
export function generateNaverAuthUrl(): string {
  const state = generateState();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CONFIG.clientId || '',
    redirect_uri: NAVER_CONFIG.getCallbackUrl(),
    state: state,
  });

  return `${NAVER_CONFIG.endpoints.authorize}?${params.toString()}`;
}

/**
 * Verifies the state parameter returned by Naver.
 * Dual-layer verification for maximum compatibility with In-App fragmented sessions.
 */
export function verifyOauthState(returnedState: string): boolean {
  const sessionState = sessionStorage.getItem(STATE_KEY);
  const localState = localStorage.getItem(STATE_KEY);
  const localExpiry = parseInt(localStorage.getItem(`${STATE_KEY}_expiry`) || '0', 10);
  
  // 1. Try Session (Standard)
  let savedState = sessionState;
  
  // 2. Fallback to Local (In-App Recovery) if session is lost AND within 10min TTL
  if (!savedState && localState && Date.now() < localExpiry) {
    savedState = localState;
    console.warn("HCTC_AUTH: Session context lost, recovered via Persistent Storage (In-App Fallback)");
  }
  
  // Cleanup both
  sessionStorage.removeItem(STATE_KEY);
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(`${STATE_KEY}_expiry`);
  
  return savedState !== null && savedState === returnedState;
}
