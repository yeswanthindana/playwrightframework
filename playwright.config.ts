// 1. Imports the 'defineConfig' function from Playwright to help define our test settings with built-in validation and auto-complete.
import { defineConfig } from '@playwright/test';

// 2. Imports the 'dotenv' library, which reads settings from custom environment configuration files (like .env files) and loads them into memory.
import dotenv from 'dotenv';

// 3. Imports the 'path' module, a built-in helper in Node.js to safely locate, merge, and handle file paths regardless of the operating system.
import path from 'path';

/**
 * Select environment file.
 *
 * Examples of environment settings:
 * TEST_ENV=qa
 * TEST_ENV=dev
 * TEST_ENV=demo
 */
// 5. Checks if there is a specific test environment requested (e.g. 'qa', 'dev'). If none is specified, default to 'qa'.
const envName = process.env.TEST_ENV || 'qa';

// 6. Constructs the exact facility on the hard drive for the environment configuration file (e.g. "config/environments/qa.env").
const envFilePath = path.resolve(process.cwd(), 'config', 'environments', `${envName}.env`);

// 7. Reads and loads all variables (like database passwords, website links) from the selected environment file into our running program.
const envResult = dotenv.config({
    path: envFilePath,
});

// 8. If loading the environment file fails (e.g., the file is missing), stop execution immediately and print the error details.
if (envResult.error) {
    console.warn(
        `Warning: Unable to load environment file: ${envFilePath}\n${envResult.error.message}`,
    );
}

// 9. Retrieves the base URL (website link) from the loaded environment variables and trims any accidental blank spaces from the ends.
const baseURL = process.env.BASE_URL?.trim() || 'https://octoqa.aetherscale.io/';

// 10. If the base URL is missing, stop the execution because tests cannot run without knowing which website to visit.
if (!baseURL) {
    throw new Error(`BASE_URL is missing in environment file: ${envFilePath}`);
}

// 11. Checks if the code is running on a remote automated build system/pipeline (Continuous Integration / CI, like GitHub Actions).
const isCI = Boolean(process.env.CI);

// 12. Decides if browsers should run invisibly. On CI pipelines, we run headless (true). Locally, we check if HEADLESS is set to 'true'.
const headless = isCI ? true : process.env.HEADLESS?.toLowerCase() === 'true';

// 13. Reads how many milliseconds we want to pause between actions (like clicking or typing) to slow down the tests for visual debugging. Defaults to 0 (no delay).
const slowMo = Number(process.env.SLOW_MO || 0);

// 14. Confirms that the slowdown delay is a valid number and is not negative. If invalid, stop execution and throw an error.
if (Number.isNaN(slowMo) || slowMo < 0) {
    throw new Error(`SLOW_MO must be a valid positive number. Received: ${process.env.SLOW_MO}`);
}

// 15. Defines where to save/retrieve member login details (cookies/tokens) to avoid logging in again for every single test. Defaults to 'playwright/.auth/member.json'.
const storageStatePath = process.env.STORAGE_STATE?.trim() || 'playwright/.auth/member.json';

// 16. Exports the official Playwright configuration object detailing how tests should execute.
export default defineConfig({
    // 17. Specifies the folder path where all our automation test files are stored.
    testDir: './tests',

    // 18. Defines the file naming pattern to identify which files are tests (any file ending in '.spec.ts').
    testMatch: '**/*.spec.ts',

    // 19. Disables running tests in parallel within the same file to prevent tests from interfering with one another's data.
    fullyParallel: true,

    // 20. Gives each individual test file a maximum of 2 minutes (120,000 milliseconds) to complete before timing out and failing.
    timeout: 2 * 60 * 1000,

    // 21. Configures assertion checks (e.g., checking if a text is visible) to wait up to 15 seconds before giving up and failing.
    expect: {
        timeout: 15 * 1000,
    },

    // 22. If running on CI, it fails the build if a test is marked with 'test.only'. This prevents developers from accidentally skipping other tests in production.
    forbidOnly: isCI,

    // 23. If on CI, retry a failed test up to 2 times to check if it was a temporary network glitch. Locally, do not retry (0).
    retries: isCI ? 2 : 0,

    // 24. Limits the number of browsers running tests at the same time. On CI, run 1 at a time to save CPU/Memory. Locally, use system defaults.
    workers: isCI ? 1 : undefined,

    // 25. Specifies the folder where Playwright stores screenshots, videos, and trace files from our tests.
    outputDir: 'test-results',

    // 26. Configures which reporters format and output our test execution results.
    reporter: [
        // 27. Prints a simple running list of test names and status (passed/failed) directly in the command terminal.
        ['list'],

        // 28. Creates a visual HTML dashboard report.
        [
            'html',
            {
                outputFolder: 'playwright-report', // Saves the HTML report in this folder.
                open: 'never', // Prevents the browser from opening the report automatically when finished.
            },
        ],

        // 29. Integrates the Allure reporting framework to generate detailed test results.
        [
            'allure-playwright',
            {
                resultsDir: 'allure-results', // Directory where raw Allure test files are written.
                detail: true, // Includes detailed steps and attachments inside the report.
                suiteTitle: true, // Includes the suite titles inside the report structure.
            },
        ],

        // 30. Updates test results directly back into the facility test cases Excel sheet.
        ['./src/reporting/excel/ExcelReporter.ts'],

        // Synchronizes annotated test results to Jira when JIRA_ENABLED=true.
        // The reporter remains loaded but performs no network calls by default.
        ['./src/reporting/jira/JiraReporter.ts'],

        // 31. Integrates Monocart reporter for self-contained, interactive HTML reports.
        [
            'monocart-reporter',
            {
                name: 'SentinelX Automation Test Report',
                outputFile: './test-results/monocart-report/index.html',
            },
        ],
    ],

    // 30. Specifies global settings for browser instances created during tests.
    use: {
        // 31. The main website URL we are testing, so tests can use relative links (like page.goto('/login')) instead of typing the whole URL.
        baseURL,

        // 32. Runs tests in a visible browser window (false) so you can watch them execute, or invisibly (true) if needed.
        headless,

        /**
         * Disable Playwright's fixed viewport.
         * Browser size will depend on the actual machine window.
         */
        // 33. Sets the size of the simulated browser screen to a standard full HD display (1920 pixels wide by 1080 pixels high).
        viewport: null, // { width: 1920, height: 1080 },

        // 34. Ignores security certificate alerts, allowing tests to run smoothly on dev/staging servers with untrusted certificates.
        ignoreHTTPSErrors: true,

        // 35. Specifies the maximum time (30 seconds) allowed for a single browser interaction (like clicking a button) to complete.
        actionTimeout: 30 * 1000,

        // 36. Specifies the maximum time (60 seconds / 1 minute) allowed for a page to load completely before failing.
        navigationTimeout: 60 * 1000,

        // 37. Takes a screenshot for every single test run to visually capture the final state of the page.
        screenshot: 'on',

        // 38. Records a video file for every single test execution so you can review member actions step-by-step.
        video: 'on',

        // 39. Captures a full diagnostic trace (actions, network requests, console logs) for every test to help developers debug failures.
        trace: 'on',

        // 40. Configures the browser language locale to English (India) formatting.
        locale: 'en-IN',

        // 41. Sets the browser timezone to India Standard Time (IST - Asia/Kolkata) to keep time calculations consistent.
        timezoneId: 'Asia/Kolkata',

        // 42. Configures low-level settings for launching browser processes.
        launchOptions: {
            // 43. Passes the slowMo value (delay between actions) calculated earlier to the browser.
            slowMo,

            // 44. Command-line flags/arguments passed directly to the browser executable on startup.
            args: [
                '--start-maximized', // Opens the browser maximized to fill the screen.
                '--disable-dev-shm-usage', // Prevents memory issues on Linux containers/CI by using disk storage for shared memory.
                '--disable-notifications', // Blocks annoying website popups asking to "Show notifications".
                '--disable-popup-blocking', // Allows tests to open new tabs or windows without the browser blocking them.
                '--disable-infobars', // Hides Chrome's "Chrome is being controlled by automated test software" notification bar.
                '--no-sandbox', // Bypasses the OS sandbox security layer (required to run inside Docker/Linux servers).
            ],
        },
    },

    /**
     * Browser projects configures the execution environment.
     */
    // 45. Defines the list of browser setups (projects) to run tests against.
    projects: [
        {
            // API tests authenticate through API headers/fixtures and must not load
            // cookies or browser sessionStorage created by the UI login flow.
            name: 'API',
            testDir: './tests/api',
            use: {
                storageState: undefined,
            },
        },
        {
            // 46. A special setup project dedicated to logging in first and saving the session before actual tests run.
            name: 'setup',
            // 47. Looks specifically for files named "auth.setup.ts" to run this setup.
            testMatch: /.*auth\.setup\.ts/,
            use: {
                storageState: undefined, // Setup doesn't load login details because it is the one generating them.
            },
        },
        {
            // 48. The primary browser project to run all member tests on Chromium (Google Chrome engine).
            name: 'Chromium',
            // API specs run only in the API project above, avoiding duplicate execution.
            testIgnore: '**/api/**/*.spec.ts',
            use: {
                browserName: 'chromium', // Uses the Chromium/Chrome browser.
                storageState: storageStatePath, // Loads the saved login session generated by the setup project.
            },
            dependencies: ['setup'], // Guarantees that the 'setup' project completes successfully before this starts.
        },
        // {
        //   name: 'Firefox',
        //   use: {
        //     browserName: 'firefox',
        //     storageState: storageStatePath
        //   },
        //   dependencies: ['setup']
        // },

        // {
        //   name: 'Edge',
        //   use: {
        //     browserName: 'chromium',
        //     channel: 'msedge',
        //     storageState: storageStatePath
        //   },
        //   dependencies: ['setup']
        // }
    ],

    /**
     * Hooks to run code once before all tests start (globalSetup) or after all tests finish (globalTeardown).
     * Currently disabled.
     */

    // globalSetup: require.resolve('./src/hooks/globalSetup'),

    // globalTeardown: require.resolve('./src/hooks/globalTeardown')
});
