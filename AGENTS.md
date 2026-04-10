# HoloGraph - Agent Notes

## 构建设置

### Electron 路径解析

在打包后的应用中，`index.html` 路径解析需要特殊处理：

```typescript
// electron/main.ts
const indexPaths = [
  // asar 打包场景
  path.join(process.resourcesPath, "app.asar", "dist", "index.html"),
  path.join(app.getAppPath(), "dist", "index.html"),
  // 未打包场景
  path.join(__dirname, "..", "dist", "index.html"),
  path.join(__dirname, "dist", "index.html"),
];
```

**关键点：**
- vite-plugin-electron 输出到 `dist-electron/` 而非 `dist-electron/electron/`
- asar 结构中 `dist/` 和 `dist-electron/` 位于根目录
- `__dirname` 在打包后指向 `dist-electron/`

### package.json 配置

```json
{
  "main": "dist-electron/main.js",
  "build": {
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "resources/**/*"
    ]
  }
}
```

## 常见错误修复

### TypeScript 编译错误

1. **未使用的导入** - 删除或使用 `_` 前缀
2. **缺少类型属性** - 扩展接口定义
3. **Promise 返回类型** - 确保 async 函数返回 Promise<void>

### 调试技巧

```typescript
// 在 main.ts 中添加调试日志
console.log('__dirname:', __dirname);
console.log('resourcesPath:', process.resourcesPath);
console.log('appPath:', app.getAppPath());
```

## 构建命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 打包发布
npm run build && npm run dist
```

## 发布文件

- `release/win-unpacked/` - 未打包版本（调试用）
- `release/HoloGraph 1.0.0.exe` - 便携版（约 84MB）
- `release/HoloGraph Setup 1.0.0.exe` - 安装程序（约 84MB）
