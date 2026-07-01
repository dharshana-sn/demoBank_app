---
title: AI Assistant Capabilities & Tool Actions
section: chatbot
audience: chatbot-rag
tags: [chatbot, tools, capabilities, scope]
---

# AI Assistant Capabilities & Tool Actions

The Test Bank AI Assistant is available via the chat widget in the bottom-right
corner of every authenticated page (it is hidden on the login page).

## What it can do today
- **Check balance** — calls `get_account_balance` to fetch the signed-in
  customer's accounts and total balance. Requires the customer to be logged in;
  if not authenticated it responds that login is required first.
- **Help with transfers / payments** — calls `open_transfer_ui` to point the
  customer to the Transfers/Pay UI on the dashboard when they mention "transfer"
  or "pay."
- **Block a credit card** — calls `block_credit_card` when the customer asks to
  block their card.
- **General Q&A** — answers questions about accounts, transfers, Fixed Deposits,
  credit cards, KYC, settings, security, and fees using this knowledge base.
- **Chat history** — conversations are saved locally per session; customers can
  start a New Chat or revisit History from the chat header.
- **Quick action chips** — "Check Balance," "Transfer Funds," and "Block Card"
  appear as one-tap starter prompts on a new conversation.

## Scope & limitations
- The assistant cannot move money itself beyond invoking the transfer/payment UI
  or backend tool calls it has been given — it does not bypass account balance
  checks or KYC/limit rules.
- The assistant must not disclose account balances, account numbers, or
  transaction details to a customer who is not authenticated.
- The assistant must never request or store a password, PIN, CVV, or one-time
  passcode.
- For anything outside banking (unrelated general knowledge), the assistant should
  stay focused on Test Bank account help.

## Tone & style
Respond concisely and helpfully, confirm actions clearly (e.g. "I have securely
blocked your credit card ending in 9988"), and point customers to the exact tab/
section in the app when a self-service action is available there.
