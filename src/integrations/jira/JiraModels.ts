export type JiraExecutionStatus = 'Passed' | 'Failed' | 'Skipped' | 'Timed Out' | 'Interrupted';

export interface JiraDocument {
    type: 'doc';
    version: 1;
    content: JiraDocumentNode[];
}

export interface JiraDocumentNode {
    type: string;
    text?: string;
    attrs?: Record<string, unknown>;
    content?: JiraDocumentNode[];
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface JiraIssueUpdate {
    fields: Record<string, unknown>;
}

export interface JiraExecutionSummary {
    issueKey: string;
    testCaseId?: string;
    testTitle: string;
    specFile: string;
    sourceLine: number;
    sourceColumn: number;
    status: JiraExecutionStatus;
    rawStatus: string;
    expectedStatus: string;
    outcome: string;
    environment: string;
    projectName: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    retry: number;
    workerIndex: number;
    parallelIndex: number;
    repeatEachIndex: number;
    timeoutMs: number;
    tags: string[];
    attachmentCount: number;
    errorCount: number;
    errorMessage?: string;
}
