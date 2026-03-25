import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/core/store/userStore';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useUserStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to Login, but save the current location they were trying to go to
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
