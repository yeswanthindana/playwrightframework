import { APIRequestContext } from '@playwright/test';
import { Logger } from '@src/reporting/logging/Logger';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { randomUUID } from 'node:crypto';

export class BaseApiClient {
    protected request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    private sanitizeForLogging(value: unknown): unknown {
        const sensitiveKeys = new Set([
            'authorization',
            'cookie',
            'set-cookie',
            'password',
            'token',
            'access_token',
            'refresh_token',
            'api_token',
            'api_key',
            'client_secret',
            'ssh_password',
            'db_password',
        ]);

        const sanitize = (current: unknown): unknown => {
            if (Array.isArray(current)) {
                return current.map((item) => sanitize(item));
            }

            if (current && typeof current === 'object') {
                return Object.fromEntries(
                    Object.entries(current as Record<string, unknown>).map(
                        ([key, item]) => [
                            key,
                            sensitiveKeys.has(key.toLowerCase())
                                ? '[REDACTED]'
                                : sanitize(item),
                        ],
                    ),
                );
            }

            return current;
        };

        return sanitize(value);
    }

    public async sendRequest(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: string,
        options?: Record<string, unknown>,
    ) {
        const requestId = randomUUID();
        const startedAt = new Date();
        const startTime = Date.now();

        const suppliedHeaders =
            (options?.headers as Record<string, string> | undefined) ?? {};

        const requestHeaders = {
            ...suppliedHeaders,
            'x-automation-request-id': requestId,
        };

        const requestOptions = {
            ...options,
            headers: requestHeaders,
        };

        const requestMetadata = {
            requestId,
            startedAt: startedAt.toISOString(),
            method,
            url,
            environment: process.env.TEST_ENV ?? 'qa',
            headers: this.sanitizeForLogging(requestHeaders),
            queryParameters: this.sanitizeForLogging(options?.params),
            body: this.sanitizeForLogging(options?.data),
        };

        Logger.info('[API REQUEST]', requestMetadata);

        await AllureUtil.attachApiRequest(
            `${method} ${url} [${requestId}]`,
            {
                method,
                url,
                headers: requestHeaders,
                queryParameters:
                    options?.params as Record<string, unknown> | undefined,
                body: options?.data,
            },
        );

        try {
            await AllureUtil.attachApiRequest(`${method} ${url}`, {
                method,
                url,
                headers: options?.headers as Record<string, unknown> | undefined,
                queryParameters: options?.params as Record<string, unknown> | undefined,
                body: options?.data,
            });
        } catch {
            // Ignore if not running in test context
        }

        //const startTIme = Date.now();
        let response;
        let currentUrl = url;
        let redirectCount = 0;
        const maxRedirects = 5;

        try {
            while (true) {
                const redirectedRequestOptions = {
                    ...requestOptions,
                    maxRedirects: 0,
                };

                switch (method) {
                    case 'GET':
                        response = await this.request.get(currentUrl, redirectedRequestOptions);
                        break;
                    case 'POST':
                        response = await this.request.post(currentUrl, redirectedRequestOptions);
                        break;
                    case 'PUT':
                        response = await this.request.put(currentUrl, redirectedRequestOptions);
                        break;
                    case 'DELETE':
                        response = await this.request.delete(currentUrl, redirectedRequestOptions);
                        break;
                    case 'PATCH':
                        response = await this.request.patch(currentUrl, redirectedRequestOptions);
                        break;
                    default:
                        throw new Error(`Unknown Method ${method}`);
                }

                const status = response.status();
                if (status >= 300 && status < 400 && redirectCount < maxRedirects) {
                    const facility = response.headers()['facility'];
                    if (facility) {
                        currentUrl = facility.startsWith('http://')
                            ? facility.replace('http://', 'https://')
                            : facility;
                        redirectCount++;
                        Logger.info(`[API Redirect] Following redirect (${redirectCount}): ${currentUrl}`);
                        continue;
                    }
                }
                break;
            }
        } catch (error) {
            const err = error as Error;
            const errorMsg = `API Request Failed: ${method} | URL : ${url} | Error ${err?.message || error}`;
            Logger.error(errorMsg);
            try {
                await AllureUtil.attachError(`API Request Error - ${method} ${url}`, error);
            } catch {
                // Ignore
            }
            throw error;
        }
        const duration = Date.now() - startTime;
        Logger.info(
            `[API RESPONSE] Status: ${response.status()} | Duration: ${duration}ms | URL: ${url}`,
        );

        const headers = response.headers();
        Logger.info(`[API RESPONSE] Headers: ${JSON.stringify(headers, null, 2)}`);

        try {
            const bodyText = await response.text();
            try {
                const bodyJson = JSON.parse(bodyText);
                Logger.info(`[API RESPONSE Body] : ${JSON.stringify(bodyJson, null, 2)}`);
            } catch {
                if (bodyText) {
                    Logger.info(`[API RESPONSE Body] : ${bodyText}`);
                }
            }
        } catch {
            // Ignore if body reading fails
        }

        try {
            await AllureUtil.attachPlaywrightApiResponse(`${method} ${url}`, response);
        } catch {
            // Ignore if not running in test context
        }

        return response;
    }
}
