# 订阅折扣链接（Promo Link）

> 网页端，不是 app

## 背景/目的

1. 现有 Membership 主要依赖创作者公开订阅套餐，缺少面向外部推广场景的定向转化工具，无法针对不同渠道、不同活动投放专属订阅优惠链接。
2. 创作者需要一个可配置、可复制、可管理、可统计效果的 Promo Link，用于在 Twitter / IG / 私域等渠道拉新，并清晰区分免费试用活动与折扣活动。
3. 为了提升 Membership 拉新转化率、活动投放效率与渠道效果可观测性，本次新增订阅折扣链接能力。

---

## 模块1：功能入口

### 子模块1：入口展示

1. 在创作者 Monetization 页面中，在 Membership Details 下方新增入口：Promo Link
2. 点击入口进入 Promo Link 列表页

---

## 模块2 / 页面2：Promo Link 列表页

### 子模块1：页面基础结构

1. 页面标题：Promo Link
2. 顶部返回按钮：返回 Monetization 页面。
3. 页面内容分两种：
   1. 空状态
   2. 有数据状态（Active / Expired tabs）

### 子模块2：空状态

1. 当用户未创建任何 Promo Link 时（Active 和 Expired 都为空时），展示空状态：
   1. 中间 icon
   2. 描述文案：
      1. No promo link yet.
      2. You can create a new promo link now.
   3. 底部主按钮：Generate Campaign
2. 仅 Active 列表为空时，Active 页面中间展示文案：
   1. No active promo link yet. You can create a new promo link now.
3. 仅 Expired 列表为空时，Expired 页面中间展示文案：
   1. No expired promo link yet.
4. 当点击 Generate Campaign 进入 New Promo Link 页面

### 子模块3：有数据状态

1. 顶部显示排序说明：按最后更新时间倒序展示。
2. Tab 分组：
   1. Active
   2. Expired
3. 每次进入页面默认选中 Active tab。
4. 每个 tab 内若无数据，展示对应空状态文案，不影响底部 Generate Campaign 按钮展示。
5. 页面底部固定悬浮按钮：Generate Campaign
   1. 点击 Generate Campaign 前先校验当前的 Active promo link 数量；
   2. 若超过 50 个，则不允许创建，当前页面弹出 Toast：You've reached the maximum number of active promo links.

### 子模块4：Link 卡片展示规则

#### 4.1 Active 卡片

1. 卡片展示内容：
   1. 标题
   2. 价格/优惠描述
   3. Claims
   4. Clicks
   5. Revenue
   6. Copy Link 按钮
   7. More 按钮
2. 标题展示逻辑：
   1. 若用户填写了 Campaign Name，展示该名称；
   2. 若未填写，则用第二行价格描述上移作为主标题样式展示。
   3. 名字过长时，用省略号展示，不会折行
3. 描述展示逻辑：
   1. Free 类型：{免费天数} Days Free · {月数} Month(s)
   2. Discount 类型：${Final Price} After {折扣力度}% OFF · {月数} Month(s)
   3. 价格变动规则
      1. link 一旦创建成功，其价格、周期、优惠参数即固化为该 link 的快照；
      2. 后续创作者在公开 Membership 页面修改通用价格、关闭某个套餐，不影响已创建 link 的实际使用与展示；
      3. 只有创作者进入编辑页并重新保存后，才会按新的编辑结果更新该 link。
4. Claims 展示逻辑：
   1. 若设置了 maximum users：展示 used_count / max_users
   2. 若未设置：仅展示 used_count
5. Clicks：展示当前 link 被点击次数。
6. Revenue：展示通过该 link 产生的累计收入。
   1. 收入口径：从用户首次通过该 link 成功订阅开始，只要该条订阅链路未中断，后续续订收入均累计到该 link；
   2. 若用户取消订阅后重新通过其他路径/其他 link 订阅，不再计入原 link。
7. Copy Link 按钮
   1. 点击后 copy 当前链接
   2. 页面顶部弹出 toast 提示：Link copied successfully! Share it with your fans now!
8. More 按钮
   1. 点击 More，底部弹出 Options 弹窗：
      1. Edit
         1. 点击后进入 Edit Promo Link 页面
      2. Deactivate
         1. 点击后弹出二次确认弹窗：
            1. 标题：Deactivate this link?
            2. 描述：Users will no longer be able to use this promo link.
            3. 按钮：Cancel / Deactivate
         2. 确认后：
            1. link 从 Active 移入 Expired
            2. Toast：Deactivated successfully.

#### 4.2 Expired 卡片

1. Expired 卡片不展示：
   1. Copy Link
   2. More
2. Expired 卡片保留：
   1. 标题
   2. 价格/优惠描述
   3. Claims / Clicks / Revenue
   4. Edit 按钮：点击后进入 Edit Promo Link 页面
3. Expired link 支持重新编辑并重新激活，重新激活后回到 Active tab。

### 子模块5：列表排序与状态定义

1. 排序规则：按 link updated_at 倒序。
2. 状态定义：
   1. Active：当前可展示为有效活动，且未被手动停用、未因有效期到期而过期；
   2. Expired：手动停用，或 available_until 到期。
3. 特殊说明：maximum users 用满后，不自动进入 Expired。
   1. 该 link 仍在 Active 列表中；
   2. 但用户点击时视为"不可使用"；
   3. 创作者可通过编辑提高 maximum users 使其恢复可用。

---

## 模块3 / 页面3：New Promo Link（创建）

### 子模块1：页面基础结构

1. 页面标题：New Promo Link
2. 顶部返回按钮：返回上一页。
3. 返回时若内容未修改：
   1. 直接返回
4. 返回时若内容已修改但未保存：
   1. 弹确认弹窗：
      1. 标题：Discard changes?
      2. 描述：By proceeding, you'll lose any changes you've made.
      3. 按钮：Discard / Keep Editing

### 子模块2：顶部说明文案

1. 页面顶部展示规则说明文案，用于告知创作者：This discount can only be claimed once per user through this promo link.
2. 文案右侧若有 info icon，则点击后展示说明气泡。
3. 所有 info 气泡均需带箭头指向当前字段，避免用户混淆说明归属。

### 子模块3：字段说明

#### 3.1 Campaign Name（Optional）

1. 选填字段。
2. 默认展示占位文案：e.g. Platform Spring Sale
3. 输入规则：
   1. 支持中英文、数字、常见符号；
   2. 最大长度 50 字符。
   3. 超长时：不允许继续输入
4. Info 文案：

#### 3.2 Campaign Type

1. 必填，单选。
2. 选项：
   1. Free Trail
   2. Discount
3. 默认选中 Free。
4. 切换类型时，页面动态切换对应字段区域：
   1. Free Trail：下方展示 Free Trial Duration
   2. Discount：下方展示 Discount + Final Price
5. Info 文案：

#### 3.3 Membership Plan

1. 必填。
2. 下拉展示当前创作者可用于该活动的 Membership 周期：
   1. 1 Month Membership (${价格})
   2. 3 Months Membership (${如设置了折扣，展示折扣后价格})
   3. 6 Months Membership (${如设置了折扣，展示折扣后价格})
   4. 实际展示项以创作者当前已配置的套餐为准。
3. 默认选中 1 Month
4. 该字段决定：
   1. Free 类型：免费结束后按该周期正常续订；
   2. Discount 类型：首个计费周期按该周期的 promo link 折扣价收取，后续按该周期通用价格正常续订。
5. Info 文案：

#### 3.4 Free Trial Duration（仅 Free）

1. 必填。
2. 默认值：7
3. 单位：Day
4. 输入框右上侧边界提示文案：100 Days Max.
5. 输入规则：
   1. 仅允许正整数；
   2. 取值范围：1~100
6. 非法值处理：
   1. 为空：字段红框 + 错误文案
   2. 0：字段红框 + 错误文案
   3. 小数/负数/非数字：字段红框 + 错误文案
   4. 超过 100：字段红框 + 错误文案
7. 错误文案：Please enter a number from 1 to 100 days.
8. Info 文案：

#### 3.5 First Month Discount（仅 Discount 类型）

1. 必填。
2. 默认值：5% Off
3. 可选范围：5% Off~ 95% Off
4. 步长：5%
5. 以下拉的形式选择，不支持手输。
6. Info 文案：

#### 3.6 Final Price（仅 Discount 类型）

1. 系统自动计算，用户不可编辑。
2. 计算规则：
   1. Final Price = Membership Plan 当前价格 × (1 - discount%)
   2. 金额保留规则与现有 Membership 支付规则一致。
3. 展示为灰态只读框。
4. 当 Membership Plan 或 Discount 变化时实时更新。
5. Info 文案：

#### 3.7 Maximum Users（Optional）

1. 选填。
2. 含义：该 link 最多可被多少个用户成功使用。
3. 输入规则：
   1. 仅允许正整数；
   2. 不允许 0；
   3. 不输入表示不限制
   4. 数字位数：最大 8 位，超出则不允许继续输入。
4. 错误文案：Please enter a number greater than 0.
5. Info 文案：

#### 3.8 Available Until（Optional）

1. 选填。
2. 由 Month / Day / Year 3 个字段组成。
3. 允许手输，需校验是否为合法日期。
   1. 不允许早于当前日期。
   2. 不允许超过当前日期后一年
4. 留空表示永久有效。
5. 截止时间定义：
   1. 以前端保存时创作者当前设备所在时区的所选日期 23:59:59 为截止；
   2. 服务端统一转 UTC 存储并用于校验；
   3. 用户点击 link 时由服务端按 UTC 判断是否过期。
6. 错误文案：Please enter a valid future date.
7. Info 文案：

### 子模块4：Generate Campaign 按钮

1. 位于页面底部固定区域。
2. 点击后校验顺序：
   1. 活跃 link 数量是否超限
   2. 必填项是否都填写
   3. 字段格式
   4. 日期合法性
3. 校验失败：
   1. 对应字段红框，下方展示对应的报错文案；
   2. 首个错误字段自动滚动到可视区域。
4. 校验通过：
   1. 按钮进入 loading；
   2. 创建失败在当前页面报错，创建成功后进入创建成功页

### 子模块5：创建成功页

1. 创建成功后跳转独立成功页
2. 页面元素：
   1. 成功 icon
   2. 标题：Promo Link Created!
   3. 生成好的 link 文本
   4. Copy Link 主按钮
   5. 右上角关闭按钮
3. link 生成规则：
   1. 系统自动生成唯一 promo link；
   2. 链接格式：https://rm11.com/memberships/promolink/OTEyNjg0MDMwOTU5MzA0NzA0OjE6MTpjNWQyYTAw
   3. 末尾为 40 位字母数字混合随机串；
   4. 链接跳转时大小写输入不敏感。
4. 点击 Copy Link：
   1. 复制成功
   2. 关闭成功页；
   3. 返回 Promo Link 列表页；
   4. Promo Link 列表页弹出 Toast：Link copied successfully! Share it with your fans now!
5. 点击关闭按钮：
   1. 不复制；
   2. 直接返回 Promo Link 列表页。

---

## 模块4 / 页面4：Edit Promo Link（编辑/重新激活）

### 子模块1：进入方式

1. Active link：
   1. 点击 More > Edit 进入。
2. Expired link：
   1. 点击 Edit 进入。

### 子模块2：编辑页回填规则

1. 除了价格相关的字段（Membership plan 的价格、final price）、所有字段回填当前 link 已保存的数据。
2. 价格字段：编辑页默认展示的是当前 link 的 Membership plan 的最新价格，以及计算后的折扣后的价格

### 子模块3：编辑规则

1. 可编辑字段（所有字段都可以编辑）：
   1. Campaign Name
   2. Campaign Type
   3. Membership Plan
   4. Free Trial Duration / Discount
   5. Maximum Users
   6. Available Until
2. 若 link 当前绑定的 Membership Plan 已在公共套餐中下架：
   1. 该 link 仍然有效，仍可继续被新用户使用；
   2. 编辑页的 Membership Plan 变更为：1 Month Membership，下方的 Final Price 也对应更新
   3. 若用户没有保存修改就返回，价格仍为原价格和套餐；
   4. 若用户切换成其他 plan，则展示最新的价格。
3. 编辑页中若用户切换为新的 Membership Plan：
   1. 相关价格以当前编辑时该套餐的最新公开价格重新计算；
   2. 仅在用户点击 Save 成功后生效；
   3. 点击返回放弃时，旧价格不变。

### 子模块4：编辑限制

1. Maximum Users
   1. 若当前已使用人数为 used_count，则编辑后的 maximum users 必须满足：
      1. 仅允许正整数；
      2. 不允许 0；
      3. 不输入表示不限制人数
      4. 数字位数：最大 8 位，超出则不允许继续输入。
      5. 如果tian xei e必须 > 当前已经使用链接订阅的人数，即claims
   2. 若输入小于等于当前 used_count：
      1. 字段红框；
      2. 错误文案：Maximum users must be greater than current claims.
2. 其他字段的限制同创建 promo link 时的限制

### 子模块5：Save / Save and Reactivate

1. Active link 编辑页底部按钮：Save
2. Expired link 编辑页底部按钮：Save and Reactivate
3. 按钮可点击规则：
   1. 相对当前已保存内容有变更时点亮；
   2. 无变更时置灰。
4. 点击后：
   1. 按钮 loading；
   2. 保存成功后返回列表页；
   3. Toast：Saved successfully.
5. 若为 Expired link 且保存成功：
   1. link 状态切换为 Active；
   2. 回到 Active tab；
   3. 按照更新时间排序

### 子模块6：返回与未保存拦截

1. 点击返回、切换页面、关闭弹窗时，如存在未保存改动：
   1. 弹 Discard changes?
   2. Discard：放弃并返回；
   3. Keep Editing：停留当前页。

---

## 模块5 / 页面5：用户通过 Promo Link 的使用流程

### 子模块1：入口与落地

1. 用户点击 Promo Link 后，先进入创作者 Profile 页。
2. 在 Profile 页之上覆盖 Membership 订阅弹窗。
3. 弹窗展示内容：
   1. 创作者信息
      1. 头像、username、nickname
      2. membership bio
   2. 订阅可获得权益
      1. Cancel your membership at any time
      2. Access {count} exclusive images & {count} exclusive videos
      3. Enjoy 1:1 video calls
   3. 当前活动优惠信息
   4. CTA 按钮
   5. 续订规则说明

### 子模块2：弹窗展示规则

#### 2.1 按键文案

1. Free 类型：Join for Free (First {count} Days · 100% Off)
2. Discount 类型：Join for ${折扣后价格} (First {count} Months · {折扣力度}% Off)

#### 2.2 续订规则说明文案

1. Free 类型：
   1. Your free membership will end in {免费天数} day(s) and renew automatically. After that, it will renew at ${续订价格} per {周期长度} month(s).
   2. You can cancel your membership at any time. To manage your settings, go to: Memberships > Manage Membership.
2. Discount 类型：
   1. Your discounted membership will end after the first month and renew automatically. After that, it will renew at $10 per {周期长度} month(s).
   2. You can cancel your membership at any time. To manage your settings, go to: Memberships > Manage Membership.

### 子模块3：用户资格校验

1. 用户打开 link 时，前端/服务端需判断以下条件：
   1. link 是否存在
   2. link 是否有效
      1. 以下条件为无效
         1. 已使用人数超过设置的人数
         2. 有效期已过
         3. 链接被设置为 Expired
   3. 当前用户是否登录
   4. 当前用户是否正在订阅该创作者
   5. 当前用户是否已使用过该条 link

### 子模块4：各类分支处理

| 场景 | 效果 | 文案 |
| --- | --- | --- |
| 链接不存在 | 展示 Page not found 页面 | |
| promo link 无效 | 展示 profile 页面，弹出 toast 提示 | This discount link is no longer valid. Please check the link or ask the creator for a new one. |
| 用户未登录 | 打开 profile 页，同时页面上订阅弹窗，点击后弹窗中的订阅后去登陆/注册，登陆后重新判断用户当前的场景，按照对应的状态进行展示 | |
| 处于订阅期 | 展示 profile 页面，弹出 toast 提示 | Already joined this membership. Discount applies to new memberships only. |
| 已使用当前 promo link | 展示 profile 页面，弹出 toast 提示 | Promo link already used. Subscribe at the current price anytime. |
| 未绑卡 | profile 页上盖上订阅弹窗，点击后弹出绑卡页面 | |
| 已绑卡 | profile 页上盖上订阅弹窗，点击后弹出支付确认弹窗 | |

#### 4.1 link 无效

1. 无效范围包括：
   1. link 不存在
   2. 被手动停用
   3. Available Until 已过期
   4. Maximum Users 已满
2. 处理方式：
   1. 仅进入创作者 Profile 页；
   2. 不弹 Membership 弹窗；
   3. Toast：This promo link is no longer available.

### 子模块5：支付确认弹窗

1. Free link
   1. Membership 字段为：{count} Days for @username
   2. 订单金额为 0；
   3. 服务费为 0；
   4. 总价为 0；
   5. 按键下方第一行文案：
      1. Your free membership will end in {免费天数} day(s) and renew automatically. After that, it will renew at ${续订价格} per {周期长度} month(s).
2. Discount 类型：
   1. Membership 字段为：{count} Month(s) for @username
   2. 金额展示当前订阅的金额和手续费
   3. 按键下方第一行文案：
      1. Your discounted membership will end after the first month and renew automatically. After that, it will renew at $10 per {周期长度} month(s).

### 子模块6：订阅成功后的结果

1. 订阅成功后进入正常 Membership 状态。
2. 若通过 promo link 成功订阅，该用户在本次订阅及续订结束前，需要打上标签。
   1. 进入创作者 My Members 列表时：
      1. 该成员显示 During promo link discount 标签。
   2. 若该成员自动续费失败：
      1. 红色失败标签优先级高于 During promo link discount 标签。

### 子模块7：首期优惠与后续续订规则

#### 7.1 Free 类型

1. 首期为 free_days，价格 0。
2. 免费结束到第一次付费这一次：
   1. 不走提前 7/5/3/1 天预扣费逻辑；
   2. 仅在到期当天尝试扣费；
   3. 扣费成功：订阅继续；
   4. 扣费失败：订阅结束。
3. 从第一次付费成功后的后续周期开始：
   1. 恢复平台现有提前扣费逻辑。

#### 7.2 Discount 类型

1. 首个周期按折后价支付。
2. 后续周期按所选 Membership Plan 通用价格正常续订。
3. 从首个折扣周期之后开始，续费逻辑与现有 Membership 一致。

### 子模块8：用户修改套餐

1. 用户通过 Promo Link 建立订阅后，如 creator 变更套餐或者价格，用户仍按键通过 promo link 订阅时的价格和套餐进行后续续订

---

## 模块6 / 页面6：Membership / My Members 状态展示

### 子模块1：promo 标签

1. 对于通过 Promo Link 成功订阅且当前仍处于该 link 订阅期的成员：
   1. 展示标签：During promo link discount
2. 标签展示时机：从订阅成功起到结束订阅前；
3. 若当前该成员出现自动续费失败：
   1. 展示 Automatic renewal failed
   2. 失败标签优先，promo link 标签不展示。

### 子模块2：字段展示规则

1. Free 类型
   1. Renews：下次续订日期
   2. Since：订阅开始日期
   3. Billing Cycle：免费期间展示 Free，免费期结束后正常展示扣费周期
   4. Cycle：免费期间展示 -，免费期结束后正常展示扣费次数
   5. Tenure：免费期间展示 -，免费期结束后正常展示扣费月数
2. Discount 类型同线上其他付费类型
