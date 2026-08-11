import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TEST_CASE_ID_PATTERN = /\bTC-[A-Z0-9-]+-\d+\b/gi;

async function collectSpecFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...(await collectSpecFiles(entryPath)));
        else if (entry.isFile() && entry.name.endsWith('.spec.ts')) files.push(entryPath);
    }
    return files;
}

export async function discoverTestCaseFiles(testsDirectory = path.resolve('tests')) {
    const discovered = new Map();
    const files = await collectSpecFiles(testsDirectory);

    for (const file of files.sort()) {
        const content = await fs.readFile(file, 'utf8');
        const testCaseIds = new Set(
            [...content.matchAll(TEST_CASE_ID_PATTERN)].map((match) => match[0].toUpperCase()),
        );
        const relativeFile = path.relative(process.cwd(), file).split(path.sep).join('/');

        for (const testCaseId of testCaseIds) {
            const existingFile = discovered.get(testCaseId);
            if (existingFile && existingFile !== relativeFile) {
                throw new Error(
                    `Test Case ID ${testCaseId} appears in multiple spec files: ` +
                        `${existingFile}, ${relativeFile}`,
                );
            }
            discovered.set(testCaseId, relativeFile);
        }
    }

    return discovered;
}
