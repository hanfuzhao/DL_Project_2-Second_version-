# SafeType — 部署说明

## 本地运行

```bash
# 1. 构建 React 前端
cd frontend && npm install && npm run build && cd ..

# 2. 启动 Flask 后端
pip install flask gunicorn
PORT=8080 python app.py
```

浏览器打开 `http://localhost:8080`。

### 前端开发模式（热更新）

```bash
cd frontend && npm run dev
```

Vite 开发服务器会自动代理 `/api` 请求到 Flask 后端（需要同时运行 Flask）。

---

## 部署到 Render

### 步骤

1. 将代码推送到 GitHub 仓库。
2. 登录 [render.com](https://render.com)，点击 **New → Web Service**。
3. 连接 GitHub 仓库，选择 `main` 分支。
4. Render 会自动检测 `render.yaml`，确认配置：
   - **Build**: 自动构建 React 前端 + 安装 Python 依赖
   - **Start**: `gunicorn app:app`
5. 环境变量已在 `render.yaml` 中预设（`SAFETYPE_DEVICE=cpu`）。
6. 选择 **Free** plan，点击 **Create Web Service**。
7. 等待构建，获取 `https://safetype-xxxx.onrender.com` 地址。

### 技术架构

```
frontend/           ← React + Vite (iOS 键盘模拟界面)
  src/App.jsx       ← 主组件（iPhone + 键盘 + 仪表板）
  src/index.css     ← 样式
  dist/             ← 构建产物（Flask 静态服务）
app.py              ← Flask 后端（API + 静态文件服务）
main.py             ← 模型推理引擎
render.yaml         ← Render 部署配置
```

### 注意事项

- Free plan 有 512MB 内存限制，默认使用 Logistic Regression 模型。
- Free plan 服务 15 分钟无访问后休眠，首次访问需约 30 秒启动。
- 确保 `models/` 目录中的模型文件已提交到仓库。
