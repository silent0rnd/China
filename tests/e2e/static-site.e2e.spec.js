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

test('галерея не пересекается, FAQ идёт перед контактами, шапка не образует плашку', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#cargo').scrollIntoViewIfNeeded();

  const boxes = await page.locator('.cargo-card').evaluateAll((cards) => cards.map((card) => {
    const rect = card.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));

  for (let first = 0; first < boxes.length; first += 1) {
    for (let second = first + 1; second < boxes.length; second += 1) {
      const a = boxes[first];
      const b = boxes[second];
      const overlapsX = a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1;
      const overlapsY = a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1;
      expect(overlapsX && overlapsY).toBe(false);
    }
  }

  const structure = await page.locator('main').evaluate((main) => ({
    faq: [...main.children].findIndex((section) => section.id === 'faq'),
    contacts: [...main.children].findIndex((section) => section.id === 'contacts'),
  }));
  expect(structure.faq).toBeLessThan(structure.contacts);

  const headerBackdrop = await page.locator('.site-header').evaluate((header) => {
    const style = window.getComputedStyle(header, '::before');
    return { width: Number.parseFloat(style.width), border: style.borderBottomWidth };
  });
  expect(headerBackdrop.width).toBeGreaterThanOrEqual(1400);
  expect(headerBackdrop.border).toBe('0px');
});
