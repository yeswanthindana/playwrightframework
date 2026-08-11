import fs from 'fs';
import path from 'path';

export class JsonDataUtil {
    private static readonly filePath = path.resolve(
        process.cwd(),
        'test-results',
        'runtime-data.json',
    );

    private static ensureFileExists(): void {
        const directory = path.dirname(this.filePath);

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
        }
    }

    static saveValue<T>(key: string, value: T): void {
        this.ensureFileExists();

        const existingData = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));

        existingData[key] = value;

        fs.writeFileSync(this.filePath, JSON.stringify(existingData, null, 2));
    }

    static getValue<T>(key: string): T {
        this.ensureFileExists();

        const existingData = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));

        if (!(key in existingData)) {
            throw new Error(`Runtime value '${key}' was not found in ${this.filePath}`);
        }

        return existingData[key] as T;
    }

    static removeValue(key: string): void {
        this.ensureFileExists();

        const existingData = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));

        delete existingData[key];

        fs.writeFileSync(this.filePath, JSON.stringify(existingData, null, 2));
    }

    static clear(): void {
        this.ensureFileExists();

        fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
    }
}
