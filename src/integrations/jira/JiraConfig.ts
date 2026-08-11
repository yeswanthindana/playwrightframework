export type JiraCustomFieldFormat = 'text' | 'select' | 'multiselect' | 'adf';

export interface JiraConfig {
    enabled: boolean;
    baseUrl: string;
    email: string;
    apiToken: string;
    executionStatusFieldId?: string;
    executionStatusFieldFormat: JiraCustomFieldFormat;
    executionStatusValues: {
        passed: string;
        failed: string;
        skipped: string;
        timedOut: string;
        interrupted: string;
    };
    executedByFieldId?: string;
    executedByAccountId?: string;
    executedByIsArray: boolean;
    environmentFieldId?: string;
    environmentFieldFormat: JiraCustomFieldFormat;
    addComment: boolean;
    uploadTestAttachments: boolean;
    uploadFailureAttachments: boolean;
    failOnError: boolean;
    maxAttachmentBytes: number;
}

function readBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.trim().toLowerCase();
    if (!value) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value);
}

function readFieldFormat(name: string, defaultValue: JiraCustomFieldFormat): JiraCustomFieldFormat {
    const value = process.env[name]?.trim().toLowerCase();
    return value === 'text' || value === 'select' || value === 'multiselect' || value === 'adf'
        ? value
        : defaultValue;
}

function readPositiveInteger(name: string, defaultValue: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : defaultValue;
}

function normalizeBaseUrl(value: string | undefined): string {
    return value?.trim().replace(/\/+$/, '') ?? '';
}

export function loadJiraConfig(): JiraConfig {
    const config: JiraConfig = {
        enabled: readBoolean('JIRA_ENABLED', false),
        baseUrl: normalizeBaseUrl(process.env.JIRA_BASE_URL),
        email: process.env.JIRA_EMAIL?.trim() ?? '',
        apiToken: process.env.JIRA_API_TOKEN?.trim() ?? '',
        executionStatusFieldId: process.env.JIRA_EXECUTION_STATUS_FIELD_ID?.trim(),
        executionStatusFieldFormat: readFieldFormat('JIRA_EXECUTION_STATUS_FIELD_FORMAT', 'select'),
        executionStatusValues: {
            passed: process.env.JIRA_STATUS_PASSED_VALUE?.trim() || 'Passed',
            failed: process.env.JIRA_STATUS_FAILED_VALUE?.trim() || 'Failed',
            skipped: process.env.JIRA_STATUS_SKIPPED_VALUE?.trim() || 'Skipped',
            timedOut: process.env.JIRA_STATUS_TIMED_OUT_VALUE?.trim() || 'Timed Out',
            interrupted: process.env.JIRA_STATUS_INTERRUPTED_VALUE?.trim() || 'Interrupted',
        },
        executedByFieldId: process.env.JIRA_EXECUTED_BY_FIELD_ID?.trim(),
        executedByAccountId: process.env.JIRA_EXECUTED_BY_ACCOUNT_ID?.trim(),
        executedByIsArray: readBoolean('JIRA_EXECUTED_BY_IS_ARRAY', false),
        environmentFieldId: process.env.JIRA_ENVIRONMENT_FIELD_ID?.trim(),
        environmentFieldFormat: readFieldFormat('JIRA_ENVIRONMENT_FIELD_FORMAT', 'select'),
        addComment: readBoolean('JIRA_ADD_COMMENT', true),
        uploadTestAttachments: readBoolean('JIRA_UPLOAD_TEST_ATTACHMENTS', false),
        uploadFailureAttachments: readBoolean('JIRA_UPLOAD_FAILURE_ATTACHMENTS', false),
        failOnError: readBoolean('JIRA_FAIL_ON_ERROR', false),
        maxAttachmentBytes: readPositiveInteger('JIRA_MAX_ATTACHMENT_BYTES', 10 * 1024 * 1024),
    };

    if (config.enabled) {
        const missing = [
            ['JIRA_BASE_URL', config.baseUrl],
            ['JIRA_EMAIL', config.email],
            ['JIRA_API_TOKEN', config.apiToken],
        ]
            .filter(([, value]) => !value)
            .map(([name]) => name);

        if (missing.length > 0) {
            throw new Error(`Jira integration is enabled but missing: ${missing.join(', ')}`);
        }
    }

    return config;
}
