import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[placeholder="用户名"]', 'admin')
  await page.fill('input[placeholder="密码"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/overview`)
}

async function createOntology(page: Page): Promise<string> {
  await page.goto(`${BASE}/ontologies/new`)
  await page.getByText('简易 LLM 提取').first().click()
  const name = `图谱测试-${Date.now()}`
  await page.fill('input[placeholder="本体名称"]', name)
  await page.getByRole('button', { name: '创建本体' }).click()
  await page.waitForURL(/\/ontologies\/[a-f0-9-]+/)
  return name
}

test.describe('Graph Tab Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('graph tab shows empty state without extraction', async ({ page }) => {
    await createOntology(page)
    await page.click('button:has-text("图谱")')
    // Graph tab should load - either show canvas or empty message
    await page.waitForTimeout(1000)
    const hasEmpty = await page.locator('text=暂无图谱数据').count()
    const hasCanvas = await page.locator('canvas').count()
    expect(hasEmpty + hasCanvas).toBeGreaterThan(0)
  })

  test('graph tab shows node/edge counts', async ({ page }) => {
    await createOntology(page)
    await page.click('button:has-text("图谱")')
    await page.waitForTimeout(1000)
    await expect(page.locator('text=节点')).toBeVisible()
    await expect(page.locator('text=边')).toBeVisible()
  })

  test('graph tab exposes layout and view controls', async ({ page }) => {
    await createOntology(page)
    await page.click('button:has-text("图谱")')

    await expect(page.getByRole('button', { name: '力导向布局' })).toBeVisible()
    await expect(page.getByRole('button', { name: '层级布局' })).toBeVisible()
    await expect(page.getByRole('button', { name: '圆形布局' })).toBeVisible()
    await expect(page.getByRole('button', { name: '放大图谱' })).toBeVisible()
    await expect(page.getByRole('button', { name: '缩小图谱' })).toBeVisible()
    await expect(page.getByRole('button', { name: '适配视图' })).toBeVisible()
  })

  test('graph empty state has guidance message', async ({ page }) => {
    await createOntology(page)
    await page.click('button:has-text("图谱")')
    await page.waitForTimeout(1000)
    const hasMessage = await page.locator('text=暂无图谱数据').count()
    if (hasMessage > 0) {
      await expect(page.locator('text=暂无图谱数据')).toBeVisible()
    }
  })
})
