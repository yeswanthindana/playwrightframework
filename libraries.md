# 🎭 Playwright & Allure Setup Guide

This guide provides step-by-step instructions to install logging dependencies, configure the Allure reporter/CLI, set up Java on Ubuntu, and establish Selenoid integration for distributed LAN browser testing.

---

## 📌 Table of Contents

1. [Logging Dependencies](#1-logging-dependencies)
2. [Allure Reporter & CLI](#2-allure-reporter--cli)
3. [Java Installation (Ubuntu)](#3-java-installation-ubuntu)
4. [Verify Java Installation](#4-verify-java-installation)
5. [Determine `JAVA_HOME`](#5-determine-java_home)
6. [Configure `JAVA_HOME` Permanently](#6-configure-java_home-permanently)
7. [Verify Complete Environment](#7-verify-complete-environment)
8. [Configure Playwright (`playwright.config.ts`)](#8-configure-playwright-playwrightconfigts)
9. [Clean Test Artifacts](#9-clean-test-artifacts)
10. [Run Playwright Tests](#10-run-playwright-tests)
11. [Generate Allure Reports](#11-generate-allure-reports)
12. [View Allure Reports](#12-view-allure-reports)
13. [Serve Allure Reports Directly](#13-serve-allure-reports-directly)
14. [Recommended Daily Workflow](#14-recommended-daily-workflow)
15. [Automated Java Setup Script](#15-automated-java-setup-script)
16. [Package Scripts Config (`package.json`)](#16-package-scripts-config-packagejson)
17. [Troubleshooting Guide](#17-troubleshooting-guide)
18. [Summary of Core Commands](#18-summary-of-core-commands)
19. [Additional Project Dependencies](#19-additional-project-dependencies)
20. [Selenoid Integration Guide](#20-selenoid-integration-guide)

---

## 1. Logging Dependencies

Install core logging utilities and data generation libraries inside your Playwright project:

```bash
npm install dotenv winston winston-daily-rotate-file chalk
npm install @faker-js/faker
npm install -D monocart-reporter @reportportal/agent-js-playwright
```

---

## 2. Allure Reporter & CLI

Install the Playwright Allure reporter and Allure CLI locally as development dependencies:

```bash
npm install -D allure-playwright allure-commandline
```

> [!NOTE]
> Ensure you use the correct package name: `allure-commandline`.

### Optional: Global Installation
To run Allure without prefixing commands with `npx`, install it globally:

```bash
sudo npm install -g allure-commandline
```

#### Verification:
```bash
allure --version
```
> [!TIP]
> If the global command is unavailable, use local invocation: `npx allure --version`.

---

## 3. Java Installation (Ubuntu)

Allure requires Java to generate and serve reports. 

1. Update Ubuntu packages:
   ```bash
   sudo apt update
   ```
2. Install OpenJDK 21:
   ```bash
   sudo apt install -y openjdk-21-jdk
   ```

> [!NOTE]
> The JDK includes the Java runtime (JRE). Installing a standalone JRE is normally unnecessary.

### Optional JRE-only Installation
If you prefer a headless runtime environment without compiler tools:
```bash
sudo apt install -y openjdk-21-jre-headless
```

---

## 4. Verify Java Installation

Verify the installed Java version:
```bash
java -version
```

**Expected Output:**
```text
openjdk version "21.x.x" ...
```

> [!WARNING]
> If you get `Command 'java' not found`, Java is either not installed or not present in your system `PATH`.

---

## 5. Determine `JAVA_HOME`

Find the installation path of your Java executable:
```bash
readlink -f "$(which java)"
```

**Example Output:**
```text
/usr/lib/jvm/java-21-openjdk-amd64/bin/java
```

Based on the example above, your **`JAVA_HOME`** path is:
```text
/usr/lib/jvm/java-21-openjdk-amd64
```

> [!TIP]
> You can retrieve the home directory path automatically using:
> ```bash
> dirname "$(dirname "$(readlink -f "$(which java)")")"
> ```

---

## 6. Configure `JAVA_HOME` Permanently

To ensure environmental variables persist across terminal sessions:

1. Open your bash configuration file:
   ```bash
   nano ~/.bashrc
   ```
2. Append the following export statements to the end of the file:
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
   export PATH="$JAVA_HOME/bin:$PATH"
   ```
3. Save and close Nano:
   - Press `Ctrl + O`, then `Enter` to save.
   - Press `Ctrl + X` to exit.
4. Reload the configuration:
   ```bash
   source ~/.bashrc
   ```
5. Verify the variable assignment:
   ```bash
   echo "$JAVA_HOME"
   ```

**Expected Output:**
```text
/usr/lib/jvm/java-21-openjdk-amd64
```

---

## 7. Verify Complete Environment

Run the following checks to ensure everything is set up correctly:

```bash
java -version
which java
echo "$JAVA_HOME"
allure --version       # For globally installed Allure
npx allure --version   # For locally installed Allure
```

---

## 8. Configure Playwright (`playwright.config.ts`)

Add the Allure reporter configuration within the `defineConfig` object:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: false,
      },
    ],
  ],
});
```

---

## 9. Clean Test Artifacts

Before running a new suite of tests, clear old logs and reports:

```bash
rm -rf allure-results allure-report
```

---

## 10. Run Playwright Tests

Run Playwright tests to generate raw Allure results:

```bash
npx playwright test
```

Verify that the results directory has been populated:
```bash
ls -la allure-results
```

---

## 11. Generate Allure Reports

Compile the raw data from `allure-results` into a viewable HTML report:

### Using Global CLI:
```bash
allure generate allure-results --clean -o allure-report
```

### Using Project-Local CLI:
```bash
npx allure generate allure-results --clean -o allure-report
```

---

## 12. View Allure Reports

Open the generated HTML report in a browser:

### Using Global CLI:
```bash
allure open allure-report
```

### Using Project-Local CLI:
```bash
npx allure open allure-report
```

---

## 13. Serve Allure Reports Directly

Generate the report and start a local web server to display it automatically:

```bash
allure serve allure-results
# Or project-local:
npx allure serve allure-results
```

---

## 14. Recommended Daily Workflow

For daily test execution and reporting, run this sequence:

```bash
# 1. Clean previous results
rm -rf allure-results allure-report

# 2. Execute tests
npx playwright test

# 3. Compile report
npx allure generate allure-results --clean -o allure-report

# 4. Open report
npx allure open allure-report
```

---

## 15. Automated Java Setup Script

To install OpenJDK 21 and configure variables with a single command run:

```bash
sudo apt update && \
sudo apt install -y openjdk-21-jdk && \
JAVA_HOME_PATH="$(dirname "$(dirname "$(readlink -f "$(which java)")")")" && \
echo "export JAVA_HOME=$JAVA_HOME_PATH" >> ~/.bashrc && \
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.bashrc
```

**Reload the shell to apply changes:**
```bash
source ~/.bashrc
```

---

## 16. Package Scripts Config (`package.json`)

Simplify reporting workflows by adding commands under the `scripts` block in `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:allure": "rm -rf allure-results allure-report && playwright test",
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report",
    "allure:serve": "allure serve allure-results",
    "report:allure": "npm run allure:generate && npm run allure:open"
  }
}
```

### Usage:
```bash
# Run tests and clear old results
npm run test:allure

# Generate and open report
npm run report:allure
```

---

## 17. Troubleshooting Guide

| Issue | Resolution |
| :--- | :--- |
| **`JAVA_HOME is not set`** | Verify Java paths using `java -version`, `which java`, and `echo "$JAVA_HOME"`. Set temporarily via: <br> `export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(which java)")")")"` <br> `export PATH="$JAVA_HOME/bin:$PATH"` |
| **`allure: command not found`** | Invoke locally via `npx allure --version` or install globally using `sudo npm install -g allure-commandline`. |
| **`allure-results` directory not found** | Run playwright tests first to create the directory: `npx playwright test`. Check directories via `ls -la allure-results`. |
| **Stale test data in reports** | Ensure you purge past reports before running tests: `rm -rf allure-results allure-report`. |

---

## 18. Summary of Core Commands

### Installation & Update
```bash
npm install dotenv winston winston-daily-rotate-file chalk
npm install -D allure-playwright allure-commandline
sudo apt update && sudo apt install -y openjdk-21-jdk
```

### Report Generation Lifecycle
```bash
rm -rf allure-results allure-report
npx playwright test
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## 19. Additional Project Dependencies

Ensure all runtime and dev dependencies are installed to maintain framework compatibility:

### A. Database and Data Mocking (Runtime)
```bash
npm install pg @faker-js/faker
npm install exceljs
```

### B. Development, Type Declarations, and Linting (DevDependencies)
```bash
npm install -D @types/pg @types/dotenv @types/node allure-js-commons typescript cross-env eslint prettier
```

---

## 20. Selenoid Integration Guide

Set up and run tests inside containerized browsers over a Local Area Network (LAN).

### 🛠️ Step 1: Code Integration

#### A. Configure Environment variables (`src/config/environment.ts`)
Add `connectWsEndpoint` to the exported config object:

```typescript
export const config = {
  baseURL: process.env.BASE_URL!,
  membername: process.env.TEST_USERNAME!,
  password: process.env.TEST_PASSWORD!,

  // Database configurations
  dbHost: process.env.DB_HOST!,
  dbPort: process.env.DB_PORT!,
  dbPassword: process.env.DB_PASSWORD!,
  dbMembername: process.env.DB_USER!,
  dbName: process.env.DB_NAME!,

  // Member configurations
  createdBy: Number(process.env.CREATED_BY || 50),

  // Remote WebSocket Browser Connection
  connectWsEndpoint: process.env.CONNECT_WS_ENDPOINT || undefined,
};
```

#### B. Update Playwright Configuration (`playwright.config.ts`)

1. **Import the environment configuration** at the top of the file:
   ```typescript
   import { defineConfig } from '@playwright/test';
   import dotenv from 'dotenv';
   import path from 'path';
   import { config } from './src/config/environment';
   ```

2. **Update the `use` block** to integrate the remote browser:
   ```typescript
   use: {
     baseURL,

     headless: config.connectWsEndpoint ? undefined : headless,

     connectOptions: config.connectWsEndpoint ? {
       wsEndpoint: config.connectWsEndpoint,
     } : undefined,

     // ... (rest of your use configuration)
   }
   ```

#### C. Update Environment Files (`.env`, `qa.env`, `dev.env`, `deskmeet.env`)
Add this variable at the end of each file. Leave it blank by default to use a local browser:

```env
CONNECT_WS_ENDPOINT=
```

---

### 🚀 Step 2: Shared Server Setup (On the dedicated LAN machine)

On the host machine (e.g., IP: `192.168.1.100`), perform the following configuration steps:

1. **Download Selenoid Configuration Manager:**
   ```bash
   curl -s https://aerokube.com/selenoid/install.sh | bash
   ```
2. **Start Selenoid with VNC-enabled Browsers:**
   *(This downloads Chromium images with video/VNC capabilities and hosts the server on port 4444)*
   ```bash
   ./cm selenoid start --vnc
   ```
3. **Launch the Selenoid Dashboard:**
   *(This starts the visual dashboard on port 8080)*
   ```bash
   ./cm selenoid-ui start
   ```

---

### ⚡ Step 3: Run & Watch Tests

1. Configure your local environment file (`.env` or target env file) to point to the shared host:
   ```env
   CONNECT_WS_ENDPOINT=ws://192.168.1.100:4444/playwright/chromium?enableVNC=true
   ```
2. Run your Playwright tests:
   ```bash
   npx playwright test tests/regression/facilities.spec.ts
   ```
3. Access the dashboard from your browser:
   [http://192.168.1.100:8080](http://192.168.1.100:8080)
   
   > [!TIP]
   > You can monitor concurrent execution streams in real-time. Click on any active session to view the interactive remote VNC window.