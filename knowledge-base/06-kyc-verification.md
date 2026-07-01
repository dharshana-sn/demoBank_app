---
title: KYC (Know Your Customer) Verification
section: kyc
audience: chatbot-rag
tags: [kyc, identity-verification, documents, compliance]
---

# KYC Verification

Location: **KYC Verification** tab.

## Why KYC matters (policy)
Test Bank requires identity verification (Know Your Customer, KYC) to comply with
financial regulations, prevent fraud, and unlock full account limits. Customers who
have not completed KYC may have reduced transaction and Fixed Deposit limits.

## Required documents
Customers must upload all three of the following:

1. **Aadhar Card** — clear image or PDF, front and back combined.
2. **PAN Card** — clear image of the Permanent Account Number card.
3. **Driver's License** — valid state-issued license, used for secondary identity
   verification.

## Upload rules
- Accepted file types: **.jpg, .jpeg, .png, .pdf**
- Maximum file size: **5 MB** per document.
- Each document is uploaded individually via **Select Document** then **Upload &
  Verify**.

## Status flow
- **Idle** — no document uploaded yet.
- **Selected** — a file has been chosen but not yet uploaded.
- **Uploading** — upload in progress.
- **Verified** — document accepted; shown with a green "Verified" badge and can be
  viewed or deleted & re-uploaded.
- **Error** — upload failed; the customer should re-check the file type/size and
  try again.

When all three documents are verified, the customer sees: **"KYC Completed
Successfully — Thank you for verifying your identity. Your account limits have been
increased."**

## Assistant guidance
If a customer asks about raising transaction limits, increasing FD limits, or
unlocking full account features, check whether their KYC is complete and direct
them to the KYC Verification tab if it is not.
