import type { Locator, Page } from '@playwright/test';

const DEFAULT_LOADING_TIMEOUT_MS = 60_000;
const DEFAULT_READY_TIMEOUT_MS = 30_000;

/** RM11 全屏 loading：居中 Logo + "loading" 文案 */
function pageLoadingLocator(page: Page) {
  return page.getByText(/^loading$/i);
}

/**
 * 等待 RM11 页面 loading 结束。
 * 若当前无 loading 指示器则立即返回，避免无谓等待。
 */
export async function waitForPageLoadingComplete(
  page: Page,
  timeoutMs = DEFAULT_LOADING_TIMEOUT_MS
): Promise<void> {
  const loading = pageLoadingLocator(page);
  if (await loading.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('等待页面 loading 结束…');
    await loading.first().waitFor({ state: 'hidden', timeout: timeoutMs });
    await page.waitForTimeout(300);
  }

  await page
    .waitForFunction(
      () => {
        const busy = document.querySelector('[aria-busy="true"]');
        if (busy instanceof HTMLElement && busy.offsetParent !== null) return false;
        const text = document.body.innerText.replace(/\s+/g, ' ').trim();
        if (/^loading\.?$/i.test(text)) return false;
        return true;
      },
      { timeout: timeoutMs }
    )
    .catch(() => {});

  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/** 等待走查锚点元素全部可见 */
export async function waitForElementsVisible(
  locators: Locator[],
  timeoutMs = DEFAULT_READY_TIMEOUT_MS
): Promise<void> {
  await Promise.all(locators.map((loc) => loc.waitFor({ state: 'visible', timeout: timeoutMs })));
}
