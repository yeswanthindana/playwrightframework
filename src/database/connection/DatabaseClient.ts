import { Pool, QueryResult, QueryResultRow } from 'pg';
import { Logger } from '@src/reporting/logging/Logger';
import { config } from '@src/config/environment';

export const db = new Pool({
    host: config.dbHost,
    port: Number(config.dbPort),
    member: config.dbMembername,
    password: config.dbPassword,
    database: config.dbName,
});

// Log unexpected pool errors
db.on('error', (err) => {
    Logger.error(`Database Pool Error: ${err.message}`);
});

//Execute SQL Query
export async function executeQuery<Row extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
): Promise<QueryResult<Row>> {
    const start = Date.now();
    try {
        const result = await db.query<Row>(sql, params);
        const paramsStr = params.length > 0 ? ` | params: ${JSON.stringify(params)}` : '';
        Logger.info(
            `SQL Executed (${Date.now() - start} ms) | rows : ${result.rowCount}${paramsStr} | ${sql}`,
        );
        return result;
    } catch (error: unknown) {
        const paramsStr = params.length > 0 ? ` | params: ${JSON.stringify(params)}` : '';
        Logger.error(`SQL Failed${paramsStr} | ${sql}`);
        Logger.error(error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// Close pool
let isDbClosed = false;
export async function closeDb(): Promise<void> {
    if (isDbClosed) {
        Logger.info(`Database Connection already closed`);
        return;
    }
    try {
        await db.end();
        isDbClosed = true;
        Logger.info(`Database Connection Closed`);
    } catch (err: any) {
        Logger.error(`Error closing database connection: ${err.message}`);
    }
}
