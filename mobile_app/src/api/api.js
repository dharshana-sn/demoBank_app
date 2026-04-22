/**
 * api.js – Central API helper for the mobile app
 * Points to the backend server (update BASE_URL to your backend IP/URL).
 */

// Change this to your backend URL:
// - Local dev: 'http://10.0.2.2:5001/api' for Android emulator
// - Local dev: 'http://localhost:5001/api' for iOS simulator
// - Production: 'https://demobank-app-backend.onrender.com/api'
export const BASE_URL = 'http://10.0.2.2:5001/api';

async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
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
export const loginUser = (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } });

// ── KYC ───────────────────────────────────────
export const getKycStatus = () => request('/kyc/status');
export const deleteKycDocument = (type) =>
    request(`/kyc/document/${type}`, { method: 'DELETE' });
