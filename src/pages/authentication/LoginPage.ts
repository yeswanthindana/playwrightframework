import { Page, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';

export class LoginPage extends BasePage {
    private readonly membernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    constructor(page: Page) {
        super(page);
        this.membernameInput = page.getByProfile('textbox', { name: 'Email' });
        this.passwordInput = page.getByProfile('textbox', { name: 'Password' });
        this.loginButton = page.getByProfile('button', { name: 'Sign In' });
    }

    async login(membername: string, password: string) {
        await this.page.goto('/login');
        await this.membernameInput.fill(membername);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        await this.page.waitForURL(/dashboard/);
    }
}
