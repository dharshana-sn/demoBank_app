/**
 * src/api.js
 * Central API helper — all fetch calls go through here.
 * Base URL is /api (proxied to Express server by Vite).
 */

const PROD_URL = 'https://demobank-app-backend.onrender.com/api';
const BASE = import.meta.env.DEV ? '/api' : PROD_URL;

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
