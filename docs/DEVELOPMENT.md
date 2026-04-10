# 开发指南

## 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: >= 2.30.0
- **操作系统**: Windows 10/11, macOS, 或 Linux

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/CloverIris/HoloGraph.git
cd HoloGraph
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

这将同时启动：
- Vite 开发服务器 (http://localhost:5173)
- Electron 应用

### 4. 构建生产版本

```bash
npm run build
```

构建产物：
- `dist/` - 前端资源
- `dist-electron/` - Electron 主进程代码
- `release/` - 打包后的桌面应用

---

## 项目脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:win` | 仅构建 Windows 版本 |
| `npm run build:mac` | 仅构建 macOS 版本 |
| `npm run build:linux` | 仅构建 Linux 版本 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run preview` | 预览生产构建 |

---

## 项目结构详解

```
HoloGraph/
├── electron/              # Electron 主进程代码
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本（安全桥接）
│
├── src/                   # 渲染进程代码（React）
│   ├── components/        # React 组件
│   │   ├── GraphCanvas/   # 图谱画布
│   │   ├── GraphNode/     # 节点组件
│   │   ├── GraphEdge/     # 边组件
│   │   ├── Sidebar/       # 侧边栏
│   │   ├── Toolbar/       # 工具栏
│   │   ├── NodePanel/     # 节点属性面板
│   │   ├── SearchBox/     # 搜索框
│   │   └── WelcomeModal/  # 欢迎弹窗
│   │
│   ├── stores/            # Zustand 状态管理
│   │   ├── graphStore.ts  # 图谱数据状态
│   │   └── uiStore.ts     # UI 状态
│   │
│   ├── services/          # 业务服务层
│   │   └── storage.ts     # 本地存储服务
│   │
│   ├── hooks/             # 自定义 React Hooks
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── utils/             # 工具函数
│   │   ├── layout.ts      # 布局算法
│   │   ├── pathfinding.ts # 路径规划
│   │   └── search.ts      # 搜索功能
│   │
│   ├── styles/            # 样式文件
│   │   └── App.css        # 全局样式
│   │
│   ├── types/             # TypeScript 类型定义
│   ├── main.tsx           # React 入口
│   └── App.tsx            # 根组件
│
├── docs/                  # 项目文档
├── resources/             # 静态资源（图标等）
├── dist/                  # 前端构建输出
├── dist-electron/         # Electron 构建输出
├── release/               # 打包后的应用
├── index.html             # 应用入口 HTML
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── vite.electron.config.ts # Electron 构建配置
```

---

## 开发规范

### 代码风格

项目使用 ESLint 进行代码检查，配置基于：
- `@typescript-eslint/recommended`
- `react-hooks/recommended`

运行代码检查：
```bash
npm run lint
```

### 命名规范

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 组件 | PascalCase | `GraphCanvas.tsx` |
| 函数/变量 | camelCase | `useGraphStore` |
| 常量 | UPPER_SNAKE_CASE | `MAX_ZOOM_LEVEL` |
| 接口 | PascalCase | `KnowledgeNode` |
| 类型别名 | PascalCase | `NodeType` |
| 文件名 | camelCase | `graphStore.ts` |

### 组件开发规范

1. **使用函数组件 + Hooks**
```typescript
// ✅ 推荐
function MyComponent({ prop }: MyComponentProps) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // side effect
  }, [dependency]);
  
  return <div>{content}</div>;
}
```

2. **类型定义放在单独文件或组件上方**
```typescript
interface MyComponentProps {
  title: string;
  onClick: () => void;
}
```

3. **使用 Zustand 进行状态管理**
```typescript
const { nodes, addNode } = useGraphStore();
```

4. **添加必要的注释**
```typescript
/**
 * 处理节点拖拽结束
 * @param event - 鼠标事件
 * @param node - 被拖拽的节点
 */
const handleDragEnd = (event: MouseEvent, node: Node) => {
  // implementation
};
```

---

## 状态管理最佳实践

### Graph Store 使用

```typescript
import { useGraphStore } from '@stores/graphStore';

function MyComponent() {
  // ✅ 只选择需要的字段（性能优化）
  const nodes = useGraphStore(state => state.nodes);
  const addNode = useGraphStore(state => state.addNode);
  
  // ❌ 避免解构整个 store
  // const { nodes, edges, ... } = useGraphStore();
  
  const handleAdd = () => {
    addNode({
      label: '新节点',
      type: 'concept',
      content: '',
      position: { x: 100, y: 100 },
      tags: []
    });
  };
  
  return <button onClick={handleAdd}>添加</button>;
}
```

### Store 更新模式

```typescript
// ✅ 使用 immer 风格的更新
updateNode(id, { label: '新标签' });

// ✅ 批量更新
set(state => {
  state.nodes = newNodes;
  state.edges = newEdges;
});
```

---

## 调试技巧

### 开发工具

1. **React Developer Tools**
   - 检查组件树
   - 查看 props 和 state
   - 性能分析

2. **Redux DevTools** (Zustand 兼容)
   - 状态时间旅行
   - Action 日志

3. **Electron DevTools**
   - 主进程: `Ctrl+Shift+I` 或 F12
   - 网络监控
   - Console 日志

### 日志输出

```typescript
// 主进程日志
console.log('Main process:', data);

// 渲染进程日志
console.log('Renderer:', data);

// 使用 DevTools 查看
```

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 热更新失效 | 重启 `npm run dev` |
| 类型错误 | 运行 `npx tsc --noEmit` |
| 构建失败 | 删除 `dist/` 和 `dist-electron/` 后重试 |
| 依赖冲突 | 删除 `node_modules` 并重新安装 |

---

## 测试策略

### 单元测试 (规划中)

```typescript
// utils/pathfinding.test.ts
describe('findShortestPath', () => {
  it('should find path between connected nodes', () => {
    const edges = [{ source: 'a', target: 'b' }];
    const path = findShortestPath('a', 'b', edges);
    expect(path).toEqual(['a', 'b']);
  });
});
```

### 集成测试 (规划中)

使用 Playwright 进行 E2E 测试：
```typescript
test('create node', async () => {
  await page.click('[data-testid="add-node"]');
  await page.fill('[data-testid="node-label"]', '测试节点');
  await page.click('[data-testid="save"]');
  
  const node = await page.locator('.graph-node').first();
  await expect(node).toHaveText('测试节点');
});
```

---

## 发布流程

### 版本号更新

1. 更新 `package.json` 中的版本号
2. 更新 `docs/CHANGELOG.md`
3. 创建 Git 标签

```bash
git add .
git commit -m "chore: bump version to v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 构建发布

```bash
npm run build
```

检查 `release/` 目录中的产物：
- `HoloGraph Setup 1.0.1.exe` - Windows 安装程序
- `HoloGraph 1.0.1.exe` - 便携版

### 发布到 GitHub Releases

1. 在 GitHub 创建新 Release
2. 上传构建产物
3. 填写发布说明（从 CHANGELOG 复制）
4. 发布

---

## 贡献指南

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
类型(范围): 描述

[可选的正文]

[可选的脚注]
```

类型：
- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(graph): 添加节点拖拽排序功能

- 实现拖拽检测逻辑
- 添加视觉反馈
- 更新状态管理

Closes #123
```

### Pull Request 流程

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 资源链接

- [React 文档](https://react.dev/)
- [Electron 文档](https://www.electronjs.org/docs)
- [Vite 文档](https://vitejs.dev/guide/)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [React Flow 文档](https://reactflow.dev/)
- [Fluent Design](https://fluent2.microsoft.design/)
