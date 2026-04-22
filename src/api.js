/**
 * src/api.js
 * Central API helper — all fetch calls go through here.
 * Base URL is /api (proxied to Express server by Vite).
 */

// const PROD_URL = 'https://demobank-app-backend.onrender.com/api';
// const BASE = import.meta.env.DEV ? '/api' : PROD_URL;
const BASE = '/api';

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
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'API error');
    }
    return res.json();
}

// ── Accounts ──────────────────────────────────
export const getAccounts = () => request('/accounts');
export const updateAccountBalance = (id, delta) =>
    request(`/accounts/${id}/balance`, { method: 'PATCH', body: { delta } });

// ── Transactions ──────────────────────────────
export const getTransactions = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
};
export const createTransaction = (txn) =>
    request('/transactions', { method: 'POST', body: txn });

// ── Fixed Deposits ────────────────────────────
export const getFixedDeposits = () => request('/fixed-deposits');
export const createFixedDeposit = (fd) =>
    request('/fixed-deposits', { method: 'POST', body: fd });

// ── Users ─────────────────────────────────────
export const getUserProfile = (id) => request(`/users/${id}`);
export const updateUserProfile = (id, data) =>
    request(`/users/${id}`, { method: 'PATCH', body: data });

// ── Auth ──────────────────────────────────────
export const oauthLogin = (provider, code) =>
    request('/auth/oauth-callback', { method: 'POST', body: { provider, code } });
export const getCaptcha = () => request('/auth/captcha');

// ── KYC ───────────────────────────────────────
export const uploadKycDocument = async (documentType, file) => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('document', file);

    const res = await fetch(`${BASE}/kyc/upload`, {
        method: 'POST',
        // Omit Content-Type so fetch can set the correct multipart boundary
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
