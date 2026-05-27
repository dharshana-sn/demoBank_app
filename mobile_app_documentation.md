# DemoBank Mobile App Documentation

This document outlines the application flow, architecture, and features of the DemoBank mobile application.

## Application Architecture and Tech Stack
- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (Native Stack & Bottom Tabs)
- **State Management:** React Context (`AuthContext`, `ThemeContext`)
- **Styling:** Custom StyleSheet with unified theme (`theme.js`)

## Application Flow

### 1. Initialization (Splash Screen)
When the app launches, `RootNavigator` checks the user's authentication status using `restoreUser` from the `AuthContext`.
- While checking, a splash screen is displayed with the DemoBank logo and an activity indicator.

### 2. Authentication Flow
- **Unauthenticated Users:** Directed to the **Login Screen**. Here, users enter their credentials to access the app.
- **Authenticated Users:** Directed to the **Dashboard**, which consists of a Bottom Tab Navigator.

### 3. Main Dashboard (Tab Navigation)
The core of the app is structured around 8 main tabs:
1. **Overview:** The home screen showing a high-level summary of the user's financial status, quick actions, and recent activity.
2. **Accounts:** Detailed view of all linked bank accounts (e.g., checking, savings), balances, and individual transaction histories.
3. **Transfers:** Interface for sending money between own accounts, to other bank customers, or external bank accounts.
4. **Analytics:** Visual insights into spending habits, income vs. expenses, and budget tracking.
5. **Credit Cards:** Management of credit cards, including viewing statements, paying bills, and managing card settings (freeze/unfreeze).
6. **Fixed Deposits:** Management of term deposits, viewing maturity dates, interest rates, and opening new fixed deposits.
7. **KYC (Know Your Customer):** Interface for identity verification, uploading required documents, and checking verification status.
8. **Settings:** User profile management, app preferences (theme, notifications), and the logout option.

### 4. Stack Screens (Overlays)
- **QR Scanner:** Accessed typically from quick actions (like in the Overview or Transfers screen), this overlay screen uses the device camera to scan QR codes for quick payments. It slides up from the bottom.

## Key Features Added

1. **Comprehensive Financial Dashboard:** A unified view of all assets, liabilities, and quick access to frequent actions.
2. **Multi-Account Management:** Support for viewing and managing multiple bank accounts in one place.
3. **Money Transfers:** Seamless intra-bank and inter-bank transfer capabilities.
4. **Spending Analytics:** Visual charts and graphs to help users understand their financial behavior.
5. **Credit Card Management:** Full lifecycle management for credit cards (viewing, paying, settings).
6. **Wealth Management (Fixed Deposits):** Easy creation and tracking of fixed deposits.
7. **In-App KYC:** Streamlined digital onboarding and identity verification process.
8. **QR Payments:** Quick and secure payments using QR code scanning.
9. **Theming:** Built-in support for themes (handled via `ThemeContext`).
10. **Secure Authentication:** Persistent login sessions and secure state management.

## Project Structure
- `App.js`: Entry point, sets up providers (SafeArea, GestureHandler, Auth, Theme) and Root Navigation.
- `src/screens/`: Contains all UI screens.
- `src/context/`: Contains React Contexts for global state (Authentication, Theming).
- `src/theme/`: Centralized design system (Colors, Fonts).
- `src/utils/` & `src/api/`: Helper functions and API integration layers.
