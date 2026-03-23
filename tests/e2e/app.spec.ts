import { test, expect } from '@playwright/test'

test.describe('AI Code Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application', async ({ page }) => {
    await expect(page.locator('text=AI Code Studio')).toBeVisible()
  })

  test('should show command palette on Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await expect(page.locator('text=Command Palette')).toBeVisible()
  })

  test('should toggle sidebar on Cmd+B', async ({ page }) => {
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    
    await page.keyboard.press('Meta+b')
    await expect(sidebar).not.toBeVisible()
    
    await page.keyboard.press('Meta+b')
    await expect(sidebar).toBeVisible()
  })

  test('should toggle terminal on Cmd+J', async ({ page }) => {
    await page.keyboard.press('Meta+j')
    await expect(page.locator('text=Terminal')).toBeVisible()
    
    await page.keyboard.press('Meta+j')
    await expect(page.locator('text=Terminal')).not.toBeVisible()
  })

  test('should show keyboard shortcuts modal', async ({ page }) => {
    await page.goto('/')
    await page.click('button[title="Keyboard Shortcuts"]')
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible()
  })

  test('should show settings modal', async ({ page }) => {
    await page.click('button[title="Settings"]')
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should show theme selector', async ({ page }) => {
    await page.click('button[title="Theme Settings"]')
    await expect(page.locator('text=Select Theme')).toBeVisible()
  })

  test('should show empty workspace message', async ({ page }) => {
    await expect(page.locator('text=Start building')).toBeVisible()
  })

  test('should show framework options', async ({ page }) => {
    await expect(page.locator('text=React')).toBeVisible()
    await expect(page.locator('text=Next.js')).toBeVisible()
    await expect(page.locator('text=Node.js')).toBeVisible()
  })

  test('should switch between left panel tabs', async ({ page }) => {
    await page.click('button[title="Search"]')
    await expect(page.locator('text=Search in all files')).toBeVisible()
    
    await page.click('button[title="Git"]')
    await expect(page.locator('text=Source Control')).toBeVisible()
  })

  test('should show activity bar icons', async ({ page }) => {
    await expect(page.locator('button[title="Explorer"]')).toBeVisible()
    await expect(page.locator('button[title="Search"]')).toBeVisible()
    await expect(page.locator('button[title="Git"]')).toBeVisible()
  })

  test('should show run button', async ({ page }) => {
    const runButton = page.locator('button:has-text("Run")')
    await expect(runButton).toBeVisible()
    await expect(runButton).toBeDisabled()
  })

  test('should show AI panel by default', async ({ page }) => {
    await expect(page.locator('text=Chat')).toBeVisible()
  })

  test('should toggle AI panel on Cmd+Shift+B', async ({ page }) => {
    const aiPanel = page.locator('text=Chat').first()
    
    await page.keyboard.press('Meta+Shift+b')
    await expect(aiPanel).not.toBeVisible()
    
    await page.keyboard.press('Meta+Shift+b')
    await expect(aiPanel).toBeVisible()
  })
})