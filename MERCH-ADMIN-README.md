# Merch Admin 文档总览

## 目标

这组文档用于承接 `merch-admin` 商家后台的一期开发决策，避免后续实现时反复回到聊天记录整理需求。

当前已经锁定的方向如下：

- 前端框架：`Vben 5.x`
- UI 方案：`Element Plus`
- 前端形态：独立前端仓库
- 后端形态：继续使用现有 `ThinkPHP + FastAdmin + wlktour`
- 交互模式：前后端分离，前端静态路由
- 账号体系：仅支持 `wlktour_merch_admin`
- 一期业务范围：`线路 + 门票 + 商品 + 订单 + 核销 + 商家设置`

## 文档清单

- [MERCH-ADMIN-FRONTEND-STRUCTURE.md](./MERCH-ADMIN-FRONTEND-STRUCTURE.md)
  - 前端仓库结构、目录职责、开发与部署约束
- [MERCH-ADMIN-PAGE-TREE.md](./MERCH-ADMIN-PAGE-TREE.md)
  - 页面树、菜单结构、路由范围、一期页面边界
- [MERCH-ADMIN-API-GROUPS.md](./MERCH-ADMIN-API-GROUPS.md)
  - 后端 API 分组方案、接口职责、鉴权和数据边界
- [MERCH-ADMIN-API-DOCS.md](./MERCH-ADMIN-API-DOCS.md)
  - 当前商家后台 API 详细对接文档，供后续 `Vben 5.6` 前端接入使用
- [MERCH-ADMIN-LINE-AUDIT.md](./MERCH-ADMIN-LINE-AUDIT.md)
  - 商家线路审核补充说明
- [MERCH-ADMIN-TICKET-AUDIT.md](./MERCH-ADMIN-TICKET-AUDIT.md)
  - 商家门票套餐审核补充说明
- [MERCH-ADMIN-DEVELOPMENT-PLAN.md](./MERCH-ADMIN-DEVELOPMENT-PLAN.md)
  - 迭代顺序、阶段拆解、验收口径、交付节奏
- [MERCH-ADMIN-BILL-DESIGN.md](./MERCH-ADMIN-BILL-DESIGN.md)
  - 商家账单查询、业绩统计、周期对账与导出设计
- [MERCH-ADMIN-CODE-RULES.md](./MERCH-ADMIN-CODE-RULES.md)
  - 商家后台后端 API 注释规则与代码注释要求
  - 同时包含商家认证边界规则，约束只能使用独立的 `MerchantAuth + fa_wlktour_merch_admin`

## 一期实施原则

- 只新增商家专用 API，不直接复用 FastAdmin 页面控制器作为前端接口
- 不改现有平台后台运行方式，不替换旧商家中心
- 所有商家数据边界由后端 `merch_id` 控制，前端传参不参与授权
- 每个业务域按“后端接口 -> 前端页面 -> 联调回归”的顺序纵向推进
- 一期不做后端动态菜单，不做复杂角色权限，不提前引入多管理端架构

## 现有系统中可直接复用的基础

- 商家管理员认证基础：
  - `application/api/controller/wlktour/Api.php`
  - `application/api/controller/wlktour/Auth.php`
  - `application/api/controller/wlktour/auth/Admin.php`
- 旧商家中心参考：
  - `application/index/controller/wlktour/merch/*`
- 核销相关现有接口参考：
  - `addons/wlktour/controller/Merch.php`
- 核心商家数据表：
  - `fa_wlktour_merch`
  - `fa_wlktour_merch_admin`
  - `fa_wlktour_line`
  - `fa_wlktour_ticket`
  - `fa_wlktour_goods`
  - `fa_wlktour_line_order`
  - `fa_wlktour_ticket_order`
  - `fa_wlktour_goods_order`

## 使用建议

- 后续如要新增页面或接口，先更新对应文档，再开始动代码
- 如果某条决策发生变化，优先修改本文档中的“锁定方向”和对应专题文档
- 这组文档默认作为一期实施基线，除非明确评审变更，否则实现应以文档为准
