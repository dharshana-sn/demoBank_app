# Detailed DemoBank External API Documentation

This documentation provides in-depth instructions on how to use the custom external API endpoints for retrieving users, accounts, balances, credit cards, fixed deposits, and transactions. This API is completely separate from the banking UI and is intended for third-party integrations.

**Base URL (Local):** `http://localhost:5001/external/api`  
**Base URL (Production):** `https://demobank-app-backend.onrender.com/external/api`  
**Content-Type:** `application/json` (all requests and responses)

---

## Authentication Overview

This API uses a **JWT-based authentication** system:

1. Register your client once to receive a long-lived **Bearer Token** (valid 1 year)
2. Use this Bearer Token in the `Authorization` header of every data request

---

## Step 1 — Register Your Client & Get Token

Registers a third-party client and issues a long-lived JWT token. Call this **once only**.

- **Endpoint:** `POST /auth/register`
- **Method:** `POST`
- **Authentication Required:** None
- **Data Required (Body):**
  - `clientName` (String, required): Name of your application.
  - `email` (String, required): Contact email for the client.
- **Handling the Response:**
  - **Success (201 Created):** Registration successful. Returns your `token` — store it securely.
  - **Bad Request (400):** `clientName` or `email` missing from body.
  - **Error (500):** Server error ( `{"error": "error message"}` ).

**Example Request:**

```http
POST http://localhost:5001/external/api/auth/register
Content-Type: application/json

{
  "clientName": "MyFinanceApp",
  "email": "dev@myfinanceapp.com"
}
```

**Example Response (201 Created):**

```json
{
  "message": "Registration successful. This token is valid for 1 year.",
  "clientName": "MyFinanceApp",
  "email": "dev@myfinanceapp.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnROYW1lIjoiTXlGaW5hbmNlQXBwIiwiZW1haWwiOiJkZXZAbXlmaW5hbmNlYXBwLmNvbSIsImlhdCI6MTcyMDYwMDAwMCwiZXhwIjoxNzUxOTc2MDAwfQ.SIGNATURE",
  "usage": "Add header: Authorization: Bearer <token>"
}
```

**Using the token in subsequent requests:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Health Check

Verify the external API is running. No authentication required.

- **Endpoint:** `GET /health`
- **Method:** `GET`
- **Authentication Required:** None

**Example Request:**

```http
GET http://localhost:5001/external/api/health
```

**Example Response (200 OK):**

```json
{
  "status": "ok",
  "api": "external"
}
```

---

## 1. List All Users

Retrieves a complete list of all users registered in the banking system. This is primarily useful for finding a specific `userId` to use in subsequent requests. Passwords are **never** returned.

- **Endpoint:** `GET /users`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required:** None.
- **Handling the Response:**
  - **Success (200 OK):** Returns a `count` and a `users` array. Extract the `id` field from the user you want to query.
  - **Unauthorized (401):** Missing or invalid token.
  - **Forbidden (403):** Token expired — call `POST /auth/token` again.
  - **Error (500):** Server error ( `{"error": "error message"}` ).

**Example Request:**

```http
GET http://localhost:5001/external/api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "count": 8,
  "users": [
    {
      "id": "user-1",
      "name": "Test User",
      "email": "testUser@gmail.com",
      "phone": "+1 (555) 012-3456",
      "address": "123 Oak Street, New York, NY 10001",
      "avatar": "TU",
      "memberSince": "2022",
      "preferences": {
        "currency": "USD",
        "branch": "New York"
      }
    },
    {
      "id": "user-2",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1 (555) 987-6543",
      "address": "456 Pine Avenue, Los Angeles, CA 90001",
      "avatar": "JD",
      "memberSince": "2023"
    },
    {
      "id": "usr-1",
      "name": "Alice Johnson",
      "email": "alice.johnson@email.com",
      "avatar": "A",
      "memberSince": "2022"
    }
  ]
}
```

---

## 2. Get Single User Profile

Retrieves the complete profile of a specific user by their `id`.

- **Endpoint:** `GET /users/{id}`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-1`).
- **Handling the Response:**
  - **Success (200 OK):** Returns the full user profile object.
  - **Not Found (404):** `{"error": "User not found."}` if the `id` doesn't match any user.
  - **Unauthorized (401):** Missing or invalid token.
  - **Forbidden (403):** Token expired.
  - **Error (500):** Server error.

**Example Request:**

```http
GET http://localhost:5001/external/api/users/user-1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "id": "user-1",
  "name": "Test User",
  "email": "testUser@gmail.com",
  "phone": "+1 (555) 012-3456",
  "address": "123 Oak Street, New York, NY 10001",
  "avatar": "TU",
  "memberSince": "2022",
  "preferences": {
    "currency": "USD",
    "branch": "New York",
    "notifications": ["email", "sms"]
  }
}
```

**Example Response (404 Not Found):**

```json
{
  "error": "User not found."
}
```

---

## 3. Get User Financial Summary

Aggregates and returns a comprehensive financial overview for a specific user, including their profile, all active accounts (with parsed credit card limits), a count of active fixed deposits, and a `financials` object containing aggregated balances and cash flow.

- **Endpoint:** `GET /users/{id}/summary`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-1`).
- **Handling the Response:**
  - **Success (200 OK):** Returns a JSON object containing `user`, `accounts` (array), `activeFixedDeposits` (integer), and `financials` (object). The `financials` object provides separate totals for `savings`, `checking`, `investment`, `creditDue`, `totalAssets`, `totalLiabilities`, `netWorth`, `income`, and `expenditure`.
  - **Not Found (404):** `{"error": "User not found."}` if the `id` doesn't match any user.
  - **Error (500):** Server error.

**Example Request:**

```http
GET http://localhost:5001/external/api/users/user-1/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "user": {
    "id": "user-1",
    "name": "Test User",
    "email": "testUser@gmail.com",
    "avatar": "TU",
    "memberSince": "2022"
  },
  "accounts": [
    {
      "id": "acc-1",
      "name": "Checking Account",
      "number": "4521678901",
      "balance": 62450.75,
      "type": "checking",
      "status": "active"
    },
    {
      "id": "acc-2",
      "name": "Savings Account",
      "number": "8832456701",
      "balance": 56789.00,
      "type": "savings",
      "status": "active"
    },
    {
      "id": "acc-5",
      "name": "Platinum Credit Card",
      "number": "5678901234",
      "balance": -8890.00,
      "limit": 70000,
      "dueAmount": 8890.00,
      "availableAmount": 61110.00,
      "type": "credit",
      "status": "active"
    }
  ],
  "activeFixedDeposits": 4,
  "financials": {
    "balances": {
      "savings": 56789.00,
      "checking": 62450.75,
      "investment": 98100.20,
      "creditDue": 8890.00,
      "totalAssets": 217339.95,
      "totalLiabilities": 8890.00,
      "netWorth": 208449.95
    },
    "cashFlow": {
      "income": 45320.00,
      "expenditure": 28100.00,
      "net": 17220.00
    }
  }
}
```

---

## 4. Get Bank Accounts

Retrieves all bank accounts (savings, checking, investment) for a specific user. Credit cards are excluded from this endpoint — use endpoint 5 for credit cards.

- **Endpoint:** `GET /users/{id}/accounts`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-1`).
- **Handling the Response:**
  - **Success (200 OK):** Returns a `count` and an `accounts` array. Each account contains `id`, `name`, `number`, `balance`, `type`, and `status`.
  - **Not Found (404):** `{"error": "User not found."}`.
  - **Error (500):** Server error.

**Example Request:**

```http
GET http://localhost:5001/external/api/users/user-1/accounts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "count": 3,
  "accounts": [
    {
      "id": "acc-1",
      "name": "Checking Account",
      "number": "4521678901",
      "balance": 62450.75,
      "type": "checking",
      "color": "#1E40AF",
      "status": "active",
      "userId": "user-1"
    },
    {
      "id": "acc-2",
      "name": "Savings Account",
      "number": "8832456701",
      "balance": 56789.00,
      "type": "savings",
      "color": "#1D4ED8",
      "status": "active",
      "userId": "user-1"
    },
    {
      "id": "acc-4",
      "name": "Investments (FD)",
      "number": "6650234501",
      "balance": 98100.20,
      "type": "investment",
      "color": "#3B82F6",
      "status": "active",
      "userId": "user-1"
    }
  ]
}
```

---

## 5. Get Credit Card Details

Retrieves all credit cards for a specific user. Each card includes the computed `dueAmount` (total money owed) and `availableAmount` (remaining credit limit).

- **Endpoint:** `GET /users/{id}/credit-cards`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-2`).
- **Handling the Response:**
  - **Success (200 OK):** Returns a `count` and a `creditCards` array. Each card contains `id`, `name`, `number`, `balance` (negative value = amount owed), `limit`, `dueAmount`, `availableAmount`, and `status`.
  - **Not Found (404):** `{"error": "User not found."}`.
  - **Error (500):** Server error.

**Example Request:**

```http
GET http://localhost:5001/external/api/users/user-2/credit-cards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "count": 1,
  "creditCards": [
    {
      "id": "acc-cc-user2",
      "name": "Gold Credit Card",
      "number": "4111111100002222",
      "balance": -30000,
      "limit": 50000,
      "dueAmount": 30000,
      "availableAmount": 20000,
      "type": "credit",
      "color": "#7C3AED",
      "status": "active",
      "userId": "user-2"
    }
  ]
}
```

---

## 6. Get Fixed Deposits

Retrieves all fixed deposit records for a specific user, sorted by creation date (newest first).

- **Endpoint:** `GET /users/{id}/fixed-deposits`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-1`).
- **Handling the Response:**
  - **Success (200 OK):** Returns a `count` and a `fixedDeposits` array. Each record contains `id`, `principal`, `rate` (annual % interest), `tenure`, `startDate`, `maturityDate`, `maturityAmount`, and `status`.
  - **Not Found (404):** `{"error": "User not found."}`.
  - **Error (500):** Server error.

**Example Request:**

```http
GET http://localhost:5001/external/api/users/user-1/fixed-deposits
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "count": 4,
  "fixedDeposits": [
    {
      "id": "fd-1",
      "userId": "user-1",
      "principal": 50000,
      "rate": 6.5,
      "tenure": "1 Year",
      "startDate": "2025-06-15",
      "maturityDate": "2026-06-15",
      "maturityAmount": 53250,
      "status": "active"
    },
    {
      "id": "fd-2",
      "userId": "user-1",
      "principal": 150000,
      "rate": 7.5,
      "tenure": "3 Years",
      "startDate": "2024-02-10",
      "maturityDate": "2027-02-10",
      "maturityAmount": 183750,
      "status": "active"
    },
    {
      "id": "fd-3",
      "userId": "user-1",
      "principal": 300000,
      "rate": 7.1,
      "tenure": "5 Years",
      "startDate": "2023-08-01",
      "maturityDate": "2028-08-01",
      "maturityAmount": 406500,
      "status": "active"
    },
    {
      "id": "fd-4",
      "userId": "user-1",
      "principal": 75000,
      "rate": 6.8,
      "tenure": "2 Years",
      "startDate": "2025-01-10",
      "maturityDate": "2027-01-10",
      "maturityAmount": 87855,
      "status": "active"
    }
  ]
}
```

---

## 7. Get Transaction History

Retrieves the paginated transaction history for a specific user. Supports filtering by transaction type and category.

- **Endpoint:** `GET /users/{id}/transactions`
- **Method:** `GET`
- **Authentication Required:** `Authorization: Bearer <token>`
- **Data Required (Path Parameter):**
  - `id` (String): The `userId` (e.g., `user-1`).
- **Data Required (Query Parameters — all optional):**
  - `page` (Number, default `1`): Page number for pagination.
  - `limit` (Number, default `50`): Number of results per page.
  - `type` (String): Filter by transaction type — `credit` or `debit`.
  - `category` (String): Filter by category — `Salary`, `Shopping`, `Bills`, `Dining`, `Transfers`, `Deposits`, `Withdrawals`, `Investments`.
- **Handling the Response:**
  - **Success (200 OK):** Returns `total` (total matching records across all pages), `page`, `limit`, and a `transactions` array. Each transaction contains `id`, `date`, `description`, `category`, `amount` (positive = credit, negative = debit), `type`, and `status`.
  - **Not Found (404):** `{"error": "User not found."}`.
  - **Error (500):** Server error ( `{"error": "error message"}` ).

**Example Request (all transactions, page 1):**

```http
GET http://localhost:5001/external/api/users/user-1/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Request (filtered — Salary credits only):**

```http
GET http://localhost:5001/external/api/users/user-1/transactions?type=credit&category=Salary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Request (paginated — page 2, 10 per page):**

```http
GET http://localhost:5001/external/api/users/user-1/transactions?page=2&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Response (200 OK):**

```json
{
  "total": 105,
  "page": 1,
  "limit": 50,
  "transactions": [
    {
      "id": "txn-008",
      "date": "2026-02-10",
      "description": "Salary Payment #8",
      "category": "Salary",
      "amount": 1527.55,
      "type": "credit",
      "status": "Completed"
    },
    {
      "id": "txn-006",
      "date": "2026-02-25",
      "description": "Dining Payment #6",
      "category": "Dining",
      "amount": -1887.85,
      "type": "debit",
      "status": "Completed"
    },
    {
      "id": "txn-001",
      "date": "2026-01-19",
      "description": "Transfers Payment #1",
      "category": "Transfers",
      "amount": -661.08,
      "type": "debit",
      "status": "Completed"
    }
  ]
}
```

---

## Error Reference

All error responses follow this shape:

```json
{
  "error": "Human-readable error message."
}
```

| Code | Meaning | When it occurs |
|------|---------|----------------|
| `400` | Bad Request | Required fields are missing from the request body |
| `401` | Unauthorized | `Authorization` header is missing or token is invalid |
| `403` | Forbidden | Bearer token has expired or is invalid |
| `404` | Not Found | The `userId` or resource does not exist |
| `500` | Internal Server Error | A database or server-side error occurred |

---

## All Endpoints at a Glance

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| — | GET | `/health` | ❌ | Server health check |
| — | POST | `/auth/register` | ❌ | Register client, get Bearer token (1 year) |
| 1 | GET | `/users` | ✅ Bearer | List all users |
| 2 | GET | `/users/:id` | ✅ Bearer | Single user profile |
| 3 | GET | `/users/:id/summary` | ✅ Bearer | Full financial summary (accounts + net worth + cash flow) |
| 4 | GET | `/users/:id/accounts` | ✅ Bearer | Savings / checking / investment accounts |
| 5 | GET | `/users/:id/credit-cards` | ✅ Bearer | Credit cards with due amount and available credit |
| 6 | GET | `/users/:id/fixed-deposits` | ✅ Bearer | Fixed deposit records |
| 7 | GET | `/users/:id/transactions` | ✅ Bearer | Paginated transaction history with filters |
