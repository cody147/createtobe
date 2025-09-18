# 批量文生图工具

一个基于 Next.js + TypeScript + Tailwind CSS 的批量文生图前端应用，支持上传 CSV 文件批量生成图片，具备并发控制、重试机制和结果导出功能。

## ✨ 功能特性

- 📁 **CSV 文件上传** - 支持拖拽上传，自动解析序号和提示词
- 🎯 **批量生成** - 按顺序或并发调用生成接口
- 🔄 **智能重试** - 失败任务自动重试，支持指数退避
- 📊 **实时监控** - 任务状态实时更新，进度可视化
- 🖼️ **图片预览** - 生成结果缩略图预览和放大查看
- 📥 **结果导出** - 支持导出生成结果到 CSV 文件
- ⚡ **性能优化** - 虚拟滚动，支持大量任务处理
- 🎨 **现代 UI** - 基于 Tailwind CSS 的响应式设计

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 📋 使用说明

### 1. 准备 CSV 文件

创建包含以下格式的 CSV 文件：

```csv
序号,提示词
1,一只蓝色的小猫，像素风格
2,夕阳下的城市天际线，油画风格
3,未来主义的机器人，科幻风格
```

**要求：**
- 第一列：序号（正整数）
- 第二列：提示词（字符串）
- 编码：UTF-8
- 支持表头（可选）

### 2. 上传和解析

- 拖拽 CSV 文件到上传区域，或点击选择文件
- 系统自动解析并显示统计信息
- 检查有效行数和无效行数

### 3. 批量生成

- 选择并发数（1-3）
- 点击"开始生成"按钮
- 实时查看任务进度和状态

### 4. 结果管理

- 查看生成结果缩略图
- 点击图片放大预览
- 下载单个图片
- 导出所有结果到 CSV

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **状态管理**: React Hooks
- **文件处理**: 原生 FileReader API

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── generate/      # 生成接口
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── ActionBar.tsx      # 操作栏
│   ├── BatchUploader.tsx  # 批量上传
│   ├── CsvPreviewTable.tsx # CSV 预览表格
│   ├── ImageModal.tsx     # 图片预览模态框
│   └── Toast.tsx          # 通知组件
├── lib/                   # 工具库
│   ├── csv.ts            # CSV 解析
│   ├── export.ts         # 导出功能
│   ├── scheduler.ts      # 任务调度
│   └── types.ts          # 类型定义
└── ...                   # 配置文件
```

## 🔧 配置说明

### 并发控制

默认并发数为 1（串行），可根据需要调整为 2-3：

```typescript
// 在 ActionBar 组件中
const concurrency = 1; // 1-3
```

### 重试策略

失败任务自动重试，最多 3 次：

```typescript
// 在 scheduler.ts 中
const maxAttempts = 3;
const retryDelay = Math.pow(2, attempt - 1) * 1000; // 指数退避
```

### API 接口

生成接口规范：

```typescript
// 请求
POST /api/generate
{
  "prompt": "一只蓝色的小猫，像素风格"
}

// 响应
{
  "taskId": "task_123",
  "imageUrl": "https://example.com/image.png"
}
```

## 🎨 设计规范

### 颜色系统

- **主色**: #3B82F6 (蓝色)
- **成功**: #22C55E (绿色)
- **警告**: #F59E0B (橙色)
- **错误**: #EF4444 (红色)

### 组件规范

- 圆角：`rounded-2xl`
- 阴影：`shadow-lg`
- 间距：8px 倍数
- 字体：Inter

## 🚀 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 自动部署完成

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 图标库
- [Picsum](https://picsum.photos/) - 示例图片服务

---

**注意**: 这是一个 MVP 版本，主要用于演示批量文生图的前端实现。生产环境使用请根据实际需求进行安全性和性能优化。