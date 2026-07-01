---
title: Fund Transfers (Internal, Same Bank, Pay to Contact)
section: transfers
audience: chatbot-rag
tags: [transfers, payments, pay-to-user, same-bank-transfer]
---

# Fund Transfers

The **Transfers** section has three tabs. All three only allow transfers from
**checking** or **savings** accounts (credit cards and investment accounts cannot be
used as the source).

## 1. Internal Transfer (between your own accounts)
Location: Transfers → Internal Transfer, also available on the Overview tab.

Fields: **From Account**, **To Account**, **Amount ($)**, **Priority**, **Note /
Memo (optional, max 100 characters)**.

Priority options and their meaning:
- **Normal** — 1–3 business days
- **Express** — same day
- **Instant Transfer** — immediate

Validation rules:
- Source and destination accounts must both be selected.
- Source and destination cannot be the same account.
- Amount must be a positive number.
- Amount cannot exceed the source account's available balance — the form shows
  "Insufficient funds. Available: $X" if it does.

On success the customer sees "Transfer initiated successfully! You'll receive a
confirmation shortly."

## 2. Same Bank Transfer (to another Test Bank customer by account number)
Location: Transfers → Same Bank Transfer.

Fields: **From Account**, **Recipient Account Number** (10–12 digits, minimum 8
characters accepted by the form), **Recipient Name**, **Amount ($)**, **Note
(optional, max 100 characters)**.

Validation rules:
- All fields except note are required.
- Recipient account number must be at least 8 characters.
- Amount must be positive and not exceed the source account's balance.

On success: "Transfer completed! **[Recipient Name]**'s account has been credited."

## 3. Pay to Contact (pay another registered user)
Location: Transfers → Pay to Contact (also called "Pay to User").

Flow:
1. Choose the **From Account**.
2. Search for a recipient by name or email in the contact/user list.
3. Select the recipient, enter an **Amount ($)** and an optional **Note**.
4. Click **Send Payment**, which opens a **Confirm Payment** dialog showing
   recipient, account, amount, and note.
5. Click **Confirm & Send** to complete the payment.

A QR code option (Pay via QR) is also available from this screen for
receiving payments.

On success: "Payment sent successfully! The transfer history has been updated."

## General transfer guidance for the assistant
- Never fabricate a transfer confirmation — only report success after the backend
  transfer tool actually completes.
- If a customer wants to move money between their own accounts, direct them to
  **Internal Transfer**. If they want to send money to another bank customer they
  know the account number for, use **Same Bank Transfer**. If they want to pay a
  saved contact, use **Pay to Contact**.
