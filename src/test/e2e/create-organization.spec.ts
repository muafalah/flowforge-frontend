import { test, expect } from "@playwright/test";

/**
 * Helper to mock the common auth APIs and set up a logged-in session.
 * After calling this, the user is "logged in" with mocked tokens.
 */
async function mockAuthAPIs(
  page: import("@playwright/test").Page,
  organizations: unknown[] = []
) {
  // Mock login
  await page.route("**/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessToken: "mocked-access-token",
          refreshToken: "mocked-refresh-token",
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
          },
        },
        message: "Login successful",
      }),
    });
  });

  // Mock refresh token
  await page.route("**/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessToken: "mocked-access-token-refreshed",
          refreshToken: "mocked-refresh-token-refreshed",
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
          },
        },
      }),
    });
  });

  // Mock get profile
  await page.route("**/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
          },
        },
      }),
    });
  });

  // Mock organizations list
  await page.route("**/v1/organizations", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: organizations,
          meta: {
            total: organizations.length,
            page: 1,
            limit: 10,
          },
        }),
      });
    } else if (route.request().method() === "POST") {
      // Mock create organization
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "org-new",
            name: body.name,
            createdAt: new Date().toISOString(),
          },
          message: "Organization created successfully",
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock logout
  await page.route("**/v1/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Logged out successfully" }),
    });
  });
}

test.describe("Create Organization Flow", () => {
  test("should redirect to create-organization after login when user has no orgs", async ({
    page,
  }) => {
    // User has no organizations
    await mockAuthAPIs(page, []);

    // Navigate to login
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();

    // Fill and submit login form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should be redirected to create-organization
    await expect(page).toHaveURL(/\/create-organization/);
    await expect(
      page.getByText(/create your organization/i)
    ).toBeVisible();
  });

  test("should create organization and redirect to dashboard", async ({
    page,
  }) => {
    // Start with no organizations
    await mockAuthAPIs(page, []);

    // Navigate directly to create-organization
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/create-organization/);

    // After creating an org, mock that the user now has organizations
    // so the OrganizationGuard lets them through
    await page.route("**/v1/organizations", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [{ id: "org-new", name: "My New Org" }],
            meta: { total: 1, page: 1, limit: 10 },
          }),
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: { id: "org-new", name: "My New Org" },
            message: "Organization created successfully",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Fill in organization name and submit
    await page.getByLabel(/organization name/i).fill("My New Org");
    await page.getByRole("button", { name: /create organization/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should prevent access to /dashboard when user has no organizations", async ({
    page,
  }) => {
    // User has no organizations
    await mockAuthAPIs(page, []);

    // Log in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to create-organization
    await expect(page).toHaveURL(/\/create-organization/);

    // Try to navigate to dashboard directly
    await page.goto("/dashboard");

    // Should be redirected back to create-organization
    await expect(page).toHaveURL(/\/create-organization/);
  });

  test("should show validation error for short organization name", async ({
    page,
  }) => {
    await mockAuthAPIs(page, []);

    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/create-organization/);

    // Type a name that's too short
    await page.getByLabel(/organization name/i).fill("AB");
    await page.getByRole("button", { name: /create organization/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least 3 characters/i)).toBeVisible();
  });

  test("should allow user to logout from create-organization page", async ({
    page,
  }) => {
    await mockAuthAPIs(page, []);

    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/create-organization/);

    // Click logout button in header
    await page.locator("#logout-button").click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
