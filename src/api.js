/**
 * src/api.js
 * Central API helper — all fetch calls go through here.
 * Base URL is /api (proxied to Express server by Vite).
 */

// const PROD_URL = 'https://demobank-app-backend.onrender.com/api';
// const BASE = import.meta.env.DEV ? '/api' : PROD_URL;
// const BASE = 'http://localhost:5001/api';
const BASE = 'http://192.168.22.89:5001/api';

export const checkHealth = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`${BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        clearTimeout(timeoutId);
        return false;
    }
};

async function request(path, options = {}) {
    // Retrieve token from sessionStorage
    const sessionData = sessionStorage.getItem("banking_user");
    const user = sessionData ? JSON.parse(sessionData) : null;
    const token = user?.token;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        headers,
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
            const err = await res.json();
            throw new Error(err.error || `Server error: ${res.status}`);
        } else {
            const text = await res.text();
            throw new Error(`Server returned non-JSON error (${res.status}). Please check if the backend server is running.`);
        }
    }

    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }
    return { status: 'ok' };
}

// ── Accounts ──────────────────────────────────
export const getAccounts = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/accounts${qs ? `?${qs}` : ''}`);
};
export const updateAccountBalance = (id, delta) =>
    request(`/accounts/${id}/balance`, { method: 'PATCH', body: { delta } });
export const updateAccountBalanceByNumber = (number, delta) =>
    request(`/accounts/by-number/${number}/balance`, { method: 'PATCH', body: { delta } });
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
export const oauthLogin = (provider, code) =>
    request('/auth/oauth-callback', { method: 'POST', body: { provider, code } });
export const getCaptcha = () => request('/auth/captcha');

// ── KYC ───────────────────────────────────────
export const uploadKycDocument = async (documentType, file) => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('document', file);

    const sessionData = sessionStorage.getItem("banking_user");
    const user = sessionData ? JSON.parse(sessionData) : null;
    const token = user?.token;

    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}/kyc/upload`, {
        method: 'POST',
        headers, // Omit Content-Type so fetch can set the correct multipart boundary
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Upload failed');
    }
    return res.json();
};

export const getKycStatus = () => request('/kyc/status');
export const deleteKycDocument = (type) => request(`/kyc/document/${type}`, { method: 'DELETE' });

// ── OTP ───────────────────────────────────────
export const sendSmsOtp = (userId) =>
    request('/otp/send-sms', { method: 'POST', body: { userId } });
export const verifySmsOtp = (userId, otp) =>
    request('/otp/verify-sms', { method: 'POST', body: { userId, otp } });
