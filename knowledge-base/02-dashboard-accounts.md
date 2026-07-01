---
title: Dashboard, Overview & Accounts
section: accounts
audience: chatbot-rag
tags: [dashboard, accounts, balance, overview]
---

# Dashboard, Overview & Accounts

## Overview tab
The Overview tab is the landing page after login and shows a summary strip with:
- **Total Net Worth** — sum of balances across all accounts.
- **Total Income** — total credits recorded.
- **Total Expenses** — total debits recorded.
- **Active Accounts** — count of open accounts.

Below the summary strip, customers see their **account cards**, a **Market Pulse**
market-insights widget, the fund transfer forms, the Pay to User panel, and their
recent transaction history (downloadable as PDF or Excel).

## Accounts tab
The Accounts tab shows every account the customer holds as a draggable card
(customers can reorder cards by dragging them) plus a detailed transaction table
below. Each account card and each row displays:
- Account name (e.g. Checking Account, Savings Account, Investments)
- Account number (customers can copy it to clipboard)
- Current balance
- Account type / trend indicator

## Account types
Test Bank accounts fall into these types: **checking**, **savings**,
**investment**, and **credit** (credit cards are managed separately — see
Credit Cards document). Fixed Deposits and Credit Cards are excluded from the
"From Account" / "To Account" pickers on transfer forms — only checking, savings,
and investment-eligible funding accounts are selectable there (investment accounts
are excluded from transfer/pay source pickers too; only checking and savings can
send/receive transfers).

## Answering balance questions
When a customer asks "what's my balance," the assistant should retrieve the
customer's live account data (via the `get_account_balance` tool) rather than
guessing — balances change constantly as customers transact.
