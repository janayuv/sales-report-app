import { test, expect } from '@playwright/test';

test.describe('Sales Report App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Wait for the application to load
    await page.waitForLoadState('networkidle');

    // Check that the app loads
    await expect(page).toHaveTitle(/Sales Report/);

    // Check for sidebar (on mobile it might be collapsed)
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // On mobile, sidebar is collapsed by default
      await expect(page.locator('[data-sidebar="trigger"]')).toBeVisible();
    } else {
      // On desktop, sidebar should be visible
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    }

    // Check for main navigation (open sidebar on mobile first)
    if (viewport && viewport.width < 768) {
      await page.locator('[data-sidebar="trigger"]').click();
    }
    
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

    // On mobile, open sidebar first
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.locator('[data-sidebar="trigger"]').click();
    }

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

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Should show customers page content
    await expect(page.locator('[data-testid="customers-page"]')).toBeVisible();
    
    // Should show the customers heading
    await expect(page.locator('h2:has-text("Customers")')).toBeVisible();
  });

  test('should have theme toggle visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // On mobile, open sidebar first
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await page.locator('[data-sidebar="trigger"]').click();
    }

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

    // Set to mobile viewport - this will trigger mobile sidebar to open
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Check if mobile sidebar is open and close it by clicking the overlay
    const sidebarOverlay = page.locator('[data-slot="sheet-overlay"]');
    if (await sidebarOverlay.isVisible()) {
      // Click on the overlay to close the sidebar
      await sidebarOverlay.click();
      await page.waitForTimeout(500);
    }

    // Alternative: try clicking the sidebar trigger to close it
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
      await page.waitForTimeout(500);
    }

    // Force click the theme toggle with retry
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click({ force: true });
    
    // Wait a moment for the menu to appear
    await page.waitForTimeout(1000);
    
    // Debug: Check if theme menu is visible
    const themeMenu = page.locator('[data-testid="theme-toggle"]').locator('..').locator('div').filter({ hasText: 'Dark' });
    const isMenuVisible = await themeMenu.isVisible();
    console.log('Theme menu visible:', isMenuVisible);
    
    // Try to find the dark mode button with different selectors
    const darkButton = page.locator('button:has-text("Dark")');
    const darkButtonCount = await darkButton.count();
    console.log('Dark button count:', darkButtonCount);
    
    if (darkButtonCount > 0) {
      await darkButton.first().click({ force: true });
    } else {
      // Fallback: try to click the theme toggle again
      await themeToggle.click({ force: true });
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Dark")').first().click({ force: true });
    }
    
    // Check that dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should change accent color', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure we're on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for the page to settle
    await page.waitForTimeout(1000);

    // Ensure sidebar is closed to avoid overlay interference
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
      // Wait for sidebar to close
      await page.waitForTimeout(500);
    }

    // Wait for any overlays to disappear
    await page.waitForTimeout(500);

    // Click accent color toggle with force to bypass any overlays
    const accentToggle = page.locator('[data-testid="accent-color-toggle"]');
    await accentToggle.click({ force: true });
    
    // Click purple color option
    await page.locator('button:has-text("Purple")').click();
    
    // Check that purple accent is applied
    await expect(page.locator('html')).toHaveClass(/accent-purple/);
  });
});
