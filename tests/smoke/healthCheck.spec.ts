import { test, expect } from '@playwright/test';
import { LoginPage } from '@src/pages/authentication/LoginPage';
import { DashboardPage } from '@src/pages/dashboard/DashboardPage';
import { config } from '@src/config/environment';

test.use({
    storageState: { cookies: [], origins: [] },
});

test('Verify member login and logout functionality @Smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login flow
    await loginPage.login(config.membername, config.password);
    await expect(page).toHaveURL('/dashboard');

    // Logout flow
    await dashboardPage.logout();
    await expect(page).toHaveURL('/login');
});
