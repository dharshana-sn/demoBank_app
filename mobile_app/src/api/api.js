/**
 * api.js – Central API helper for the mobile app
 * Points to the backend server (update BASE_URL to your backend IP/URL).
 */

// Change this to your backend URL:
// - Local dev: 'http://10.0.2.2:5001/api' for Android emulator
// - Local dev: 'http://localhost:5001/api' for iOS simulator
// - Production: 'https://demobank-app-backend.onrender.com/api'
export const BASE_URL = 'http://192.168.22.89:5001/api';
// export const BASE_URL = 'http://10.0.2.2:5001/api';

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

async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
            signal: controller.signal,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
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
export const getAccounts = async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/accounts${qs ? `?${qs}` : ''}`);
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
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
};
export const createTransaction = (txn) =>
    request('/transactions', { method: 'POST', body: txn });
export const sameBankTransfer = (data) =>
    request('/transactions/same-bank-transfer', { method: 'POST', body: data });

// ── Fixed Deposits ────────────────────────────
export const getFixedDeposits = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/fixed-deposits${qs ? `?${qs}` : ''}`);
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
    const qs = new URLSearchParams(params).toString();
    return request(`/kyc/status${qs ? `?${qs}` : ''}`);
};
export const deleteKycDocument = (type, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/kyc/document/${type}${qs ? `?${qs}` : ''}`, { method: 'DELETE' });
};

export const uploadKycDocument = async (type, fileUri, fileName, mimeType, userId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
        const formData = new FormData();
        formData.append('document', { uri: fileUri, name: fileName, type: mimeType || 'application/octet-stream' });
        formData.append('documentType', type);
        formData.append('userId', userId);
        const res = await fetch(`${BASE_URL}/kyc/upload`, {
            method: 'POST',
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
