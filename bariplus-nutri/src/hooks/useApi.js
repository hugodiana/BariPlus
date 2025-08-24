// bariplus-nutri/src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';

export const useApi = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (endpoint, options = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchApi(endpoint, options);
            return data;
        } catch (err) {
            const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
            if (!options.skipToast) {
                toast.error(errorMessage);
            }
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isLoading, error, request };
};