import { test, expect } from '@playwright/test'

test.describe('Mobile Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage on mobile', async ({ page }) => {
    await expect(page).toHaveTitle(/DrawGuess/i)
    
    // Check if the main game area is visible
    const gameBoard = page.locator('[data-testid="game-board"]')
    await expect(gameBoard).toBeVisible()
  })

  test('should handle touch interactions', async ({ page }) => {
    // Check if canvas is present and responsive
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Simulate touch interaction
    const canvasBox = await canvas.boundingBox()
    if (canvasBox) {
      await page.touchscreen.tap(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test different mobile viewport sizes
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 360, height: 640 }, // Galaxy S5
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      
      // Check if layout adapts properly
      const gameBoard = page.locator('[data-testid="game-board"]')
      await expect(gameBoard).toBeVisible()
      
      // Ensure no horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width)
    }
  })

  test('should handle orientation changes', async ({ page }) => {
    // Test portrait orientation
    await page.setViewportSize({ width: 375, height: 667 })
    let gameBoard = page.locator('[data-testid="game-board"]')
    await expect(gameBoard).toBeVisible()

    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 })
    gameBoard = page.locator('[data-testid="game-board"]')
    await expect(gameBoard).toBeVisible()
  })
})