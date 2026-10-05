# HRG 国庆特别综艺 Web App

面向杭州西湖线下活动的本机运行 Web App 首版。当前包含玩家端、工作人员端、PWA 基础能力和可替换棋盘接口。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:3000/`。登录页可切换玩家账号与工作人员账号；当前为交互原型，输入框中的演示账号可直接登录。

开发预览也可使用：

- 玩家端：`http://127.0.0.1:3000/?preview=player`
- 工作人员端：`http://127.0.0.1:3000/?preview=staff`

## 已实现范围

- 玩家端：区域进度、任务图库、图片单张提交、卡牌使用、消息中心、事件与排名快照展示。
- 工作人员端：总览、FIFO 审核队列、队长位置、离线/完赛标识、现场完赛确认与操作留痕展示。
- 技术基础：React + TypeScript + Vite、PWA manifest/service worker、响应式布局、本地阿里妈妈方圆体。
- 解耦接口：棋盘通过 `BoardAdapter` 提供任务状态与选择事件，后续视觉方案可直接替换。

## 校验

```bash
npm test
npm run build
```

正式接入阶段仍需补齐后端 API、鉴权、对象存储、Web Push、实时定位通道和数据库持久化。
