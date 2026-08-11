import { ConsoleMessage, expect, Request, Response, test as base } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DbRepositories } from '@src/database/DbRepositories';
import { Logger } from '@src/reporting/logging/Logger';

export const sessionStoragePath = path.resolve(
    process.cwd(),
    'playwright/.auth/session-storage.json',
);

export interface SavedSessionStorage {
    origin: string;
    entries: Record<string, string>;
}

interface BrowserDiagnostic {
    type: 'console-error' | 'page-error';
    message: string;
    location?: string;
}

interface NetworkDiagnostic {
    type: 'request-failed' | 'http-error';
    method: string;
    url: string;
    status?: number;
    error?: string;
}

interface BaseFixtures {
    db: DbRepositories;
    /**
     * Automatic fixture.
     * Tests do not need to request this fixture explicitly.
     */
    autoLogger: void;
}

interface BaseWorkerFixtures {
    dbClientTeardown: void;
}

function isSavedSessionStorage(value: unknown): value is SavedSessionStorage {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<SavedSessionStorage>;

    return (
        typeof candidate.origin === 'string' &&
        candidate.origin.length > 0 &&
        !!candidate.entries &&
        typeof candidate.entries === 'object' &&
        Object.values(candidate.entries).every((entry) => typeof entry === 'string')
    );
}

function shouldIgnoreRequest(url: string): boolean {
    const ignoredPatterns = [
        /google-analytics/i,
        /googletagmanager/i,
        /hotjar/i,
        /sentry/i,
        /favicon\.ico/i,
        /\.(?:png|jpg|jpeg|gif|svg|woff2?|ttf)(?:\?|$)/i,
    ];

    return ignoredPatterns.some((pattern) => pattern.test(url));
}

function sanitizeUrl(rawUrl: string): string {
    try {
        const url = new URL(rawUrl);

        const sensitiveParameters = [
            'token',
            'access_token',
            'refresh_token',
            'api_key',
            'apikey',
            'password',
            'secret',
            'authorization',
        ];

        for (const parameter of sensitiveParameters) {
            if (url.searchParams.has(parameter)) {
                url.searchParams.set(parameter, '[REDACTED]');
            }
        }

        return url.toString();
    } catch {
        return rawUrl;
    }
}

export const test = base.extend<BaseFixtures, BaseWorkerFixtures>({
    dbClientTeardown: [
        async ({}, use) => {
            await use();
            const { closeDb } = require('@src/database/connection/DatabaseClient');
            await closeDb();
        },
        { scope: 'worker', auto: true },
    ],

    /**
     * Automatically logs every test start, completion,
     * duration, retry, worker and final status.
     */
    autoLogger: [
        async ({}, use, testInfo) => {
            const startTime = Date.now();
            Logger.setTestName(testInfo.title);
            Logger.separator(`TEST STARTED: ${testInfo.title}`);

            Logger.info(`Project: ${testInfo.project.name}`);
            Logger.info(`Worker index: ${testInfo.workerIndex}`);
            Logger.info(`Parallel index: ${testInfo.parallelIndex}`);
            Logger.info(`Retry number: ${testInfo.retry}`);
            Logger.info(`Test file: ${testInfo.file}`);

            try {
                await use();
            } catch (error) {
                Logger.error(`Unhandled test failure: ${testInfo.title}`, error);

                throw error;
            } finally {
                const duration = Date.now() - startTime;
                const status = testInfo.status ?? 'unknown';

                if (status === 'passed') {
                    Logger.success(`Test passed in ${duration} ms`);
                } else if (status === 'skipped') {
                    Logger.warn(`Test skipped after ${duration} ms`);
                } else {
                    Logger.error(`Test completed with status: ${status}`);
                    for (const error of testInfo.errors) {
                        Logger.error('Playwright test error', error);
                    }
                }
                Logger.info(`Expected status: ${testInfo.expectedStatus}`);
                Logger.info(`Actual status: ${status}`);
                Logger.separator(`TEST COMPLETED: ${testInfo.title}`);
                Logger.clearTestName();
            }
        },
        {
            auto: true,
        },
    ],

    /**
     * Database repository fixture.
     */
    db: async ({}, use) => {
        Logger.debug('Initialising database repositories');

        const repositories = new DbRepositories();

        try {
            await use(repositories);
        } finally {
            Logger.debug('Database repository fixture completed');
        }
    },

    /**
     * Restores sessionStorage before the page loads.
     */
    context: async ({ context }, use, testInfo) => {
        if (testInfo.project.name === 'API') {
            Logger.debug('Skipping browser sessionStorage restoration for API project');
            await use(context);
            return;
        }

        let savedSession: unknown;

        try {
            const sessionFile = await readFile(sessionStoragePath, 'utf8');
            savedSession = JSON.parse(sessionFile);
            Logger.info(`Loaded session storage from: ${sessionStoragePath}`);
        } catch (error) {
            Logger.error('Unable to load authenticated session storage', error);
            throw new Error(
                `Unable to load authenticated session storage from ${sessionStoragePath}. Run the Playwright setup project before authenticated tests.`,
                { cause: error },
            );
        }

        if (!isSavedSessionStorage(savedSession)) {
            Logger.error(`Invalid session storage structure: ${sessionStoragePath}`);

            throw new Error(`Invalid session storage data in ${sessionStoragePath}.`);
        }

        await context.addInitScript(({ origin, entries }: SavedSessionStorage) => {
            if (window.location.origin !== origin) {
                return;
            }

            for (const [key, value] of Object.entries(entries)) {
                window.sessionStorage.setItem(key, value);
            }
        }, savedSession);

        Logger.debug(
            `Session storage initialisation registered for origin: ` + `${savedSession.origin}`,
        );

        await use(context);
    },

    /**
     * Captures browser and network diagnostics.
     */
    page: async ({ page }, use, testInfo) => {
        const browserDiagnostics: BrowserDiagnostic[] = [];
        const networkDiagnostics: NetworkDiagnostic[] = [];

        const handleConsole = (message: ConsoleMessage): void => {
            if (message.type() !== 'error') {
                return;
            }

            const location = message.location();

            const diagnostic: BrowserDiagnostic = {
                type: 'console-error',
                message: message.text(),
                location: location.url
                    ? `${sanitizeUrl(location.url)}:` +
                      `${location.lineNumber}:` +
                      `${location.columnNumber}`
                    : undefined,
            };

            browserDiagnostics.push(diagnostic);

            Logger.error(`Browser console error: ${diagnostic.message}`, diagnostic);
        };

        const handlePageError = (error: Error): void => {
            const diagnostic: BrowserDiagnostic = {
                type: 'page-error',
                message: error.stack ?? error.message,
            };

            browserDiagnostics.push(diagnostic);

            Logger.error('Unhandled browser page error', error);
        };

        const handleRequestFailed = (request: Request): void => {
            if (shouldIgnoreRequest(request.url())) {
                return;
            }

            const diagnostic: NetworkDiagnostic = {
                type: 'request-failed',
                method: request.method(),
                url: sanitizeUrl(request.url()),
                error: request.failure()?.errorText ?? 'Unknown network error',
            };

            networkDiagnostics.push(diagnostic);

            Logger.error(`${diagnostic.method} request failed: ` + `${diagnostic.url}`, diagnostic);
        };

        const handleResponse = (response: Response): void => {
            if (response.status() < 400 || shouldIgnoreRequest(response.url())) {
                return;
            }

            const diagnostic: NetworkDiagnostic = {
                type: 'http-error',
                method: response.request().method(),
                url: sanitizeUrl(response.url()),
                status: response.status(),
            };

            networkDiagnostics.push(diagnostic);

            Logger.warn(`HTTP ${diagnostic.status}: ` + `${diagnostic.method} ${diagnostic.url}`);
        };

        page.on('console', handleConsole);
        page.on('pageerror', handlePageError);
        page.on('requestfailed', handleRequestFailed);
        page.on('response', handleResponse);

        Logger.debug('Browser diagnostic listeners registered');

        try {
            await use(page);

            if (testInfo.status !== testInfo.expectedStatus) {
                Logger.error(`Test failed at URL: ${sanitizeUrl(page.url())}`);

                await testInfo.attach('Current URL', {
                    body: Buffer.from(sanitizeUrl(page.url())),
                    contentType: 'text/plain',
                });

                if (!page.isClosed()) {
                    const screenshot = await page.screenshot({
                        fullPage: true,
                    });

                    await testInfo.attach('Failure screenshot', {
                        body: screenshot,
                        contentType: 'image/png',
                    });

                    Logger.info('Failure screenshot attached');
                }

                if (browserDiagnostics.length > 0) {
                    await testInfo.attach('Browser errors', {
                        body: Buffer.from(JSON.stringify(browserDiagnostics, null, 2)),
                        contentType: 'application/json',
                    });

                    Logger.error(`Captured ${browserDiagnostics.length} ` + `browser error(s)`);
                }

                if (networkDiagnostics.length > 0) {
                    await testInfo.attach('Network errors', {
                        body: Buffer.from(JSON.stringify(networkDiagnostics, null, 2)),
                        contentType: 'application/json',
                    });

                    Logger.error(`Captured ${networkDiagnostics.length} ` + `network error(s)`);
                }
            }
        } finally {
            page.off('console', handleConsole);
            page.off('pageerror', handlePageError);
            page.off('requestfailed', handleRequestFailed);
            page.off('response', handleResponse);

            Logger.debug('Browser diagnostic listeners removed');
        }
    },
});

export { expect };
