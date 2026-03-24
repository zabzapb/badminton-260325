/**
 * Naver Login Configuration (Server-Side + Static)
 * Manages OAuth credentials and dynamic callback endpoints.
 */

export const NAVER_CONFIG = {
  // Use VITE_ prefix for client-accessible variables in Vite project
  clientId: import.meta.env.VITE_NAVER_CLIENT_ID || 'Kk3SMMsp_T3X6GoLmS7O',
  // clientSecret: [Server-side only] Removed to comply with security requirements.

  // Dynamically generates the Callback URL based on the current environment.
  getCallbackUrl: () => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (import.meta.env.VITE_BASE_URL || 'https://hctc.nstove.com');
    
    const path = import.meta.env.VITE_NAVER_CALLBACK_PATH || '/auth/naver/callback';
    return `${baseUrl}${path}`;
  },
  
  endpoints: {
    authorize: "https://nid.naver.com/oauth2.0/authorize",
    token: "https://nid.naver.com/oauth2.0/token",
    profile: "https://openapi.naver.com/v1/nid/me"
  }
};
