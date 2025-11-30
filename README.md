# 📘 Playwright Test Automation Framework

A complete end-to-end **Playwright automation starter framework** built
using **Node.js & TypeScript**, supporting cross-browser execution,
parallel testing, debugging, HTML reporting, and modern automation
capabilities.

------------------------------------------------------------------------

## 🚀 Features

-   Cross-browser testing (Chromium, Firefox, WebKit)
-   Headless and headed execution
-   Parallel test execution
-   Playwright UI mode for debugging
-   HTML reports
-   Async/await based fast execution
-   Isolated browser contexts
-   CI/CD ready structure

------------------------------------------------------------------------

## 📦 Prerequisites

Before installing Playwright, install:

### 1️⃣ Node.js

https://nodejs.org

### 2️⃣ Visual Studio Code

https://code.visualstudio.com

### 3️⃣ Project Folder

Open your project folder in VS Code.

------------------------------------------------------------------------

## 🔧 Installing Playwright

Run the below command in your project:

``` sh
npm init playwright@latest
```

This creates:

  File / Folder            Description
  ------------------------ --------------------------
  `package.json`           Project dependencies
  `playwright.config.ts`   Playwright configuration
  `tests/`                 Test files folder

Check version:

``` sh
npx playwright --version
```

------------------------------------------------------------------------

## 📁 Project Structure

    ├── tests/
    │   └── FirstTest.spec.ts
    ├── playwright.config.ts
    ├── package.json
    └── README.md

------------------------------------------------------------------------

## ✍️ Writing Your First Test

Create file: **tests/FirstTest.spec.ts**

``` ts
const { test, expect } = require('@playwright/test');

test('Verify page title', async ({ page }) => {
  await page.goto('https://example.com');
  const title = await page.title();
  expect(title).toBe('Example Domain');
});
```

------------------------------------------------------------------------

## ⏳ Understanding async / await

Playwright APIs return **Promises**, so you must use:

  Keyword   Description
  --------- -------------------------------------------
  `async`   Declares an asynchronous function
  `await`   Pauses execution until a Promise resolves

Example:

``` ts
await page.goto('https://example.com');
```

------------------------------------------------------------------------

## 🧪 Running Tests & Debugging Commands

  --------------------------------------------------------------------------------------------------------------
  Command                                                            Description
  ------------------------------------------------------------------ -------------------------------------------
  `npx playwright test`                                              Run all tests (headless)

  `npx playwright test --headed`                                     Run all tests in headed mode

  `npx playwright show-report`                                       Open HTML test report

  `npx playwright test mytest.spec.ts`                               Run a specific test

  `npx playwright test --project=chromium --headed mytest.spec.ts`   Run on Chromium headed

  `npx playwright test mytest1.spec.ts mytest2.spec.ts`              Run multiple tests

  `npx playwright test -g "test title"`                              Run tests matching title

  `npx playwright test --project=chromium`                           Run Chromium only

  `npx playwright test --debug`                                      Debug mode

  `npx playwright test example.spec.ts --debug`                      Debug a single test

  `npx playwright test mytest.spec.ts --ui`                          Run in UI mode
  --------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 🏗️ Playwright Architecture (Overview)

### 1️⃣ Client / Language Bindings

Supports JavaScript/TypeScript, Java, Python, .NET.

### 2️⃣ WebSocket Communication

-   Faster than HTTP\
-   Connection stays open\
-   Enables extremely fast automation

### 3️⃣ Browser Contexts

Each context has its own: - Cookies\
- Storage\
- Session data

Allows: - Parallel execution\
- Isolated test sessions

### 4️⃣ Performance Advantage

-   Single persistent WebSocket\
-   Multi-browser engine\
-   Modern architecture

### 5️⃣ Ideal Use Cases

Suitable for: - Trading apps\
- Gaming apps\
- Slack / GitHub type platforms

------------------------------------------------------------------------

## 📊 Reports

Open test report:

``` sh
npx playwright show-report
```

------------------------------------------------------------------------

## 🤝 Contributing

Contributions are welcome.

------------------------------------------------------------------------

## 📄 License

MIT License.
