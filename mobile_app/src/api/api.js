/**
 * api.js – Central API helper for the mobile app
 * Points to the backend server (update BASE_URL to your backend IP/URL).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL:
// - Local dev: 'http://10.0.2.2:5001/api' for Android emulator
// - Local dev: 'http://localhost:5001/api' for iOS simulator
// - Production: 'https://demobank-app-backend.onrender.com/api'
// export const BASE_URL = 'http://10.117.88.164:5001/api';
export const BASE_URL = 'http://192.168.22.89:5001/api';

export const checkHealth = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check
    try {
        const res = await fetch(`${BASE_URL}/health`, { 
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (err) {
        clearTimeout(timeoutId);
        return false;
    }
};

let onUnauthorizedCallback = null;

export const setOnUnauthorized = (cb) => {
    onUnauthorizedCallback = cb;
};

const buildQueryString = (params = {}) => {
    const keys = Object.keys(params).filter(
        key => params[key] !== undefined && params[key] !== null
    );
    if (keys.length === 0) return '';
    return '?' + keys
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
};

async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        let token = null;
        try {
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                const userData = JSON.parse(stored);
                token = userData?.token;
            }
        } catch (_) {}

        const headers = { 
            'Content-Type': 'application/json', 
            ...options.headers 
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}${path}`, {
            headers,
            ...options,
            signal: controller.signal,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            if ((res.status === 401 || res.status === 403) && onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
            throw new Error(err.error || 'API error');
        }
        return res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please check your server.');
        }
        throw err;
    }
}

// ── Accounts ──────────────────────────────────
export const getAccounts = (params = {}) => {
    return request(`/accounts${buildQueryString(params)}`);
};
export const updateAccountBalance = (id, delta) =>
    request(`/accounts/${id}/balance`, { method: 'PATCH', body: { delta } });
export const updateAccount = (id, data) =>
    request(`/accounts/${id}`, { method: 'PATCH', body: data });
export const createAccount = (data) =>
    request('/accounts', { method: 'POST', body: data });
export const deleteAccount = (id) =>
    request(`/accounts/${id}`, { method: 'DELETE' });


// ── Transactions ──────────────────────────────
export const getTransactions = (params = {}) => {
    return request(`/transactions${buildQueryString(params)}`);
};
export const createTransaction = (txn) =>
    request('/transactions', { method: 'POST', body: txn });
export const sameBankTransfer = (data) =>
    request('/transactions/same-bank-transfer', { method: 'POST', body: data });

// ── Fixed Deposits ────────────────────────────
export const getFixedDeposits = (params = {}) => {
    return request(`/fixed-deposits${buildQueryString(params)}`);
};
export const createFixedDeposit = (fd) =>
    request('/fixed-deposits', { method: 'POST', body: fd });

// ── Users ─────────────────────────────────────
export const getUserProfile = (id) => request(`/users/${id}`);
export const updateUserProfile = (id, data) =>
    request(`/users/${id}`, { method: 'PATCH', body: data });

// ── Auth ──────────────────────────────────────
export const loginUser = (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } });

// ── KYC ───────────────────────────────────────
export const getKycStatus = (params = {}) => {
    return request(`/kyc/status${buildQueryString(params)}`);
};
export const deleteKycDocument = (type, params = {}) => {
    return request(`/kyc/document/${type}${buildQueryString(params)}`, { method: 'DELETE' });
};

export const uploadKycDocument = async (type, fileUri, fileName, mimeType, userId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        let token = null;
        try {
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                const userData = JSON.parse(stored);
                token = userData?.token;
            }
        } catch (_) {}

        const formData = new FormData();
        formData.append('document', { uri: fileUri, name: fileName, type: mimeType || 'application/octet-stream' });
        formData.append('documentType', type);
        formData.append('userId', userId);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}/kyc/upload`, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || 'Upload failed');
        }
        return res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Upload timed out. Please try again.');
        throw err;
    }
};

// ── OTP ───────────────────────────────────────
export const sendSmsOtp = (userId) =>
    request('/otp/send-sms', { method: 'POST', body: { userId } });
export const verifySmsOtp = (userId, otp) =>
    request('/otp/verify-sms', { method: 'POST', body: { userId, otp } });
