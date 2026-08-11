import fs from 'node:fs';
import chalk from 'chalk';
import path from 'node:path';
import util from 'node:util';

export type LogLevel = 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';

export interface LoggerContext {
    testName?: string;
    projectName?: string;
    workerIndex?: number;
    retry?: number;
}

export class Logger {
    private static context: LoggerContext = {
        testName: 'Framework',
        projectName: 'SentinelX Automation Framework',
        workerIndex: -1,
        retry: 0,
    };

    private static readonly logsRootDirectory = path.resolve(process.cwd(), 'logs');

    private static readonly logLevelPriority: Record<LogLevel, number> = {
        DEBUG: 10,
        INFO: 20,
        SUCCESS: 25,
        WARN: 30,
        ERROR: 40,
    };

    /**
     * Sets all test-related log information.
     *
     * Recommended for use inside the automatic fixture.
     */
    static setContext(context: LoggerContext): void {
        this.context = {
            ...this.context,
            ...context,
        };
    }

    /**
     * Maintained for compatibility with the existing base fixture.
     */
    static setTestName(testName: string): void {
        this.context.testName = testName;
    }

    /**
     * Clears all test context after test completion.
     */
    static clearContext(): void {
        this.context = {
            testName: 'Framework',
            projectName: 'N/A',
            workerIndex: -1,
            retry: 0,
        };
    }

    /**
     * Maintained for compatibility with the existing base fixture.
     */
    static clearTestName(): void {
        this.context.testName = 'Framework';
    }

    static debug(message: string, data?: unknown): void {
        this.write('DEBUG', message, data);
    }

    static info(message: string, data?: unknown): void {
        this.write('INFO', message, data);
    }

    static success(message: string, data?: unknown): void {
        this.write('SUCCESS', message, data);
    }

    static warn(message: string, data?: unknown): void {
        this.write('WARN', message, data);
    }

    static error(message: string, error?: unknown): void {
        this.write('ERROR', message, error);
    }

    static step(message: string, data?: unknown): void {
        this.write('INFO', `STEP: ${message}`, data);
    }

    /**
     * Writes a test-start separator.
     */
    static testStarted(title: string): void {
        this.separator(`TEST STARTED: ${title}`);
    }

    /**
     * Writes a test-completion separator.
     */
    static testCompleted(title: string): void {
        this.separator(`TEST COMPLETED: ${title}`);
    }

    /**
     * Creates a visual separator in both console and log file.
     */
    static separator(title?: string): void {
        const line = '='.repeat(110);

        const content = title ? `\n${line}\n${title}\n${line}\n` : `\n${line}\n`;

        process.stdout.write(chalk.magentaBright(content));
        this.writeRaw(content);
    }

    private static write(level: LogLevel, message: string, data?: unknown): void {
        if (!this.shouldLog(level)) {
            return;
        }
        const logEntry = this.buildLogEntry(level, message, data);
        this.writeToConsole(level, logEntry);
        this.writeRaw(`${logEntry}\n`);
    }

    private static buildLogEntry(level: LogLevel, message: string, data?: unknown): string {
        const timestamp = this.getTimestamp();
        const testName = this.context.testName || 'Framework';
        const projectName = this.context.projectName || 'N/A';
        const workerIndex = this.context.workerIndex ?? -1;
        const retry = this.context.retry ?? 0;

        let logEntry =
            `[${timestamp}] ` +
            `[${level.padEnd(7)}] ` +
            `[PID:${process.pid}] ` +
            `[WORKER:${workerIndex}] ` +
            `[PROJECT:${projectName}] ` +
            `[RETRY:${retry}] ` +
            `[TEST:${testName}] ` +
            `${message}`;

        if (data !== undefined) {
            logEntry += `\n${this.formatData(data)}`;
        }

        return logEntry;
    }

    private static shouldLog(level: LogLevel): boolean {
        const configuredLevel = this.getConfiguredLogLevel();

        return this.logLevelPriority[level] >= this.logLevelPriority[configuredLevel];
    }

    private static getConfiguredLogLevel(): LogLevel {
        const configuredLevel = process.env.LOG_LEVEL?.trim().toUpperCase();
        const validLevels: LogLevel[] = ['DEBUG', 'INFO', 'SUCCESS', 'WARN', 'ERROR'];

        if (configuredLevel && validLevels.includes(configuredLevel as LogLevel)) {
            return configuredLevel as LogLevel;
        }

        return 'INFO';
    }

    private static writeRaw(content: string): void {
        try {
            const logFilePath = this.getDailyLogFilePath();

            /*
             * A complete log entry is written in one call.
             * This reduces interleaving when multiple workers run.
             */
            fs.appendFileSync(logFilePath, this.stripAnsi(content), {
                encoding: 'utf8',
            });
        } catch (error) {
            console.error('[LOGGER ERROR] Unable to write log file:', error);
        }
    }

    /**
     * Creates:
     *
     * logs/
     * └── 2026-07-29/
     *     └── automation-2026-07-29.log
     */
    private static getDailyLogFilePath(): string {
        const currentDate = this.getCurrentDate();
        const dailyDirectory = path.join(this.logsRootDirectory, currentDate);
        fs.mkdirSync(dailyDirectory, { recursive: true });
        return path.join(dailyDirectory, `automation-${currentDate}.log`);
    }

    private static getCurrentDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private static getTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();

        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day} ` + `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    private static formatData(data: unknown): string {
        if (data instanceof Error) {
            return this.stripAnsi(data.stack ?? data.message);
        }

        if (typeof data === 'string') {
            return this.stripAnsi(data);
        }

        try {
            return this.stripAnsi(
                util.inspect(data, {
                    depth: 10,
                    colors: false,
                    compact: false,
                    breakLength: 120,
                    maxArrayLength: 100,
                    maxStringLength: 10_000,
                }),
            );
        } catch (error) {
            return `[Unable to format log data: ${
                error instanceof Error ? error.message : String(error)
            }]`;
        }
    }

    private static stripAnsi(value: string): string {
        return value
            .replace(new RegExp(String.raw`\x1B\[[0-?]*[ -/]*[@-~]`, 'g'), '')
            .replace(/\\x1B\[[0-?]*[ -/]*[@-~]/gi, '');
    }

    private static writeToConsole(level: LogLevel, message: string): void {
        switch (level) {
            case 'DEBUG':
                console.debug(chalk.gray(message));
                break;

            case 'INFO':
                console.log(chalk.cyan(message));
                break;

            case 'SUCCESS':
                console.log(chalk.green.bold(message));
                break;

            case 'WARN':
                console.warn(chalk.yellow.bold(message));
                break;

            case 'ERROR':
                console.error(chalk.red.bold(message));
                break;

            default:
                console.log(message);
        }
    }
}
