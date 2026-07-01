---
title: Credit Cards
section: credit-cards
audience: chatbot-rag
tags: [credit-card, credit-limit, statement, block-card]
---

# Credit Cards

Location: **Credit Cards** tab.

## Card overview
Customers see their card rendered visually with card number, holder name, and
expiry, plus three key figures:
- **Amount Due** — current outstanding balance owed.
- **Total Credit Limit** — the customer's approved credit line.
- **Available Limit** — remaining credit available to spend.

## Making a payment ("Quick Pay")
1. Choose **Pay From Account** (a checking or savings account).
2. Enter an **Amount to Pay**, or use the shortcuts:
   - **Pay Full** — pays the entire amount due.
   - **Pay Min (10%)** — pays 10% of the amount due.
3. Click **Make Payment**.

Payments are blocked if: there is no pending amount due, the entered amount is
invalid, the card is blocked, or the source account has insufficient funds. Payments
post instantly and the available limit updates immediately.

## Card settings
- **Manage Credit Limit** — request a new credit limit (submitted as an update to
  the account's limit).
- **View Card Statement** — lists all transactions posted to the credit card,
  most recent first.
- **Record New Purchase** — manually log a purchase against the card (description,
  category, amount); categories include Shopping, Dining, Transport, Entertainment,
  Groceries, Bills, Other.

## Applying for a new card
If a customer has no credit card yet, they can click **Apply Now** and choose from:

| Card | Credit Limit | Highlights |
| --- | --- | --- |
| Platinum Credit Card | $70,000 | Premium rewards & travel perks |
| Gold Rewards Card | $30,000 | Great for everyday spending |
| Global Traveler Card | $50,000 | Zero forex fees worldwide |

Approval in the demo environment is instant for eligible customers.

## Card benefits & perks (all cards)
- **5x Reward Points** on dining, per dollar spent.
- **Zero Liability** — no responsibility for unauthorized charges.
- **Contactless Pay** — tap-to-pay supported worldwide.
- **Instant Alerts** — real-time notification on every transaction.

## Blocking a lost or stolen card
Customers (or the AI Assistant, via the `block_credit_card` tool) can block a card
immediately if it is lost, stolen, or compromised. A blocked card cannot be used for
new payments or purchases until it is unblocked from the card management section.
