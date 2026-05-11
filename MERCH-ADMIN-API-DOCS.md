# Merch Admin API 文档

## 说明

本文档整理当前商家后台后端 API，供后续 `merch-admin` 前端仓库接入使用。

当前接口实现目录：

- `application/api/controller/merchant/*`

当前路由入口：

- `application/route.php`
- 统一前缀：`/merchant-api`

## 认证与返回约定

## 认证规则

- 登录接口：无需登录
- 其余接口：默认都需要商家管理员登录
- 当前商家认证体系独立于旧 `wlktour` 会员体系
- 当前商家账号来源：`fa_wlktour_merch_admin`

## 登录会话规则

- 当前商家端使用 `单 token + 服务端会话` 方案，不是纯 JWT
- 登录成功后，后端会返回随机 `token`，前端继续像现在一样保存并随请求带上即可
- 会话空闲 `2 小时` 无有效请求会失效
- 会话最长 `7 天` 后必须重新登录
- 每次已登录请求通过鉴权后，后端会自动刷新空闲过期时间
- 当前没有单独的续期接口，也不需要 refresh token
- 以下情况当前 token 会立刻失效：
  - 主动退出登录
  - 修改密码成功
  - 同账号在其他设备重新登录
  - 账号状态变成非 `normal`
  - 服务端清空运行缓存

## Token 传递方式

推荐请求头：

```http
Authorization: Bearer xxxxx
```

当前后端也兼容：

```http
Token: xxxxx
```

说明：

- 如果现有前端已经使用 `Token` 请求头，可以继续使用
- 中期建议统一切到 `Authorization: Bearer <token>`
- 仍然兼容请求参数 `token=xxx` 和 Cookie 中的 `token`，但不建议新代码继续使用

不要发送自定义服务器变量风格的：

```http
HTTP_TOKEN: xxxxx
```

## 响应结构

统一返回：

```json
{
  "code": 1,
  "msg": "获取成功",
  "time": 1710000000,
  "data": {}
}
```

说明：

- `code = 1` 表示成功
- `code = 0` 表示业务失败
- 部分鉴权失败会带 `401/403` HTTP 状态码

## 401 处理约定

商家端前端建议统一按 HTTP 状态码处理登录态失效：

- 只要商家端接口返回 `401`
- 就视为当前登录态失效
- 清理本地 token、管理员资料、商家资料
- 跳转登录页并提示“登录已过期，请重新登录”

当前 `401` 常见响应文案包括：

- `Session has expired`
- `Please login first`

前端不要依赖固定英文文案判断，建议以 `HTTP 401` 为准。

## 列表结构

分页列表统一放在 `data` 中：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "page_size": 15
}
```

## 文本标签约定

商家后台 API 统一在接口层显式返回中文标签，不依赖模型中的翻译字段。

约定如下：

- 原始值保留原字段
  - 例如：`status`、`type`、`pay_type`
- 中文标签统一使用 `*_text`
  - 例如：`status_text`
  - `type_text`
  - `pay_type_text`
  - `platform_text`
  - `refund_status_text`

禁止在商家 API 中继续依赖：

- `status_text`
- `type_text`
- `pay_type_text`
- `platform_text`
- `refund_status_text`

原因：

- 商家 API 运行在 `api` 模块下，不应依赖 `application/admin/lang/*` 的语言加载链
- 显式返回 `*_text` 更稳定，便于前端长期接入与文档维护

## 模块总览

| 模块     | 前缀           | 说明                       |
| -------- | -------------- | -------------------------- |
| 认证     | `/auth`        | 登录、退出、当前资料、改密 |
| 工作台   | `/dashboard`   | 汇总卡片数据               |
| 元数据   | `/meta`        | 表单下拉、分类、类型等     |
| 线路     | `/line`        | 线路主表                   |
| 线路套餐 | `/line/suit`   | 线路套餐及价格             |
| 商品     | `/goods`       | 商品主表                   |
| 商品规格 | `/goods/sku`   | 商品多规格保存与读取       |
| 景点     | `/ticket`      | 商家可经营景点只读视图     |
| 门票套餐 | `/ticket/suit` | 当前商家门票套餐           |
| 订单     | `/order/*`     | 三类订单列表与详情         |
| 退款     | `/refund`      | 售后退款处理               |
| 对账     | `/bill`        | 账单与账期                 |
| 结算     | `/settlement`  | 结算明细、申请、结算单     |
| 核销     | `/verify`      | 门票核销                   |
| 设置     | `/setting`     | 商家资料、账号资料         |
| 上传     | `/upload`      | 图片、文件上传             |

## 1. 认证接口

## 1.1 登录

- 方法：`POST`
- 路径：`/merchant-api/auth/login`
- 处理器：`merchant/Passport@login`

### 请求参数

| 字段       | 类型   | 必填 | 说明           |
| ---------- | ------ | ---- | -------------- |
| `username` | string | 是   | 商家管理员账号 |
| `userName` | string | 否   | 兼容旧前端命名 |
| `password` | string | 是   | 登录密码       |

### 返回 data

```json
{
  "token": "uuid-token",
  "admin": {
    "id": 7,
    "username": "merchant_admin",
    "nickname": "测试管理员",
    "avatar": "https://...",
    "email": "test@example.com",
    "mobile": "13800000000",
    "merch_id": 7,
    "status": "normal",
    "logintime": 1710000000,
    "logintime_text": "2026-04-15 10:00:00"
  },
  "merchant": {
    "id": 7,
    "name": "微凌客旅行社",
    "logo": "https://...",
    "mobile": "0577-12345678",
    "type": "external",
    "status": "normal"
  }
}
```

## 1.2 退出登录

- 方法：`POST`
- 路径：`/merchant-api/auth/logout`
- 处理器：`merchant/Auth@logout`

### 请求参数

无

### 前端注意

- 调用成功后，当前 token 立即失效
- 前端应同步清理本地登录态，不要继续保留旧 token

## 1.3 获取当前登录资料

- 方法：`GET`
- 路径：`/merchant-api/auth/profile`
- 处理器：`merchant/Auth@profile`

### 请求参数

无

### 返回 data

和登录成功后的 `data` 结构一致。

### 前端注意

- 如果会话空闲超过 `2 小时`，或总登录时长超过 `7 天`，这里会返回 `401`
- 可以用这个接口作为页面初始化时的登录态探测接口

## 1.4 修改密码

- 方法：`POST`
- 路径：`/merchant-api/auth/change-password`
- 处理器：`merchant/Auth@changePassword`

### 请求参数

| 字段               | 类型   | 必填 | 说明       |
| ------------------ | ------ | ---- | ---------- |
| `old_password`     | string | 是   | 原密码     |
| `oldPassword`      | string | 否   | 兼容旧命名 |
| `new_password`     | string | 是   | 新密码     |
| `newPassword`      | string | 否   | 兼容旧命名 |
| `confirm_password` | string | 是   | 确认新密码 |
| `confirmPassword`  | string | 否   | 兼容旧命名 |

### 前端注意

- 修改密码成功后，当前 token 会立即失效
- 前端不要继续停留在当前登录态，建议直接清理本地登录信息并跳转登录页

## 2. 工作台接口

## 2.1 获取商家工作台汇总数据

- 方法：`GET`
- 路径：`/merchant-api/dashboard/summary`
- 处理器：`merchant/Dashboard@summary`

### 返回 data

| 字段                   | 类型   | 说明                   |
| ---------------------- | ------ | ---------------------- |
| `today_turnover`       | number | 今日成交额             |
| `today_order_count`    | number | 今日订单数             |
| `pending_pay_count`    | number | 待支付订单数           |
| `pending_verify_count` | number | 待核销订单数           |
| `line_count`           | number | 线路数量               |
| `ticket_count`         | number | 当前商家可经营景点数量 |
| `goods_count`          | number | 商品数量               |

## 3. 元数据接口

## 3.1 线路表单元数据

- 方法：`GET`
- 路径：`/merchant-api/meta/line-options`
- 处理器：`merchant/Meta@lineOptions`

### 返回 data

| 字段                   | 说明         |
| ---------------------- | ------------ |
| `type_list`            | 线路类型选项 |
| `status_list`          | 线路状态选项 |
| `multi_signatory_list` | 多人签约选项 |
| `tag_groups`           | 属性组及标签 |
| `start_city_options`   | 出发地树     |
| `end_city_options`     | 目的地树     |
| `site_options`         | 上车点树     |

## 3.2 商品表单元数据

- 方法：`GET`
- 路径：`/merchant-api/meta/goods-options`
- 处理器：`merchant/Meta@goodsOptions`

### 返回 data

| 字段               | 说明         |
| ------------------ | ------------ |
| `type_list`        | 商品类型选项 |
| `status_list`      | 商品状态选项 |
| `category_options` | 商品分类树   |
| `dispatch_options` | 发货模板列表 |

## 3.3 门票表单元数据

- 方法：`GET`
- 路径：`/merchant-api/meta/ticket-options`
- 处理器：`merchant/Meta@ticketOptions`

### 返回 data

| 字段                | 说明                   |
| ------------------- | ---------------------- |
| `status_list`       | 景点状态选项           |
| `ticket_options`    | 当前商家可经营景点列表 |
| `category_options`  | 景点分类树             |
| `level_options`     | 景点等级列表           |
| `type_options`      | 门票类型列表           |
| `passenger_options` | 游客信息要求选项       |

## 3.4 快递公司选项

- 方法：`GET`
- 路径：`/merchant-api/meta/express-options`
- 处理器：`merchant/Meta@expressOptions`

### 返回 data

| 字段              | 说明         |
| ----------------- | ------------ |
| `express_options` | 快递公司列表 |

### `express_options[]` 字段

| 字段   | 类型   | 说明         |
| ------ | ------ | ------------ |
| `id`   | int    | 快递公司 ID  |
| `name` | string | 快递公司名称 |
| `code` | string | 快递公司编码 |

## 4. 线路接口

## 4.1 获取线路列表

- 方法：`GET`
- 路径：`/merchant-api/line/list`
- 处理器：`merchant/Line@list`

### 请求参数

| 字段           | 类型   | 必填 | 说明                               |
| -------------- | ------ | ---- | ---------------------------------- |
| `page`         | int    | 否   | 页码                               |
| `page_size`    | int    | 否   | 每页条数                           |
| `keyword`      | string | 否   | 标题关键词                         |
| `status`       | string | 否   | `0`/`1`                            |
| `audit_status` | string | 否   | `0` 待审核，`1` 审核通过，`2` 驳回 |
| `type`         | string | 否   | 线路类型                           |

### 返回项

每项包含：

- `id`
- `title`
- `desc`
- `lineday`
- `linenight`
- `sales`
- `status`
- `status_text`
- `audit_status`
- `audit_status_text`
- `audit_remark`
- `type`
- `type_text`
- `mobile`
- `images`
- `poster`
- `file`
- `suit_count`
- `createtime`
- `updatetime`

## 4.2 获取线路详情

- 方法：`GET`
- 路径：`/merchant-api/line/detail`
- 处理器：`merchant/Line@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 线路 ID |

### 返回 data

```json
{
  "detail": {},
  "suits": []
}
```

其中 `detail` 包含主表字段，`suits` 为当前线路下套餐及价格信息。

`detail` 额外包含以下审核字段：

- `audit_status`
- `audit_status_text`
- `audit_remark`
- `audit_time`
- `audit_admin_id`

## 4.3 创建线路

- 方法：`POST`
- 路径：`/merchant-api/line/create`
- 处理器：`merchant/Line@create`

### 允许字段

| 字段                | 说明                 |
| ------------------- | -------------------- |
| `title`             | 标题                 |
| `desc`              | 描述                 |
| `lineday`           | 天数                 |
| `linenight`         | 晚数                 |
| `linebefore`        | 提前报名天数         |
| `startcity`         | 出发地数组或对象数组 |
| `endcity`           | 目的地数组或对象数组 |
| `tagids`            | 标签数组或对象数组   |
| `insuranceids`      | 保险 ID 数组         |
| `type`              | 线路类型             |
| `min_num`           | 最低成团人数         |
| `mobile`            | 联系电话             |
| `video`             | 视频                 |
| `images`            | 轮播图               |
| `dayinfo`           | 行程明细             |
| `content`           | 详情                 |
| `content1~content5` | 预留内容             |
| `poster`            | 长图海报             |
| `site_ids`          | 上车点数组或对象数组 |
| `isMultiSignatory`  | 是否多人签署         |
| `file`              | 行程文件             |

### 说明

- `merchid` 由后端自动取当前商家，不接受前端指定
- 套餐和价格不在这里提交，走 `line/suit/*`
- 创建时会强制写入 `status=0`、`audit_status=0`、`audit_remark=''`

## 4.4 更新线路

- 方法：`POST`
- 路径：`/merchant-api/line/update`
- 处理器：`merchant/Line@update`

### 请求参数

在创建字段基础上额外需要：

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 线路 ID |

### 说明

- 更新后会自动重置为待审核：`status=0`、`audit_status=0`、`audit_remark=''`

## 4.5 切换线路状态

- 方法：`POST`
- 路径：`/merchant-api/line/toggle-status`
- 处理器：`merchant/Line@toggleStatus`

### 请求参数

| 字段     | 类型   | 必填 | 说明               |
| -------- | ------ | ---- | ------------------ |
| `id`     | int    | 是   | 线路 ID            |
| `status` | string | 是   | `0` 下架，`1` 上架 |

### 说明

- 只有 `audit_status=1` 的线路才允许上架
- `status=0` 可直接执行下架

## 5. 线路套餐接口

## 5.1 获取线路套餐列表

- 方法：`GET`
- 路径：`/merchant-api/line/suit/list`
- 处理器：`merchant/LineSuit@list`

### 请求参数

| 字段                 | 类型   | 必填 | 说明           |
| -------------------- | ------ | ---- | -------------- |
| `page`               | int    | 否   | 页码           |
| `page_size`          | int    | 否   | 每页条数       |
| `line_id` / `lineId` | int    | 否   | 按线路筛选     |
| `keyword`            | string | 否   | 套餐名称关键词 |

## 5.2 获取线路套餐详情

- 方法：`GET`
- 路径：`/merchant-api/line/suit/detail`
- 处理器：`merchant/LineSuit@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 套餐 ID |

## 5.3 创建线路套餐

- 方法：`POST`
- 路径：`/merchant-api/line/suit/create`
- 处理器：`merchant/LineSuit@create`

### 请求参数

主表字段：

| 字段                 | 类型   | 必填 | 说明         |
| -------------------- | ------ | ---- | ------------ |
| `lineid` / `line_id` | int    | 是   | 所属线路     |
| `name`               | string | 是   | 套餐名称     |
| `price`              | string | 否   | 原始价格展示 |
| `oldperson`          | string | 否   | 老人标准     |
| `person`             | string | 否   | 成人标准     |
| `child`              | string | 否   | 儿童标准     |
| `room`               | string | 否   | 单房差标准   |
| `content`            | string | 否   | 套餐说明     |

价格信息：

| 字段                      | 类型                 | 必填 | 说明     |
| ------------------------- | -------------------- | ---- | -------- |
| `priceinfo` / `priceInfo` | array 或 json string | 是   | 价格日历 |

### `priceinfo` 单项结构

| 字段              | 说明       |
| ----------------- | ---------- |
| `date`            | 日期       |
| `stock`           | 库存       |
| `elderprice`      | 老人售价   |
| `price`           | 成人售价   |
| `childprice`      | 儿童售价   |
| `base_elderprice` | 老人成本   |
| `base_price`      | 成人成本   |
| `base_childprice` | 儿童成本   |
| `roomblance`      | 单房差售价 |
| `roomcount`       | 单房差规则 |
| `bxinfo`          | 必消信息   |

## 5.4 更新线路套餐

- 方法：`POST`
- 路径：`/merchant-api/line/suit/update`
- 处理器：`merchant/LineSuit@update`

### 请求参数

在创建基础上额外需要：

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 套餐 ID |

## 5.5 删除线路套餐

- 方法：`POST`
- 路径：`/merchant-api/line/suit/delete`
- 处理器：`merchant/LineSuit@delete`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 套餐 ID |

## 6. 商品接口

## 6.1 获取商品列表

- 方法：`GET`
- 路径：`/merchant-api/goods/list`
- 处理器：`merchant/Goods@list`

### 请求参数

| 字段        | 类型   | 必填 | 说明                  |
| ----------- | ------ | ---- | --------------------- |
| `page`      | int    | 否   | 页码                  |
| `page_size` | int    | 否   | 每页条数              |
| `keyword`   | string | 否   | 标题关键词            |
| `status`    | string | 否   | `up/hidden/down`      |
| `type`      | string | 否   | `normal/virtual/card` |

## 6.2 获取商品详情

- 方法：`GET`
- 路径：`/merchant-api/goods/detail`
- 处理器：`merchant/Goods@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 商品 ID |

### 返回 data

```json
{
  "detail": {},
  "sku": {
    "mode": "single|multiple",
    "detail": null,
    "list": [],
    "price": []
  }
}
```

### `detail` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 商品 ID |
| `type` | string | 商品类型，`normal/virtual/card` |
| `type_text` | string | 商品类型中文 |
| `title` | string | 商品标题 |
| `subtitle` | string | 商品副标题 |
| `category_ids` | array | 商品分类 ID 数组 |
| `image` | string | 商品主图完整 URL |
| `images` | array | 商品轮播图完整 URL 数组 |
| `params` | array | 商品参数，原样返回 JSON 结构 |
| `content` | string | 商品详情内容 |
| `original_price` | string | 划线价 |
| `price` | string | 销售价，来自当前商品有效 SKU 的最低价 |
| `is_sku` | int | 是否多规格，`0` 单规格，`1` 多规格 |
| `dispatch_type` | string | 发货方式 |
| `dispatch_id` | int | 发货模板或规则 ID |
| `status` | string | 商品状态，`up/hidden/down` |
| `status_text` | string | 商品状态中文 |
| `audit_status` | string | 审核状态，`0` 待审核，`1` 审核通过，`2` 驳回 |
| `audit_status_text` | string | 审核状态中文 |
| `audit_remark` | string | 审核备注 |
| `audit_time` | int/null | 审核时间戳，未审核时为 `null` |
| `audit_admin_id` | int/null | 审核管理员 ID，未审核时为 `null` |
| `sales` | int | 销量 |
| `likes` | int | 点赞数 |
| `views` | int | 浏览量 |
| `stock` | int | 当前上架 SKU 库存合计 |
| `createtime` | int | 创建时间戳 |
| `updatetime` | int | 更新时间戳 |

### `sku` 字段

| 字段     | 类型        | 说明                                    |
| -------- | ----------- | --------------------------------------- |
| `mode`   | string      | SKU 模式，`single` 或 `multiple`        |
| `detail` | object/null | 单规格详情，仅 `mode=single` 时返回对象 |
| `list`   | array       | 规格树，仅 `mode=multiple` 时返回       |
| `price`  | array       | 多规格价格行，仅 `mode=multiple` 时返回 |

### `sku.detail` 字段（`mode=single`）

| 字段     | 类型   | 说明          |
| -------- | ------ | ------------- |
| `id`     | int    | SKU 价格行 ID |
| `stock`  | int    | 库存          |
| `sn`     | string | SKU 编码      |
| `weight` | string | 重量          |
| `price`  | string | 售价          |
| `status` | string | SKU 状态      |

### `sku.list[]` 字段（`mode=multiple`）

| 字段       | 类型   | 说明                        |
| ---------- | ------ | --------------------------- |
| `id`       | int    | 一级规格 ID                 |
| `name`     | string | 一级规格名称                |
| `pid`      | int    | 父级 ID，一级规格固定为 `0` |
| `children` | array  | 二级规格数组                |

### `sku.list[].children[]` 字段

| 字段   | 类型   | 说明            |
| ------ | ------ | --------------- |
| `id`   | int    | 二级规格 ID     |
| `name` | string | 二级规格名称    |
| `pid`  | int    | 所属一级规格 ID |

### `sku.price[]` 字段（`mode=multiple`）

| 字段             | 类型   | 说明             |
| ---------------- | ------ | ---------------- |
| `id`             | int    | SKU 价格行 ID    |
| `goods_sku_ids`  | array  | 规格值 ID 数组   |
| `goods_sku_text` | array  | 规格文案数组     |
| `image`          | string | 规格图片完整 URL |
| `stock`          | int    | 库存             |
| `sn`             | string | SKU 编码         |
| `weight`         | string | 重量             |
| `cost_price`     | string | 成本价           |
| `original_price` | string | 划线价           |
| `price`          | string | 售价             |
| `status`         | string | SKU 状态         |

## 6.3 创建商品

- 方法：`POST`
- 路径：`/merchant-api/goods/create`
- 处理器：`merchant/Goods@create`

### 主表字段

| 字段             | 说明               |
| ---------------- | ------------------ |
| `type`           | 商品类型           |
| `title`          | 标题               |
| `subtitle`       | 副标题             |
| `category_ids`   | 分类 ID 数组       |
| `image`          | 主图               |
| `images`         | 轮播图数组或逗号串 |
| `params`         | 参数详情数组       |
| `content`        | 图文详情           |
| `original_price` | 原价               |
| `price`          | 售价               |
| `is_sku`         | 是否多规格         |
| `dispatch_type`  | 发货方式           |
| `dispatch_id`    | 发货模板           |
| `status`         | 状态               |

### 单规格附加字段

当 `is_sku = 0` 时，还支持：

| 字段     | 说明 |
| -------- | ---- |
| `stock`  | 库存 |
| `sn`     | 货号 |
| `weight` | 重量 |

### 说明

- `merch_id` 后端自动写入当前商家
- 单规格商品会自动同步默认 SKU 行
- 多规格商品主表创建完成后，需继续调用 `goods/sku/save`
- 商品相关中文文本统一返回 `type_text`、`status_text`

## 6.4 更新商品

- 方法：`POST`
- 路径：`/merchant-api/goods/update`
- 处理器：`merchant/Goods@update`

### 请求参数

在创建基础上额外需要：

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 商品 ID |

## 6.5 切换商品状态

- 方法：`POST`
- 路径：`/merchant-api/goods/toggle-status`
- 处理器：`merchant/Goods@toggleStatus`

### 请求参数

| 字段     | 类型   | 必填 | 说明             |
| -------- | ------ | ---- | ---------------- |
| `id`     | int    | 是   | 商品 ID          |
| `status` | string | 是   | `up/hidden/down` |

## 7. 商品多规格接口

## 7.1 获取多规格详情

- 方法：`GET`
- 路径：`/merchant-api/goods/sku/detail`
- 处理器：`merchant/GoodsSku@detail`

### 请求参数

| 字段                   | 类型 | 必填 | 说明    |
| ---------------------- | ---- | ---- | ------- |
| `goods_id` / `goodsId` | int  | 是   | 商品 ID |

## 7.2 保存多规格

- 方法：`POST`
- 路径：`/merchant-api/goods/sku/save`
- 处理器：`merchant/GoodsSku@save`

### 请求参数

| 字段                   | 类型                 | 必填 | 说明       |
| ---------------------- | -------------------- | ---- | ---------- |
| `goods_id` / `goodsId` | int                  | 是   | 商品 ID    |
| `listData`             | array 或 json string | 是   | 规格树     |
| `priceData`            | array 或 json string | 是   | 规格价格表 |

### `listData` 结构示例

```json
[
  {
    "id": 13,
    "name": "颜色",
    "children": [
      { "id": 14, "name": "黑色", "temp_id": "temp_1" },
      { "id": 15, "name": "白色", "temp_id": "temp_2" }
    ]
  }
]
```

### `priceData` 结构示例

```json
[
  {
    "id": 6,
    "goods_sku_temp_ids": ["temp_1", "temp_3"],
    "goods_sku_text": ["黑色", "大"],
    "image": "/uploads/xxx.png",
    "stock": 10,
    "sn": "SKU001",
    "weight": 1.2,
    "cost_price": 10,
    "original_price": 20,
    "price": 15,
    "status": "up"
  }
]
```

## 8. 景点接口

## 8.1 获取景点列表

- 方法：`GET`
- 路径：`/merchant-api/ticket/list`
- 处理器：`merchant/Ticket@list`

### 说明

- 这里只返回“当前商家可经营的景点”
- 归属关系来自 `fa_wlktour_ticket_suit.merch_id`
- `ticket` 主表在商家后台按只读视图处理
- 景点状态中文统一返回 `status_text`

### 请求参数

| 字段        | 类型   | 必填 | 说明            |
| ----------- | ------ | ---- | --------------- |
| `page`      | int    | 否   | 页码            |
| `page_size` | int    | 否   | 每页条数        |
| `keyword`   | string | 否   | 景点名称关键词  |
| `status`    | string | 否   | `hidden/normal` |

## 8.2 获取景点详情

- 方法：`GET`
- 路径：`/merchant-api/ticket/detail`
- 处理器：`merchant/Ticket@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 景点 ID |

### 返回 data

```json
{
  "detail": {},
  "merchant_suits": []
}
```

## 9. 门票套餐接口

## 9.1 获取门票套餐列表

- 方法：`GET`
- 路径：`/merchant-api/ticket/suit/list`
- 处理器：`merchant/TicketSuit@list`

### 请求参数

| 字段                     | 类型   | 必填 | 说明       |
| ------------------------ | ------ | ---- | ---------- |
| `page`                   | int    | 否   | 页码       |
| `page_size`              | int    | 否   | 每页条数   |
| `ticket_id` / `ticketId` | int    | 否   | 景点 ID    |
| `keyword`                | string | 否   | 套餐关键词 |

## 9.2 获取门票套餐详情

- 方法：`GET`
- 路径：`/merchant-api/ticket/suit/detail`
- 处理器：`merchant/TicketSuit@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 门票套餐 ID |

## 9.3 创建门票套餐

- 方法：`POST`
- 路径：`/merchant-api/ticket/suit/create`
- 处理器：`merchant/TicketSuit@create`

### 请求参数

主表字段：

| 字段                     | 说明                  |
| ------------------------ | --------------------- |
| `ticket_id` / `ticketId` | 景点 ID               |
| `name`                   | 门票名称              |
| `type_id`                | 门票类型              |
| `tags`                   | 标签数组              |
| `explain`                | 取票说明              |
| `content`                | 门票介绍              |
| `price`                  | 原价                  |
| `before`                 | 提前预订天数          |
| `beforetime`             | 当天结束时间          |
| `passenger`              | 游客信息要求，`0/1/2` |

价格信息：

| 字段                      | 类型                 | 必填 | 说明     |
| ------------------------- | -------------------- | ---- | -------- |
| `priceInfo` / `priceinfo` | array 或 json string | 是   | 价格日历 |

### `priceInfo` 单项结构

| 字段         | 说明 |
| ------------ | ---- |
| `date`       | 日期 |
| `stock`      | 库存 |
| `base_price` | 成本 |
| `price`      | 售价 |

### 说明

- `merch_id` 后端自动取当前商家，不接受前端指定

## 9.4 更新门票套餐

- 方法：`POST`
- 路径：`/merchant-api/ticket/suit/update`
- 处理器：`merchant/TicketSuit@update`

### 请求参数

在创建基础上额外需要：

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 门票套餐 ID |

## 9.5 删除门票套餐

- 方法：`POST`
- 路径：`/merchant-api/ticket/suit/delete`
- 处理器：`merchant/TicketSuit@delete`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 门票套餐 ID |

## 10. 订单接口

## 10.1 线路订单列表

- 方法：`GET`
- 路径：`/merchant-api/order/line/list`
- 处理器：`merchant/Order@lineList`

### 请求参数

| 字段        | 类型   | 必填 | 说明                        |
| ----------- | ------ | ---- | --------------------------- |
| `page`      | int    | 否   | 页码                        |
| `page_size` | int    | 否   | 每页条数                    |
| `keyword`   | string | 否   | 订单号/联系人/手机号        |
| `status`    | string | 否   | 订单状态                    |
| `date_from` | string | 否   | 开始日期，格式 `YYYY-MM-DD` |
| `date_to`   | string | 否   | 结束日期，格式 `YYYY-MM-DD` |

### 返回项

每项包含：

- `id`
- `order_sn`
- `line_id`
- `line_title`
- `date`
- `realname`
- `mobile`
- `status`
- `status_text`
- `pay_type`
- `pay_type_text`
- `platform`
- `platform_text`
- `total_fee`
- `pay_fee`
- `createtime`
- `paytime`
- `refund_id`
- `user_info`

### `user_info` 字段

| 字段       | 类型   | 说明       |
| ---------- | ------ | ---------- |
| `id`       | int    | 用户 ID    |
| `nickname` | string | 昵称       |
| `username` | string | 用户名     |
| `mobile`   | string | 脱敏手机号 |

## 10.2 线路订单详情

- 方法：`GET`
- 路径：`/merchant-api/order/line/detail`
- 处理器：`merchant/Order@lineDetail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

```json
{
  "detail": {
    "site_json": null,
    "passengers": [],
    "bx_info": [],
    "line_info": {},
    "suit_info": {},
    "project_orders": [],
    "refund": null
  }
}
```

### `detail` 字段

| 字段             | 类型        | 说明                             |
| ---------------- | ----------- | -------------------------------- |
| `id`             | int         | 订单 ID                          |
| `order_sn`       | string      | 订单号                           |
| `status`         | string      | 订单状态                         |
| `status_text`    | string      | 订单状态中文                     |
| `pay_type`       | string      | 支付方式                         |
| `pay_type_text`  | string      | 支付方式中文                     |
| `platform`       | string      | 下单来源                         |
| `platform_text`  | string      | 下单来源中文                     |
| `date`           | string      | 出游日期                         |
| `realname`       | string      | 联系人姓名                       |
| `mobile`         | string      | 联系手机号                       |
| `remark`         | string      | 订单备注                         |
| `adult_num`      | int         | 成人数                           |
| `elder_num`      | int         | 老人数                           |
| `child_num`      | int         | 儿童数                           |
| `room_num`       | int         | 单房差数量                       |
| `adult_price`    | string      | 成人单价                         |
| `elder_price`    | string      | 老人单价                         |
| `child_price`    | string      | 儿童单价                         |
| `room_price`     | string      | 单房差单价                       |
| `price`          | string      | 线路基础费用                     |
| `project_fee`    | string      | 保险费用                         |
| `bx_fee`         | string      | 必消费用                         |
| `room_fee`       | string      | 单房差费用                       |
| `total_fee`      | string      | 订单总金额                       |
| `pay_fee`        | string      | 实付金额                         |
| `refund_fee`     | string      | 已退款金额                       |
| `transaction_id` | string      | 支付流水号                       |
| `pay_cert`       | string      | 支付凭证图片 URL，无则为空字符串 |
| `paytime`        | int         | 支付时间戳                       |
| `finishtime`     | int         | 完成时间戳                       |
| `createtime`     | int         | 创建时间戳                       |
| `user_info`      | object      | 下单用户信息                     |
| `site_json`      | object/null | 上车点信息，未选择时为 `null`    |
| `passengers`     | array       | 出游人数组                       |
| `bx_info`        | array       | 必消项目数组                     |
| `line_info`      | object      | 线路信息                         |
| `suit_info`      | object      | 套餐信息                         |
| `project_orders` | array       | 保险订单数组                     |
| `refund`         | object/null | 退款信息，无退款时为 `null`      |

### `detail.user_info` 字段

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| `id`       | int    | 用户 ID      |
| `nickname` | string | 昵称         |
| `username` | string | 用户名       |
| `avatar`   | string | 头像完整 URL |
| `mobile`   | string | 用户手机号   |

### `detail.site_json` 字段

| 字段   | 类型   | 说明       |
| ------ | ------ | ---------- |
| `id`   | int    | 上车点 ID  |
| `name` | string | 上车点名称 |

### `detail.passengers[]` 字段

| 字段       | 类型   | 说明                      |
| ---------- | ------ | ------------------------- |
| `realname` | string | 出游人姓名                |
| `mobile`   | string | 出游人手机号              |
| `gender`   | int    | 性别，通常 `1` 男、`0` 女 |
| `idcard`   | string | 证件号码                  |
| `idtype`   | int    | 证件类型                  |

### `detail.bx_info[]` 字段

| 字段    | 类型          | 说明         |
| ------- | ------------- | ------------ |
| `name`  | string        | 必消项目名称 |
| `price` | string/number | 必消项目单价 |

### `detail.line_info` 字段

| 字段    | 类型   | 说明     |
| ------- | ------ | -------- |
| `id`    | int    | 线路 ID  |
| `title` | string | 线路标题 |

### `detail.suit_info` 字段

| 字段   | 类型   | 说明     |
| ------ | ------ | -------- |
| `id`   | int    | 套餐 ID  |
| `name` | string | 套餐名称 |

### `detail.project_orders[]` 字段

| 字段            | 类型   | 说明             |
| --------------- | ------ | ---------------- |
| `id`            | int    | 保险订单 ID      |
| `order_sn`      | string | 保险订单号       |
| `status`        | string | 保险订单状态     |
| `status_text`   | string | 保险订单状态中文 |
| `project_id`    | int    | 保险产品 ID      |
| `project_name`  | string | 保险产品名称     |
| `project_price` | string | 保险产品单价     |
| `total_fee`     | string | 保险订单金额     |

### `detail.refund` 字段

| 字段                 | 类型   | 说明                          |
| -------------------- | ------ | ----------------------------- |
| `id`                 | int    | 退款记录 ID                   |
| `refund_sn`          | string | 退款单号                      |
| `type`               | string | 退款类型，`line/ticket/goods` |
| `type_text`          | string | 退款类型中文                  |
| `status`             | string | 退款处理状态                  |
| `status_text`        | string | 退款处理状态中文              |
| `refund_status`      | string | 售后申请状态                  |
| `refund_status_text` | string | 售后申请状态中文              |
| `refund_fee`         | string | 退款金额                      |
| `reason`             | string | 退款原因                      |
| `createtime`         | int    | 退款申请时间戳                |
| `finishtime`         | int    | 退款完成时间戳                |

## 10.3 门票订单列表

- 方法：`GET`
- 路径：`/merchant-api/order/ticket/list`
- 处理器：`merchant/Order@ticketList`

### 请求参数

参数规则与 `10.1 线路订单列表` 一致。

### 返回项

每项包含：

- `id`
- `order_sn`
- `ticket_id`
- `ticket_title`
- `suit_id`
- `suit_name`
- `date`
- `realname`
- `mobile`
- `number`
- `status`
- `status_text`
- `pay_type`
- `pay_type_text`
- `platform`
- `platform_text`
- `total_fee`
- `pay_fee`
- `createtime`
- `paytime`
- `refund_id`
- `verify_status`
- `verify_status_text`
- `user_info`

### `user_info` 字段

| 字段       | 类型   | 说明       |
| ---------- | ------ | ---------- |
| `id`       | int    | 用户 ID    |
| `nickname` | string | 昵称       |
| `username` | string | 用户名     |
| `mobile`   | string | 脱敏手机号 |

## 10.4 门票订单详情

- 方法：`GET`
- 路径：`/merchant-api/order/ticket/detail`
- 处理器：`merchant/Order@ticketDetail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

```json
{
  "detail": {
    "passengers": [],
    "ticket_info": {},
    "suit_info": {},
    "verify_info": null,
    "refund": null
  }
}
```

### `detail` 字段

| 字段             | 类型        | 说明                             |
| ---------------- | ----------- | -------------------------------- |
| `id`             | int         | 订单 ID                          |
| `order_sn`       | string      | 订单号                           |
| `status`         | string      | 订单状态                         |
| `status_text`    | string      | 订单状态中文                     |
| `pay_type`       | string      | 支付方式                         |
| `pay_type_text`  | string      | 支付方式中文                     |
| `platform`       | string      | 下单来源                         |
| `platform_text`  | string      | 下单来源中文                     |
| `date`           | string      | 游玩日期                         |
| `realname`       | string      | 联系人姓名                       |
| `mobile`         | string      | 联系手机号                       |
| `remark`         | string      | 订单备注                         |
| `number`         | int         | 门票数量                         |
| `price`          | string      | 门票单价                         |
| `total_fee`      | string      | 订单总金额                       |
| `pay_fee`        | string      | 实付金额                         |
| `refund_fee`     | string      | 已退款金额                       |
| `transaction_id` | string      | 支付流水号                       |
| `pay_cert`       | string      | 支付凭证图片 URL，无则为空字符串 |
| `paytime`        | int         | 支付时间戳                       |
| `finishtime`     | int         | 完成时间戳                       |
| `createtime`     | int         | 创建时间戳                       |
| `user_info`      | object      | 下单用户信息                     |
| `passengers`     | array       | 出游人数组                       |
| `ticket_info`    | object      | 景点信息                         |
| `suit_info`      | object      | 套餐信息                         |
| `verify_info`    | object/null | 核销信息，未生成时为 `null`      |
| `refund`         | object/null | 退款信息，无退款时为 `null`      |

### `detail.user_info` 字段

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| `id`       | int    | 用户 ID      |
| `nickname` | string | 昵称         |
| `username` | string | 用户名       |
| `avatar`   | string | 头像完整 URL |
| `mobile`   | string | 用户手机号   |

### `detail.passengers[]` 字段

| 字段       | 类型   | 说明                      |
| ---------- | ------ | ------------------------- |
| `realname` | string | 出游人姓名                |
| `mobile`   | string | 出游人手机号              |
| `gender`   | int    | 性别，通常 `1` 男、`0` 女 |
| `idcard`   | string | 证件号码                  |
| `idtype`   | int    | 证件类型                  |

### `detail.ticket_info` 字段

| 字段    | 类型   | 说明     |
| ------- | ------ | -------- |
| `id`    | int    | 景点 ID  |
| `title` | string | 景点标题 |

### `detail.suit_info` 字段

| 字段   | 类型   | 说明     |
| ------ | ------ | -------- |
| `id`   | int    | 套餐 ID  |
| `name` | string | 套餐名称 |

### `detail.verify_info` 字段

| 字段          | 类型   | 说明         |
| ------------- | ------ | ------------ |
| `id`          | int    | 核销记录 ID  |
| `code`        | string | 核销码       |
| `status`      | string | 核销状态     |
| `status_text` | string | 核销状态中文 |
| `verifytime`  | int    | 核销时间戳   |
| `merch_id`    | int    | 商家 ID      |
| `saler_id`    | int    | 核销员 ID    |

### `detail.refund` 字段

| 字段                 | 类型   | 说明                          |
| -------------------- | ------ | ----------------------------- |
| `id`                 | int    | 退款记录 ID                   |
| `refund_sn`          | string | 退款单号                      |
| `type`               | string | 退款类型，`line/ticket/goods` |
| `type_text`          | string | 退款类型中文                  |
| `status`             | string | 退款处理状态                  |
| `status_text`        | string | 退款处理状态中文              |
| `refund_status`      | string | 售后申请状态                  |
| `refund_status_text` | string | 售后申请状态中文              |
| `refund_fee`         | string | 退款金额                      |
| `reason`             | string | 退款原因                      |
| `createtime`         | int    | 退款申请时间戳                |
| `finishtime`         | int    | 退款完成时间戳                |

## 10.5 商品订单列表

- 方法：`GET`
- 路径：`/merchant-api/order/goods/list`
- 处理器：`merchant/Order@goodsList`

参数规则与线路订单列表一致，但关键词匹配：

- 订单号
- 收货人
- 手机号

### 返回项

每项包含：

- `id`
- `order_sn`
- `consignee`
- `mobile`
- `status`
- `status_text`
- `pay_type`
- `pay_type_text`
- `platform`
- `platform_text`
- `goods_amount`
- `dispatch_amount`
- `total_fee`
- `pay_fee`
- `createtime`
- `paytime`
- `sendtime`
- `finishtime`
- `sku_count`
- `user_info`

### `user_info` 字段

| 字段       | 类型   | 说明       |
| ---------- | ------ | ---------- |
| `id`       | int    | 用户 ID    |
| `nickname` | string | 昵称       |
| `username` | string | 用户名     |
| `mobile`   | string | 脱敏手机号 |

## 10.6 商品订单详情

- 方法：`GET`
- 路径：`/merchant-api/order/goods/detail`
- 处理器：`merchant/Order@goodsDetail`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

```json
{
  "detail": {
    "items": [],
    "express": []
  }
}
```

### `detail` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 订单 ID |
| `order_sn` | string | 订单号 |
| `type` | string | 订单类型，当前支持 `goods/score` |
| `type_text` | string | 订单类型中文 |
| `status` | string | 订单状态，`-2/-1/0/1/2/3` |
| `status_text` | string | 订单状态中文 |
| `pay_type` | string | 支付方式，如 `wechat/alipay/wallet/score/sys` |
| `pay_type_text` | string | 支付方式中文 |
| `platform` | string | 下单来源，如 `H5/App/wxOfficialAccount/wxMiniProgram` |
| `platform_text` | string | 下单来源中文 |
| `goods_amount` | string | 商品金额 |
| `dispatch_amount` | string | 运费金额 |
| `total_amount` | string | 订单总金额 |
| `total_fee` | string | 订单应付金额 |
| `pay_fee` | string | 实付金额 |
| `transaction_id` | string | 支付流水号 |
| `consignee` | string | 收货人 |
| `mobile` | string | 收货手机号 |
| `province_name` | string | 省份名称 |
| `city_name` | string | 城市名称 |
| `district_name` | string | 区县名称 |
| `address` | string | 详细地址 |
| `remark` | string | 订单备注 |
| `paytime` | int | 支付时间戳 |
| `sendtime` | int | 发货时间戳 |
| `finishtime` | int | 完成时间戳 |
| `createtime` | int | 创建时间戳 |
| `user_info` | object | 下单用户信息 |
| `items` | array | 商品明细数组，按明细 ID 升序返回 |
| `express` | array | 发货记录数组，按记录 ID 降序返回 |

### `detail.user_info` 字段

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| `id`       | int    | 用户 ID      |
| `nickname` | string | 昵称         |
| `username` | string | 用户名       |
| `avatar`   | string | 头像完整 URL |
| `mobile`   | string | 用户手机号   |

### `detail.items[]` 字段

| 字段                    | 类型   | 说明             |
| ----------------------- | ------ | ---------------- |
| `id`                    | int    | 订单商品明细 ID  |
| `goods_id`              | int    | 商品 ID          |
| `goods_title`           | string | 商品标题         |
| `goods_sku_text`        | string | 下单时的规格文案 |
| `goods_num`             | int    | 商品数量         |
| `goods_price`           | string | 商品单价         |
| `pay_price`             | string | 商品实付金额     |
| `dispatch_fee`          | string | 商品分摊运费     |
| `dispatch_status`       | string | 发货状态         |
| `dispatch_status_text`  | string | 发货状态中文     |
| `aftersale_status`      | string | 售后状态         |
| `aftersale_status_text` | string | 售后状态中文     |
| `refund_status`         | string | 退款状态         |
| `refund_status_text`    | string | 退款状态中文     |
| `refund_fee`            | string | 已退款金额       |

### `detail.express[]` 字段

| 字段           | 类型   | 说明               |
| -------------- | ------ | ------------------ |
| `id`           | int    | 发货记录 ID        |
| `express_name` | string | 快递公司名称       |
| `express_code` | string | 快递公司编码       |
| `express_no`   | string | 快递单号           |
| `createtime`   | int    | 发货记录创建时间戳 |

## 10.7 结算总览

### 适用范围

当前商家端 `settlement/*` 接口只面向**内部结算链路**，也就是仅处理：

- `settle_channel = internal` 的订单
- 当前已落地的主要场景为：`external` 外部供应商 + `money` 余额支付 + 订单完成后进入内部结算

以下订单**不走**这套商家端结算接口：

- `settle_channel = wechat_profitsharing` 的微信服务商分账订单
- 平台自营且不需要供应商打款结算的订单

前端接入时应按订单或结算明细返回的 `settle_channel` 判断链路，避免把微信分账订单误接入“申请结算单”流程。

- 方法：`GET`
- 路径：`/merchant-api/settlement/overview`
- 处理器：`merchant/Settlement@overview`

### 返回 data

```json
{
  "overview": {
    "pending_amount": "26.00",
    "settled_amount": "28.00",
    "refund_amount": "0.00",
    "pending_count": 2,
    "settled_count": 1
  }
}
```

### `overview` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pending_amount` | string | 当前待结算金额，统计 `settlement_status in (pending, part_refunded)` 的 `current_settle_amount` |
| `settled_amount` | string | 已结算金额，统计 `settlement_status=settled` 的 `current_settle_amount` |
| `refund_amount` | string | 退款影响金额，统计 `settlement_status in (part_refunded, refunded)` 的 `refund_fee` |
| `pending_count` | int | 待结算明细数量 |
| `settled_count` | int | 已打款结算单数量 |

## 10.8 结算明细列表

- 方法：`GET`
- 路径：`/merchant-api/settlement/item-list`
- 处理器：`merchant/Settlement@itemList`

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页条数 |
| `keyword` | string | 否 | 订单号关键字 |
| `biz_type` | string | 否 | 业务类型，`line/ticket/goods` |
| `settlement_status` | string | 否 | 结算状态，`pending/processing/settled/part_refunded/refunded/closed` |
| `date_from` | string | 否 | 开始日期，格式 `YYYY-MM-DD` |
| `date_to` | string | 否 | 结束日期，格式 `YYYY-MM-DD` |

### 返回项

每项包含：

- `id`
- `biz_type`
- `biz_type_text`
- `item_type`
- `item_type_text`
- `order_sn`
- `pay_type`
- `payment_mode`
- `settle_channel`
- `settle_channel_text`
- `pay_fee`
- `refund_fee`
- `settle_amount`
- `current_settle_amount`
- `platform_amount`
- `settlement_status`
- `settlement_status_text`
- `settlement_apply_id`
- `apply_status`
- `apply_status_text`
- `settlement_order_id`
- `completed_at`
- `settled_at`
- `remark`

### 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 结算明细 ID |
| `biz_type` | string | 业务类型，`line/ticket/goods` |
| `biz_type_text` | string | 业务类型中文 |
| `item_type` | string | 明细类型，`normal` 正常结算，`refund_adjust` 退款红字调整 |
| `item_type_text` | string | 明细类型中文 |
| `order_sn` | string | 业务订单号 |
| `pay_type` | string | 支付方式原始值，如 `wechat`、`money`、`sys` |
| `payment_mode` | string | 支付模式，当前可能为 `direct` 直连商户、`service_provider` 服务商模式，内部结算场景下也可能为空 |
| `settle_channel` | string | 结算通道，`none` 无、`wechat_profitsharing` 微信分账、`internal` 内部结算 |
| `settle_channel_text` | string | 结算通道中文 |
| `pay_fee` | string | 订单支付金额 |
| `refund_fee` | string | 当前累计退款金额 |
| `settle_amount` | string | 原始结算金额快照，支付完成后固化 |
| `current_settle_amount` | string | 当前待结金额，已考虑退款扣减后的可结算金额 |
| `platform_amount` | string | 平台留存金额 |
| `settlement_status` | string | 结算状态，`pending/processing/settled/part_refunded/refunded/closed` |
| `settlement_status_text` | string | 结算状态中文 |
| `settlement_apply_id` | int | 关联的结算申请 ID，`0` 表示尚未申请 |
| `apply_status` | string | 申请状态，`none/pending/approved/rejected` |
| `apply_status_text` | string | 申请状态中文 |
| `settlement_order_id` | int | 关联的结算单 ID，`0` 表示尚未生成结算单 |
| `completed_at` | int | 订单完成时间戳 |
| `settled_at` | int | 实际结算完成时间戳，未打款时一般为 `0` |
| `remark` | string | 结算备注 |

### 说明

- `settlement_apply_id=0` 表示尚未进入结算申请
- `apply_status` 取值：
  - `none` 未申请
  - `pending` 申请中
  - `approved` 已通过
  - `rejected` 已驳回

## 10.9 提交结算申请

- 方法：`POST`
- 路径：`/merchant-api/settlement/apply-create`
- 处理器：`merchant/Settlement@applyCreate`

### 请求参数

| 字段     | 类型   | 必填 | 说明                     |
| -------- | ------ | ---- | ------------------------ |
| `ids`    | int[]  | 是   | 待申请的结算明细 ID 数组 |
| `remark` | string | 否   | 申请备注                 |

### 返回 data

```json
{
  "apply": {
    "id": 12,
    "apply_no": "SA202605071030001234"
  }
}
```

### 说明

- 只允许申请当前商家自己的内部结算明细
- 仅 `settlement_status in (pending, part_refunded)` 且 `settlement_order_id=0` 的明细可申请
- 提交后，明细会写入：
  - `settlement_apply_id`
  - `apply_status = pending`

## 10.10 结算申请列表

- 方法：`GET`
- 路径：`/merchant-api/settlement/apply-list`
- 处理器：`merchant/Settlement@applyList`

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页条数 |
| `keyword` | string | 否 | 申请单号关键字 |
| `status` | string | 否 | 申请状态，`pending/approved/rejected/paid/closed` |
| `date_from` | string | 否 | 开始日期，格式 `YYYY-MM-DD` |
| `date_to` | string | 否 | 结束日期，格式 `YYYY-MM-DD` |

### 返回项

每项包含：

- `id`
- `apply_no`
- `order_count`
- `apply_amount`
- `status`
- `status_text`
- `remark`
- `audit_remark`
- `settlement_order_id`
- `apply_time`
- `audit_time`
- `pay_time`

### 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 结算申请 ID |
| `apply_no` | string | 结算申请单号 |
| `order_count` | int | 本次申请包含的结算明细数量 |
| `apply_amount` | string | 本次申请金额合计 |
| `status` | string | 申请状态，`pending/approved/rejected/paid/closed` |
| `status_text` | string | 申请状态中文 |
| `remark` | string | 商家提交申请时填写的备注 |
| `audit_remark` | string | 平台审核备注或驳回原因 |
| `settlement_order_id` | int | 关联结算单 ID，未生成时为 `0` |
| `apply_time` | int | 申请提交时间戳 |
| `audit_time` | int | 平台审核时间戳，未审核时为 `0` |
| `pay_time` | int | 实际打款时间戳，未打款时为 `0` |

## 10.11 结算申请详情

- 方法：`GET`
- 路径：`/merchant-api/settlement/apply-detail`
- 处理器：`merchant/Settlement@applyDetail`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 结算申请 ID |

### 返回 data

```json
{
  "detail": {
    "id": 12,
    "apply_no": "SA202605071030001234",
    "order_count": 2,
    "apply_amount": "26.00",
    "status": "pending",
    "status_text": "待审核",
    "remark": "",
    "audit_remark": "",
    "settlement_order_id": 0,
    "apply_time": 1778123456,
    "audit_time": 0,
    "pay_time": 0,
    "items": []
  }
}
```

### `detail` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 结算申请 ID |
| `apply_no` | string | 结算申请单号 |
| `order_count` | int | 本次申请包含的结算明细数量 |
| `apply_amount` | string | 本次申请金额合计 |
| `status` | string | 申请状态，`pending/approved/rejected/paid/closed` |
| `status_text` | string | 申请状态中文 |
| `remark` | string | 商家申请备注 |
| `audit_remark` | string | 平台审核备注或驳回原因 |
| `settlement_order_id` | int | 关联结算单 ID，未生成时为 `0` |
| `apply_time` | int | 申请提交时间戳 |
| `audit_time` | int | 平台审核时间戳，未审核时为 `0` |
| `pay_time` | int | 实际打款时间戳，未打款时为 `0` |
| `items` | array | 本次申请关联的结算明细列表 |

### `detail.items[]` 字段

| 字段                     | 类型   | 说明         |
| ------------------------ | ------ | ------------ |
| `id`                     | int    | 结算明细 ID  |
| `biz_type`               | string | 业务类型     |
| `biz_type_text`          | string | 业务类型中文 |
| `order_sn`               | string | 订单号       |
| `settle_amount`          | string | 原始结算金额 |
| `current_settle_amount`  | string | 当前待结金额 |
| `settlement_status`      | string | 结算状态     |
| `settlement_status_text` | string | 结算状态中文 |

## 10.12 结算单列表

- 方法：`GET`
- 路径：`/merchant-api/settlement/order-list`
- 处理器：`merchant/Settlement@orderList`

### 请求参数

| 字段        | 类型   | 必填 | 说明                                 |
| ----------- | ------ | ---- | ------------------------------------ |
| `page`      | int    | 否   | 页码                                 |
| `page_size` | int    | 否   | 每页条数                             |
| `keyword`   | string | 否   | 结算单号关键字                       |
| `status`    | string | 否   | 结算单状态，`pending/settled/closed` |
| `date_from` | string | 否   | 开始日期，格式 `YYYY-MM-DD`          |
| `date_to`   | string | 否   | 结束日期，格式 `YYYY-MM-DD`          |

### 返回项

每项包含：

- `id`
- `settlement_no`
- `order_count`
- `settle_amount`
- `adjust_amount`
- `final_amount`
- `status`
- `status_text`
- `pay_voucher`
- `pay_time`
- `period_start`
- `period_end`
- `remark`
- `createtime`

### 字段说明

| 字段            | 类型   | 说明                                 |
| --------------- | ------ | ------------------------------------ |
| `id`            | int    | 结算单 ID                            |
| `settlement_no` | string | 结算单号                             |
| `order_count`   | int    | 结算单内包含的订单/结算明细数量      |
| `settle_amount` | string | 结算金额合计                         |
| `adjust_amount` | string | 调整金额，正负都可能出现             |
| `final_amount`  | string | 最终打款金额                         |
| `status`        | string | 结算单状态，`pending/settled/closed` |
| `status_text`   | string | 结算单状态中文                       |
| `pay_voucher`   | string | 打款凭证地址，未上传时可能为空       |
| `pay_time`      | int    | 实际打款时间戳，未打款时为 `0`       |
| `period_start`  | int    | 本结算单统计周期开始时间戳           |
| `period_end`    | int    | 本结算单统计周期结束时间戳           |
| `remark`        | string | 平台结算备注                         |
| `createtime`    | int    | 结算单创建时间戳                     |

## 10.13 退款订单列表

- 方法：`GET`
- 路径：`/merchant-api/refund/list`
- 处理器：`merchant/Refund@list`

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码 |
| `page_size` | int | 否 | 每页条数 |
| `keyword` | string | 否 | 关键字，匹配退款单号、订单号、备注、拒绝原因、用户昵称/手机号/用户名 |
| `type` | string | 否 | 订单类型，`line/ticket/goods` |
| `refund_status` | string | 否 | 售后状态，支持 `-2/-1/0/1/2` |
| `status` | string | 否 | 退款处理状态，支持 `-1/0/1/2` |
| `date_from` | string | 否 | 开始日期，格式 `YYYY-MM-DD` |
| `date_to` | string | 否 | 结束日期，格式 `YYYY-MM-DD` |

### 返回项

每项包含：

- `id`
- `order_sn`
- `refund_sn`
- `type`
- `type_text`
- `refund_status`
- `refund_status_text`
- `status`
- `status_text`
- `pay_fee`
- `pay_type`
- `pay_type_text`
- `refund_fee`
- `remark`
- `sys_msg`
- `createtime`
- `finishtime`
- `user_info`
- `order_info`
- `can_pass`
- `can_reject`

### `user_info` 字段

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| `id`       | int    | 用户 ID      |
| `username` | string | 用户名       |
| `nickname` | string | 昵称         |
| `avatar`   | string | 头像完整 URL |
| `mobile`   | string | 脱敏手机号   |

### `order_info` 字段

会根据退款类型返回不同摘要：

- `line`：`id`、`order_sn`、`date`、`realname`、`mobile`、`title`、`suit_name`、`total_fee`、`pay_fee`
- `ticket`：`id`、`order_sn`、`date`、`realname`、`mobile`、`title`、`suit_name`、`total_fee`、`pay_fee`
- `goods`：`id`、`order_sn`、`consignee`、`mobile`、`goods_title`、`goods_sku_text`、`total_fee`、`pay_fee`

## 10.14 退款订单详情

- 方法：`GET`
- 路径：`/merchant-api/refund/detail`
- 处理器：`merchant/Refund@detail`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 退款订单 ID |

### 返回 data

```json
{
  "detail": {
    "user_info": {},
    "order_info": {},
    "line_info": null,
    "ticket_info": null,
    "suit_info": null,
    "goods_item": null
  }
}
```

### `detail` 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int | 退款订单 ID |
| `user_id` | int | 用户 ID |
| `order_sn` | string | 原订单号 |
| `refund_sn` | string | 退款单号 |
| `order_item_id` | int | 商品退款明细 ID，非商品退款时为 `0` |
| `type` | string | 订单类型，`line/ticket/goods` |
| `type_text` | string | 订单类型中文 |
| `refund_status` | string | 售后状态 |
| `refund_status_text` | string | 售后状态中文 |
| `status` | string | 退款处理状态 |
| `status_text` | string | 退款处理状态中文 |
| `pay_fee` | string | 原支付金额 |
| `pay_type` | string | 原支付方式 |
| `pay_type_text` | string | 原支付方式中文 |
| `refund_fee` | string | 退款金额 |
| `remark` | string | 用户申请备注 |
| `sys_msg` | string | 商家处理说明/拒绝原因 |
| `payment_json` | object/string/null | 退款原始数据，能解 JSON 时返回对象，否则返回原字符串 |
| `createtime` | int | 申请时间戳 |
| `finishtime` | int | 完成时间戳 |
| `updatetime` | int | 更新时间戳 |
| `user_info` | object | 用户信息 |
| `order_info` | object | 关联订单信息 |
| `line_info` | object/null | 线路信息，仅 `type=line` 时返回 |
| `ticket_info` | object/null | 景点信息，仅 `type=ticket` 时返回 |
| `suit_info` | object/null | 套餐信息，`line/ticket` 时返回 |
| `goods_item` | object/null | 商品退款明细，仅 `type=goods` 时返回 |
| `can_pass` | bool | 当前是否可通过 |
| `can_reject` | bool | 当前是否可拒绝 |

### `user_info` 字段

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| `id`       | int    | 用户 ID      |
| `username` | string | 用户名       |
| `nickname` | string | 昵称         |
| `avatar`   | string | 头像完整 URL |
| `mobile`   | string | 手机号       |

### `order_info` 字段

会根据退款类型返回不同结构：

#### `type=line`

| 字段            | 类型   | 说明         |
| --------------- | ------ | ------------ |
| `id`            | int    | 订单 ID      |
| `order_sn`      | string | 订单号       |
| `status`        | string | 订单状态     |
| `status_text`   | string | 订单状态中文 |
| `pay_type`      | string | 支付方式     |
| `pay_type_text` | string | 支付方式中文 |
| `platform`      | string | 下单来源     |
| `platform_text` | string | 下单来源中文 |
| `date`          | string | 出游日期     |
| `realname`      | string | 联系人姓名   |
| `mobile`        | string | 联系手机号   |
| `remark`        | string | 订单备注     |
| `total_fee`     | string | 订单总金额   |
| `pay_fee`       | string | 实付金额     |
| `refund_fee`    | string | 已退款金额   |

#### `type=ticket`

| 字段            | 类型   | 说明         |
| --------------- | ------ | ------------ |
| `id`            | int    | 订单 ID      |
| `order_sn`      | string | 订单号       |
| `status`        | string | 订单状态     |
| `status_text`   | string | 订单状态中文 |
| `pay_type`      | string | 支付方式     |
| `pay_type_text` | string | 支付方式中文 |
| `platform`      | string | 下单来源     |
| `platform_text` | string | 下单来源中文 |
| `date`          | string | 游玩日期     |
| `realname`      | string | 联系人姓名   |
| `mobile`        | string | 联系手机号   |
| `remark`        | string | 订单备注     |
| `number`        | int    | 门票数量     |
| `total_fee`     | string | 订单总金额   |
| `pay_fee`       | string | 实付金额     |
| `refund_fee`    | string | 已退款金额   |

#### `type=goods`

| 字段              | 类型   | 说明         |
| ----------------- | ------ | ------------ |
| `id`              | int    | 订单 ID      |
| `order_sn`        | string | 订单号       |
| `status`          | string | 订单状态     |
| `status_text`     | string | 订单状态中文 |
| `pay_type`        | string | 支付方式     |
| `pay_type_text`   | string | 支付方式中文 |
| `platform`        | string | 下单来源     |
| `platform_text`   | string | 下单来源中文 |
| `consignee`       | string | 收货人       |
| `mobile`          | string | 收货手机号   |
| `remark`          | string | 订单备注     |
| `goods_amount`    | string | 商品金额     |
| `dispatch_amount` | string | 运费金额     |
| `total_fee`       | string | 订单总金额   |
| `pay_fee`         | string | 实付金额     |
| `refund_fee`      | string | 已退款金额   |

### `line_info` 字段

| 字段    | 类型   | 说明     |
| ------- | ------ | -------- |
| `id`    | int    | 线路 ID  |
| `title` | string | 线路标题 |

### `ticket_info` 字段

| 字段    | 类型   | 说明     |
| ------- | ------ | -------- |
| `id`    | int    | 景点 ID  |
| `title` | string | 景点标题 |

### `suit_info` 字段

| 字段   | 类型   | 说明     |
| ------ | ------ | -------- |
| `id`   | int    | 套餐 ID  |
| `name` | string | 套餐名称 |

### `goods_item` 字段

| 字段                    | 类型   | 说明             |
| ----------------------- | ------ | ---------------- |
| `id`                    | int    | 订单商品明细 ID  |
| `order_id`              | int    | 订单 ID          |
| `goods_id`              | int    | 商品 ID          |
| `goods_title`           | string | 商品标题         |
| `goods_image`           | string | 商品图片完整 URL |
| `goods_sku_text`        | string | 规格文案         |
| `goods_num`             | int    | 商品数量         |
| `goods_price`           | string | 商品单价         |
| `pay_price`             | string | 商品实付金额     |
| `dispatch_fee`          | string | 分摊运费         |
| `dispatch_status`       | string | 发货状态         |
| `dispatch_status_text`  | string | 发货状态中文     |
| `aftersale_status`      | string | 售后状态         |
| `aftersale_status_text` | string | 售后状态中文     |
| `refund_status`         | string | 退款状态         |
| `refund_status_text`    | string | 退款状态中文     |
| `refund_fee`            | string | 已退款金额       |

## 10.15 通过退款

- 方法：`POST`
- 路径：`/merchant-api/refund/pass`
- 处理器：`merchant/Refund@pass`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 退款订单 ID |

### 返回 data

返回最新 `detail`，字段结构与 `10.14 退款订单详情` 一致。

### 说明

- 仅允许处理当前商家自己的退款订单
- 仅 `refund_status=1` 的退款单可通过
- 商品退款会校验累计退款金额不能超过整单金额
- 真正退款执行逻辑复用后台退款模型

## 10.16 拒绝退款

- 方法：`POST`
- 路径：`/merchant-api/refund/reject`
- 处理器：`merchant/Refund@reject`

### 请求参数

| 字段         | 类型   | 必填 | 说明                       |
| ------------ | ------ | ---- | -------------------------- |
| `id`         | int    | 是   | 退款订单 ID                |
| `reject_msg` | string | 是   | 拒绝原因，兼容 `rejectMsg` |

### 返回 data

返回最新 `detail`，字段结构与 `10.14 退款订单详情` 一致。

### 说明

- 仅允许处理当前商家自己的退款订单
- 仅 `refund_status=1` 的退款单可拒绝
- 拒绝商品退款时会同步把对应商品明细售后状态改为已拒绝

## 10.17 线路订单确认支付

- 方法：`POST`
- 路径：`/merchant-api/order/line/pay`
- 处理器：`merchant/Order@linePay`

### 请求参数

| 字段       | 类型   | 必填 | 说明                                   |
| ---------- | ------ | ---- | -------------------------------------- |
| `id`       | int    | 是   | 订单 ID                                |
| `pay_cert` | string | 否   | 支付凭证图片 URL，表存在该字段时会保存 |

### 返回 data

返回最新 `detail`，字段结构与 `10.2 线路订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的线路订单
- 仅 `status=0` 的待支付订单可确认支付
- 确认后订单会走后台支付逻辑，支付方式记为 `sys`

## 10.18 线路订单完成

- 方法：`POST`
- 路径：`/merchant-api/order/line/finish`
- 处理器：`merchant/Order@lineFinish`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

返回最新 `detail`，字段结构与 `10.2 线路订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的线路订单
- 仅 `status=1` 的已支付订单可完成
- 完成后会同步触发订单完成事件与通知

## 10.19 线路合同详情

- 方法：`GET`
- 路径：`/merchant-api/order/line/contract-detail`
- 处理器：`merchant/Order@lineContractDetail`

### 请求参数

| 字段 | 类型 | 必填 | 说明        |
| ---- | ---- | ---- | ----------- |
| `id` | int  | 是   | 线路订单 ID |

### 返回 data

```json
{
  "detail": {
    "contract_enabled": true,
    "contract": null,
    "can_send": false,
    "can_repeat": false,
    "can_invalid": false,
    "can_repeat_invalid": false
  }
}
```

### `detail` 字段

| 字段                 | 类型        | 说明                        |
| -------------------- | ----------- | --------------------------- |
| `order_id`           | int         | 订单 ID                     |
| `order_sn`           | string      | 订单号                      |
| `status`             | string      | 订单状态                    |
| `status_text`        | string      | 订单状态中文                |
| `contract_enabled`   | bool        | 当前商家是否开启电子合同    |
| `contract`           | object/null | 合同信息，未生成时为 `null` |
| `can_send`           | bool        | 是否可生成合同              |
| `can_repeat`         | bool        | 是否可重发合同              |
| `can_invalid`        | bool        | 是否可作废合同              |
| `can_repeat_invalid` | bool        | 是否可重发作废通知          |

### `detail.contract` 字段

| 字段                | 类型   | 说明         |
| ------------------- | ------ | ------------ |
| `id`                | int    | 合同记录 ID  |
| `order_id`          | int    | 订单 ID      |
| `contractNumber`    | string | 合同编号     |
| `fileURL`           | string | 合同文件地址 |
| `signingURL`        | string | 签署链接     |
| `QRCodeURL`         | string | 二维码链接   |
| `state`             | string | 合同状态值   |
| `state_text`        | string | 合同状态中文 |
| `signStatus`        | string | 签署状态值   |
| `signStatus_text`   | string | 签署状态中文 |
| `signedtime`        | int    | 签署时间戳   |
| `signedtime_text`   | string | 签署时间文本 |
| `invalidetime`      | int    | 作废时间戳   |
| `invalidetime_text` | string | 作废时间文本 |
| `content`           | string | 合同内容     |
| `error_message`     | string | 错误信息     |
| `createtime`        | int    | 创建时间戳   |
| `updatetime`        | int    | 更新时间戳   |

## 10.20 线路合同操作

- 方法：`POST`
- 路径：`/merchant-api/order/line/contract-action`
- 处理器：`merchant/Order@lineContractAction`

### 请求参数

| 字段   | 类型   | 必填 | 说明                                              |
| ------ | ------ | ---- | ------------------------------------------------- |
| `id`   | int    | 是   | 线路订单 ID                                       |
| `type` | string | 是   | 合同操作类型：`send/repeat/invalid/repeatInvalid` |

### 返回 data

返回最新 `detail`，字段结构与 `10.13 线路合同详情` 一致。

### 说明

- 仅允许操作当前商家自己的线路订单
- 商家未开启电子合同时会直接报错
- `send` 仅允许已支付订单发起

## 10.21 门票订单确认支付

- 方法：`POST`
- 路径：`/merchant-api/order/ticket/pay`
- 处理器：`merchant/Order@ticketPay`

### 请求参数

| 字段       | 类型   | 必填 | 说明                                   |
| ---------- | ------ | ---- | -------------------------------------- |
| `id`       | int    | 是   | 订单 ID                                |
| `pay_cert` | string | 否   | 支付凭证图片 URL，表存在该字段时会保存 |

### 返回 data

返回最新 `detail`，字段结构与 `10.4 门票订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的门票订单
- 仅 `status=0` 的待支付订单可确认支付
- 确认后订单会走后台支付逻辑，支付方式记为 `sys`

## 10.22 门票订单完成

- 方法：`POST`
- 路径：`/merchant-api/order/ticket/finish`
- 处理器：`merchant/Order@ticketFinish`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

返回最新 `detail`，字段结构与 `10.4 门票订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的门票订单
- 仅 `status=1` 的已支付订单可完成
- 完成后会同步触发订单完成事件与通知

## 10.23 商品订单发货

- 方法：`POST`
- 路径：`/merchant-api/order/goods/send`
- 处理器：`merchant/Order@goodsSend`

### 请求参数

| 字段         | 类型   | 必填 | 说明                                        |
| ------------ | ------ | ---- | ------------------------------------------- |
| `id`         | int    | 是   | 订单 ID                                     |
| `express_id` | int    | 是   | 快递公司 ID，可通过 `3.4 快递公司选项` 获取 |
| `express_no` | string | 是   | 快递单号                                    |

### 返回 data

返回最新 `detail`，字段结构与 `10.6 商品订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的商品订单
- 仅 `status=1` 的待发货订单可发货
- 发货后订单状态会改为 `2`，并记录 `sendtime`
- 若平台配置了自动确认收货时间，会同步投递自动确认队列

## 10.24 商品订单完成

- 方法：`POST`
- 路径：`/merchant-api/order/goods/finish`
- 处理器：`merchant/Order@goodsFinish`

### 请求参数

| 字段 | 类型 | 必填 | 说明    |
| ---- | ---- | ---- | ------- |
| `id` | int  | 是   | 订单 ID |

### 返回 data

返回最新 `detail`，字段结构与 `10.6 商品订单详情` 一致。

### 说明

- 仅允许操作当前商家自己的商品订单
- 支持 `status=1` 或 `status=2` 的订单直接完成
- 完成后会补写 `finishtime`，并触发订单完成事件与通知

## 11. 门票核销接口

## 11.1 获取门票核销记录列表

- 方法：`GET`
- 路径：`/merchant-api/verify/ticket/list`
- 处理器：`merchant/Verify@ticketList`

### 请求参数

| 字段        | 类型   | 必填 | 说明                        |
| ----------- | ------ | ---- | --------------------------- |
| `page`      | int    | 否   | 页码                        |
| `page_size` | int    | 否   | 每页条数                    |
| `keyword`   | string | 否   | 核销码/订单号/联系人/手机号 |
| `status`    | string | 否   | `0` 待核销，`1` 已核销      |

### 返回项

每项包含：

- `id`
- `code`
- `status`
- `status_text`
- `order_id`
- `order_sn`
- `date`
- `realname`
- `mobile`
- `ticket_id`
- `suit_id`
- `number`
- `total_fee`
- `verifytime`
- `verifytime_text`
- `createtime`
- `createtime_text`
- `user_info`

### `user_info` 字段

| 字段       | 类型   | 说明       |
| ---------- | ------ | ---------- |
| `id`       | int    | 用户 ID    |
| `nickname` | string | 昵称       |
| `username` | string | 用户名     |
| `mobile`   | string | 脱敏手机号 |

## 11.2 获取门票核销详情

- 方法：`GET`
- 路径：`/merchant-api/verify/ticket/detail`
- 处理器：`merchant/Verify@ticketDetail`

### 请求参数

二选一传入：

| 字段   | 类型   | 必填 | 说明        |
| ------ | ------ | ---- | ----------- |
| `id`   | int    | 否   | 核销记录 ID |
| `code` | string | 否   | 核销码      |

### 返回 data

```json
{
  "detail": {}
}
```

`detail` 包含核销信息与 `order_info`，其中 `order_info` 会返回：

- 订单基础信息
- `ticket_info`
- `suit_info`
- `passengers`

## 11.3 执行门票核销

- 方法：`POST`
- 路径：`/merchant-api/verify/ticket/use`
- 处理器：`merchant/Verify@ticketUse`

### 请求参数

二选一传入：

| 字段   | 类型   | 必填 | 说明        |
| ------ | ------ | ---- | ----------- |
| `id`   | int    | 否   | 核销记录 ID |
| `code` | string | 否   | 核销码      |

### 说明

- 仅允许核销当前商家自己的门票订单
- 已核销记录重复提交会返回错误
- 核销成功后返回最新 `detail`

## 12. 设置接口

## 12.1 获取商家资料

- 方法：`GET`
- 路径：`/merchant-api/setting/merchant-profile`
- 处理器：`merchant/Setting@merchantProfile`

## 12.2 更新商家资料

- 方法：`POST`
- 路径：`/merchant-api/setting/merchant-profile`
- 处理器：`merchant/Setting@updateMerchantProfile`

### 请求参数

| 字段                        | 说明                        |
| --------------------------- | --------------------------- |
| `name`                      | 商家名称                    |
| `logo`                      | 商家 Logo                   |
| `mobile`                    | 联系电话                    |
| `kf_url`                    | 客服链接                    |
| `corp_id`                   | 企业微信企业 ID             |
| `transactorName`            | 经办人姓名                  |
| `transactorPhone`           | 经办人电话                  |
| `agencyName`                | 旅行社名称                  |
| `travelAgencyLicenseNumber` | 旅行社许可证号              |
| `businessLicenseNumber`     | 营业执照号/统一社会信用代码 |
| `area`                      | 省市区数组或 `/` 拼接字符串 |
| `description`               | 详细地址                    |
| `contactName`               | 联系人                      |
| `contactPhone`              | 联系电话                    |
| `servicePhone`              | 客服电话                    |

## 12.3 获取账号资料

- 方法：`GET`
- 路径：`/merchant-api/setting/account-profile`
- 处理器：`merchant/Setting@accountProfile`

## 12.4 更新账号资料

- 方法：`POST`
- 路径：`/merchant-api/setting/account-profile`
- 处理器：`merchant/Setting@updateAccountProfile`

### 请求参数

| 字段       | 说明   |
| ---------- | ------ |
| `nickname` | 昵称   |
| `avatar`   | 头像   |
| `email`    | 邮箱   |
| `mobile`   | 手机号 |

## 13. 上传接口

## 13.1 图片上传

- 方法：`POST`
- 路径：`/merchant-api/upload/image`
- 处理器：`merchant/Upload@image`

### 请求参数

普通上传：

| 字段   | 类型 | 必填 | 说明     |
| ------ | ---- | ---- | -------- |
| `file` | file | 是   | 图片文件 |

分片上传支持：

| 字段         | 说明               |
| ------------ | ------------------ |
| `chunkid`    | 分片 ID            |
| `action`     | `merge` 时表示合并 |
| `chunkindex` | 分片索引           |
| `chunkcount` | 分片总数           |
| `filename`   | 原始文件名         |

## 13.2 文件上传

- 方法：`POST`
- 路径：`/merchant-api/upload/file`
- 处理器：`merchant/Upload@file`

### 返回 data

| 字段       | 说明         |
| ---------- | ------------ |
| `id`       | 附件 ID      |
| `url`      | 相对路径     |
| `fullurl`  | 完整访问地址 |
| `mimetype` | 文件类型     |
| `filesize` | 文件大小     |
| `storage`  | 存储类型     |

## 当前业务约束

## 1. 商家认证边界

商家后台只允许使用：

- `application/common/library/MerchantAuth.php`
- `fa_wlktour_merch_admin`

禁止混用：

- `fa_user`
- 普通会员体系
- 旧 `application/api/controller/wlktour/*`

## 2. 景点与门票套餐边界

- `ticket` 主表在商家后台按只读视图使用
- 真正可写的是 `ticket_suit`
- 商家归属以 `fa_wlktour_ticket_suit.merch_id` 为准

## 3. 商品多规格边界

- `goods/create` 和 `goods/update` 当前主要处理商品主表
- 单规格商品可直接随主表一起保存库存信息
- 多规格商品需要继续调用 `goods/sku/save`

## 4. 数据隔离规则

所有接口都按当前登录商家做数据隔离：

- 线路：`merchid`
- 商品：`merch_id`
- 门票套餐：`merch_id`
- 订单：对应订单表中的商家字段

前端传入的 `merch_id` 不参与授权判断。

## 5. 结算链路边界

当前系统中的供应商结算，分为两条链路：

1. 微信服务商分账

- 适用于 `settle_channel = wechat_profitsharing`
- 订单完成后由平台自动发起微信分账
- 退款前需要先回退分账
- 不走商家端 `settlement/*` 申请结算流程

2. 内部结算

- 适用于 `settle_channel = internal`
- 当前主要是外部供应商的余额支付订单
- 订单完成后生成结算明细
- 商家端再走：
  - 结算明细查询
  - 提交结算申请
  - 平台审核
  - 生成结算单
  - 线下打款/后台标记打款
