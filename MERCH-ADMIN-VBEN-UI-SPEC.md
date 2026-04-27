# Merch Admin Vben UI 开发规范

## 1. 目的

本文档用于约束 `merch-admin` 后续页面开发方式，统一到当前仓库真实采用的 Vben 5.x 开发范式，避免出现“页面能跑，但不符合仓库既有结构和 UI 规范”的情况。

本文档不是设计稿，而是可直接执行的工程规范。

---

## 2. 规范来源

本规范以当前仓库已有实现为准，优先级如下：

1. `packages` 中已经提供的基础能力与页面容器
2. `playground` 中的示例页面与系统管理页面
3. `apps/web-ele` 当前适配器与布局实现
4. `merch-admin` 自身业务文档

核心参考文件：

- `packages/effects/common-ui/src/components/page/page.vue`
- `packages/effects/common-ui/src/components/col-page/col-page.vue`
- `packages/effects/common-ui/src/ui/profile/profile.vue`
- `apps/web-ele/src/adapter/form.ts`
- `apps/web-ele/src/adapter/vxe-table.ts`
- `playground/src/views/system/role/list.vue`
- `playground/src/views/system/menu/modules/form.vue`
- `playground/src/views/examples/form/basic.vue`
- `apps/web-ele/src/views/dashboard/analytics/index.vue`
- `apps/web-ele/src/views/dashboard/workspace/index.vue`

---

## 3. 总体原则

### 3.0 优先找“同场景完整页面模板”

在决定页面实现方案前，必须先按下面顺序找参考：

1. `apps/web-ele` 中是否已经有同场景完整页面
2. `playground/src/views` 中是否已经有同场景完整页面
3. `packages/effects/common-ui` 中是否已有可直接复用的页面级 UI
4. 如果以上都没有，再退回通用组件组合

这条优先级高于“先选表单组件/表格组件”的中层规范。

也就是说：

- 如果当前仓库已经有完整的“资料中心页”，优先参考该资料中心页
- 如果当前仓库已经有完整的“工作台页”，优先参考该工作台页
- 不要在已有完整页面模板的情况下，只参考更底层的 `Page`、`Card`、`Form` 自己重新拼一页

### 3.1 先复用框架，再补业务

页面开发顺序必须是：

1. 先选页面容器
2. 先复用已有通用组件
3. 先走 schema 化表单/表格方案
4. 最后才补局部业务定制

禁止一上来直接手写整页 DOM、整页布局和整页样式。

### 3.2 结构优先，视觉其次

Vben 在本仓库中的风格不是“先做视觉稿”，而是“先把结构搭对”。

优先确保：

- 页面结构统一
- 交互入口统一
- 表单、表格、抽屉、弹窗使用方式统一
- 样式来源统一

### 3.3 优先使用仓库内约定，而不是自由发挥

如果 `packages` 或 `playground` 已有同类实现，优先复用和模仿，不重复造页面骨架。

---

## 4. 页面容器规范

### 4.0 页面模板优先于页面容器

`Page`、`ColPage` 是页面容器，不是页面模板。

如果仓库中已经存在更贴近当前业务场景的完整模板，则优先级应高于普通容器：

- 资料中心类页面：优先参考 `apps/web-ele/src/views/_core/profile/index.vue`
- 工作台类页面：优先参考 `apps/web-ele/src/views/dashboard/workspace/index.vue`
- 分析看板类页面：优先参考 `apps/web-ele/src/views/dashboard/analytics/index.vue`

只有在没有更贴近的完整模板时，才回退到 `Page` / `ColPage` 自由组合。

### 4.1 普通页面必须优先使用 `Page`

适用场景：

- 工作台
- 列表页
- 表单页
- 详情页
- 说明页
- 示例页

标准写法：

```vue
<template>
  <Page title="页面标题" description="页面说明">
    页面主体内容
  </Page>
</template>
```

说明：

- 页面标题、描述、右侧操作区统一通过 `Page` 提供
- 不要自己手写“标题区 + 内容区 + 底部区”作为默认方案
- 需要内容区域自适应高度时，使用 `auto-content-height`

### 4.2 双栏页面优先使用 `ColPage`

适用场景：

- 左侧树/分类，右侧详情
- 左侧导航，右侧编辑
- 左侧筛选，右侧主内容

禁止手写一套可拖拽双栏布局。

### 4.3 资料中心类页面优先复用 `Profile`

适用场景：

- 账号设置
- 商家设置
- 多标签配置页

如果是“左侧 tabs / 右侧内容”的资料中心形态，优先使用 `Profile`，而不是自己拼卡片和侧边栏。

更具体地说，`merch-admin` 的以下页面必须首先对齐：

- `apps/web-ele/src/views/_core/profile/index.vue`

对于商家端：

- `商家资料`
- `账号设置`
- `修改密码`

优先落到同一类资料中心结构中，而不是拆成若干普通表单页后再自己拼视觉层。

---

## 5. 路由与页面目录规范

### 5.1 路由模块化

每个业务域使用独立 route module：

- `dashboard.ts`
- `line.ts`
- `ticket.ts`
- `goods.ts`
- `order.ts`
- `verify.ts`
- `setting.ts`

### 5.2 路由 meta 必须完整

至少包含：

- `title`
- `icon`
- `order`

需要隐藏菜单或绑定激活菜单时补充：

- `hideInMenu`
- `activePath`

### 5.3 页面目录建议

业务域页面按下面结构组织：

```text
views/merchant/<domain>/
├─ list.vue
├─ detail.vue
├─ modules/
│  ├─ form.vue
│  ├─ detail-drawer.vue
│  └─ columns.ts
└─ data.ts
```

说明：

- 列表页负责页面壳和事件编排
- `modules` 放子组件、表单抽屉、详情抽屉
- `data.ts` 放 columns、schema、枚举、常量映射

禁止把列表、筛选、表单 schema、弹窗逻辑、详情逻辑全塞进一个页面文件。

---

## 6. 列表页规范

### 6.1 标准模式

列表页统一采用：

- `Page`
- `useVbenVxeGrid`
- `formOptions`
- `gridOptions`
- `useVbenDrawer` 或 `useVbenModal`

参考：

- `playground/src/views/system/role/list.vue`

### 6.2 查询区规范

查询区不手写独立 `el-form`，优先放到 `useVbenVxeGrid` 的 `formOptions` 中。

常见能力：

- 时间映射 `fieldMappingTime`
- 查询后自动触发
- 折叠查询项
- grid 内置工具栏

### 6.3 表格规范

表格统一使用当前项目已接好的 `useVbenVxeGrid` 适配器，不直接手写 `el-table` 作为主方案，除非明确说明该场景不适合表格插件。

原因：

- 列表行为一致
- 工具栏一致
- 分页一致
- 代理请求模式一致
- 后续维护成本更低

### 6.4 列表页推荐结构

```vue
<script setup lang="ts">
const [FormDrawer, formDrawerApi] = useVbenDrawer({...});
const [Grid, gridApi] = useVbenVxeGrid({...});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="gridApi.query()" />
    <Grid table-title="列表标题">
      <template #toolbar-tools>
        操作按钮
      </template>
    </Grid>
  </Page>
</template>
```

---

## 7. 表单页规范

### 7.1 标准模式

表单统一优先使用：

- `useVbenForm`
- schema 驱动
- `z` 校验

参考：

- `playground/src/views/examples/form/basic.vue`
- `playground/src/views/system/menu/modules/form.vue`
- `packages/effects/common-ui/src/ui/profile/base-setting.vue`

### 7.2 禁止项

以下写法不作为默认方案：

- 直接大量手写 `el-form`
- 页面内堆满 `el-form-item`
- 把字段显隐逻辑写在模板里
- 把校验规则拆散在多个局部函数中

### 7.3 schema 规范

字段 schema 应集中定义，典型能力包括：

- `dependencies.show`
- `dependencies.rules`
- `componentProps`
- 异步校验
- 远程选项加载

### 7.4 表单布局规范

推荐使用：

- `commonConfig`
- `wrapperClass`
- `showDefaultActions: false`

提交按钮由页面或抽屉统一控制，不在每个字段块中各自散落。

---

## 8. 抽屉与弹窗规范

### 8.1 优先使用 `useVbenDrawer`

适用场景：

- 列表页新增/编辑
- 详情查看
- 辅助配置

### 8.2 优先使用 `useVbenModal`

适用场景：

- 小型确认
- 少量字段编辑
- 二次确认流程

### 8.3 抽屉内容规范

抽屉内部通常只承接：

- 一个 `useVbenForm`
- 或一组轻量内容块

不要把整个列表页、整套大布局塞进抽屉里。

---

## 9. 工作台与概览页规范

### 9.1 不要从零手搓首页视觉系统

工作台、分析页优先复用 `@vben/common-ui` 提供的组件组合。

优先参考：

- `apps/web-ele/src/views/dashboard/analytics/index.vue`
- `apps/web-ele/src/views/dashboard/workspace/index.vue`

其中优先级更高的参考是：

- 若页面目标是“后台首页 / 导航首页 / 日常进入页”，优先参考 `workspace/index.vue`
- 若页面目标是“图表分析 / 数据看板”，优先参考 `analytics/index.vue`

可优先组合的组件方向：

- `AnalysisOverview`
- `AnalysisChartCard`
- `AnalysisChartsTabs`
- `WorkbenchHeader`
- `WorkbenchQuickNav`
- `WorkbenchTodo`
- `WorkbenchProject`
- `WorkbenchTrends`

### 9.2 商家端工作台允许业务化，但不能脱离框架基底

商家端工作台可以有自己的文案和业务指标，但结构上仍应：

- 优先对齐 `apps/web-ele/src/views/dashboard/workspace/index.vue` 的页面组织方式
- 优先复用 `WorkbenchHeader`、`WorkbenchProject`、`WorkbenchQuickNav`、`WorkbenchTodo`、`AnalysisChartCard`
- 如果现有 `WorkbenchHeader` 不满足业务数据展示，可以做“商家版 header 包装层”，但页面整体结构仍然应先贴近 `workspace`
- 只在现成组件不满足时做局部补充

禁止整页大面积自定义 hero、卡片系统、阴影系统、颜色系统作为首选实现。

---

## 10. 样式规范

### 10.1 样式优先级

严格按下面顺序处理：

1. 组件自带能力
2. utility class
3. 少量 `contentClass`、`headerClass`、`footerClass`
4. 极少量局部 `style scoped`

### 10.2 禁止重新发明一套视觉系统

禁止默认做法：

- 大量手写颜色变量
- 大量手写阴影、圆角、卡片体系
- 大量手写响应式断点布局
- 为单个业务页单独发明一套视觉语言

### 10.3 `<style scoped>` 使用约束

只有在以下情况才允许补：

- utility class 无法表达
- 第三方组件局部样式覆写
- 极少量复杂布局修正

如果一个页面主要靠 `<style scoped>` 才能成立，通常说明写法已经偏离仓库范式。

### 10.4 证据

`playground/src/views` 中大部分页面没有写 `<style scoped>`，说明当前仓库的主流方式就是：

- 组件组合
- utility class
- 少量样式补充

而不是整页 CSS 驱动。

---

## 11. 组件选择规范

### 11.1 优先使用仓库已接入组件

`apps/web-ele` 当前优先栈：

- 布局：`@vben/layouts`
- 通用页面组件：`@vben/common-ui`
- 表单：`useVbenForm`
- 表格：`useVbenVxeGrid`
- 图标：`@vben/icons`

### 11.2 Element Plus 的使用边界

可以使用 Element Plus，但应作为底层组件来源，而不是重新绕过 Vben 生态搭一套业务页面。

推荐：

- 在 `adapter/form.ts` 体系下使用 Element Plus 组件
- 在现有 `adapter/vxe-table.ts` 下使用表格体系

不推荐：

- 直接整页手写 `el-form`
- 直接整页手写 `el-card`
- 直接整页手写 `el-table`

---

## 12. 数据层与页面职责规范

### 12.1 页面只做编排

页面文件负责：

- 组织组件
- 调用 API
- 处理跳转
- 触发弹窗/抽屉

### 12.2 schema、columns、常量分离

以下内容尽量下沉到独立文件：

- 表格 columns
- 查询 schema
- 表单 schema
- 状态枚举
- 文案映射

### 12.3 接口契约集中

业务接口定义放在 `src/api/core` 或按业务域拆分的 API 文件中，不在页面内部散写请求逻辑。

---

## 13. 商家端推荐页面落地模式

### 13.1 工作台

推荐：

- 优先参考 `apps/web-ele/src/views/dashboard/workspace/index.vue`
- 使用 `WorkbenchHeader` 或其业务包装层
- 使用 `WorkbenchProject`
- 使用 `WorkbenchQuickNav`
- 使用 `WorkbenchTodo`
- 使用 `AnalysisChartCard`

不推荐：

- 整页自定义 hero
- 整页自定义卡片风格

### 13.2 商家资料 / 账号设置

推荐：

- 优先参考 `apps/web-ele/src/views/_core/profile/index.vue`
- 使用 `Profile`
- 内容区再承载 `useVbenForm`

不推荐：

- 大量手写 `el-form + el-card + scoped css`
- 只参考 `Page + Form`，却忽略 `Profile` 这种更贴近场景的页面模板

### 13.3 线路 / 门票 / 商品 / 订单列表

推荐：

- `Page`
- `useVbenVxeGrid`
- `modules/form.vue`
- `data.ts`
- `useVbenDrawer`

### 13.4 线路 / 门票 / 商品编辑

推荐：

- 表单 schema 化
- 抽屉或独立表单页二选一
- 配套详情、列表、编辑共享 schema/常量

---

## 14. 当前商家端已发现的偏差

以下文件当前不符合本规范：

- `apps/web-ele/src/views/merchant/dashboard/index.vue`
  - 问题：之前没有优先对齐 `workspace/index.vue`
  - 问题：之前自定义了一套首页组织方式，参考层级偏低

- `apps/web-ele/src/views/merchant/setting/merchant.vue`
  - 问题：之前没有优先对齐 `profile/index.vue`
  - 问题：之前只回收到 `Page + useVbenForm`，但没有回到更高优先级的资料中心模板

- `apps/web-ele/src/views/merchant/setting/account.vue`
  - 问题：之前没有优先对齐 `profile/index.vue`
  - 问题：之前没有优先采用资料中心场景模板

- `apps/web-ele/src/views/merchant/common/placeholder.vue`
  - 问题：不符合仓库普通内页的默认写法

这些页面需要按本文档重构。

---

## 15. 后续开发执行清单

后续新增页面前，必须先自检：

1. 这个页面是否已经放进 `Page` 或 `ColPage`
2. 这个页面是否可以复用 `Profile`、分析组件、工作台组件
3. 这个表单是否已经优先尝试 `useVbenForm`
4. 这个列表是否已经优先尝试 `useVbenVxeGrid`
5. 这个新增/编辑是否已经优先尝试 `useVbenDrawer`
6. 是否把 schema、columns、常量拆到了独立文件
7. 是否用 utility class 替代了大部分自定义 CSS
8. 是否避免新建一套页面视觉系统

只要以上 8 条里有 3 条以上不满足，原则上就不应继续实现，先回到规范修结构。

---

## 16. 结论

`merch-admin` 后续开发必须回到当前仓库真实的 Vben 方式：

- 页面先用 `Page`
- 表单先用 `useVbenForm`
- 列表先用 `useVbenVxeGrid`
- 资料页先看 `Profile`
- 工作台先复用分析/工作台组件
- 样式先用 utility class，最后才补少量 scoped css

这不是风格偏好问题，而是当前仓库的既有工程约束。
