# MongoDB 数据库管理界面

这是一个基于 Next.js + Hono 框架开发的 MongoDB 数据库管理界面，提供了完整的 CRUD 操作功能。

## 功能特性

- 🔗 **连接管理**: 支持 MongoDB 连接字符串配置和测试
- 🗄️ **数据库浏览**: 查看所有数据库和集合
- 📊 **文档管理**: 支持文档的查看、创建、编辑和删除
- 📄 **分页显示**: 大量数据的分页浏览
- 🎨 **现代界面**: 美观的深色主题界面
- 🔒 **用户认证**: 集成 Clerk 身份验证

## 使用方法

### 1. 配置 MongoDB 连接

1. 访问主页 `http://localhost:3000`
2. 点击 "MongoDB" 卡片
3. 如果是首次使用，会跳转到设置页面
4. 输入你的 MongoDB 连接字符串，例如：
   - **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - **本地 MongoDB**: `mongodb://localhost:27017/mydatabase`
   - **带认证的连接**: `mongodb://username:password@host:port/database`

### 2. 测试连接

1. 在设置页面输入连接字符串后，点击 "测试连接"
2. 如果连接成功，会显示绿色的成功消息
3. 点击 "保存并继续" 进入主管理界面

### 3. 浏览数据库和集合

1. 在主界面左侧可以看到所有数据库列表
2. 点击数据库名称查看该数据库下的所有集合
3. 点击集合名称查看集合中的文档

### 4. 文档操作

#### 查看文档
- 选择数据库和集合后，右侧会显示文档表格
- 支持分页浏览，每页显示 10 个文档
- 所有字段会自动展示在表格中

#### 创建文档
1. 点击 "创建文档" 按钮
2. 在弹出的 JSON 编辑器中输入文档内容
3. 点击 "创建" 保存文档

#### 编辑文档
1. 点击文档行的 "编辑" 按钮
2. 在 JSON 编辑器中修改文档内容
3. 点击 "保存" 更新文档

#### 删除文档
- 点击文档行的 "删除" 按钮即可删除文档

## 技术架构

### 后端 (Hono)
- **路由**: `src/server/routers/mongodb-router.ts`
- **连接管理**: 使用连接池缓存 MongoDB 连接
- **API 端点**:
  - `testConnection`: 测试 MongoDB 连接
  - `getDatabases`: 获取数据库列表
  - `getCollections`: 获取集合列表
  - `getDocuments`: 获取文档列表（分页）
  - `createDocument`: 创建文档
  - `updateDocument`: 更新文档
  - `deleteDocument`: 删除文档
  - `getCollectionStats`: 获取集合统计信息

### 前端 (Next.js)
- **主页面**: `src/app/mongodb/page.tsx`
- **设置页面**: `src/app/mongodb/settings/page.tsx`
- **组件**:
  - `DatabaseExplorer`: 数据库和集合浏览器
  - `DocumentTable`: 文档表格和 CRUD 操作

### 状态管理
- 使用 TanStack Query 进行数据获取和缓存
- localStorage 存储连接字符串

## 安全注意事项

1. **连接字符串安全**: 连接字符串存储在浏览器的 localStorage 中，请确保在生产环境中使用 HTTPS
2. **身份验证**: 所有 API 都需要通过 Clerk 身份验证
3. **权限控制**: 建议为 MongoDB 用户设置适当的权限，避免使用管理员账户

## 支持的 MongoDB 版本

- MongoDB 3.6+
- MongoDB Atlas
- 本地 MongoDB 实例
- 副本集和分片集群

## 故障排除

### 连接失败
1. 检查连接字符串格式是否正确
2. 确认网络连接正常
3. 验证 MongoDB 服务是否运行
4. 检查用户名和密码是否正确

### 数据显示问题
1. 确认用户有读取权限
2. 检查集合是否存在数据
3. 查看浏览器控制台是否有错误信息

## 开发说明

如需修改或扩展功能，主要文件位置：

- 后端路由: `src/server/routers/mongodb-router.ts`
- 前端页面: `src/app/mongodb/`
- 组件: `src/app/mongodb/components/`

欢迎提交 Issue 和 Pull Request！ 