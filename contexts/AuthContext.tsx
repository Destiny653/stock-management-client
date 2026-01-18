'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { base44, User } from '@/api/base44Client';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Verify session with backend (cookies sent automatically)
                const freshUser = await base44.auth.me();
                if (freshUser) {
                    setUser(freshUser);
                } else {
                    // Session invalid
                    setUser(null);
                    localStorage.removeItem('base44_currentUser');
                }
            } catch {
                setUser(null);
                localStorage.removeItem('base44_currentUser');
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const loggedInUser = await base44.auth.login(username, password);
            if (loggedInUser) {
                setUser(loggedInUser);
                return { success: true };
            }
            return { success: false, error: 'Login failed: Could not retrieve user profile' };
        } catch (err: any) {
            console.error('Login error:', err);
            return {
                success: false,
                error: err.response?.data?.detail || 'Invalid username or password'
            };
        }
    };

    const logout = () => {
        setUser(null);
        base44.auth.logout();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
