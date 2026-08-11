import dotenv from 'dotenv';
import path from 'path';

const environment = process.env.TEST_ENV || 'qa';

dotenv.config({
    path: path.resolve(__dirname, `${environment}.env`),
});

export const config = {
    baseURL: process.env.BASE_URL!,
    membername: process.env.TEST_USERNAME!,
    password: process.env.TEST_PASSWORD!,

    // Database configurations
    dbHost: process.env.DB_HOST!,
    dbPort: process.env.DB_PORT!,
    dbPassword: process.env.DB_PASSWORD!,
    dbMembername: process.env.DB_USER!,
    dbName: process.env.DB_NAME!,

    // Member configurations
    createdBy: Number(process.env.CREATED_BY || 50),
};
