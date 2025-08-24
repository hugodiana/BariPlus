// client/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchApi, setAuthToken as setApiAuthToken } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('bariplus_token');
        if (token) {
            setApiAuthToken(token);
            try {
                const userData = await fetchApi('/api/me');
                setUser(userData);
            } catch (error) {
                console.error("Sessão inválida, limpando token.", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = (userData, token) => {
        localStorage.setItem('bariplus_token', token);
        setApiAuthToken(token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('bariplus_token');
        setApiAuthToken(null);
        setUser(null);
    };
    
    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
    };

    if (loading) {
        return <LoadingSpinner fullPage />;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};