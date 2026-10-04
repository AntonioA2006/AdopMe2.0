import { test, expect } from '@playwright/test';

test('abre el test de compatibilidad y muestra resultados', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-quiz]').first().click();
  const quizForm = page.locator('#compatibility-form');

  await quizForm.locator('select[name="hogar"]').selectOption('departamento');
  await quizForm.locator('select[name="tiempo"]').selectOption('poco');
  await quizForm.locator('select[name="experiencia"]').selectOption('primera');
  await quizForm.locator('select[name="preferencia"]').selectOption('gato');
  await quizForm.locator('button[type="submit"]').click();

  await expect(page.locator('#quiz-result')).toBeVisible();
  await expect(page.locator('.quiz-result-item')).toHaveCount(3);
});

test('muestra la sección de refugios', async ({ page }) => {
  await page.goto('/#refugios');
  await expect(page.locator('#refuges-title')).toBeVisible();
  await expect(page.locator('.refuge-list-item')).toHaveCount(4);
});
