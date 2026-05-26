# 商家端静态站点部署配置手册

本文档用于部署商家端前端静态站点，并通过站点伪静态/反向代理将接口请求转发到后端 PHP API 站点。

## 一、部署目标

前端静态站点和后端 API 站点分开部署：

```text
前端静态站点：https://merch.asphel.cn
后端 API 站点：https://newtour.asphel.cn
API 前缀：/merchant-api
```

部署完成后，浏览器实际访问：

```text
https://merch.asphel.cn/merchant-api/auth/login
```

服务器内部转发到：

```text
https://newtour.asphel.cn/merchant-api/auth/login
```

这样浏览器看到的是同源请求，可以避免跨域问题。

## 二、前端配置要求

商家端前端生产环境接口地址必须使用相对路径：

```env
VITE_GLOB_API_URL=/merchant-api
```

不要配置成完整后端域名：

```env
VITE_GLOB_API_URL=https://newtour.asphel.cn/merchant-api
```

如果前端已经打包完成，请检查打包目录中的运行时配置文件：

```text
dist/_app.config.js
```

确认里面的接口地址仍然是：

```js
VITE_GLOB_API_URL: '/merchant-api';
```

如果不是，请重新打包或修改运行时配置文件。

## 三、Apache 配置方式

适用于宝塔 Apache、标准 Apache 虚拟主机。

### 1. 开启 Apache 模块

Apache 需要启用以下模块：

```apache
mod_proxy
mod_proxy_http
mod_proxy_ssl
mod_rewrite
```

如果是 HTTPS 后端地址，还必须开启：

```apache
mod_ssl
mod_proxy_ssl
```

### 2. 反向代理配置

在前端站点 `merch.asphel.cn` 的 Apache 站点配置中加入以下内容。

宝塔路径通常为：

```text
网站 -> merch.asphel.cn -> 设置 -> 配置文件
```

配置示例：

```apache
SSLProxyEngine On
ProxyRequests Off
ProxyPreserveHost Off

ProxyPass "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"
ProxyPassReverse "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"

ProxyPass "/merchant-api" "https://newtour.asphel.cn/merchant-api"
ProxyPassReverse "/merchant-api" "https://newtour.asphel.cn/merchant-api"
```

说明：

- `SSLProxyEngine On`：允许 Apache 代理 HTTPS 后端。
- `ProxyPreserveHost Off`：转发到后端时使用后端域名 `newtour.asphel.cn`。
- 同时配置 `/merchant-api/` 和 `/merchant-api`，避免末尾斜杠差异导致 404。

### 3. Apache 伪静态配置

前端是 SPA 应用，需要把普通页面路由重写到 `index.html`，但必须排除 `/merchant-api`。

宝塔路径通常为：

```text
网站 -> merch.asphel.cn -> 设置 -> 伪静态
```

配置示例：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{REQUEST_URI} !^/merchant-api(?:/|$)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [L]
</IfModule>
```

重点是这一行：

```apache
RewriteCond %{REQUEST_URI} !^/merchant-api(?:/|$)
```

它表示：所有 `/merchant-api` 开头的请求都不要重写到前端页面，而是交给反向代理处理。

### 4. Apache 完整示例

以下为简化后的 Apache HTTPS 站点配置示例，实际配置请保留服务器证书、日志、站点目录等原有内容。

```apache
<VirtualHost *:443>
    ServerName merch.asphel.cn
    DocumentRoot "/www/wwwroot/merch.asphel.cn"

    SSLEngine On
    SSLCertificateFile /path/to/fullchain.pem
    SSLCertificateKeyFile /path/to/privkey.pem

    SSLProxyEngine On
    ProxyRequests Off
    ProxyPreserveHost Off

    ProxyPass "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"
    ProxyPassReverse "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"

    ProxyPass "/merchant-api" "https://newtour.asphel.cn/merchant-api"
    ProxyPassReverse "/merchant-api" "https://newtour.asphel.cn/merchant-api"

    <Directory "/www/wwwroot/merch.asphel.cn">
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    <IfModule mod_rewrite.c>
      RewriteEngine On

      RewriteCond %{REQUEST_URI} !^/merchant-api(?:/|$)
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule ^ /index.html [L]
    </IfModule>
</VirtualHost>
```

修改后需要重载 Apache。

### 5. 后端站点附加配置

如果后端 `newtour.asphel.cn` 站点使用 Apache，并且接口认证依赖 `Authorization`、`Token` 等请求头，建议在后端站点目录中补充以下配置：

```apache
<Directory "/www/wwwroot/newtour.asphel.cn">
    CGIPassAuth On
</Directory>
```

作用：

- 让 Apache 在 CGI / FastCGI 场景下继续传递认证信息。
- 避免部分接口因为认证头未透传而出现 401。

说明：

- 这段配置应放在后端 API 站点，不是前端静态站点。
- 如果后端已经能正常识别认证头，可以不额外添加。

## 四、Nginx 配置方式

适用于 Nginx、宝塔 Nginx、OpenResty。

### 1. 反向代理和伪静态配置

在前端站点 `merch.asphel.cn` 的 Nginx 配置中加入以下内容。

宝塔路径通常为：

```text
网站 -> merch.asphel.cn -> 设置 -> 配置文件
```

配置示例：

```nginx
location /merchant-api/ {
    proxy_ssl_server_name on;
    proxy_set_header Host newtour.asphel.cn;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_pass https://newtour.asphel.cn/merchant-api/;
}

location /merchant-api {
    proxy_ssl_server_name on;
    proxy_set_header Host newtour.asphel.cn;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_pass https://newtour.asphel.cn/merchant-api;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

注意：`location /merchant-api/` 必须放在 `location /` 前面，确保接口请求先被代理。

### 2. Nginx 完整示例

以下为简化后的 Nginx HTTPS 站点配置示例，实际配置请保留服务器证书、日志、站点目录等原有内容。

```nginx
server {
    listen 443 ssl http2;
    server_name merch.asphel.cn;

    root /www/wwwroot/merch.asphel.cn;
    index index.html;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location /merchant-api/ {
        proxy_ssl_server_name on;
        proxy_set_header Host newtour.asphel.cn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass https://newtour.asphel.cn/merchant-api/;
    }

    location /merchant-api {
        proxy_ssl_server_name on;
        proxy_set_header Host newtour.asphel.cn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass https://newtour.asphel.cn/merchant-api;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

修改后需要重载 Nginx。

## 五、验证方法

### 1. 浏览器验证

打开商家端登录页，按 `F12` 打开开发者工具，查看 `Network`。

登录接口的请求地址应该是：

```text
https://merch.asphel.cn/merchant-api/auth/login
```

不应该是：

```text
https://newtour.asphel.cn/merchant-api/auth/login
```

### 2. 命令行验证

可以使用以下命令验证代理是否生效：

```bash
curl -i https://merch.asphel.cn/merchant-api/auth/login
```

如果返回后端接口的 JSON 响应，说明代理生效。

如果返回的是前端 `index.html`，说明伪静态没有排除 `/merchant-api`。

## 六、常见问题

### 1. 请求仍然发到后端完整域名

现象：

```text
Request URL: https://newtour.asphel.cn/merchant-api/xxx
```

原因：

```text
前端生产配置仍然是完整后端域名。
```

处理：

```text
检查 dist/_app.config.js，确认 VITE_GLOB_API_URL 是否为 /merchant-api。
```

### 2. 请求返回前端页面

现象：

```text
/merchant-api/auth/login 返回 index.html
```

原因：

```text
伪静态把 /merchant-api 请求重写到了前端入口文件。
```

处理：

```text
Apache 检查 RewriteCond 是否排除了 /merchant-api。
Nginx 检查 location /merchant-api/ 是否放在 location / 前面。
```

### 3. Apache 返回 500 或 502

常见原因：

```text
mod_proxy 未开启。
mod_proxy_http 未开启。
mod_proxy_ssl 未开启。
未配置 SSLProxyEngine On。
```

处理：

```text
开启对应 Apache 模块，并重载 Apache。
```

### 4. 后端返回 404

常见原因：

```text
ProxyPass 路径末尾斜杠配置错误。
```

推荐配置：

```apache
ProxyPass "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"
ProxyPassReverse "/merchant-api/" "https://newtour.asphel.cn/merchant-api/"
```

```nginx
location /merchant-api/ {
    proxy_pass https://newtour.asphel.cn/merchant-api/;
}
```

### 5. 仍然出现跨域错误

使用本方案后，浏览器请求应该是同源地址：

```text
https://merch.asphel.cn/merchant-api/xxx
```

如果仍然出现跨域错误，通常说明前端仍在直连后端：

```text
https://newtour.asphel.cn/merchant-api/xxx
```

请重新检查前端生产配置和打包后的 `dist/_app.config.js`。

## 七、最终配置检查清单

上线前请确认：

- 前端生产配置为 `VITE_GLOB_API_URL=/merchant-api`。
- `dist/_app.config.js` 中接口地址为 `/merchant-api`。
- 前端站点已配置 `/merchant-api` 反向代理。
- SPA 伪静态已排除 `/merchant-api`。
- 浏览器 Network 中接口地址为前端域名。
- 不需要额外配置 CORS。
