import { test, expect } from '@playwright/test';

test.describe('Sales Report App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Wait for the application to load
    await page.waitForLoadState('networkidle');

    // Check that the app loads
    await expect(page).toHaveTitle(/Sales Report/);

    // Check for company selector
    await expect(page.locator('[data-testid="company-selector"]')).toBeVisible();

    // Check for main navigation
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    // Sidebar should be collapsible on mobile
    await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
  });

  test('should have company selector visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that company selector is present
    await expect(page.locator('[data-testid="company-selector"]')).toBeVisible();
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we're on desktop viewport for easier navigation
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Click on customers navigation
    await page.locator('[data-testid="nav-customers"]').click();

    // Should show customers page content (no company selected message)
    await expect(page.locator('[data-testid="no-company-message"]')).toBeVisible();
  });

  test('should have theme toggle visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that theme toggle is present
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="accent-color-toggle"]')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we're on desktop viewport to avoid mobile overlay issues
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Click theme toggle
    await page.locator('[data-testid="theme-toggle"]').click();
    
    // Click dark mode option
    await page.locator('button:has-text("Dark")').click();
    
    // Check that dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should toggle dark mode on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Close sidebar if it's open (click outside or close button)
    try {
      await page.locator('[data-testid="sidebar-close"]').click({ timeout: 2000 });
    } catch {
      // Sidebar might already be closed, continue
    }

    // Click theme toggle
    await page.locator('[data-testid="theme-toggle"]').click();
    
    // Click dark mode option
    await page.locator('button:has-text("Dark")').click();
    
    // Check that dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should change accent color', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we're on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Click accent color toggle
    await page.locator('[data-testid="accent-color-toggle"]').click();
    
    // Click purple color option
    await page.locator('button:has-text("Purple")').click();
    
    // Check that purple accent is applied
    await expect(page.locator('html')).toHaveClass(/accent-purple/);
  });
});
