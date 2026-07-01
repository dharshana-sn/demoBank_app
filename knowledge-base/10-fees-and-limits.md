---
title: Fees & Transaction Limits Policy
section: policy
audience: chatbot-rag
tags: [policy, fees, limits, transfers]
---

# Fees & Transaction Limits Policy

## Published limits (customer-facing policy)
These are the limits Test Bank publishes to customers for planning purposes:

| Activity | Daily Limit | Per-Transaction Limit |
| --- | --- | --- |
| Internal Transfer (own accounts) | $250,000 | $100,000 |
| Same Bank Transfer (to another customer) | $100,000 | $50,000 |
| Pay to Contact | $50,000 | $25,000 |
| Fixed Deposit booking | — | $10,000 min / $50,000,000 max |
| Credit Card payment | — | Up to full amount due |

Fully KYC-verified customers receive these full limits. Customers who have not yet
completed KYC verification have reduced limits until verification is complete (see
the KYC Verification document).

## Fees
- **Internal transfers between own accounts:** free, any priority tier (Normal,
  Express, Instant).
- **Same Bank Transfers and Pay to Contact:** free.
- **Fixed Deposit premature withdrawal:** may incur a reduced interest rate penalty
  (typically 1% below the applicable slab rate).
- **Credit Card late payment:** a late fee and interest may apply if the minimum
  amount due is not paid by the due date.
- Test Bank does not charge monthly maintenance fees on standard checking or
  savings accounts in this program.

## Important note for this demo environment
This is a demonstration banking application used for testing and automation
practice. The limits above reflect Test Bank's **published policy** for customer
communication. The live demo build itself only enforces that a transfer amount be
positive and not exceed the source account's current balance — it does not enforce
the daily/per-transaction caps above in the UI. When answering policy questions,
state the published limits; when asked whether a specific transfer will succeed
right now, rely on the customer's actual account balance rather than the policy
table.
