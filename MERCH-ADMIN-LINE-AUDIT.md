# 商家线路审核补充说明

## 字段约定

- `status`
  - `0` = 下架
  - `1` = 上架
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

### 线路列表

`/merchant-api/line/list` 现在支持：

- 按 `status` 筛选上下架状态
- 按 `audit_status` 筛选审核状态

并额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`

### 线路详情

`/merchant-api/line/detail` 现在额外返回：

- `audit_status`
- `audit_status_text`
- `audit_remark`
- `audit_time`
- `audit_admin_id`

### 创建线路

`/merchant-api/line/create` 会自动写入：

- `status = 0`
- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

商家端不允许通过创建接口直接指定上架状态。

### 修改线路

`/merchant-api/line/update` 会自动重置为待审核：

- `status = 0`
- `audit_status = 0`
- `audit_remark = ''`
- `audit_time = null`
- `audit_admin_id = null`

商家端不允许通过编辑接口直接指定上架状态。

### 上下架

`/merchant-api/line/toggle-status` 规则如下：

- `status = 0` 可直接执行下架
- `status = 1` 只有在 `audit_status = 1` 时才允许上架
- 未审核通过时返回：`当前线路未审核通过，不能上架`

## 平台后台变化

- 原 `线路管理` 页面不再承担审核工作队列
- 新增同级菜单：`待审核线路`
- 审核通过、审核驳回动作集中在待审核线路页面

## C 端可见性规则

线路相关前台入口统一按以下条件放行：

- `status = 1`
- `audit_status = 1`

已补入口包括：

- 线路列表
- 线路详情
- 首页/分类推荐线路
- 收藏线路
- 游记关联线路
- DIY 页面线路
- 分销推广线路
