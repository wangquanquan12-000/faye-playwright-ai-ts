import * as fs from 'fs';
import * as path from 'path';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { waitForElementsVisible, waitForPageLoadingComplete } from './page-ready';
import {
  RM11,
  RM11_TYPE,
  RM11_UI_SPECIAL_TYPE,
  colorMatches,
  fontWeightMatches,
  fontSizeMatches,
  fontFamilyMatchesAvenir,
  formatExpectedFontWeight,
  formatUiSpecialTypeLabel,
  hasPrimaryButtonGradient,
  type FontWeightLabel,
  type Rm11TypeToken,
  type Rm11UiSpecialTypeKey,
} from './ui-design';
import {
  runVisionInspection,
  type UiVisionCheck,
  type UiVisionOptions,
} from './ui-vision';

/** 走查缺陷 — 与 specs/rm11-ui-design-spec.md 输出格式一致 */
export interface UiDefect {
  element: string;
  issue_type: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

/**
 * 单项检查结果（无论通过/失败都生成一条），用于报告中完整列出验证元素、预期、实际。
 * 失败项额外带 issue_type / severity，并在控制台/截图以红色标注。
 */
export interface UiCheckResult {
  /** 元素名 */
  element: string;
  /** 检查项：可见性 / 颜色 / 字号 / 字重 / 字体 / 主按钮渐变 / 最小字号 / 文本溢出 / 对齐 / 页面背景 / 占位取样 */
  check: string;
  /** 预期值 */
  expected: string;
  /** 实际值 */
  actual: string;
  /** 结果状态 */
  status: 'passed' | 'failed';
  /** 失败标记，便于在 JSON 中快速识别（通过项为空字符串） */
  mark: string;
  /** 失败时的问题类型 */
  issue_type?: string;
  /** 失败时的严重度 */
  severity?: 'High' | 'Medium' | 'Low';
}

/** 失败项报告条目（仅写入 `<scene>.failed.json`，带 id 便于与截图标注对照） */
export interface UiFailedCheckResult extends UiCheckResult {
  status: 'failed';
  id: string;
}

export interface UiElementSpec {
  /** 元素名称，用于缺陷报告 */
  name: string;
  locator: Locator;
  /** 期望文字颜色 Token */
  color?: keyof typeof RM11;
  colorProperty?: 'color' | 'backgroundColor';
  /** 期望字体规格 Type_xx（与 uiType 二选一） */
  type?: Rm11TypeToken;
  /** UI 图特殊字型（登记于 RM11_UI_SPECIAL_TYPE / §7.5，与 type 二选一） */
  uiType?: Rm11UiSpecialTypeKey;
  /** 期望主按钮渐变 Button_01 */
  primaryButton?: boolean;
  /** 是否检查文本截断/溢出 */
  checkOverflow?: boolean;
  /** 是否检查字号不低于 Type_09 (10px) */
  checkMinFontSize?: boolean;
  /** 元素不存在时不记为缺陷 */
  optional?: boolean;
  /**
   * 从 `::placeholder` 伪元素读取 color / 字号 / 字重（勿读 input/textarea 本体 color，那是已输入文字色）。
   * 凡校验「占位文案」时必须设为 true。
   */
  samplePlaceholderStyle?: boolean;
}

export interface UiInspectionOptions {
  /** 场景名称，用于截图文件名 */
  scene: string;
  elements: UiElementSpec[];
  /** 检查一组元素左对齐是否一致（如侧栏） */
  alignmentGroup?: { name: string; locators: Locator[] };
  /** 检查页面背景 Grey_01 */
  checkPageBackground?: boolean;
  /** 走查前等待全屏 loading 结束（默认 true） */
  waitForLoading?: boolean;
  /** 走查前等待必选元素出现的超时（毫秒） */
  readyTimeout?: number;
  /** 可选 Midscene 视觉语义辅助断言（仅 UI_VISION=1 时执行） */
  vision?: UiVisionOptions;
}

interface FailedMarkCandidate {
  element: string;
  check: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 截图标注：精准矩形 + id 标签 */
interface AnnotatedMark {
  id: string;
  element: string;
  check: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const UI_DEFECTS_DIR = path.join(process.cwd(), 'reports', 'ui-defects');

/**
 * 单次「执行」标识：进程加载时生成一次，同一次 `playwright test` 运行内的所有 scene 共用。
 * 格式 `YYYY-MM-DD_HH-mm-ss`（避免冒号，兼容各系统文件名）。
 */
function formatRunStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
  );
}

/** 本次执行的时间戳（用于子文件夹名 + 文件名后缀） */
const RUN_STAMP = formatRunStamp(new Date());
/** 本次执行的独立子文件夹：reports/ui-defects/<时间戳>/ */
const RUN_DIR = path.join(UI_DEFECTS_DIR, RUN_STAMP);

/**
 * 本次执行内、按页面功能名（scene）生成独立文件，文件名仅用页面名（时间体现在子文件夹）。
 * 每次执行写入各自时间戳子文件夹，互不覆盖、不再混到一起。
 */
function sceneArtifactPaths(scene: string) {
  const base = path.join(RUN_DIR, scene);
  return {
    passedJson: `${base}.passed.json`,
    failedJson: `${base}.failed.json`,
    defectPng: `${base}.png`,
  };
}

function assignFailedCheckIds(checks: UiCheckResult[]): UiFailedCheckResult[] {
  return checks
    .filter((c): c is UiCheckResult & { status: 'failed' } => c.status === 'failed')
    .map((c, index) => ({
      ...c,
      id: String(index + 1).padStart(3, '0'),
    }));
}

function buildFailedMarks(
  failedChecks: UiFailedCheckResult[],
  candidates: FailedMarkCandidate[]
): AnnotatedMark[] {
  const marks: AnnotatedMark[] = [];
  for (const check of failedChecks) {
    const candidate = candidates.find(
      (c) => c.element === check.element && c.check === check.check
    );
    if (!candidate) continue;
    marks.push({
      id: check.id,
      element: check.element,
      check: check.check,
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height,
    });
  }
  return marks;
}

/** 在本次执行子文件夹内累计写 summary.json，并在顶层维护指向最新执行的 latest-run.json */
function writeRunSummary(
  scene: string,
  testTitle: string,
  status: 'PASSED' | 'FAILED',
  defectCount: number
): void {
  const summaryPath = path.join(RUN_DIR, 'summary.json');
  let summary: Record<string, unknown> = {
    runStamp: RUN_STAMP,
    startedAt: new Date().toISOString(),
    scenes: {} as Record<string, unknown>,
  };
  if (fs.existsSync(summaryPath)) {
    try {
      summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    } catch {
      /* 忽略损坏的旧文件 */
    }
  }
  const scenes = (summary.scenes as Record<string, unknown>) ?? {};
  scenes[scene] = { testTitle, status, defectCount, checkedAt: new Date().toISOString() };
  summary.scenes = scenes;
  summary.updatedAt = new Date().toISOString();
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // 顶层指针，便于快速定位本次执行目录（不混放 scene 产物）
  fs.writeFileSync(
    path.join(UI_DEFECTS_DIR, 'latest-run.json'),
    JSON.stringify(
      { runStamp: RUN_STAMP, runDir: path.relative(process.cwd(), RUN_DIR), updatedAt: new Date().toISOString() },
      null,
      2
    )
  );
}

function severityFor(issueType: string): UiDefect['severity'] {
  if (/颜色|字体|渐变|背景/.test(issueType)) return 'High';
  if (/截断|溢出|重叠/.test(issueType)) return 'High';
  if (/对齐/.test(issueType)) return 'Medium';
  return 'Low';
}

function defect(
  element: string,
  issue_type: string,
  description: string,
  severity?: UiDefect['severity']
): UiDefect {
  return { element, issue_type, description, severity: severity ?? severityFor(issue_type) };
}

/** 通过项 */
function pass(element: string, check: string, expected: string, actual: string): UiCheckResult {
  return { element, check, expected, actual, status: 'passed', mark: '' };
}

/** 失败项（红色标注） */
function fail(
  element: string,
  check: string,
  expected: string,
  actual: string,
  issue_type: string,
  severity?: UiDefect['severity']
): UiCheckResult {
  return {
    element,
    check,
    expected,
    actual,
    status: 'failed',
    mark: '🔴 FAILED',
    issue_type,
    severity: severity ?? severityFor(issue_type),
  };
}

/** 将失败的检查结果转为缺陷（兼容既有缺陷汇总/抛错逻辑） */
export function checksToDefects(checks: UiCheckResult[]): UiDefect[] {
  return checks
    .filter((c) => c.status === 'failed')
    .map((c) =>
      defect(
        c.element,
        c.issue_type ?? c.check,
        `${c.check}：实际 ${c.actual}，预期 ${c.expected}`,
        c.severity
      )
    );
}

async function collectElementChecks(spec: UiElementSpec): Promise<UiCheckResult[]> {
  const checks: UiCheckResult[] = [];
  const visible = await spec.locator.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) {
    if (!spec.optional) {
      checks.push(
        fail(spec.name, '可见性', '元素可见', '元素未显示', '元素不可见', 'High')
      );
    }
    return checks;
  }

  checks.push(pass(spec.name, '可见性', '元素可见', '元素可见'));

  const styles = await spec.locator.evaluate(
    (el, samplePlaceholder) => {
      const box = {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };

      if (samplePlaceholder) {
        const tag = el.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          return {
            ...box,
            color: '',
            backgroundColor: '',
            backgroundImage: '',
            fontFamily: '',
            fontSize: '',
            fontWeight: '',
            textOverflow: '',
            overflow: '',
            placeholderSampled: false,
            placeholderSampleError: `元素 ${tag} 不支持 ::placeholder 取样`,
          };
        }
        const placeholder = el.getAttribute('placeholder');
        if (!placeholder) {
          return {
            ...box,
            color: '',
            backgroundColor: '',
            backgroundImage: '',
            fontFamily: '',
            fontSize: '',
            fontWeight: '',
            textOverflow: '',
            overflow: '',
            placeholderSampled: false,
            placeholderSampleError: '元素无 placeholder 属性',
          };
        }
        const s = getComputedStyle(el, '::placeholder');
        return {
          color: s.color,
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          textOverflow: s.textOverflow,
          overflow: s.overflow,
          ...box,
          placeholderSampled: true,
        };
      }

      const s = getComputedStyle(el);
      return {
        color: s.color,
        backgroundColor: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        textOverflow: s.textOverflow,
        overflow: s.overflow,
        ...box,
      };
    },
    !!spec.samplePlaceholderStyle
  );

  if (spec.samplePlaceholderStyle && !styles.placeholderSampled) {
    if (!spec.optional) {
      checks.push(
        fail(
          spec.name,
          '占位取样',
          '可从 ::placeholder 读取样式',
          styles.placeholderSampleError ?? '无法读取 ::placeholder',
          '取样失败',
          'High'
        )
      );
    }
    return checks;
  }

  // 取样来源说明：占位文案取 ::placeholder，其余取元素本体
  const srcNote = spec.samplePlaceholderStyle ? '（::placeholder）' : '';

  if (spec.color) {
    const prop = spec.colorProperty ?? 'color';
    const actual = prop === 'backgroundColor' ? styles.backgroundColor : styles.color;
    const expected = RM11[spec.color];
    const expectedLabel = `${spec.color}（${expected}）`;
    const actualLabel = `${actual}${srcNote}`;
    if (colorMatches(actual, expected)) {
      checks.push(pass(spec.name, '颜色', expectedLabel, actualLabel));
    } else {
      checks.push(fail(spec.name, '颜色', expectedLabel, actualLabel, '颜色不符', 'High'));
    }
  }

  const fontFromUi = spec.uiType ? RM11_UI_SPECIAL_TYPE[spec.uiType] : undefined;
  const fontFromType = spec.type ? RM11_TYPE[spec.type] : undefined;
  const fontSizePx = fontFromUi?.fontSize ?? fontFromType?.fontSize;
  const fontWeightLabel = fontFromUi?.weightLabel ?? fontFromType?.weightLabel;

  if (fontFromUi || fontFromType) {
    const typeTag = fontFromUi
      ? formatUiSpecialTypeLabel(spec.uiType!)
      : `${spec.type}（${fontFromType!.fontSize}px）`;

    if (fontFamilyMatchesAvenir(styles.fontFamily)) {
      checks.push(pass(spec.name, '字体', 'Avenir', `${styles.fontFamily}${srcNote}`));
    } else {
      checks.push(
        fail(spec.name, '字体', 'Avenir', `${styles.fontFamily}${srcNote}`, '字体错误', 'High')
      );
    }

    const sizeExpected = fontFromUi
      ? `${typeTag}`
      : `${spec.type}（${fontFromType!.fontSize}px）`;
    if (fontSizePx !== undefined && fontSizeMatches(styles.fontSize, fontSizePx)) {
      checks.push(pass(spec.name, '字号', sizeExpected, `${styles.fontSize}${srcNote}`));
    } else {
      checks.push(
        fail(spec.name, '字号', sizeExpected, `${styles.fontSize}${srcNote}`, '字体大小错误', 'High')
      );
    }

    if (fontWeightLabel && fontWeightLabel !== '-') {
      const label = fontWeightLabel as FontWeightLabel;
      const weightExpected = fontFromUi
        ? `${typeTag} ${formatExpectedFontWeight(label)}`
        : `${spec.type} ${formatExpectedFontWeight(label)}`;
      const weightActual = `font-weight=${styles.fontWeight}${srcNote}`;
      if (fontWeightMatches(styles.fontWeight, styles.fontFamily, fontWeightLabel)) {
        checks.push(pass(spec.name, '字重', weightExpected, weightActual));
      } else {
        checks.push(fail(spec.name, '字重', weightExpected, weightActual, '字重错误', 'Medium'));
      }
    }
  }

  if (spec.primaryButton) {
    const expected = 'Button_01 渐变（#460443 → #FE0127）';
    const actual = `backgroundImage=${styles.backgroundImage}`;
    if (hasPrimaryButtonGradient(styles.backgroundImage, styles.backgroundColor)) {
      checks.push(pass(spec.name, '主按钮渐变', expected, actual));
    } else {
      checks.push(fail(spec.name, '主按钮渐变', expected, actual, '颜色不符', 'High'));
    }
  }

  if (spec.checkMinFontSize) {
    const px = parseFloat(styles.fontSize);
    const expected = `≥ Type_09（10px）`;
    if (px < RM11_TYPE.Type_09.fontSize - 1) {
      checks.push(fail(spec.name, '最小字号', expected, styles.fontSize, '字体大小错误', 'Medium'));
    } else {
      checks.push(pass(spec.name, '最小字号', expected, styles.fontSize));
    }
  }

  if (spec.checkOverflow && !spec.samplePlaceholderStyle) {
    const hOverflow = styles.scrollWidth > styles.clientWidth + 2;
    const vOverflow = styles.scrollHeight > styles.clientHeight + 2;
    const expected = '无文本溢出/截断';
    const actual = `scroll(${styles.scrollWidth}x${styles.scrollHeight}) / client(${styles.clientWidth}x${styles.clientHeight})`;
    if (hOverflow || vOverflow) {
      checks.push(fail(spec.name, '文本溢出', expected, actual, '文本截断', 'High'));
    } else {
      checks.push(pass(spec.name, '文本溢出', expected, actual));
    }
  }

  return checks;
}

async function collectAlignmentChecks(
  name: string,
  locators: Locator[]
): Promise<UiCheckResult[]> {
  const visibleLocators: Locator[] = [];
  for (const loc of locators) {
    if (await loc.isVisible().catch(() => false)) visibleLocators.push(loc);
  }
  if (visibleLocators.length < 2) return [];

  const lefts = await Promise.all(
    visibleLocators.map((loc) => loc.evaluate((el) => Math.round(el.getBoundingClientRect().left)))
  );
  const maxDelta = Math.max(...lefts) - Math.min(...lefts);
  const expected = '子元素左边缘一致（偏差 ≤ 4px）';
  const actual = `左边缘 ${lefts.join('px, ')}px，偏差 ${maxDelta}px`;
  if (new Set(lefts).size > 1 && maxDelta > 4) {
    return [fail(name, '对齐', expected, actual, '布局错位', 'Medium')];
  }
  return [pass(name, '对齐', expected, actual)];
}

async function collectPageBackgroundChecks(page: Page): Promise<UiCheckResult[]> {
  const actual = await page.evaluate(() => {
    const pick = (el: Element) => getComputedStyle(el).backgroundColor;
    const isFilled = (bg: string) => bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
    if (isFilled(pick(document.documentElement))) return pick(document.documentElement);
    if (isFilled(pick(document.body))) return pick(document.body);
    for (const child of Array.from(document.body.children)) {
      const bg = pick(child);
      if (isFilled(bg)) return bg;
    }
    return pick(document.body);
  });

  const expected = `Grey_01（${RM11.Grey_01}）`;
  if (colorMatches(actual, RM11.Grey_01)) {
    return [pass('页面背景', '颜色', expected, actual)];
  }
  return [fail('页面背景', '颜色', expected, actual, '颜色不符', 'High')];
}

/** 走查前：loading 结束 + 必选元素就绪 */
async function waitForInspectionReady(page: Page, options: UiInspectionOptions): Promise<void> {
  if (options.waitForLoading !== false) {
    await waitForPageLoadingComplete(page);
  }

  const required = options.elements.filter((spec) => !spec.optional).map((spec) => spec.locator);
  if (required.length > 0) {
    await waitForElementsVisible(required, options.readyTimeout ?? 30_000);
  }
}

async function unionLocatorBox(locators: Locator[]): Promise<FailedMarkCandidate | null> {
  const boxes = (
    await Promise.all(
      locators.map(async (loc) => {
        if (!(await loc.isVisible().catch(() => false))) return null;
        return loc.boundingBox();
      })
    )
  ).filter((box): box is NonNullable<typeof box> => box !== null);

  if (boxes.length === 0) return null;

  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return {
    element: '',
    check: '',
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

/** 执行 UI 走查，返回所有检查结果（含通过/失败）+ 失败项截图标注候选坐标 */
export async function runUiInspection(
  page: Page,
  options: UiInspectionOptions
): Promise<{ checks: UiCheckResult[]; defects: UiDefect[]; markCandidates: FailedMarkCandidate[] }> {
  const checks: UiCheckResult[] = [];
  const markCandidates: FailedMarkCandidate[] = [];

  if (options.checkPageBackground) {
    checks.push(...(await collectPageBackgroundChecks(page)));
  }

  for (const spec of options.elements) {
    const elementChecks = await collectElementChecks(spec);
    checks.push(...elementChecks);

    const box =
      (await spec.locator.isVisible().catch(() => false))
        ? await spec.locator.boundingBox()
        : null;
    for (const check of elementChecks) {
      if (check.status !== 'failed' || !box) continue;
      markCandidates.push({
        element: check.element,
        check: check.check,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      });
    }
  }

  if (options.alignmentGroup) {
    const alignmentChecks = await collectAlignmentChecks(
      options.alignmentGroup.name,
      options.alignmentGroup.locators
    );
    checks.push(...alignmentChecks);

    const failedAlignment = alignmentChecks.find((c) => c.status === 'failed');
    if (failedAlignment) {
      const union = await unionLocatorBox(options.alignmentGroup.locators);
      if (union) {
        markCandidates.push({
          ...union,
          element: failedAlignment.element,
          check: failedAlignment.check,
        });
      }
    }
  }

  return { checks, defects: checksToDefects(checks), markCandidates };
}

/** 在页面上绘制精准矩形标注（带 id）后截图 */
export async function captureAnnotatedScreenshot(
  page: Page,
  marks: AnnotatedMark[]
): Promise<Buffer> {
  if (marks.length > 0) {
    await page.evaluate((items) => {
      document.getElementById('rm11-ui-inspection-overlay')?.remove();
      const container = document.createElement('div');
      container.id = 'rm11-ui-inspection-overlay';
      container.setAttribute('data-testid', 'ui-inspection-overlay');
      container.style.cssText =
        'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:visible';

      for (const mark of items) {
        const pad = 2;
        const left = mark.x - pad;
        const top = mark.y - pad;
        const width = mark.width + pad * 2;
        const height = mark.height + pad * 2;

        const rect = document.createElement('div');
        rect.title = `${mark.id} ${mark.element} / ${mark.check}`;
        rect.style.cssText = [
          'position:absolute',
          `left:${left}px`,
          `top:${top}px`,
          `width:${width}px`,
          `height:${height}px`,
          'border:2px solid #FF0000',
          'border-radius:2px',
          'box-sizing:border-box',
          'box-shadow:0 0 4px rgba(255,0,0,0.55)',
        ].join(';');
        container.appendChild(rect);

        const label = document.createElement('div');
        label.textContent = mark.id;
        label.style.cssText = [
          'position:absolute',
          `left:${left}px`,
          `top:${Math.max(0, top - 18)}px`,
          'color:#FFFFFF',
          'font-size:11px',
          'font-weight:bold',
          'font-family:monospace',
          'background:#FF0000',
          'padding:1px 5px',
          'border-radius:2px',
          'line-height:16px',
          'white-space:nowrap',
        ].join(';');
        container.appendChild(label);
      }
      document.body.appendChild(container);
    }, marks);
  }

  const buffer = await page.screenshot({ fullPage: false });
  await page.evaluate(() => document.getElementById('rm11-ui-inspection-overlay')?.remove());
  return buffer;
}

/** 格式化走查结果为标准输出 */
export function formatInspectionResult(defects: UiDefect[]): string {
  if (defects.length === 0) return '【PASSED】';
  return JSON.stringify(defects, null, 2);
}

export interface UiInspectionRunOptions {
  /**
   * 为 true 时：写入缺陷报告但不抛错，返回结果供汇总；
   * 用于同一条视觉用例内多 scene 连续走查（某 scene 失败不阻断后续）。
   */
  continueOnFail?: boolean;
}

export interface UiInspectionRunResult {
  scene: string;
  passed: boolean;
  defects: UiDefect[];
  checks?: UiCheckResult[];
  visionChecks?: UiVisionCheck[];
  defectPng?: string;
  passedJson?: string;
  failedJson?: string;
}

function buildPassedReport(
  scene: string,
  testTitle: string,
  checks: UiCheckResult[],
  visionChecks: UiVisionCheck[],
  overallStatus: 'PASSED' | 'FAILED'
): Record<string, unknown> {
  const passedChecks = checks.filter((c) => c.status === 'passed');
  const passedVision = visionChecks.filter((c) => c.status === 'passed' || c.status === 'skipped');
  return {
    scene,
    testTitle,
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    summary: {
      total: passedChecks.length,
      passed: passedChecks.length,
      failed: 0,
    },
    checks: passedChecks,
    visionSummary: {
      total: passedVision.length,
      passed: visionChecks.filter((c) => c.status === 'passed').length,
      failed: 0,
      skipped: visionChecks.filter((c) => c.status === 'skipped').length,
      blocking: false,
    },
    visionChecks: passedVision,
  };
}

function buildFailedReport(
  scene: string,
  testTitle: string,
  failedChecks: UiFailedCheckResult[],
  visionChecks: UiVisionCheck[]
): Record<string, unknown> {
  const failedVision = visionChecks.filter((c) => c.status === 'failed');
  let visionId = failedChecks.length;
  const failedVisionWithId = failedVision.map((c) => ({
    ...c,
    id: String(++visionId).padStart(3, '0'),
  }));

  return {
    scene,
    testTitle,
    status: 'FAILED',
    checkedAt: new Date().toISOString(),
    summary: {
      total: failedChecks.length + failedVisionWithId.length,
      passed: 0,
      failed: failedChecks.length + failedVisionWithId.length,
    },
    checks: failedChecks,
    visionSummary: {
      total: failedVisionWithId.length,
      passed: 0,
      failed: failedVisionWithId.length,
      skipped: 0,
      blocking: false,
    },
    visionChecks: failedVisionWithId,
  };
}

/** 汇总多 scene 走查结果，任一失败则整条用例失败 */
export function assertVisualInspectionResults(results: UiInspectionRunResult[]): void {
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) return;

  const summary = failed
    .map(
      (r) =>
        `[${r.scene}] ${r.defects.length} 处缺陷` +
        (r.defectPng ? ` → ${r.defectPng}` : '')
    )
    .join('\n');

  expect(
    failed.map((r) => ({ scene: r.scene, defects: r.defects })),
    `UI 走查未全部通过（${failed.length}/${results.length} 个 scene 失败）:\n${summary}`
  ).toHaveLength(0);
}

/**
 * 执行走查并断言通过。
 * - 通过：控制台输出 【PASSED】
 * - 失败：写入 passed/failed 分文件报告，并附加 id 矩形标注截图
 * - continueOnFail：失败时不抛错，返回 UiInspectionRunResult
 */
export async function inspectUiAndAssert(
  page: Page,
  testInfo: TestInfo,
  options: UiInspectionOptions,
  runOptions?: UiInspectionRunOptions
): Promise<UiInspectionRunResult | void> {
  await waitForInspectionReady(page, options);
  const { checks, defects, markCandidates } = await runUiInspection(page, options);
  const visionChecks = await runVisionInspection(page, options.vision);
  const paths = sceneArtifactPaths(options.scene);
  const failedChecks = assignFailedCheckIds(checks);
  const failedMarks = buildFailedMarks(failedChecks, markCandidates);
  const overallStatus = defects.length === 0 ? 'PASSED' : 'FAILED';
  const passedReport = buildPassedReport(
    options.scene,
    testInfo.title,
    checks,
    visionChecks,
    overallStatus
  );
  const passedJson = JSON.stringify(passedReport, null, 2);

  fs.mkdirSync(RUN_DIR, { recursive: true });

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const failedCount = failedChecks.length;
  console.log(
    `UI走查 [${options.scene}]: ${defects.length === 0 ? '【PASSED】' : `${defects.length} 处缺陷`}` +
      ` （共 ${checks.length} 项检查：通过 ${passedCount}，失败 ${failedCount}）`
  );

  fs.writeFileSync(paths.passedJson, passedJson);

  if (defects.length === 0) {
    writeRunSummary(options.scene, testInfo.title, 'PASSED', 0);
    await testInfo.attach(`ui-checks-${options.scene}.passed.json`, {
      body: passedJson,
      contentType: 'application/json',
    });
    if (runOptions?.continueOnFail) {
      return {
        scene: options.scene,
        passed: true,
        defects: [],
        checks,
        visionChecks,
        passedJson: paths.passedJson,
      };
    }
    expect(defects).toHaveLength(0);
    return;
  }

  const failedReport = buildFailedReport(options.scene, testInfo.title, failedChecks, visionChecks);
  const failedJson = JSON.stringify(failedReport, null, 2);
  const annotated = await captureAnnotatedScreenshot(page, failedMarks);

  fs.writeFileSync(paths.failedJson, failedJson);
  fs.writeFileSync(paths.defectPng, annotated);
  writeRunSummary(options.scene, testInfo.title, 'FAILED', defects.length);

  await testInfo.attach(`ui-defects-${options.scene}`, {
    body: annotated,
    contentType: 'image/png',
  });
  await testInfo.attach(`ui-checks-${options.scene}.passed.json`, {
    body: passedJson,
    contentType: 'application/json',
  });
  await testInfo.attach(`ui-checks-${options.scene}.failed.json`, {
    body: failedJson,
    contentType: 'application/json',
  });

  const result: UiInspectionRunResult = {
    scene: options.scene,
    passed: false,
    defects,
    checks,
    visionChecks,
    defectPng: paths.defectPng,
    passedJson: paths.passedJson,
    failedJson: paths.failedJson,
  };

  if (runOptions?.continueOnFail) {
    console.warn(
      `UI走查 [${options.scene}] 失败（continueOnFail），已记录 ${defects.length} 处缺陷，继续后续 scene…`
    );
    return result;
  }

  throw new Error(
    `UI 走查未通过 [${options.scene}]，发现 ${defects.length} 处缺陷。` +
      `通过项: ${paths.passedJson}\n失败项: ${paths.failedJson}\n标注截图: ${paths.defectPng}`
  );
}
