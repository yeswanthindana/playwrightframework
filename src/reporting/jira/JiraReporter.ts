import path from 'node:path';
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { loadJiraConfig, JiraConfig } from '@src/integrations/jira/JiraConfig';
import { JiraClient } from '@src/integrations/jira/JiraClient';
import { JiraExecutionStatus } from '@src/integrations/jira/JiraModels';
import { Logger } from '@src/reporting/logging/Logger';
import testCaseMap from '../../../resources/jira-test-case-map.json';

const JIRA_ISSUE_KEY_PATTERN = /(?:^|[\s@])(\b[A-Z][A-Z0-9]+-\d+\b)(?=$|[\s,;])/i;
const TEST_CASE_ID_PATTERN = /\bTC-[A-Z0-9-]+-\d+\b/i;

interface TestCaseMapping {
    jiraKey: string | null;
    testFile: string | null;
}

const jiraTestCaseMap = testCaseMap as Record<string, TestCaseMapping>;

class JiraReporter implements Reporter {
    private readonly config: JiraConfig;
    private readonly client?: JiraClient;
    private readonly pendingUpdates: Promise<void>[] = [];

    constructor() {
        this.config = loadJiraConfig();
        if (this.config.enabled) {
            this.client = new JiraClient(this.config);
            Logger.info('JiraReporter: integration enabled');
        }
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        if (!this.config.enabled || !this.client) return;

        const issueKey = this.findIssueKey(test);
        if (!issueKey) {
            Logger.debug(`JiraReporter: no Jira key found for "${test.title}"; skipping`);
            return;
        }

        this.pendingUpdates.push(this.processTestResult(issueKey, test, result));
    }

    async onEnd(): Promise<void> {
        if (this.pendingUpdates.length === 0) return;

        Logger.info(`JiraReporter: waiting for ${this.pendingUpdates.length} Jira update(s)`);
        await Promise.all(this.pendingUpdates);
    }

    private async processTestResult(
        issueKey: string,
        test: TestCase,
        result: TestResult,
    ): Promise<void> {
        try {
            const client = this.client;
            if (!client) {
                Logger.warn(`JiraReporter: client unavailable for ${issueKey}; skipping update`);
                return;
            }

            await client.updateExecution({
                issueKey,
                testCaseId: this.findTestCaseId(test),
                testTitle: test.titlePath().join(' > '),
                specFile: path.relative(process.cwd(), test.location.file),
                sourceLine: test.location.line,
                sourceColumn: test.location.column,
                status: this.mapStatus(result.status),
                rawStatus: result.status,
                expectedStatus: test.expectedStatus,
                outcome: test.outcome(),
                environment: process.env.TEST_ENV?.trim() || 'qa',
                projectName: test.parent.project()?.name ?? 'unknown',
                startedAt: result.startTime.toISOString(),
                completedAt: new Date(result.startTime.getTime() + result.duration).toISOString(),
                durationMs: result.duration,
                retry: result.retry,
                workerIndex: result.workerIndex,
                parallelIndex: result.parallelIndex,
                repeatEachIndex: test.repeatEachIndex,
                timeoutMs: test.timeout,
                tags: test.tags,
                attachmentCount: result.attachments.length,
                errorCount: result.errors.length,
                errorMessage: result.error?.message,
            });

            if (
                this.config.uploadTestAttachments ||
                (this.config.uploadFailureAttachments && result.status !== 'passed')
            ) {
                await this.uploadTestEvidence(issueKey, test, result);
            }

            Logger.success(`JiraReporter: updated ${issueKey} with ${result.status}`);
        } catch (error) {
            Logger.error(`JiraReporter: unable to process "${test.title}"`, error);
            if (this.config.failOnError) throw error;
        }
    }

    private findIssueKey(test: TestCase): string | undefined {
        const annotation = test.annotations.find((item) =>
            ['jira', 'issue'].includes(item.type.toLowerCase()),
        );
        const annotatedKey = annotation?.description?.trim();
        const annotationMatch = annotatedKey?.match(/\b[A-Z][A-Z0-9]+-\d+\b/i);
        if (annotationMatch?.[0]) return annotationMatch[0].toUpperCase();

        const titleMatch = test.titlePath().join(' ').match(JIRA_ISSUE_KEY_PATTERN);
        if (titleMatch?.[1]) return titleMatch[1].toUpperCase();

        const testCaseId = this.findTestCaseId(test);
        if (!testCaseId) return undefined;
        return jiraTestCaseMap[testCaseId]?.jiraKey ?? undefined;
    }

    private findTestCaseId(test: TestCase): string | undefined {
        return test.titlePath().join(' ').match(TEST_CASE_ID_PATTERN)?.[0]?.toUpperCase();
    }

    private mapStatus(status: TestResult['status']): JiraExecutionStatus {
        const statusMap: Record<TestResult['status'], JiraExecutionStatus> = {
            passed: 'Passed',
            failed: 'Failed',
            skipped: 'Skipped',
            timedOut: 'Timed Out',
            interrupted: 'Interrupted',
        };
        return statusMap[status];
    }

    private async uploadTestEvidence(
        issueKey: string,
        test: TestCase,
        result: TestResult,
    ): Promise<void> {
        if (!this.client) return;

        //const supportedContentTypes = new Set(['image/png', 'image/jpeg']);
        const supportedContentTypes = new Set([
            'image/png',
            'image/jpeg',
            'text/plain',
            'text/html',
            'application/json',
            'video/webm',
        ]);
        for (const attachment of result.attachments) {
            if (!attachment.path || !supportedContentTypes.has(attachment.contentType)) continue;

            try {
                const uploaded = await this.client.uploadAttachment(issueKey, attachment.path);
                if (!uploaded) {
                    Logger.warn(`JiraReporter: skipped oversized attachment ${attachment.name}`);
                }
            } catch (error) {
                Logger.error(
                    `JiraReporter: unable to upload attachment ${attachment.name} to ${issueKey}`,
                    error,
                );
                if (this.config.failOnError) throw error;
            }
        }

        const testLog = this.buildTestLog(issueKey, test, result);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFileName = `${issueKey}-${timestamp}-test.log`;
        try {
            const uploaded = await this.client.uploadTextAttachment(issueKey, logFileName, testLog);
            if (!uploaded) Logger.warn(`JiraReporter: skipped oversized log ${logFileName}`);
        } catch (error) {
            Logger.error(`JiraReporter: unable to upload test log to ${issueKey}`, error);
            if (this.config.failOnError) throw error;
        }
    }

    private buildTestLog(issueKey: string, test: TestCase, result: TestResult): string {
        const completedAt = new Date();
        const startedAt = new Date(completedAt.getTime() - result.duration);
        const output = [...result.stdout, ...result.stderr]
            .map((chunk) => (typeof chunk === 'string' ? chunk : chunk.toString('utf8')))
            .join('\n')
            .trim();
        const lines = [
            `Jira Issue: ${issueKey}`,
            `Test: ${test.titlePath().join(' > ')}`,
            `Status: ${this.mapStatus(result.status)}`,
            `Environment: ${process.env.TEST_ENV?.trim() || 'qa'}`,
            `Playwright Project: ${test.parent.project()?.name ?? 'unknown'}`,
            `Started At: ${startedAt.toISOString()}`,
            `Completed At: ${completedAt.toISOString()}`,
            `Duration: ${result.duration} ms`,
            `Retry: ${result.retry}`,
        ];

        if (result.error?.message) lines.push(`Error: ${result.error.message}`);
        if (output) lines.push('', 'Captured Test Output:', output);

        return this.sanitizeLog(lines.join('\n'));
    }

    private sanitizeLog(content: string): string {
        return content
            .replace(new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, 'g'), '')
            .replace(/\\x1B\[[0-?]*[ -/]*[@-~]/gi, '')
            .replace(/(authorization\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]')
            .replace(/(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
            .replace(
                /([?&](?:token|access_token|refresh_token|api_key|password)=)[^&\s]+/gi,
                '$1[REDACTED]',
            );
    }
}

export default JiraReporter;
