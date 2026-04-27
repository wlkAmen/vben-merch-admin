# 商家商品审核补充说明

## 字段约定

- `status`
  - `up` = 上架
  - `hidden` = 隐藏
  - `down` = 下架
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

### 商品列表

`/merchant-api/goods/list` 现在支持：

- 按 `status` 筛选上下架状态
- 按 `audit_status` 筛选审核状态

并额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`

### 商品详情

`/merchant-api/goods/detail` 现在额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`
- `audit_time`
- `audit_admin_id`

### 创建商品

`/merchant-api/goods/create` 会自动写入：

- `status = down`
- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

商家端不允许通过创建接口直接指定商品状态。

### 修改商品

`/merchant-api/goods/update` 会自动重置为待审核：

- `status = down`
- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

商家端不允许通过编辑接口直接指定商品状态。

### 上下架

`/merchant-api/goods/toggle-status` 规则如下：

- `status = up` 只有在 `audit_status = 1` 时才允许执行
- `status = hidden/down` 可直接执行
- 未审核通过时返回：`当前商品未审核通过，不能上架`

## 平台后台变化

- 原 `商品管理` 页面只负责已审核商品管理
- 新增同级菜单：`待审核商品`
- 审核通过、审核驳回动作集中在待审核商品页面

## C 端可见性规则

商品相关前台入口统一按以下条件放行：

- `status = up`
- `audit_status = 1`

已补入口包括：

- 商品列表
- 商品详情
- 收藏商品
- 购物车商品读取与加购校验
- DIY 页面商品聚合
