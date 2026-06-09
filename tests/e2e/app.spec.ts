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
