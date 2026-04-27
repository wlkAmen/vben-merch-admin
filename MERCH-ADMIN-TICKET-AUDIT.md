# 商家门票套餐审核补充说明

## 边界说明

- 商家真正拥有的是 `ticket_suit`
- `ticket` 主表是景点主数据，商家后台按只读视图使用
- 所以门票审核字段落在 `fa_wlktour_ticket_suit`

## 字段约定

- `audit_status`
  - `0` = 待审核
  - `1` = 审核通过
  - `2` = 驳回
- `audit_remark`
  - 驳回原因
- `audit_time`
  - 审核时间
- `audit_admin_id`
  - 审核管理员

## 商家端接口变化

### 门票套餐列表

`/merchant-api/ticket/suit/list` 现在支持：

- 按 `audit_status` 筛选审核状态

并额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`
- `audit_time`
- `audit_admin_id`

### 门票套餐详情

`/merchant-api/ticket/suit/detail` 现在额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`
- `audit_time`
- `audit_admin_id`

### 创建门票套餐

`/merchant-api/ticket/suit/create` 会自动写入：

- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

### 修改门票套餐

`/merchant-api/ticket/suit/update` 会自动重置为待审核：

- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

## 平台后台变化

- 原 `门票套餐管理` 页面只负责已审核数据管理
- 新增同级菜单：`待审核门票`
- 审核通过、审核驳回动作集中在待审核门票页面

## C 端可见性规则

门票相关前台入口统一要求套餐满足：

- `audit_status = 1`

已补入口包括：

- 推荐景点
- 景点列表
- 景点详情下套餐
- 收藏景点
- 首页/分类/DIY 页面景点聚合
