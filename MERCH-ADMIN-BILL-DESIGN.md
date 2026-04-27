# Merch Admin 账单查询设计

## 目标

商家端需要一个稳定的账单查询入口，用来解决两类核心问题：

- 看业绩：
  - 今天卖了多少
  - 哪个业务类型贡献最高
  - 退款冲减后净收入是多少
- 做对账：
  - 某一天或某个月和总部核对成交、退款、净额
  - 导出明细给财务或运营核对

这份文档用于锁定商家端账单查询的一期设计方案，供后端先行实现 API。

## 设计边界

一期只做：

- 账单汇总
- 账单流水查询
- 周期对账汇总
- 明细导出

一期不做：

- 提现
- 分账
- 发票
- 结算单审批流
- 财务权限拆分

遵循原则：

- KISS：先做统一查询和导出，不在一期引入复杂财务流转
- YAGNI：不提前设计税费、佣金、多账户结算
- DRY：后端统一输出账单域，不让前端分别拼订单和退款数据

## 菜单与路由建议

前端建议直接新增一级菜单 `财务中心`，把账单和对账相关页面集中放到该菜单下。

### 一期菜单结构建议

- 一级菜单：`财务中心`
  - 二级菜单：`账单查询`

### 路由建议

- 一级菜单：`/finance`
- 二级页面：`/finance/bill`

### 设计原因

- 商家在心理模型上会把“收入、退款、净额、对账”统一归到财务域
- 一开始就独立成一级菜单，后续扩展提现、结算单、发票时不会再迁移菜单
- 对后端接口分组和前端路由规划更清晰，避免继续混在订单域里

## 核心口径

账单模块最重要的是“口径一致”。如果商家端和总部后台的口径不同，后续对账一定会出现争议。

### 1. 成交金额

- 定义：成功支付订单的实付金额汇总
- 取值字段：`pay_fee`
- 时间口径：`paytime`
- 纳入范围：
  - 线路订单
  - 门票订单
  - 商品订单
- 排除范围：
  - 待支付
  - 已取消
  - 支付失败

### 2. 退款金额

- 定义：退款已完成的退款金额汇总
- 取值字段：`refund_fee`
- 时间口径：退款单 `finishtime`
- 纳入范围：
  - 退款处理状态已完成
- 排除范围：
  - 退款申请中
  - 已拒绝
  - 退款失败
  - 用户取消

### 3. 净收入

- 定义：成交金额减去退款金额
- 公式：`net_amount = paid_amount - refunded_amount`

### 4. 完单金额

- 定义：已完成订单的实付金额汇总
- 取值字段：`pay_fee`
- 时间口径：订单 `finishtime`
- 用途：
  - 经营分析
  - 服务履约统计
- 说明：
  - 只作为补充指标
  - 不替代成交金额和净收入口径

### 5. 不纳入账单金额的动作

以下动作不直接记账，只影响订单状态或后续流程：

- 门票核销
- 商品发货
- 线路合同生成/重发/作废

## 数据来源建议

账单域建议统一基于以下数据源生成，不要让前端分别请求多个列表后自行聚合：

- `fa_wlktour_line_order`
- `fa_wlktour_ticket_order`
- `fa_wlktour_goods_order`
- 退款单表（当前商家退款域）

后端职责：

- 统一把订单收入和退款支出转换成标准账单流水
- 统一做日期过滤、类型过滤、状态过滤
- 统一返回汇总卡片和导出结果

## 页面结构建议

一期建议只做一个页面，分成三块：

### 1. 顶部汇总卡片

- 成交金额
- 退款金额
- 净收入
- 完单金额
- 订单数
- 退款单数

### 2. 流水明细

给商家查看每一笔收入和退款，适合日常核对。

### 3. 周期对账

按天或按月聚合，适合和总部月末对账。

## 前端筛选建议

### 通用筛选项

- 日期范围
- 业务类型：
  - `line`
  - `ticket`
  - `goods`
- 流水类型：
  - `income`
  - `refund`
- 关键字：
  - 订单号
  - 退款单号
  - 用户昵称
  - 用户名
  - 手机号
  - 联系人
  - 收货人
- 支付方式
- 平台来源

### 扩展筛选项

- 订单状态
- 退款状态

## 流水明细 API 建议

### `GET /merchant-api/bill/summary`

用于顶部卡片。

#### 请求参数

| 字段 | 类型 | 说明 |
|---|---|---|
| `date_from` | string | 开始日期 |
| `date_to` | string | 结束日期 |
| `biz_type` | string | 业务类型：`line/ticket/goods`，为空表示全部 |

#### 返回建议

```json
{
  "summary": {
    "paid_amount": "1000.00",
    "refund_amount": "120.00",
    "net_amount": "880.00",
    "finished_amount": "760.00",
    "order_count": 18,
    "refund_count": 2
  }
}
```

### `GET /merchant-api/bill/list`

用于账单流水明细。

#### 请求参数

| 字段 | 类型 | 说明 |
|---|---|---|
| `page` | int | 页码 |
| `page_size` | int | 每页条数 |
| `date_from` | string | 开始日期 |
| `date_to` | string | 结束日期 |
| `biz_type` | string | 业务类型：`line/ticket/goods` |
| `flow_type` | string | 流水类型：`income/refund` |
| `keyword` | string | 关键字 |
| `pay_type` | string | 支付方式 |
| `platform` | string | 平台来源 |
| `order_status` | string | 订单状态 |
| `refund_status` | string | 退款状态 |

#### 返回项建议

每条账单流水建议统一成以下结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | int | 流水 ID |
| `biz_type` | string | 业务类型：`line/ticket/goods` |
| `biz_type_text` | string | 业务类型中文 |
| `flow_type` | string | `income/refund` |
| `flow_type_text` | string | 流水类型中文 |
| `occur_time` | int | 账务发生时间戳 |
| `occur_time_text` | string | 账务发生时间文本 |
| `order_id` | int | 订单 ID |
| `order_sn` | string | 订单号 |
| `refund_id` | int | 退款单 ID，无则 `0` |
| `refund_sn` | string | 退款单号，无则空 |
| `user_info` | object | 下单用户信息 |
| `contact_name` | string | 联系人/收货人 |
| `contact_mobile` | string | 联系手机号/收货手机号 |
| `resource_title` | string | 线路/景点/商品名称 |
| `resource_subtitle` | string | 套餐名/规格文案 |
| `pay_type` | string | 支付方式 |
| `pay_type_text` | string | 支付方式中文 |
| `platform` | string | 平台来源 |
| `platform_text` | string | 平台来源中文 |
| `income_amount` | string | 收入金额 |
| `refund_amount` | string | 退款金额 |
| `net_amount` | string | 净额 |
| `order_status` | string | 订单状态 |
| `order_status_text` | string | 订单状态中文 |
| `refund_status` | string | 退款状态 |
| `refund_status_text` | string | 退款状态中文 |
| `remark` | string | 备注 |

#### `user_info` 字段建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | int | 用户 ID |
| `nickname` | string | 昵称 |
| `username` | string | 用户名 |
| `avatar` | string | 头像完整 URL |
| `mobile` | string | 手机号 |

## 周期对账 API 建议

### `GET /merchant-api/bill/statement-list`

用于按天/按月汇总。

#### 请求参数

| 字段 | 类型 | 说明 |
|---|---|---|
| `date_from` | string | 开始日期 |
| `date_to` | string | 结束日期 |
| `cycle_type` | string | `day/month` |
| `biz_type` | string | 业务类型：`line/ticket/goods`，为空表示全部 |

#### 返回项建议

| 字段 | 类型 | 说明 |
|---|---|---|
| `cycle_key` | string | 周期主键，如 `2026-04-24` 或 `2026-04` |
| `cycle_text` | string | 周期文本 |
| `line_paid_amount` | string | 线路成交金额 |
| `ticket_paid_amount` | string | 门票成交金额 |
| `goods_paid_amount` | string | 商品成交金额 |
| `paid_amount` | string | 总成交金额 |
| `refund_amount` | string | 总退款金额 |
| `net_amount` | string | 净收入 |
| `finished_amount` | string | 完单金额 |
| `order_count` | int | 订单数 |
| `refund_count` | int | 退款单数 |

### `GET /merchant-api/bill/statement-detail`

用于点进某一个周期看明细，返回结构可直接复用 `bill/list`。

## 导出 API 建议

### `GET /merchant-api/bill/export`

用于导出流水或对账单。

#### 请求参数

与 `bill/list` 或 `statement-list` 保持一致，再增加：

| 字段 | 类型 | 说明 |
|---|---|---|
| `export_type` | string | `flow/statement` |

#### 导出列建议

- 业务日期
- 流水类型
- 业务类型
- 原订单号
- 退款单号
- 资源名称
- 套餐/规格
- 用户 ID
- 昵称
- 用户名
- 手机号
- 联系人/收货人
- 支付方式
- 平台来源
- 收入金额
- 退款金额
- 净额
- 订单状态
- 退款状态
- 备注

## 元数据 API 建议

### `GET /merchant-api/meta/bill-options`

用于统一下拉选项。

#### 返回建议

| 字段 | 说明 |
|---|---|
| `biz_type_options` | 业务类型选项 |
| `flow_type_options` | 流水类型选项 |
| `pay_type_options` | 支付方式选项 |
| `platform_options` | 平台来源选项 |
| `order_status_options` | 订单状态选项 |
| `refund_status_options` | 退款状态选项 |
| `cycle_type_options` | 周期类型选项 |

## 前端展示建议

### 顶部卡片

- 成交金额
- 退款金额
- 净收入
- 完单金额
- 订单数
- 退款单数

### 流水表格

建议复用现有订单模块体验：

- `VxeGrid`
- 下单用户走已有的用户卡片组件
- 点击订单号可查看原订单详情
- 点击退款单号可查看退款单详情

### 周期对账表格

建议列：

- 周期
- 线路成交
- 门票成交
- 商品成交
- 总成交
- 总退款
- 净收入
- 完单金额
- 订单数
- 退款单数
- 操作：查看明细 / 导出

## 关键业务假设

这部分建议后端实现前先确认：

### 1. 净收入口径

- 采用：
  - 成交金额 - 退款金额
- 不扣除：
  - 平台佣金
  - 税费
  - 分账

### 2. 商品订单发货

- 发货不记账
- 只改变订单状态

### 3. 核销

- 核销不记账
- 只作为履约行为

### 4. 合同

- 合同生成/作废不记账
- 只作为履约辅助信息

### 5. 时间口径

- 成交金额：按支付时间
- 退款金额：按退款完成时间
- 完单金额：按订单完成时间

## 一期最小落地建议

如果要快速上线，建议后端先做这 4 个接口：

1. `GET /merchant-api/bill/summary`
2. `GET /merchant-api/bill/list`
3. `GET /merchant-api/bill/statement-list`
4. `GET /merchant-api/bill/export`

前端先做：

- 一个 `财务中心 / 账单查询` 页面
- 顶部汇总卡片
- 流水列表
- 周期对账列表
- 订单/退款详情联动

这样已经足够支撑商家日常看业绩和找总部对账。

## 后续扩展位

后续如果需要扩展财务中心，可以在这套设计上继续增加：

- 财务首页
- 提现记录
- 结算单
- 对账备注
- 发票申请
- 财务通知
