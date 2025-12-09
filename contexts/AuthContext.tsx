'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Dummy users for simulation
const DUMMY_USERS = [
    {
        id: '1',
        username: 'Alpha',
        password: 'alpha123',
        full_name: 'Alpha Administrator',
        email: 'alpha@stockflow.com',
        role: 'admin',
        user_type: 'admin',
        avatar: null,
    },
    {
        id: '2',
        username: 'Employee',
        password: 'employee123',
        full_name: 'Employee Vendor',
        email: 'employee@stockflow.com',
        role: 'user',
        user_type: 'vendor',
        avatar: null,
    },
];

export interface User {
    id: string;
    username: string;
    full_name: string;
    email: string;
    role: 'admin' | 'user';
    user_type: 'admin' | 'vendor' | 'manager' | 'staff';
    avatar: string | null;
}

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
        const storedUser = localStorage.getItem('stockflow_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch {
                localStorage.removeItem('stockflow_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const foundUser = DUMMY_USERS.find(
            u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );

        if (foundUser) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = foundUser;
            setUser(userWithoutPassword as User);
            localStorage.setItem('stockflow_user', JSON.stringify(userWithoutPassword));
            return { success: true };
        }

        return { success: false, error: 'Invalid username or password' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('stockflow_user');
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
