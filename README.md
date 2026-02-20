# 🏦 Test Bank: Advanced Automation Showcase

A feature-rich banking application designed specifically for automation engineers to practice modern testing techniques, including Refactoring, Shadow DOM traversal, and Flutter UI automation.

## 🚀 Features
- **Modern React Frontend**: Clean, responsive UI with complex state management.
- **Shadow DOM Settings**: An encapsulated settings module for practicing Shadow Root piercing.
- **Flutter Analytics Module**: A production-ready Flutter module (Source available in `/flutter_module`) showcasing dynamic data visualization.
- **Advanced Locators**: Custom data-testids and complex DOM structures for XPath/CSS mastery.

## 📂 Folder Structure
```
├── src/
│   ├── web-components/   # Vanilla JS Shadow DOM components
│   ├── components/       # React functional components
│   └── pages/            # Page-level containers
├── flutter_module/       # Redesigned Analytics module (Dart/Flutter)
├── AUTOMATION_GUIDE.md   # Top 20 Locators & Handling Challenges
└── README.md             # You are here
```

## 🧪 Testing Strategies

### Shadow DOM Inspection
1. Open DevTools.
2. Locate `<settings-web-component>`.
3. Expand `#shadow-root (open)`.
4. Note that elements inside are isolated from global CSS/JS.

### Interacting with Shadow DOM
- **JavaScript**: `element.shadowRoot.querySelector('#id')`
- **Playwright**: `page.locator('settings-web-component >> #thresholdSlider')`
- **Selenium (v4+)**: `driver.findElement(By.cssSelector("settings-web-component")).getShadowRoot()`

## 🛠️ How to Run
1. Clone the repository.
2. Run `npm install`.
3. Start the dev server: `npm run dev`.
4. Navigate to `http://localhost:5173`.
