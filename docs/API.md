# HoloGraph API 文档

## 组件 API

### GraphCanvas

知识图谱可视化画布组件。

```typescript
interface GraphCanvasProps {
  // 无 props，所有状态从 graphStore 获取
}

function GraphCanvas(): JSX.Element
```

**功能**：
- 渲染 SVG 画布
- 处理缩放/平移/选择交互
- 渲染节点和边

---

### GraphNode

单个知识节点组件。

```typescript
interface GraphNodeProps {
  id: string;
  label: string;
  type: NodeType;
  position: { x: number; y: number };
  color?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDrag?: (id: string, position: { x: number; y: number }) => void;
}

function GraphNode(props: GraphNodeProps): JSX.Element
```

**样式变体**：
| 类型 | 颜色 | 用途 |
|------|------|------|
| concept | #64b5f6 (蓝) | 概念、想法 |
| note | #81c784 (绿) | 笔记、记录 |
| task | #ffb74d (橙) | 待办任务 |
| reference | #e57373 (红) | 引用、来源 |
| tag | #ba68c8 (紫) | 标签、分类 |

---

### GraphEdge

连接边组件。

```typescript
interface GraphEdgeProps {
  id: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  label?: string;
  type: EdgeType;
  weight?: number;
  animated?: boolean;
}

function GraphEdge(props: GraphEdgeProps): JSX.Element
```

---

### NodePanel

节点属性编辑面板。

```typescript
interface NodePanelProps {
  // 无 props，从 graphStore 获取 selectedNodeId
}

function NodePanel(): JSX.Element
```

**功能**：
- 编辑节点标签、类型、内容
- 修改节点颜色
- 添加/删除标签
- 显示创建/修改时间

---

### Toolbar

顶部工具栏组件。

```typescript
interface ToolbarProps {
  onAddNode: () => void;
  onLayout: () => void;
  onExport: () => void;
  onImport: () => void;
}

function Toolbar(props: ToolbarProps): JSX.Element
```

---

### SearchBox

搜索组件。

```typescript
interface SearchBoxProps {
  // 无 props，使用 uiStore 的 searchQuery
}

function SearchBox(): JSX.Element
```

---

## Store API

### useGraphStore

图谱状态管理。

```typescript
interface GraphState {
  // State
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  viewBox: ViewBox;
  selectedNodeId: string | null;
  
  // Node Actions
  addNode: (node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  
  // Edge Actions
  addEdge: (edge: Omit<KnowledgeEdge, 'id' | 'createdAt'>) => void;
  removeEdge: (id: string) => void;
  
  // View Actions
  setViewBox: (viewBox: ViewBox) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  
  // Data Loading
  loadNodes: () => Promise<void>;
  loadEdges: () => Promise<void>;
}

const useGraphStore = create<GraphState>();
```

**使用示例**：
```typescript
function MyComponent() {
  const { nodes, addNode, selectNode } = useGraphStore();
  
  const handleClick = () => {
    addNode({
      label: '新节点',
      type: 'concept',
      content: '',
      position: { x: 100, y: 100 },
      tags: []
    });
  };
  
  return <div onClick={handleClick}>添加节点</div>;
}
```

---

### useUIStore

UI 状态管理。

```typescript
interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  searchQuery: string;
  
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setSearchQuery: (query: string) => void;
}

const useUIStore = create<UIState>();
```

---

## Services API

### storageService

数据持久化服务。

```typescript
interface StorageService {
  // 节点操作
  loadNodes(): Promise<KnowledgeNode[]>;
  saveNodes(nodes: KnowledgeNode[]): Promise<void>;
  
  // 边操作
  loadEdges(): Promise<KnowledgeEdge[]>;
  saveEdges(edges: KnowledgeEdge[]): Promise<void>;
  
  // 完整图谱操作
  load(): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }>;
  save(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): Promise<void>;
  
  // 导入/导出
  exportToJSON(): string;
  importFromJSON(json: string): void;
}

const storageService: StorageService;
```

---

### layoutService

布局算法服务。

```typescript
interface LayoutOptions {
  width?: number;           // 布局区域宽度
  height?: number;          // 布局区域高度
  iterations?: number;      // 迭代次数
  stiffness?: number;       // 弹簧刚度
  repulsion?: number;       // 排斥力强度
  damping?: number;         // 阻尼系数
}

interface LayoutService {
  // 力导向布局
  applyForceLayout(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: LayoutOptions
  ): KnowledgeNode[];
  
  // 圆形布局
  applyCircularLayout(
    nodes: KnowledgeNode[],
    radius?: number
  ): KnowledgeNode[];
  
  // 层次布局
  applyHierarchicalLayout(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): KnowledgeNode[];
}

const layoutService: LayoutService;
```

---

## Utility API

### pathfinding

路径规划工具。

```typescript
/**
 * 使用 Dijkstra 算法查找最短路径
 * @param startId - 起始节点 ID
 * @param endId - 目标节点 ID
 * @param edges - 图中所有边
 * @returns 节点 ID 数组，如果无路径返回 null
 */
function findShortestPath(
  startId: string,
  endId: string,
  edges: KnowledgeEdge[]
): string[] | null;

/**
 * 查找节点到所有其他节点的最短路径
 * @param startId - 起始节点 ID
 * @param edges - 图中所有边
 * @returns 距离映射表
 */
function findAllShortestPaths(
  startId: string,
  edges: KnowledgeEdge[]
): Map<string, { distance: number; path: string[] }>;
```

---

### search

搜索工具。

```typescript
interface SearchOptions {
  fields?: ('label' | 'content' | 'tags')[];
  caseSensitive?: boolean;
  fuzzy?: boolean;
}

/**
 * 在节点中搜索
 * @param nodes - 节点列表
 * @param query - 搜索词
 * @param options - 搜索选项
 * @returns 匹配的节点数组
 */
function searchNodes(
  nodes: KnowledgeNode[],
  query: string,
  options?: SearchOptions
): KnowledgeNode[];

/**
 * 高亮匹配文本
 * @param text - 原文本
 * @param query - 搜索词
 * @returns 带高亮标记的 HTML 字符串
 */
function highlightMatch(text: string, query: string): string;
```

---

## Hooks API

### useKeyboardShortcuts

键盘快捷键 Hook。

```typescript
interface KeyboardShortcutsOptions {
  onNewNode?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
}

/**
 * 注册键盘快捷键
 * @param options - 快捷键回调配置
 */
function useKeyboardShortcuts(options: KeyboardShortcutsOptions): void;

// 使用示例
function App() {
  useKeyboardShortcuts({
    onNewNode: () => console.log('新建节点'),
    onSearch: () => console.log('打开搜索'),
    onEscape: () => console.log('取消选择'),
  });
  
  return <div>App</div>;
}
```

---

## Electron IPC API

### 主进程 -> 渲染进程

```typescript
// 暴露给渲染进程的 API 接口
interface ElectronAPI {
  // 图谱数据
  getGraphData: () => Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }>;
  saveGraphData: (data: unknown) => Promise<{ success: boolean }>;
  
  // 导入/导出
  exportGraph: (format: string) => Promise<{ filePath: string | undefined; canceled: boolean }>;
  importGraph: () => Promise<{ data: string | null; canceled: boolean }>;
  
  // 系统信息
  platform: string;
  versions: NodeJS.ProcessVersions;
}

// 在渲染进程中访问
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## 类型定义

### 枚举类型

```typescript
type NodeType = 'concept' | 'note' | 'task' | 'reference' | 'tag';

type EdgeType = 'related' | 'depends' | 'refines' | 'sequence';
```

### 核心接口

```typescript
interface KnowledgeNode {
  id: string;
  label: string;
  type: NodeType;
  content: string;
  position: { x: number; y: number };
  color?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: EdgeType;
  weight: number;
  createdAt: string;
}

interface ViewBox {
  x: number;
  y: number;
  zoom: number;
}
```

---

## 快捷键参考

| 快捷键 | 功能 | 作用域 |
|--------|------|--------|
| `Ctrl+N` | 新建节点 | 全局 |
| `Ctrl+F` | 搜索 | 全局 |
| `Ctrl+S` | 立即保存 | 全局 |
| `Delete` | 删除选中节点 | 全局 |
| `Escape` | 取消选择/关闭面板 | 全局 |
| `Ctrl+滚轮` | 缩放画布 | 画布 |
| `空格+拖拽` | 平移画布 | 画布 |
| `Ctrl+A` | 选择所有节点 | 画布 |
| `Shift+单击` | 多选节点 | 画布 |
