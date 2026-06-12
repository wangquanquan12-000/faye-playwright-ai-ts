import type { Locator, Page, TestInfo } from '@playwright/test';
import {
  inspectUiAndAssert,
  type UiInspectionOptions,
  type UiInspectionRunOptions,
  type UiInspectionRunResult,
} from './ui-inspection';

export type { UiInspectionRunOptions, UiInspectionRunResult };
export { assertVisualInspectionResults } from './ui-inspection';
import {
  ageGateInspection,
  homeSidebarInspection,
  landingAuthInspection,
  postSuccessInspection,
  promoLinkActiveInspection,
  promoLinkCreatedInspection,
  promoLinkEmptyInspection,
  promoLinkNewDefaultInspection,
  postDetailsInspection,
  publishFormInspection,
} from './ui-profiles';

/**
 * RM11 UI 设计规范 — 见 specs/rm11-ui-design-spec.md
 * 走查入口：inspectUiAndAssert / runUiInspection（src/helpers/ui-inspection.ts）
 */
export const RM11 = {
  Green: '#78DFB1',
  Red: '#F2514F',
  Black_01: '#222222',
  Grey_01: '#0D0D0D',
  Grey_02: '#221200',
  Line_01: '#332C1D',
  Line_02: '#4A412E',
  Line_03: '#B90332',
  Light_Yellow_01: '#FFDA91',
  Light_Yellow_02: '#B39966',
  Light_Yellow_03: '#806D49',
  Button_01_start: '#460443',
  Button_01_end: '#FE0127',
  Button_03: '#000000',
} as const;

export type Rm11ColorToken = keyof typeof RM11;

/** 设计稿字重标签 → 浏览器 font-weight 数值（Avenir 字族惯例） */
export type FontWeightLabel = 'Heavy' | 'Medium' | 'Book';

export const RM11_FONT_WEIGHT: Record<
  FontWeightLabel,
  { css: number; familyKeywords: string[] }
> = {
  Heavy: { css: 800, familyKeywords: ['heavy', 'black'] },
  Medium: { css: 500, familyKeywords: ['medium'] },
  Book: { css: 400, familyKeywords: ['book', 'roman', 'regular'] },
};

/** CSS font-weight 比对容差（±100，即相邻一个字重档位） */
const FONT_WEIGHT_CSS_TOLERANCE = 100;

export const RM11_TYPE = {
  Type_01: { fontSize: 20, weightLabel: 'Heavy' as const },
  Type_02: { fontSize: 16, weightLabel: 'Heavy' as const },
  Type_03: { fontSize: 16, weightLabel: 'Medium' as const },
  Type_04: { fontSize: 14, weightLabel: 'Medium' as const },
  Type_05: { fontSize: 14, weightLabel: 'Medium' as const },
  Type_06: { fontSize: 12, weightLabel: 'Book' as const },
  Type_07: { fontSize: 14, weightLabel: 'Medium' as const },
  Type_08: { fontSize: 12, weightLabel: 'Medium' as const },
  Type_09: { fontSize: 10, weightLabel: '-' as const },
} as const;

export type Rm11TypeToken = keyof typeof RM11_TYPE;

/**
 * UI 图提取的特殊字型：标准 Type_xx 无对应「字号+字重」组合时登记于此。
 * 取值一律来自 design-refs/ 对应 UI 图，禁止在 profile 里放宽为 checkMinFontSize 或省略字重。
 * 登记表同步维护于 specs/rm11-ui-design-spec.md §7.5。
 */
export const RM11_UI_SPECIAL_TYPE = {
  'promo-link-created:url': {
    ref: 'design-refs/promo-link/promo-link-created.png',
    fontSize: 14,
    weightLabel: 'Book' as const,
    note: '金框内链接 URL',
  },
  'promo-link-active:card-copy-link': {
    ref: 'design-refs/promo-link/promo-link-active.png',
    fontSize: 14,
    weightLabel: 'Heavy' as const,
    note: '卡片内描边 Copy Link 按钮文字',
  },
  'promo-link-active:card-title': {
    ref: 'design-refs/promo-link/promo-link-active.png',
    fontSize: 14,
    weightLabel: 'Heavy' as const,
    note: '卡片 Campaign Name 主标题（非页面大标题，勿用 Type_01）',
  },
  'promo-link-active:stat-value': {
    ref: 'design-refs/promo-link/promo-link-active.png',
    fontSize: 14,
    weightLabel: 'Heavy' as const,
    note: 'Claims/Clicks/Revenue 下方数值',
  },
} as const;

export type Rm11UiSpecialTypeKey = keyof typeof RM11_UI_SPECIAL_TYPE;

export function formatUiSpecialTypeLabel(key: Rm11UiSpecialTypeKey): string {
  const t = RM11_UI_SPECIAL_TYPE[key];
  return `特殊 UI 字型（${t.note}，${t.fontSize}px ${t.weightLabel}，${t.ref}）`;
}

/** 字重标签转 CSS font-weight 数值 */
export function fontWeightLabelToCss(label: FontWeightLabel): number {
  return RM11_FONT_WEIGHT[label].css;
}

/** 格式化字重比对说明（缺陷报告用） */
export function formatExpectedFontWeight(label: FontWeightLabel): string {
  return `${label}（font-weight: ${fontWeightLabelToCss(label)}）`;
}

const DEFAULT_TOLERANCE = 0.03;
const FONT_SIZE_TOLERANCE_PX = 1;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function parseCssColor(color: string): Rgb | null {
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith('#')) return hexToRgb(trimmed);
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }
  return null;
}

export function colorMatches(actual: string, expectedHex: string, tolerance = DEFAULT_TOLERANCE): boolean {
  const a = parseCssColor(actual);
  const e = hexToRgb(expectedHex);
  if (!a) return false;
  const maxDelta = 255 * tolerance;
  return (
    Math.abs(a.r - e.r) <= maxDelta &&
    Math.abs(a.g - e.g) <= maxDelta &&
    Math.abs(a.b - e.b) <= maxDelta
  );
}

export function fontFamilyMatchesAvenir(fontFamily: string): boolean {
  return /avenir/i.test(fontFamily);
}

export function fontSizeMatches(actualFontSize: string, expectedPx: number): boolean {
  const actual = parseFloat(actualFontSize);
  return Math.abs(actual - expectedPx) <= FONT_SIZE_TOLERANCE_PX;
}

/**
 * 比对字重：设计标签 → CSS font-weight。
 * 1. font-family 含 Avenir 字重变体名（如 "Avenir Heavy"）视为匹配
 * 2. 否则比对 font-weight 数值与标签映射值（容差 ±100）
 */
export function fontWeightMatches(
  actualWeight: string,
  fontFamily: string,
  weightLabel: FontWeightLabel | '-'
): boolean {
  if (weightLabel === '-') return true;

  const spec = RM11_FONT_WEIGHT[weightLabel];
  const family = fontFamily.toLowerCase();
  if (spec.familyKeywords.some((kw) => family.includes(kw))) return true;

  const w = parseInt(actualWeight, 10);
  if (Number.isNaN(w)) return false;
  return Math.abs(w - spec.css) <= FONT_WEIGHT_CSS_TOLERANCE;
}

export function hasPrimaryButtonGradient(backgroundImage: string, backgroundColor: string): boolean {
  if (/linear-gradient/i.test(backgroundImage)) return true;
  return (
    colorMatches(backgroundColor, RM11.Button_01_start) ||
    colorMatches(backgroundColor, RM11.Button_01_end)
  );
}

type VisualInspect = (
  page: Page,
  testInfo: TestInfo,
  runOptions?: UiInspectionRunOptions
) => Promise<UiInspectionRunResult | void>;

async function runInspect(
  page: Page,
  testInfo: TestInfo,
  factory: (page: Page) => UiInspectionOptions,
  runOptions?: UiInspectionRunOptions
): Promise<UiInspectionRunResult | void> {
  return inspectUiAndAssert(page, testInfo, factory(page), runOptions);
}

export const inspectAgeGateUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, ageGateInspection, runOptions);

export const inspectLandingAuthUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, landingAuthInspection, runOptions);

export const inspectHomeSidebarUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, homeSidebarInspection, runOptions);

export const inspectPostSuccessUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, postSuccessInspection, runOptions);

export const inspectPublishFormUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, publishFormInspection, runOptions);

export const inspectPostDetailsUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, postDetailsInspection, runOptions);

export const inspectPromoLinkEmptyUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, promoLinkEmptyInspection, runOptions);

export const inspectPromoLinkNewDefaultUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, promoLinkNewDefaultInspection, runOptions);

export const inspectPromoLinkCreatedUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, promoLinkCreatedInspection, runOptions);

export const inspectPromoLinkActiveUi: VisualInspect = (page, testInfo, runOptions) =>
  runInspect(page, testInfo, promoLinkActiveInspection, runOptions);
