/**
 * Naver JS SDK (naveridlogin_js_sdk_2.0.2) 전역 타입 선언
 * window.naver.LoginWithNaverId 사용을 위한 TypeScript 인터페이스 정의
 */

interface NaverLoginUser {
  getEmail(): string;
  getId(): string;
  getGender(): string;
  getName(): string;
  getNickname(): string;
  getMobile(): string;
  getBirthday(): string;
  getBirthyear(): string;
  getProfileImage(): string;
  getAge(): string;
}

interface NaverLoginInstance {
  init(): void;
  getLoginStatus(callback: (status: boolean) => void): void;
  user: NaverLoginUser;
}

interface NaverLoginOptions {
  clientId: string;
  callbackUrl: string;
  isPopup: boolean;
  loginButton?: { color: string; type: number; height: number };
  callbackHandle?: boolean;
}

interface NaverLoginConstructor {
  new (options: NaverLoginOptions): NaverLoginInstance;
}

interface NaverNamespace {
  LoginWithNaverId: NaverLoginConstructor;
}

interface Window {
  naver: NaverNamespace;
}
