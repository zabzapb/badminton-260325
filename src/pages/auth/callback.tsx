/**
 * Naver Login Callback Page
 * Receives the auth code, verifies CSRF state, and finalizes the login process.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyOauthState } from '@/services/auth/naverProvider';
import { normalizeNaverUser } from '@/services/auth/naverTransformer';
import { finalizeLogin } from '@/services/auth/authService';
import { exchangeNaverToken, fetchNaverProfile } from '@/lib/api/authApi';
import { UserProfile } from '@/lib/types';
import './callback.css';

export default function NaverAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [step, setStep] = useState<'verifying' | 'exchanging' | 'syncing' | 'redirecting'>('verifying');
    const hasProcessed = useRef(false);

    useEffect(() => {
        // [Safety Net] Max 10 seconds for the whole process
        const safetyTimeout = setTimeout(() => {
            if (status === 'loading') {
                console.error('Authentication process timed out (10s)');
                setErrorCode('ERR_AUTH_TIMEOUT');
                setStatus('error');
            }
        }, 10000);

        const processAuth = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state') || '';
            const error = searchParams.get('error');

            if (error || !code) {
                setErrorCode(error === 'access_denied' ? 'ERR_AUTH_002' : 'ERR_AUTH_INVALID_REQUEST');
                setStatus('error');
                clearTimeout(safetyTimeout);
                return;
            }

            try {
                // 1. Verify CSRF
                setStep('verifying');
                if (!verifyOauthState(state)) {
                    setErrorCode('ERR_AUTH_001');
                    setStatus('error');
                    clearTimeout(safetyTimeout);
                    return;
                }

                // 2. Exchange token
                setStep('exchanging');
                const accessToken = await exchangeNaverToken(code, state);
                const naverProfileData = await fetchNaverProfile(accessToken);

                // 3. Sync
                setStep('syncing');
                const normalized = normalizeNaverUser(naverProfileData);
                const { success, isNewUser } = await finalizeLogin(normalized as UserProfile);

                if (success) {
                    setStatus('success');
                    setStep('redirecting');
                    clearTimeout(safetyTimeout);
                    
                    // Proceed immediately for maximum speed as requested
                    if (isNewUser) {
                        navigate('/register', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                } else {
                    setErrorCode('ERR_AUTH_SYNC_FAILED');
                    setStatus('error');
                }
            } catch (err) {
                console.error('Login error:', err);
                setErrorCode('ERR_AUTH_EXCEPTION');
                setStatus('error');
            }
        };

        processAuth();
        return () => clearTimeout(safetyTimeout);
    }, [searchParams, navigate]);

    return (
        <div className="callback-page">
            <div className="callback-container">
                {status === 'loading' && (
                    <div className="callback-loading-ui">
                        <div className="loading-spinner-large" />
                        <h2 className="callback-status">
                            {step === 'verifying' && "인증 정보 확인 중..."}
                            {step === 'exchanging' && "프로필 정보를 가져오는 중..."}
                            {step === 'syncing' && "데이터 동기화 중..."}
                        </h2>
                        <p className="callback-hint">잠시만 기다려 주세요. 안전하게 로그인 중입니다.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="callback-success-ui">
                        <div className="success-lottie-placeholder">✅</div>
                        <h2 className="callback-status">로그인 완료!</h2>
                        <p className="callback-hint">곧 서비스 화면으로 이동합니다.</p>
                    </div>
                )}

                {status === 'error' && (
                    <>
                        <div className="error-icon">⚠️</div>
                        <h2 className="callback-status">로그인 실패</h2>
                        <p className="callback-hint">네이버 인증 중 오류가 발생했습니다.</p>
                        <p className="code-display" style={{ fontSize: '12px', color: '#ff6b3d', marginTop: '8px', opacity: 0.8 }}>
                            Error Code: {errorCode || 'UNKNOWN'}
                        </p>
                        <p className="callback-hint-minor" style={{ marginTop: '16px' }}>
                            {errorCode === 'ERR_AUTH_001' ? '세션 정보가 유실되었습니다. 브라우저를 새로고침하거나 다른 브라우저에서 다시 시도해 주세요.' : 
                             errorCode === 'ERR_AUTH_002' ? '인앱 브라우저에서 차단되었습니다. 외부 브라우저(크롬, 사파리 등)로 실행해 주세요.' :
                             '잠시 후 다시 시도하시거나 관리자에게 문의바랍니다.'}
                        </p>
                        <button className="btn-retry" onClick={() => navigate('/')}>다시 시도하기</button>
                    </>
                )}
            </div>
        </div>
    );
}
