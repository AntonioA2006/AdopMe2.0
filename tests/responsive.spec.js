import { expect, test } from '@playwright/test';

const WIDTHS = [320, 375, 414, 768, 1024, 1440];

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function expectInside(page, selector, width) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  expect(await overflow(page)).toBeLessThanOrEqual(1);
}

test.describe('layout en distintos anchos', () => {
  for (const width of WIDTHS) {
    test(`no hay desbordamiento y el match se ve completo a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('.recommendation-card')).toHaveCount(3);
      expect(await overflow(page)).toBeLessThanOrEqual(1);

      const cards = await page.locator('.recommendation-card').evaluateAll((nodes) => {
        const view = window.innerWidth;
        return nodes.map((card) => {
          const rect = card.getBoundingClientRect();
          const button = card.querySelector('.meet-button').getBoundingClientRect();
          const badge = card.querySelector('.match-badge').getBoundingClientRect();
          const name = card.querySelector('h3').getBoundingClientRect();
          const inside = (box) => box.left >= rect.left - 1 && box.right <= rect.right + 1;
          return {
            withinView: rect.left >= -1 && rect.right <= view + 1,
            buttonInside: inside(button),
            badgeInside: inside(badge),
            nameInside: inside(name)
          };
        });
      });

      for (const card of cards) {
        expect(card.withinView).toBe(true);
        expect(card.buttonInside).toBe(true);
        expect(card.badgeInside).toBe(true);
        expect(card.nameInside).toBe(true);
      }

      await page.locator('#auth-trigger').click();
      await expect(page.locator('#auth-dialog')).toBeVisible();
      await expectInside(page, '#auth-dialog', width);
      await page.locator('#auth-switch').click();
      await expect(page.locator('#register-form')).toBeVisible();
      await expectInside(page, '#auth-dialog', width);
      await page.locator('#auth-close').click();

      await page.locator('footer [data-open-refuge]').click();
      await expect(page.locator('#refuge-dialog')).toBeVisible();
      await expectInside(page, '#refuge-dialog', width);
      await page.locator('#refuge-dialog [data-close-dialog]').click();

      await page.locator('[data-open-quiz]').click();
      await expect(page.locator('#compatibility-dialog')).toBeVisible();
      await expectInside(page, '#compatibility-dialog', width);
      await page.locator('#quiz-close').click();
    });
  }

  for (const width of [375, 768]) {
    test(`el formulario de solicitud cabe a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#auth-trigger').click();
      await page.locator('#auth-switch').click();
      await page.locator('#register-form input[name="nombre"]').fill('Ana Pérez');
      await page.locator('#register-form input[name="correo"]').fill(`ana-${width}@correo.com`);
      await page.locator('#register-form input[name="password"]').fill('Clave1234');
      await page.locator('#register-form button[type="submit"]').click();
      await expect(page.locator('#auth-trigger')).toHaveText('Salir');

      await page.locator('.recommendation-card .meet-button').first().click();
      await expect(page.locator('#adoption-dialog')).toBeVisible();
      await expectInside(page, '#adoption-dialog', width);
    });
  }
});
