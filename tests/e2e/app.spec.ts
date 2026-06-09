import { expect, test } from '@playwright/test'

test('plays Zhuge Liang official dream to an ending', async ({ page }) => {
  await page.goto('/#/play/official-zhugeliang')
  await expect(page.getByRole('heading', { name: '五丈原最后一盏灯' })).toBeVisible()

  for (const label of ['出山相助', '联吴抗曹', '借势火攻', '明法治蜀', '鞠躬尽瘁', '传下遗策']) {
    await page.getByRole('button', { name: new RegExp(label) }).click()
  }

  await expect(page.getByRole('heading', { name: '遗策流光' })).toBeVisible()
})

test('creates a local sample and opens it from mine page', async ({ page }) => {
  await page.goto('/#/create')
  await page.getByRole('button', { name: /保存本地样例/ }).click()
  await page.getByRole('button', { name: /去复制分享链接/ }).click()
  await expect(page.getByRole('heading', { name: '我的梦境' })).toBeVisible()
  await page.getByRole('button', { name: '试玩' }).first().click()
  await expect(page.getByText('本机梦境')).toBeVisible()
})

test('creates a custom historical figure local sample', async ({ page }) => {
  await page.goto('/#/create')
  await page.getByRole('button', { name: '自定义人物' }).click()
  await page.getByLabel('人物姓名').fill('苏轼')
  await page.getByLabel('所处时代').fill('北宋')
  await page.getByLabel('人物标签').fill('词人,文臣')
  await page.getByLabel('梦境主题').fill('乌台诗案后的旷达之梦')
  await page.getByRole('button', { name: /保存本地样例/ }).click()
  await page.getByRole('button', { name: /去复制分享链接/ }).click()
  await expect(page.getByRole('heading', { name: '我的梦境' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '苏轼 · 乌台诗案后的旷达之梦' })).toBeVisible()
  await page.getByRole('button', { name: '试玩' }).first().click()
  await expect(page.getByRole('heading', { name: '苏轼 · 乌台诗案后的旷达之梦' })).toBeVisible()
})
