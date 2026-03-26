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

    const handleCopyUrl = () => {
        const url = window.location.origin; // Copy base URL to redirect back to home
        navigator.clipboard.writeText(url).then(() => {
            alert('주소가 복사되었습니다. 주소창에 붙여넣어 주세요.');
        });
    };

    return (
        <div className="callback-page">
            <div className="callback-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
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
                        <p className="callback-hint">현재 환경에서는 로그인이 원활하지 않습니다.</p>
                        <p className="code-display" style={{ fontSize: '10px', color: '#ccc', marginTop: '4px', opacity: 0.6 }}>
                            Trace: {errorCode || 'UNKNOWN'}
                        </p>

                        {errorCode === 'ERR_AUTH_001' && (
                            <div className="url-copy-section">
                                <span className="url-copy-label">외부 브라우저(Chrome/Safari)로 이동</span>
                                <div className="url-copy-box">
                                    <span className="url-input">player.nstove.com...</span>
                                    <button className="btn-copy" onClick={handleCopyUrl}>복사하기</button>
                                </div>
                                <span className="copy-guide">
                                    위 버튼을 눌러 주소를 복사한 후, 일반 브라우저 주소창에 붙여넣어 접속해 주세요.
                                </span>
                            </div>
                        )}

                        <p className="callback-hint-minor" style={{ marginTop: '24px', fontSize: '13px' }}>
                            {errorCode === 'ERR_AUTH_001' ? '네이버 밴드 등 일부 앱에서는 로그인이 차단될 수 있습니다.' : 
                             errorCode === 'ERR_AUTH_002' ? '인앱 브라우저에서 차단되었습니다. 외부 브라우저로 실행해 주세요.' :
                             '잠시 후 다시 시도하시거나 관리자에게 문의바랍니다.'}
                        </p>
                        <button className="btn-retry" onClick={() => navigate('/')}>홈으로 돌아가기</button>
                    </>
                )}
            </div>
        </div>
    );
}
