/**
 * Naver OAuth Provider (Implicit Grant Direct Flow)
 * Client redirects to Naver OAuth authorization endpoint with response_type=token.
 * No client_secret required, zero code-exchange delay.
 */

const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID || 'Kk3SMMsp_T3X6GoLmS7O';

function getCallbackUrl(): string {
  const path = import.meta.env.VITE_NAVER_CALLBACK_PATH || '/auth/naver/callback';
  return `${window.location.origin}${path}`;
}

function generateCsrfState(): string {
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  return array.join('-');
}

/**
 * Redirects browser to Naver OAuth 2.0 Authorization Endpoint.
 * Uses response_type=token (Implicit Grant).
 */
export function redirectToNaverLogin(): void {
  const state = generateCsrfState();
  const callbackUrl = encodeURIComponent(getCallbackUrl());
  const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${NAVER_CLIENT_ID}&redirect_uri=${callbackUrl}&state=${state}`;
  window.location.href = authUrl;
}
