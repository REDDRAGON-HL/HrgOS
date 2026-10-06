# 部署到 hrgos.skyseiun.com

此目录部署独立规则测试后端及 PostgreSQL。主玩家/工作人员界面仍为原型；真实 Web Push、生产对象存储及主界面的后端接入尚未完成。完整的测试范围、运行方式和验收边界见 [规则联调说明](../docs/rule-testing.md)。

## 服务器部署人员操作

前提：Linux、Git、OpenSSL、Docker Engine 和 Docker Compose；域名源站指向本服务器，80/443 可用。域名经过 Cloudflare 时，还需确认源站证书及 WebSocket 转发正常。

```sh
git clone https://github.com/bult-0509/HrgOS.git
cd HrgOS
umask 077
cp deploy/.env.example deploy/.env
```

使用编辑器修改 `deploy/.env`：

```dotenv
API_DOMAIN=hrgos.skyseiun.com
FRONTEND_ORIGINS=https://hrgos.skyseiun.com,http://127.0.0.1:3001,http://localhost:3001
POSTGRES_PASSWORD=独立生成的64位十六进制随机字符串
TEST_API_KEY=另一个独立生成的64位十六进制随机字符串
```

分别执行两次 `openssl rand -hex 32` 生成两份值，不要使用示例占位值。`FRONTEND_ORIGINS` 必须列出实际测试前端的 origin；本机端口改成 3002 时也要相应修改。配置文件不提交 Git。

```sh
chmod 600 deploy/.env
docker compose --env-file deploy/.env -f deploy/compose.yml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yml up -d --build --wait
curl --fail https://hrgos.skyseiun.com/api/health
```

健康检查应包含 `"database":"postgresql"` 和 `"testApiEnabled":true`。数据库使用持久卷，不开放 5432 公网端口。网关目前转发 API，不提供前端静态站点；测试前端可在开发机运行，或使用下述独立部署方式。若本服务器已有网站占用 80/443，请先将 API 接入现有代理，避免直接启动第二个网关。

不要执行 `docker compose down -v`，这会删除数据库卷。更新部署时只运行 `git pull --ff-only` 和上述 `up -d --build --wait`；不要覆盖已有密码。日志与状态：

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml ps
docker compose --env-file deploy/.env -f deploy/compose.yml logs --tail=100 api gateway
sh deploy/backup.sh
```

## 前端一键测试

开发机安装 Node.js 24 LTS：

```sh
npm ci
```

PowerShell：

```powershell
$env:HRG_TEST_API_URL = 'https://hrgos.skyseiun.com'
npm run test:lab
```

Linux/macOS：

```sh
HRG_TEST_API_URL=https://hrgos.skyseiun.com npm run test:lab
```

打开终端打印的 `/?test=rules` URL，输入服务器 `deploy/.env` 中的 `TEST_API_KEY`，点击“一键执行规则测试”。成功结果为 31 项自动通过、0 项失败、4 项待验收，数据库应显示 `postgresql`。密钥仅输入测试页面，不能配置成 `VITE_` 变量。

部署到手机可访问的前端静态站点时：

```sh
VITE_ENABLE_TEST_LAB=true VITE_TEST_API_BASE_URL=https://hrgos.skyseiun.com npm run build
```

通过现有 HTTPS 静态站点托管 `dist/`，配置 SPA 回退到 `index.html`，访问 `/?test=rules`。若前后端共用 `hrgos.skyseiun.com`，已有网关须将 `/api/*` 转发到本 Compose 的 `api:4000`，其余路径提供前端静态文件；本仓库默认 Caddy 配置为独立 API 网关，需要按该服务器实际站点结构整合。前端静态目录绝不能包含 `.env`、`local-private/` 或备份文件。

定位、相机需要手机 HTTPS 及用户授权。iPhone/Android 的锁屏通知尚需配置真实 Web Push 后验收。远端异常退出恢复和正式活动开赛条件也不会被一键接口测试标为通过。

本地已验证前端构建、33 项单元测试、4 项后端测试及浏览器一键流程；当前未提供服务器访问，因此尚未验证此 Compose 在异地服务器实际启动。
