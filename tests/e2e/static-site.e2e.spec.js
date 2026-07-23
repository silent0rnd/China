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

test('способы доставки образуют единый адаптивный коридор с рабочим CTA', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#delivery').scrollIntoViewIfNeeded();

  await expect(page.locator('#delivery .delivery-card')).toHaveCount(3);
  await expect(page.locator('#delivery .delivery-track')).toBeVisible();

  const icon = page.locator('#delivery .delivery-card__visual').first();
  const transformBefore = await icon.evaluate((element) => window.getComputedStyle(element).transform);
  await page.locator('#delivery .delivery-card').first().hover();
  await page.waitForTimeout(380);
  const transformAfter = await icon.evaluate((element) => window.getComputedStyle(element).transform);
  expect(transformAfter).not.toBe(transformBefore);

  await page.getByRole('button', { name: 'Подобрать способ доставки', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Подобрать способ доставки' })).toBeVisible();
});

test('mobile-коридор способов доставки не создаёт переполнение и уважает reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#delivery').scrollIntoViewIfNeeded();

  const geometry = await page.locator('#delivery').evaluate((section) => {
    const track = section.querySelector('.delivery-track');
    const card = section.querySelector('.delivery-card');
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      noOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
      verticalTrack: trackRect.height > trackRect.width,
      cardVisible: cardRect.height > 0 && window.getComputedStyle(card).opacity !== '0',
    };
  });

  expect(geometry.noOverflow).toBe(true);
  expect(geometry.verticalTrack).toBe(true);
  expect(geometry.cardVisible).toBe(true);
});
