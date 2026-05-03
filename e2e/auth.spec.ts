import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page and handle successful login', async ({ page }) => {
    // 1. Mock the API response for the login request
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            accessToken: 'mocked-jwt-token',
            refreshToken: 'mocked-refresh-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
            },
          },
          message: 'Login successful',
        }),
      });
    });

    // Mock the user profile request that might happen after login
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        }),
      });
    });

    // 2. Navigate to the login page
    await page.goto('/login');

    // 3. Verify the page is loaded correctly (checking for common login elements)
    // Adjust these selectors based on your actual UI implementation
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Fill out the form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit the form
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // 4. Verify successful redirection or state change
    // Assuming successful login redirects to dashboard or home
    await expect(page).toHaveURL(/\/(dashboard)?/);
  });
});
