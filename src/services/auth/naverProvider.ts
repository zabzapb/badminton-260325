/**
 * Naver OAuth 2.0 Provider
 * Authentication URL generation and CSRF protection.
 */

import { NAVER_CONFIG } from '@/config/auth.config';

/**
 * Generates and stores a unique CSRF state token.
 */
function generateState(): string {
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  return array.join('-');
}

/**
 * Generates the full Naver Authentication URL.
 */
export function generateNaverAuthUrl(): string {
  const state = generateState();
  sessionStorage.setItem('hctc_naver_oauth_state', state);

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
 */
export function verifyOauthState(returnedState: string): boolean {
  const savedState = sessionStorage.getItem('hctc_naver_oauth_state');
  sessionStorage.removeItem('hctc_naver_oauth_state'); 
  return savedState !== null && savedState === returnedState;
}
