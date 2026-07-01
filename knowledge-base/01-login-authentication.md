---
title: Login & Authentication
section: login
audience: chatbot-rag
tags: [login, authentication, demo-accounts, oauth, security]
---

# Login & Authentication

## How to sign in
1. Go to the login page (`/login`).
2. Enter your **Email Address** and **Password**.
3. Optionally check **Remember me**.
4. Click **Sign In**.

The login form validates that the email looks like a valid email address and that a
password was entered before it will submit.

## Demo / test accounts
Test Bank is a demo banking environment. The following demo accounts are pre-loaded
(all use the password `password123`):

| Name | Email |
| --- | --- |
| Test User | testUser@gmail.com |
| John Doe | john.doe@example.com |
| Alice Johnson | alice.johnson@email.com |
| Bob Williams | bob.williams@email.com |
| Catherine Lee | catherine.lee@email.com |

Clicking the "🔑 Demo" hint text on the login page auto-fills the primary demo
credentials (testUser@gmail.com / password123).

## OAuth sign-in
The login page also supports mock OAuth provider buttons that redirect through an
OAuth callback page before landing on the dashboard, for demonstrating third-party
sign-in flows.

## Common login errors
- **"Invalid email or password."** — the email/password combination does not match
  a known account. Double check for typos, or use one of the demo accounts above.
- **"Something went wrong. Server is unreachable."** — the backend health check
  failed; try again shortly.
- **"Forgot password?"** link is present on the login form for account recovery.

## Session & security policy
- Sessions are tied to the signed-in browser session; signing out clears the active
  session.
- Multi-factor authentication and 256-bit SSL encryption are part of Test Bank's
  advertised account protections.
- Customers should never share their password or one-time codes with anyone,
  including anyone claiming to be from Test Bank support.
