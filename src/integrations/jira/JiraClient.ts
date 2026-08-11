import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { JiraConfig, JiraCustomFieldFormat } from '@src/integrations/jira/JiraConfig';
import {
    JiraDocument,
    JiraExecutionStatus,
    JiraExecutionSummary,
    JiraIssueUpdate,
} from '@src/integrations/jira/JiraModels';

export class JiraClient {
    private resolvedMember?: {
        accountId: string;
        displayName?: string;
        emailAddress?: string;
    };

    constructor(private readonly config: JiraConfig) {}

    async updateExecution(summary: JiraExecutionSummary): Promise<void> {
        const fields: Record<string, unknown> = {};
        const executedBy =
            this.config.executedByFieldId || this.config.addComment
                ? await this.getExecutedByMember()
                : undefined;

        if (this.config.executionStatusFieldId) {
            fields[this.config.executionStatusFieldId] = this.formatCustomFieldValue(
                this.getConfiguredStatusValue(summary.status),
                this.config.executionStatusFieldFormat,
            );
        }

        if (this.config.environmentFieldId) {
            fields[this.config.environmentFieldId] = this.formatCustomFieldValue(
                summary.environment,
                this.config.environmentFieldFormat,
            );
        }

        if (this.config.executedByFieldId && executedBy) {
            const memberValue = {
                accountId: executedBy.accountId,
            };
            fields[this.config.executedByFieldId] = this.config.executedByIsArray
                ? [memberValue]
                : memberValue;
        }

        if (Object.keys(fields).length > 0) {
            await this.request(`/rest/api/3/issue/${encodeURIComponent(summary.issueKey)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields } satisfies JiraIssueUpdate),
            });
        }

        if (this.config.addComment) {
            await this.addComment(
                summary.issueKey,
                this.buildExecutionComment(summary, executedBy),
            );
        }
    }

    async uploadAttachment(issueKey: string, filePath: string): Promise<boolean> {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile() || fileStats.size > this.config.maxAttachmentBytes) {
            return false;
        }

        const form = new FormData();
        const contents = await readFile(filePath);
        form.append('file', new Blob([contents]), path.basename(filePath));

        await this.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
            method: 'POST',
            headers: { 'X-Atlassian-Token': 'no-check' },
            body: form,
        });
        return true;
    }

    async uploadTextAttachment(
        issueKey: string,
        fileName: string,
        content: string,
    ): Promise<boolean> {
        const contents = Buffer.from(content, 'utf8');
        if (contents.byteLength > this.config.maxAttachmentBytes) return false;

        const form = new FormData();
        form.append('file', new Blob([contents], { type: 'text/plain' }), fileName);

        await this.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
            method: 'POST',
            headers: { 'X-Atlassian-Token': 'no-check' },
            body: form,
        });
        return true;
    }

    private async addComment(issueKey: string, document: JiraDocument): Promise<void> {
        await this.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: document }),
        });
    }

    private buildExecutionComment(
        summary: JiraExecutionSummary,
        executedBy?: { accountId: string; displayName?: string; emailAddress?: string },
    ): JiraDocument {
        const executedByText = executedBy
            ? [executedBy.displayName, executedBy.emailAddress].filter(Boolean).join(' — ') ||
              executedBy.accountId
            : 'Unavailable';
        const lines = [
            'Automated Test Execution Summary',
            `Reported at: ${new Date().toISOString()}`,
            `Executed by: ${executedByText}`,
            `Automation result: ${summary.status}`,
            `Test Case ID: ${summary.testCaseId ?? 'Not provided'}`,
            `Jira Issue: ${summary.issueKey}`,
            `Test: ${summary.testTitle}`,
            `Spec file: ${summary.specFile}:${summary.sourceLine}:${summary.sourceColumn}`,
            `Environment: ${summary.environment}`,
            `Playwright project: ${summary.projectName}`,
            `Expected status: ${summary.expectedStatus}`,
            `Actual status: ${summary.rawStatus}`,
            `Outcome: ${summary.outcome}`,
            `Started at: ${summary.startedAt}`,
            `Completed at: ${summary.completedAt}`,
            `Duration: ${summary.durationMs} ms`,
            `Retry: ${summary.retry}`,
            `Worker index: ${summary.workerIndex}`,
            `Parallel index: ${summary.parallelIndex}`,
            `Repeat-each index: ${summary.repeatEachIndex}`,
            `Timeout: ${summary.timeoutMs} ms`,
            `Tags: ${summary.tags.length > 0 ? summary.tags.join(', ') : 'None'}`,
            `Attachments: ${summary.attachmentCount}`,
            `Errors: ${summary.errorCount}`,
        ];

        if (summary.errorMessage) {
            lines.push(`Error: ${this.limitText(this.stripAnsi(summary.errorMessage), 1500)}`);
        }

        return this.toDocument(lines);
    }

    private formatCustomFieldValue(
        value: JiraExecutionStatus | string,
        format: JiraCustomFieldFormat,
    ): unknown {
        if (format === 'select') return { value };
        if (format === 'multiselect') return [{ value }];
        if (format === 'adf') return this.toDocument([value]);
        return value;
    }

    private getConfiguredStatusValue(status: JiraExecutionStatus): string {
        const values = this.config.executionStatusValues;
        const statusValues: Record<JiraExecutionStatus, string> = {
            Passed: values.passed,
            Failed: values.failed,
            Skipped: values.skipped,
            'Timed Out': values.timedOut,
            Interrupted: values.interrupted,
        };
        return statusValues[status];
    }

    private async getExecutedByMember(): Promise<{
        accountId: string;
        displayName?: string;
        emailAddress?: string;
    }> {
        if (this.resolvedMember) return this.resolvedMember;

        const configuredAccountId = this.config.executedByAccountId;
        const resource = configuredAccountId
            ? `/rest/api/3/member?accountId=${encodeURIComponent(configuredAccountId)}`
            : '/rest/api/3/myself';
        const response = await this.request(resource, { method: 'GET' });
        const body = (await response.json()) as unknown;
        if (
            !body ||
            typeof body !== 'object' ||
            !('accountId' in body) ||
            typeof body.accountId !== 'string' ||
            !body.accountId
        ) {
            throw new Error('Jira member response did not contain a valid accountId');
        }
        this.resolvedMember = {
            accountId: body.accountId,
            displayName:
                'displayName' in body && typeof body.displayName === 'string'
                    ? body.displayName
                    : undefined,
            emailAddress:
                'emailAddress' in body && typeof body.emailAddress === 'string'
                    ? body.emailAddress
                    : undefined,
        };
        return this.resolvedMember;
    }

    private toDocument(lines: string[]): JiraDocument {
        return {
            type: 'doc',
            version: 1,
            content: lines.map((text) => ({
                type: 'paragraph',
                content: [{ type: 'text', text }],
            })),
        };
    }

    private limitText(value: string, maxLength: number): string {
        return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
    }

    private stripAnsi(value: string): string {
        return value
            .replace(new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, 'g'), '')
            .replace(/\\x1B\[[0-?]*[ -/]*[@-~]/gi, '');
    }

    private async request(resource: string, init: RequestInit): Promise<Response> {
        const authorization = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString(
            'base64',
        );
        const response = await fetch(`${this.config.baseUrl}${resource}`, {
            ...init,
            headers: {
                Accept: 'application/json',
                Authorization: `Basic ${authorization}`,
                ...init.headers,
            },
        });

        if (!response.ok) {
            const responseText = this.limitText(await response.text(), 2000);
            throw new Error(
                `Jira request ${init.method ?? 'GET'} ${resource} failed with ` +
                    `${response.status} ${response.statusText}: ${responseText}`,
            );
        }

        return response;
    }
}
