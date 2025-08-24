// bariplus-nutri/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchApi, setAuthToken as setApiAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [nutricionista, setNutricionista] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchNutri = useCallback(async () => {
        const token = localStorage.getItem('nutri_token');
        if (token) {
            setApiAuthToken(token);
            try {
                const nutriData = await fetchApi('/api/nutri/auth/me');
                setNutricionista(nutriData);
            } catch (error) {
                console.error("Sessão de nutri inválida, a limpar token.", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNutri();
    }, [fetchNutri]);

    const login = (nutriData, token) => {
        localStorage.setItem('nutri_token', token);
        setApiAuthToken(token);
        setNutricionista(nutriData);
    };

    const logout = () => {
        localStorage.removeItem('nutri_token');
        setApiAuthToken(null);
        setNutricionista(null);
    };

    return (
        <AuthContext.Provider value={{ nutricionista, login, logout, isAuthenticated: !!nutricionista }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};