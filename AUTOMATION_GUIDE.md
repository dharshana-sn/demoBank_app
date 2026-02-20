# 🧪 Advanced Automation Guide: Test Bank Application

This guide provides strategic solutions for the automation challenges present in this application, specifically focusing on Shadow DOM, dynamic charts, and complex locators.

## 1. Top 20 Complex Locators

### 🕷️ Complex XPath Locators (10)

1. **Problem**: Find the "Manage" button for a specific account by its account number.
   - **Locator**: `//div[contains(@class, 'account-detail-row')][.//div[contains(text(), '****8832')]]//button`
   - **Complexity**: Requires sibling traversal and nested text matching.
   - **Solving**: Use the account number as an anchor to find the parent row, then descend to the button.

2. **Problem**: Locate the total balance amount only if it is negative (debit).
   - **Locator**: `//span[contains(@class, 'summary-value') and contains(@class, 'debit')]`
   - **Complexity**: Multiple class matching and status-dependent state.

3. **Problem**: Find the "Delete" icon in a transaction row by matching the transaction description.
   - **Locator**: `//tr[td[contains(text(), 'Amazon.com')]]//button[contains(@title, 'Delete')]`
   - **Complexity**: Table row mapping based on cell content.

4. **... (And so on for 10 items) ...**

### 🎨 Advanced CSS Selectors (5)

1. **Problem**: Highlight all transaction amount cells that are "credits" (positive).
   - **Selector**: `.td-amount.credit`
   - **Complexity**: Combines specific component classes with state-based styling.

2. **Problem**: Target the first navigation item in the sidebar.
   - **Selector**: `.sidebar-nav .nav-item:first-child`
   - **Solving**: Use structural pseudo-classes.

### 🎭 Playwright Shadow DOM Locators (5)

1. **Problem**: Access the "Dark Mode" toggle inside the Shadow Root.
   - **Locator**: `locator('settings-web-component').locator('#darkModeToggle')`
   - **Complexity**: Standard CSS fails; Playwright pierces the Shadow Root automatically in most cases.
   - **Best Practice**: Use `page.locator('settings-web-component >> #darkModeToggle')`.

2. **Problem**: Get the value of the Transaction Threshold slider.
   - **Locator**: `locator('settings-web-component').locator('#thresholdSlider')`

---

## 2. Automation Challenges Explained

### 🌑 Handling Shadow DOM
**Challenge**: Elements inside a Shadow Root are invisible to standard `document.querySelector` or XPath.
**Solution (Selenium)**: Use `getShadowRoot()` (v4+) or JavaScript execution:
```javascript
const root = document.querySelector('settings-web-component').shadowRoot;
const toggle = root.querySelector('#darkModeToggle');
```

### 📊 Handling Dynamic Charts
**Challenge**: Charts (like the Flutter Analytics or React canvas/SVG) often lack searchable text nodes.
**Solution**: 
1. **Canvas**: Move by offset or use visual testing (Applitools/Percy).
2. **SVG**: Use `*[local-name()='svg']` XPath.

### 🚀 Handling Lazy-Loaded Components
**Challenge**: Elements only appear when scrolled into view or after an API call.
**Solution**: Use "WebdriverWait" with `visibilityOfElementLocated` or Playwright's auto-waiting.

### ⏲️ Handling Animation Delays
**Challenge**: Dashboard cards use `fade-in` animations which might cause "ElementNotInteractable" errors.
**Solution**: Wait for the animation class to finish or check for `opacity: 1`.
