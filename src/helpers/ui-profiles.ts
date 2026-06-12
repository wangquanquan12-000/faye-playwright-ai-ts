/**
 * UI 走查 profile。新增/修改元素断言前 **必须** 完成同页层级表：
 * `specs/ui-scene-workflow.md` 步骤 ③½；禁止从 §7.1 速记表直接抄 Type_xx。
 */
import type { Page } from '@playwright/test';
import { appNavigation } from './auth';
import type { UiInspectionOptions } from './ui-inspection';
import { navPostButton } from './post';
import {
  PROMO_LINK_TEST_CAMPAIGN_NAME,
  promoCardStatValue,
  promoCardSubtitle,
  uitestPromoCard,
} from './promo-link';

/** 18+ 年龄确认弹窗走查 */
export function ageGateInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'age-gate',
    checkPageBackground: true,
    elements: [
      {
        name: 'Adults only 大标题',
        locator: page.getByText(/adults only/i),
        color: 'Light_Yellow_01',
        type: 'Type_01',
        checkOverflow: true,
      },
      {
        name: "I'm over 18 主按钮",
        locator: page.getByRole('button', { name: /over\s*18/i }),
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
      },
      {
        name: 'Leave 次级按钮',
        locator: page.getByRole('button', { name: /^leave$/i }),
        type: 'Type_04',
        checkOverflow: true,
        optional: true,
      },
    ],
  };
}

/** 落地页注册区走查（已过 18+；登录/注册页字体规格独立于站内 Type 体系） */
export function landingAuthInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'landing-auth',
    checkPageBackground: true,
    elements: [
      {
        name: 'Sign up with Email',
        locator: page.getByText('Sign up with Email', { exact: true }),
        color: 'Light_Yellow_01',
        checkOverflow: true,
        checkMinFontSize: true,
      },
      {
        name: 'Log in 按钮',
        locator: page.getByRole('button', { name: /^log in$/i }),
        color: 'Light_Yellow_01',
        checkOverflow: true,
        checkMinFontSize: true,
      },
    ],
  };
}

/** 已登录 Home 底部导航走查（mobile 图标入口；不套 desktop 文字/左对齐规则） */
export function homeSidebarInspection(page: Page): UiInspectionOptions {
  const nav = appNavigation(page);

  return {
    scene: 'home-sidebar',
    checkPageBackground: true,
    vision: {
      assertions: [
        {
          assertion:
            '页面底部存在一个包含 Home、Notifications、Post、Message、Profile 五个入口的导航栏，入口以图标形式展示',
          expected: 'mobile 底部导航展示 5 个 icon 入口',
        },
        {
          assertion: 'Post 发布入口位于底部导航栏中间位置',
          expected: 'Post 图标位于底部导航正中',
        },
        {
          assertion: 'Home 入口在底部导航最左侧，Profile 入口在最右侧',
          expected: 'Home 最左，Profile 最右',
        },
        {
          assertion: '底部导航栏没有显示 Home、Post、Profile 这些文字标签，只显示图标入口',
          expected: 'mobile 底部 Tab 为 icon-only，不套文字导航规则',
        },
      ],
    },
    elements: [
      {
        name: '底部导航 Home 入口',
        locator: nav.locator('a[href="/home"], a[href^="/home?"]'),
      },
      {
        name: '底部导航 Notifications 入口',
        locator: nav.locator('a[href*="/notifications"]'),
      },
      {
        name: '底部导航 Post 入口',
        locator: navPostButton(page),
      },
      {
        name: '底部导航 Message 入口',
        locator: nav.locator('a[href*="/message"]'),
      },
      {
        name: '底部导航 Profile 入口',
        locator: nav.locator('a[href*="/@"]'),
      },
    ],
  };
}

/** 发帖 Step1 上传表单 — design-refs/post/step1-upload-form.png */
export function publishFormInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'publish-form',
    checkPageBackground: true,
    elements: [
      {
        name: 'Image 入口',
        locator: page.getByText('Image', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Video 入口',
        locator: page.getByText('Video', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Everyone 访问标签',
        locator: page.getByText('Everyone', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'Members 访问标签',
        locator: page.getByText('Members', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'PPV 访问标签',
        locator: page.getByText('PPV', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: '访问权限说明文案',
        locator: page.getByText(/select viewer.?s access/i),
        color: 'Light_Yellow_02',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Upload Guide',
        locator: page.getByRole('button', { name: /upload guide/i }),
        color: 'Light_Yellow_03',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
    ],
  };
}

/** 发帖成功页 — design-refs/post/step3-publish-success.png */
export function postSuccessInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'post-success',
    checkPageBackground: true,
    elements: [
      {
        name: '发布成功提示文案',
        locator: page.getByText(
          /your (media|scheduel?).*(posted|set up) successfully/i
        ),
        color: 'Light_Yellow_02',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'Share 按钮',
        locator: page.getByRole('button', { name: /^share$/i }),
        color: 'Light_Yellow_01',
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'View Post 按钮',
        locator: page.getByRole('button', { name: /view (scheduel )?post/i }),
        color: 'Light_Yellow_01',
        type: 'Type_02',
        checkOverflow: true,
      },
      {
        name: 'Done 次按钮',
        locator: page.getByRole('button', { name: /^done$/i }),
        color: 'Light_Yellow_01',
        type: 'Type_02',
        checkOverflow: true,
        optional: true,
      },
    ],
  };
}

/** Promo Link 空列表页 — design-refs/promo-link/promo-link-empty.png */
export function promoLinkEmptyInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'promo-link-empty',
    checkPageBackground: true,
    elements: [
      {
        name: 'Promo Link 标题',
        locator: page.getByText('Promo Link', { exact: true }).first(),
        color: 'Light_Yellow_01',
        type: 'Type_01',
        checkOverflow: true,
      },
      {
        name: '空状态主文案',
        locator: page.getByText('No promo link yet.', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: '空状态副文案',
        locator: page.getByText(/you can create a new promo link/i),
        color: 'Light_Yellow_02',
        type: 'Type_04',
        checkOverflow: true,
      },
      {
        name: '空状态中间 Icon',
        locator: page.locator('svg, img').filter({ hasNot: page.locator('nav img') }).first(),
        optional: true,
      },
      {
        name: 'Generate Campaign 按钮',
        locator: page.getByRole('button', { name: /^generate campaign$/i }),
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
      },
    ],
  };
}

/** New Promo Link 创建页（默认态）— design-refs/promo-link/new-promo-link-default.png */
export function promoLinkNewDefaultInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'promo-link-new-default',
    checkPageBackground: true,
    elements: [
      {
        name: 'New Promo Link 标题',
        locator: page.getByText('New Promo Link', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_01',
        checkOverflow: true,
      },
      {
        name: '顶部提示文案',
        locator: page.getByText(
          /this discount can only be claimed once per user through this promo link/i
        ),
        color: 'Light_Yellow_02',
        type: 'Type_06',
        checkOverflow: true,
      },
      {
        name: 'Campaign Name 字段名',
        locator: page.getByText('Campaign Name (Optional)', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Campaign Type 字段名',
        locator: page.getByText('Campaign Type', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Campaign Name 占位文案',
        locator: page.getByPlaceholder(/spring sale/i),
        color: 'Light_Yellow_03',
        type: 'Type_05',
        samplePlaceholderStyle: true,
      },
      {
        name: 'Generate Campaign 按钮',
        locator: page.getByRole('button', { name: /^generate campaign$/i }),
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
      },
    ],
  };
}

/** Promo Link 创建成功页 — design-refs/promo-link/promo-link-created.png */
export function promoLinkCreatedInspection(page: Page): UiInspectionOptions {
  return {
    scene: 'promo-link-created',
    checkPageBackground: true,
    elements: [
      {
        name: '成功 Icon',
        locator: page.locator('svg, img').first(),
        optional: true,
      },
      {
        name: 'Promo Link Created 标题',
        locator: page.getByText('Promo Link Created!', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_01',
        checkOverflow: true,
      },
      {
        name: '生成的 Promo Link',
        locator: page.locator('text=/memberships\\/promolink\\//i').first(),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-created:url',
        checkOverflow: true,
      },
      {
        name: 'Copy Link 按钮',
        locator: page.getByRole('button', { name: /^copy link$/i }),
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
      },
    ],
  };
}

/** Promo Link Active 非空列表页 — design-refs/promo-link/promo-link-active.png（锚定 uitest 卡片） */
export function promoLinkActiveInspection(page: Page): UiInspectionOptions {
  const card = uitestPromoCard(page);

  return {
    scene: 'promo-link-active',
    checkPageBackground: true,
    elements: [
      {
        name: 'Active Tab',
        locator: page.getByText('Active', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_04',
        checkOverflow: true,
      },
      {
        name: '卡片主标题',
        locator: card.getByText(PROMO_LINK_TEST_CAMPAIGN_NAME, { exact: true }),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-active:card-title',
        checkOverflow: true,
      },
      {
        name: '卡片副标题',
        locator: promoCardSubtitle(card),
        color: 'Light_Yellow_02',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Claims 字段名',
        locator: card.getByText('Claims', { exact: true }),
        color: 'Light_Yellow_03',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'Claims 数值',
        locator: promoCardStatValue(card, 'Claims'),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-active:stat-value',
        checkOverflow: true,
      },
      {
        name: 'Clicks 字段名',
        locator: card.getByText('Clicks', { exact: true }),
        color: 'Light_Yellow_03',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'Clicks 数值',
        locator: promoCardStatValue(card, 'Clicks'),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-active:stat-value',
        checkOverflow: true,
      },
      {
        name: 'Revenue 字段名',
        locator: card.getByText('Revenue', { exact: true }),
        color: 'Light_Yellow_03',
        type: 'Type_08',
        checkOverflow: true,
      },
      {
        name: 'Revenue 数值',
        locator: promoCardStatValue(card, 'Revenue'),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-active:stat-value',
        checkOverflow: true,
      },
      {
        name: 'Copy Link 按钮',
        locator: card.getByRole('button', { name: /^copy link$/i }),
        color: 'Light_Yellow_01',
        uiType: 'promo-link-active:card-copy-link',
        checkOverflow: true,
      },
    ],
  };
}

/** Post Details 页 — design-refs/post/step2-post-details.png */
export function postDetailsInspection(page: Page): UiInspectionOptions {
  const header = page.getByRole('banner').filter({ hasText: 'Post Details' });
  const panel = header.locator('xpath=following-sibling::*[1]');
  const shell = header.locator('xpath=..');

  return {
    scene: 'post-details',
    checkPageBackground: true,
    elements: [
      {
        name: 'Post Details 标题',
        locator: header.getByText('Post Details', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_01',
        checkOverflow: true,
      },
      {
        name: '返回按钮',
        locator: header.locator('> *').first(),
        optional: true,
      },
      {
        name: 'Post Media 区块标题',
        locator: panel.getByText('Post Media', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: '媒体缩略图',
        locator: panel.locator('img[alt*="blur"], img[src]').first(),
        optional: true,
      },
      {
        name: 'Cover 标签',
        locator: panel.getByText('Cover', { exact: true }).first(),
        color: 'Light_Yellow_01',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Who Can Access 区块标题',
        locator: panel.getByText('Who Can Access', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: '访问权限选项值',
        locator: panel.getByText('Everyone', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_04',
        checkOverflow: true,
      },
      {
        name: 'PPV Price 区块标题',
        locator: panel.getByText('PPV Price', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'PPV Min/Max 说明',
        locator: panel.getByText(/1 Token Min/i),
        color: 'Light_Yellow_02',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Caption 区块标题',
        locator: panel.getByText('Caption', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Caption 字数统计',
        locator: panel.getByText(/\d+\/(200|2500)/),
        color: 'Light_Yellow_03',
        type: 'Type_08',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Caption 占位文案',
        locator: panel.getByPlaceholder(/say something/i),
        color: 'Light_Yellow_03',
        type: 'Type_05',
        samplePlaceholderStyle: true,
        optional: true,
      },
      {
        name: 'Caption 输入框',
        locator: panel.locator('textarea:visible, [contenteditable="true"]:visible').first(),
        color: 'Light_Yellow_01',
        type: 'Type_05',
        checkOverflow: true,
      },
      {
        name: 'Send On 区块标题',
        locator: panel.getByText('Send On', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_03',
        checkOverflow: true,
      },
      {
        name: 'Send On 选项值',
        locator: panel.getByText('Post Immediately', { exact: true }),
        color: 'Light_Yellow_01',
        type: 'Type_04',
        checkOverflow: true,
        optional: true,
      },
      {
        name: 'Post 发布按钮',
        locator: shell.getByRole('button', { name: /^(post|publish)$/i }),
        primaryButton: true,
        type: 'Type_02',
        checkOverflow: true,
      },
    ],
  };
}
