import { expect, test } from '@playwright/test';

test('отображает статические разделы и открывает фотографию', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Доставка спецтехники');
  await expect(page.locator('.cargo-card')).toHaveCount(6);
  await expect(page.locator('#process .route-step')).toHaveCount(6);
  await expect(page.locator('#faq details')).toHaveCount(10);

  await page.getByRole('button', {
    name: 'Гусеничная техника, закреплённая в транспортном кузове Техника в транспортном кузове',
    exact: true
  }).click();

  await expect(page.getByRole('dialog', {
    name: 'Гусеничная техника, закреплённая в транспортном кузове'
  })).toBeVisible();

  await page.getByRole('button', { name: 'Закрыть фотографию', exact: true }).click();
  await expect(page.getByRole('dialog', {
    name: 'Гусеничная техника, закреплённая в транспортном кузове'
  })).toBeHidden();
});

test('mobile-меню не создаёт горизонтальную прокрутку', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Открыть меню', exact: true });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole('link', { name: 'Контакты', exact: true }).last()).toBeVisible();

  const hasNoHorizontalScroll = await page.locator('html').evaluate(() => {
    window.scrollTo({ left: 999, top: window.scrollY });
    const hasHorizontalScroll = window.scrollX !== 0;
    window.scrollTo({ left: 0, top: window.scrollY });
    return !hasHorizontalScroll;
  });
  expect(hasNoHorizontalScroll).toBe(true);
});
