# HoloGraph 架构文档

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Window Mgr  │  │  IPC Handler │  │  File Dialog │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ IPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Electron Renderer Process                   │
│                    (Chromium + Node.js)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   React Application                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │ GraphCanvas  │  │  NodePanel   │  │  Toolbar  │  │   │
│  │  │  (可视化)     │  │  (属性编辑)   │  │  (工具栏)  │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Sidebar    │  │  SearchBox   │  │WelcomeModal│  │   │
│  │  │  (侧边栏)     │  │   (搜索)     │  │ (欢迎弹窗) │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    State Management                   │   │
│  │          (Zustand - 轻量级状态管理库)                   │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │  graphStore  │  │   uiStore    │                  │   │
│  │  │  (图谱数据)   │  │  (UI 状态)   │                  │   │
│  │  └──────────────┘  └──────────────┘                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Services & Utilities                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Storage    │  │    Layout    │  │  Search   │  │   │
│  │  │  (持久化)     │  │  (布局算法)   │  │  (搜索)   │  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心模块详解

### 1. Electron 主进程 (Main Process)

**文件**: `electron/main.ts`

职责：
- 创建和管理应用窗口
- 处理系统级 IPC 调用
- 管理文件对话框（导入/导出）
- 控制应用生命周期

关键类/函数：
```typescript
function createWindow(): void  // 创建主窗口
// IPC Handlers:
- get-graph-data: 获取图谱数据
- save-graph-data: 保存图谱数据
- export-graph: 导出文件对话框
- import-graph: 导入文件对话框
```

**文件**: `electron/preload.ts`

职责：
- 安全地暴露 Electron API 给渲染进程
- 使用 contextBridge 隔离主进程 API

---

### 2. 状态管理 (State Management)

#### 2.1 Graph Store

**文件**: `src/stores/graphStore.ts`

管理图谱核心数据：
```typescript
interface GraphState {
  nodes: KnowledgeNode[];      // 节点列表
  edges: KnowledgeEdge[];      // 边列表
  viewBox: ViewBox;            // 视口状态
  selectedNodeId: string | null; // 当前选中节点
  
  // Actions
  addNode: (node: Omit<KnowledgeNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Omit<KnowledgeEdge, 'id'>) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  setViewBox: (viewBox: ViewBox) => void;
  loadNodes: () => Promise<void>;
  loadEdges: () => Promise<void>;
}
```

#### 2.2 UI Store

**文件**: `src/stores/uiStore.ts`

管理界面状态：
```typescript
interface UIState {
  sidebarOpen: boolean;        // 侧边栏展开状态
  rightPanelOpen: boolean;     // 右侧面板展开状态
  searchQuery: string;         // 当前搜索词
  
  // Actions
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setSearchQuery: (query: string) => void;
}
```

---

### 3. 可视化组件 (Visualization)

#### 3.1 GraphCanvas

**文件**: `src/components/GraphCanvas/index.tsx`

核心职责：
- 渲染 SVG 画布
- 处理缩放/平移交互
- 渲染节点和边
- 管理选择状态

实现细节：
- 使用 SVG 的 `viewBox` 实现无限画布
- 鼠标滚轮缩放（改变 viewBox 尺寸）
- 空格+拖拽平移（改变 viewBox 原点）
- 点击选择节点

#### 3.2 GraphNode & GraphEdge

**文件**: 
- `src/components/GraphNode/index.tsx`
- `src/components/GraphEdge/index.tsx`

职责：
- 渲染单个节点/边
- 处理交互事件（hover、click）
- 应用 Fluent Design 样式

---

### 4. 布局引擎 (Layout Engine)

#### 4.1 力导向布局

**文件**: `src/utils/layout.ts`

基于 D3-force 的力导向布局：
```typescript
function applyForceLayout(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  options: LayoutOptions
): KnowledgeNode[] {
  // 1. 创建 D3 仿真
  // 2. 配置力：
  //    - 节点间排斥力 (forceManyBody)
  //    - 连接吸引力 (forceLink)
  //    - 中心引力 (forceCenter)
  // 3. 运行仿真并更新节点位置
  // 4. 返回更新后的节点
}
```

#### 4.2 路径规划

**文件**: `src/utils/pathfinding.ts`

使用 Dijkstra 算法：
```typescript
function findShortestPath(
  startId: string,
  endId: string,
  edges: KnowledgeEdge[]
): string[] | null {
  // 实现 Dijkstra 最短路径算法
  // 返回节点 ID 数组
}
```

---

### 5. 数据持久化 (Persistence)

#### 5.1 Storage Service

**文件**: `src/services/storage.ts`

职责：
- localStorage 数据读写
- JSON 导入/导出
- 数据版本迁移

实现：
```typescript
class StorageService {
  private readonly NODES_KEY = 'holograph:nodes';
  private readonly EDGES_KEY = 'holograph:edges';
  
  async loadNodes(): Promise<KnowledgeNode[]>;
  async saveNodes(nodes: KnowledgeNode[]): Promise<void>;
  async loadEdges(): Promise<KnowledgeEdge[]>;
  async saveEdges(edges: KnowledgeEdge[]): Promise<void>;
  exportToJSON(): string;
  importFromJSON(json: string): void;
}
```

---

## 数据模型

### KnowledgeNode (知识节点)

```typescript
interface KnowledgeNode {
  id: string;                    // 唯一标识符 (UUID)
  label: string;                 // 显示标签
  type: 'concept' | 'note' | 'task' | 'reference' | 'tag';
  content: string;               // Markdown 内容
  position: { x: number; y: number }; // 2D 坐标
  color?: string;                // 自定义颜色 (可选)
  tags: string[];                // 标签数组
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

### KnowledgeEdge (知识边)

```typescript
interface KnowledgeEdge {
  id: string;                    // 唯一标识符
  source: string;                // 源节点 ID
  target: string;                // 目标节点 ID
  label?: string;                // 关系标签 (可选)
  type: 'related' | 'depends' | 'refines' | 'sequence';
  weight: number;                // 连接权重 (1-10)
  createdAt: string;             // ISO 8601 时间戳
}
```

### ViewBox (视口)

```typescript
interface ViewBox {
  x: number;                     // 视口左上 X 坐标
  y: number;                     // 视口左上 Y 坐标
  zoom: number;                  // 缩放级别 (0.1 - 5.0)
}
```

---

## 构建系统

### 开发模式
```bash
npm run dev
```
- Vite 启动开发服务器
- Electron 加载本地开发 URL
- 支持热更新 (HMR)

### 生产构建
```bash
npm run build
```
构建流程：
1. TypeScript 编译检查
2. Vite 构建前端资源 → `dist/`
3. Vite 构建 Electron → `dist-electron/`
4. electron-builder 打包 → `release/`

### 输出产物
```
release/
├── win-unpacked/           # 未打包的 Windows 应用
├── HoloGraph 1.0.0.exe     # 便携版 (~82 MB)
├── HoloGraph Setup 1.0.0.exe # 安装程序 (~83 MB)
└── ...
```

---

## 性能优化策略

### 渲染优化
1. **虚拟化**: 只渲染视口内的节点
2. **防抖**: 搜索输入防抖 300ms
3. **节流**: 布局仿真节流 16ms
4. **Memoization**: 使用 React.memo 和 useMemo

### 数据优化
1. **懒加载**: 大型图谱分页加载
2. **增量保存**: 只保存变更的数据
3. **压缩**: localStorage 数据 LZ 压缩

### 启动优化
1. **代码分割**: 按路由分割代码
2. **预加载**: 关键资源预加载
3. **Splash**: 显示启动画面提升感知性能

---

## 安全考虑

### 进程隔离
- 主进程拥有 Node.js 完整权限
- 渲染进程通过 Preload 脚本访问受限 API
- `contextIsolation: true` 启用上下文隔离

### 数据安全
- 本地数据使用 localStorage，不上传云端
- 导入/导出由用户主动控制
- 无远程代码执行能力

### 依赖安全
- 定期更新依赖
- 使用 `npm audit` 检查漏洞
- 锁定版本避免意外更新
