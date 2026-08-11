import * as allure from 'allure-js-commons';
import { Page, test, APIResponse, TestInfo } from '@playwright/test';
import { Logger } from '@src/reporting/logging/Logger';
import excelJs from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

export type AllureSeverity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export interface AllureTestDetails {
    epic: string;
    feature: string;
    story: string;
    severity: AllureSeverity;

    owner?: string;
    tags?: string[];

    parentSuite?: string;
    suite?: string;
    subSuite?: string;

    description?: string;

    issueId?: string;
    issueName?: string;

    testCaseId?: string;
    testCaseName?: string;
}

export interface AllureStepOptions {
    /**
     * Capture screenshot after a successful step.
     */
    screenshotOnSuccess?: boolean;

    /**
     * Capture screenshot when the step fails.
     */
    screenshotOnFailure?: boolean;

    /**
     * Capture current URL after failure.
     */
    attachUrlOnFailure?: boolean;

    /**
     * Capture the page DOM after failure.
     */
    attachDomOnFailure?: boolean;
}

export interface ApiRequestAttachment {
    method: string;
    url: string;
    headers?: Record<string, unknown>;
    queryParameters?: Record<string, unknown>;
    body?: unknown;
}

export interface ApiResponseAttachment {
    status: number;
    statusText?: string;
    url?: string;
    headers?: Record<string, unknown>;
    body?: unknown;
    durationMs?: number;
}

export class AllureUtil {
    private static readonly defaultStepOptions: Required<AllureStepOptions> = {
        screenshotOnSuccess: true,
        screenshotOnFailure: true,
        attachUrlOnFailure: true,
        attachDomOnFailure: true,
    };

    private static readonly sensitiveKeys = new Set([
        'password',
        'passcode',
        'secret',
        'token',
        'access_token',
        'refresh_token',
        'authorization',
        'api_key',
        'apikey',
        'client_secret',
        'cookie',
        'set-cookie',
    ]);

    static async loadDetailsFromExcel(testCaseId: string): Promise<Partial<AllureTestDetails>> {
        const parts = testCaseId.split('-');
        let moduleName = 'facility';
        let isApi = false;

        if (parts.length >= 3) {
            isApi = parts.includes('API');
            const moduleCode = parts[1]?.toUpperCase();
            if (moduleCode === 'LOC') moduleName = 'facility';
            else if (moduleCode === 'ROLE') moduleName = 'profile';
            else if (moduleCode === 'COMPUTENODE') moduleName = 'computeNode';
            else if (moduleCode === 'EVENT') moduleName = 'event';
            else if (moduleCode) moduleName = moduleCode.toLowerCase();
        }

        const fileName = isApi
            ? `api_${moduleName}_test_cases.xlsx`
            : `${moduleName}_test_cases.xlsx`;
        const excelFilePath = path.resolve(__dirname, `../../resources/${fileName}`);

        if (!fs.existsSync(excelFilePath)) {
            Logger.warn(`AllureUtil: Excel test case sheet not found at ${excelFilePath}`);
            return {};
        }

        try {
            const workbook = new excelJs.Workbook();
            await workbook.xlsx.readFile(excelFilePath);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) return {};

            let details: Partial<AllureTestDetails> = {};

            worksheet.eachRow((row) => {
                const cellValue = row.getCell(1).value?.toString().trim();
                if (cellValue === testCaseId) {
                    const title = row.getCell(3).value?.toString().trim() ?? '';
                    const objective = row.getCell(4).value?.toString().trim() ?? '';
                    const prerequisite = row.getCell(10).value?.toString().trim() ?? 'NA';
                    const expectedResult = row.getCell(12).value?.toString().trim() ?? '';

                    const description = [
                        `### Objective`,
                        objective || title,
                        `### Pre-Requisites`,
                        prerequisite,
                        `### Expected Result`,
                        expectedResult,
                    ].join('\n\n');

                    details = {
                        description,
                        testCaseName: title,
                    };
                }
            });

            return details;
        } catch (error) {
            Logger.error(`AllureUtil: Failed to read Excel file for Allure description: ${error}`);
            return {};
        }
    }

    /**
     * Adds the main test metadata. Supports both Positional arguments and AllureTestDetails object.
     */
    static async setTestDetails(
        detailsOrEpic: AllureTestDetails | string,
        feature?: string,
        story?: string,
        severity?: AllureSeverity,
    ): Promise<void> {
        if (typeof detailsOrEpic === 'object') {
            const details = detailsOrEpic;

            if (details.testCaseId && !details.description) {
                const excelDetails = await this.loadDetailsFromExcel(details.testCaseId);
                if (excelDetails.description) {
                    details.description = excelDetails.description;
                }
            }
            await Promise.all([
                allure.epic(details.epic),
                allure.feature(details.feature),
                allure.story(details.story),
                allure.severity(details.severity),
            ]);

            if (details.owner) {
                await allure.owner(details.owner);
            }

            if (details.description) {
                await allure.description(details.description);
            }

            if (details.parentSuite) {
                await allure.parentSuite(details.parentSuite);
            }

            if (details.suite) {
                await allure.suite(details.suite);
            }

            if (details.subSuite) {
                await allure.subSuite(details.subSuite);
            }

            for (const tag of details.tags ?? []) {
                await allure.tag(tag);
            }

            if (details.issueId) {
                await allure.issue(details.issueId, details.issueName ?? details.issueId);
            }

            if (details.testCaseId) {
                await allure.tms(details.testCaseId, details.testCaseName ?? details.testCaseId);
            }
        } else {
            // Legacy positional parameters
            if (detailsOrEpic) await allure.epic(detailsOrEpic);
            if (feature) await allure.feature(feature);
            if (story) await allure.story(story);
            if (severity) await allure.severity(severity);
        }
    }

    static async addOwner(owner: string): Promise<void> {
        await allure.owner(owner);
    }

    static async addTag(tag: string): Promise<void> {
        await allure.tag(tag);
    }

    static async addTags(...tags: string[]): Promise<void> {
        for (const tag of tags) {
            await allure.tag(tag);
        }
    }

    static async addSeverity(severity: AllureSeverity): Promise<void> {
        await allure.severity(severity);
    }

    static async addDescription(description: string): Promise<void> {
        await allure.description(description);
    }

    static async addSuites(parentSuite: string, suite: string, subSuite?: string): Promise<void> {
        await allure.parentSuite(parentSuite);
        await allure.suite(suite);

        if (subSuite) {
            await allure.subSuite(subSuite);
        }
    }

    static async addIssue(issueId: string, displayName: string = issueId): Promise<void> {
        await allure.issue(issueId, displayName);
    }

    static async addTestCase(testCaseId: string, displayName: string = testCaseId): Promise<void> {
        await allure.tms(testCaseId, displayName);
    }

    static async addLink(url: string, name?: string, type?: string): Promise<void> {
        await allure.link(url, name, type);
    }

    static async addParameter(name: string, value: unknown): Promise<void> {
        await allure.parameter(name, this.convertToString(value));
    }

    /**
     * Generic attachment method.
     */
    static async attach(
        name: string,
        content: string | Buffer,
        contentType: string,
    ): Promise<void> {
        try {
            await allure.attachment(name, content, { contentType });
        } catch (error) {
            Logger.warn(`Unable to add Allure attachment: ${name}`, error);
        }
    }

    static async attachText(name: string, text: string): Promise<void> {
        await this.attach(name, text, 'text/plain');
    }

    static async attachHtml(name: string, html: string): Promise<void> {
        await this.attach(name, html, 'text/html');
    }

    static async attachJson(name: string, data: unknown): Promise<void> {
        const sanitizedData = this.sanitizeSensitiveData(data);
        await this.attach(name, JSON.stringify(sanitizedData, null, 2), 'application/json');
    }

    static async attachScreenshot(name: string, screenshot: Buffer): Promise<void> {
        await this.attach(name, screenshot, 'image/png');
    }

    /**
     * Safely captures a screenshot.
     */
    static async captureScreenshot(page: Page, name: string, fullPage = true): Promise<void> {
        try {
            if (page.isClosed()) {
                Logger.warn(`Screenshot skipped because page is closed: ${name}`);
                return;
            }

            const screenshot = await page.screenshot({ fullPage });
            await this.attachScreenshot(name, screenshot);
        } catch (error) {
            Logger.warn(`Unable to capture screenshot: ${name}`, error);
        }
    }

    static async attachCurrentUrl(page: Page): Promise<void> {
        try {
            const currentUrl = page.isClosed() ? 'Page is closed' : this.sanitizeUrl(page.url());

            await this.attachText('Current URL', currentUrl);
        } catch (error) {
            Logger.warn('Unable to attach current URL', error);
        }
    }

    static async attachPageDom(page: Page, name = 'Page DOM'): Promise<void> {
        try {
            if (page.isClosed()) {
                return;
            }

            const html = await page.content();
            await this.attachHtml(name, html);
        } catch (error) {
            Logger.warn('Unable to attach page DOM', error);
        }
    }

    static async attachError(name: string, error: unknown): Promise<void> {
        const errorDetails = this.formatError(error);
        await this.attachText(name, errorDetails);
    }

    /**
     * Attach an API request with sensitive values redacted.
     */
    static async attachApiRequest(name: string, request: ApiRequestAttachment): Promise<void> {
        const attachment = {
            method: request.method,
            url: this.sanitizeUrl(request.url),
            headers: this.sanitizeSensitiveData(request.headers),
            queryParameters: this.sanitizeSensitiveData(request.queryParameters),
            body: this.sanitizeSensitiveData(request.body),
        };

        await this.attachJson(`${name} - Request`, attachment);
    }

    /**
     * Attach a normal response object.
     */
    static async attachApiResponse(name: string, response: ApiResponseAttachment): Promise<void> {
        const attachment = {
            status: response.status,
            statusText: response.statusText,
            url: response.url ? this.sanitizeUrl(response.url) : undefined,
            durationMs: response.durationMs,
            headers: this.sanitizeSensitiveData(response.headers),
            body: this.sanitizeSensitiveData(response.body),
        };

        await this.attachJson(`${name} - Response`, attachment);
    }

    /**
     * Attach Playwright APIResponse details.
     */
    static async attachPlaywrightApiResponse(name: string, response: APIResponse): Promise<void> {
        let body: unknown;

        try {
            body = await response.json();
        } catch {
            try {
                body = await response.text();
            } catch {
                body = '[Unable to read response body]';
            }
        }

        await this.attachApiResponse(name, {
            status: response.status(),
            statusText: response.statusText(),
            url: response.url(),
            headers: response.headers(),
            body,
        });
    }

    /**
     * Attach Playwright test execution information.
     */
    static async attachTestInfo(testInfo: TestInfo): Promise<void> {
        await this.attachJson('Test execution information', {
            title: testInfo.title,
            file: testInfo.file,
            project: testInfo.project.name,
            workerIndex: testInfo.workerIndex,
            parallelIndex: testInfo.parallelIndex,
            retry: testInfo.retry,
            expectedStatus: testInfo.expectedStatus,
            actualStatus: testInfo.status,
            duration: testInfo.duration,
        });
    }

    /**
     * UI step with automatic logging and diagnostics.
     */
    static async step<T>(
        page: Page,
        name: string,
        action: () => Promise<T>,
        options: AllureStepOptions = {},
    ): Promise<T> {
        const isPostrequisite = /^post-?requisite\b/i.test(name.trim());
        const resolvedOptions = {
            ...this.defaultStepOptions,
            ...(isPostrequisite
                ? {
                      screenshotOnSuccess: false,
                      screenshotOnFailure: false,
                      attachUrlOnFailure: false,
                      attachDomOnFailure: false,
                  }
                : {}),
            ...options,
        };

        return test.step(name, async () => {
            const startedAt = Date.now();
            Logger.step(name);

            try {
                const result = await action();
                const durationMs = Date.now() - startedAt;

                Logger.success(`Step completed: ${name} (${durationMs} ms)`);
                await allure.parameter(`${name} duration`, `${durationMs} ms`);

                if (isPostrequisite) {
                    await this.attachJson(`${name} - confirmation`, {
                        operation: name,
                        status: 'Completed without error',
                        completedAt: new Date().toISOString(),
                        durationMs,
                    });
                }

                if (resolvedOptions.screenshotOnSuccess) {
                    await this.captureScreenshot(page, `${name} - completed`);
                }

                return result;
            } catch (error) {
                const durationMs = Date.now() - startedAt;

                Logger.error(`Step failed: ${name} (${durationMs} ms)`, error);
                await this.attachError(`${name} - Error`, error);
                await allure.parameter(`${name} duration`, `${durationMs} ms`);

                if (resolvedOptions.attachUrlOnFailure) {
                    await this.attachCurrentUrl(page);
                }

                if (resolvedOptions.screenshotOnFailure) {
                    await this.captureScreenshot(page, `${name} - failed`);
                }

                if (resolvedOptions.attachDomOnFailure) {
                    await this.attachPageDom(page, `${name} - DOM`);
                }

                throw error;
            }
        });
    }

    /**
     * Step for API, DB or utility work where no Page exists.
     */
    static async actionStep<T>(name: string, action: () => Promise<T>): Promise<T> {
        return test.step(name, async () => {
            const startedAt = Date.now();
            const isPostrequisite = /^post-?requisite\b/i.test(name.trim());
            Logger.step(name);

            try {
                const result = await action();
                const durationMs = Date.now() - startedAt;
                Logger.success(`Step completed: ${name} (${durationMs} ms)`);
                if (isPostrequisite) {
                    await this.attachJson(`${name} - confirmation`, {
                        operation: name,
                        status: 'Completed without error',
                        completedAt: new Date().toISOString(),
                        durationMs,
                    });
                }
                return result;
            } catch (error) {
                Logger.error(`Step failed: ${name} (${Date.now() - startedAt} ms)`, error);
                await this.attachError(`${name} - Error`, error);
                throw error;
            }
        });
    }

    private static formatError(error: unknown): string {
        if (error instanceof Error) {
            return [
                `Name: ${error.name}`,
                `Message: ${error.message}`,
                '',
                'Stack:',
                error.stack ?? 'Stack unavailable',
            ].join('\n');
        }

        if (typeof error === 'string') {
            return error;
        }

        try {
            return JSON.stringify(error, null, 2);
        } catch {
            return String(error);
        }
    }

    private static convertToString(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    private static sanitizeUrl(rawUrl: string): string {
        try {
            const url = new URL(rawUrl);

            for (const parameter of url.searchParams.keys()) {
                if (this.isSensitiveKey(parameter)) {
                    url.searchParams.set(parameter, '[REDACTED]');
                }
            }

            return url.toString();
        } catch {
            return rawUrl;
        }
    }

    private static sanitizeSensitiveData(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeSensitiveData(item));
        }

        if (typeof value === 'object') {
            const record = value as Record<string, unknown>;
            const sanitized: Record<string, unknown> = {};

            for (const [key, item] of Object.entries(record)) {
                sanitized[key] = this.isSensitiveKey(key)
                    ? '[REDACTED]'
                    : this.sanitizeSensitiveData(item);
            }

            return sanitized;
        }

        return value;
    }

    private static isSensitiveKey(key: string): boolean {
        return this.sensitiveKeys.has(key.trim().toLowerCase());
    }
}
