# MongoDB 连接问题调试指南

## 问题描述
- 测试连接成功
- 但无法获取数据库和集合列表
- 出现 "hanging Promise" 错误
- EventEmitter 内存泄漏警告
- 跨请求 Promise 解析警告

## 可能的原因

### 1. 权限问题
MongoDB 用户可能没有 `listDatabases` 权限。这是最常见的问题。

**解决方案:**
- 确保 MongoDB 用户有 `readAnyDatabase` 或 `dbAdmin` 权限
- 或者在连接字符串中指定具体的数据库名

### 2. 网络超时
在 Cloudflare Workers 或 Edge Runtime 环境中，长时间运行的操作可能被终止。

**解决方案:**
- 添加超时控制
- 使用更短的超时时间
- 实现重试机制

### 3. 连接池问题
MongoDB 连接池配置可能不适合当前环境。

**解决方案:**
- 调整连接池大小
- 设置合适的超时参数
- 实现连接清理机制

## 调试步骤

### 1. 检查 MongoDB 用户权限
```javascript
// 在 MongoDB shell 中执行
db.runCommand({connectionStatus: 1})
```

### 2. 测试基本连接
```javascript
// 使用我们的测试脚本
node test-mongodb.js
```

### 3. 检查连接字符串格式
确保连接字符串包含数据库名：
```
mongodb://username:password@host:port/database_name
mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### 4. 查看服务器日志
检查开发服务器的控制台输出，查看详细的错误信息。

## 已实现的解决方案

### 1. 移除连接缓存
- **问题**: 在 Cloudflare Workers 环境中，连接缓存会导致跨请求 Promise 问题
- **解决**: 每个请求创建新连接，请求结束后立即关闭

### 2. 优化连接参数
```javascript
{
  serverSelectionTimeoutMS: 5000,  // 减少超时时间
  connectTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  maxPoolSize: 1,                  // 减少连接池大小
  minPoolSize: 0,
  retryWrites: false,               // 禁用重试
  retryReads: false,
  directConnection: true,           // 直接连接
  monitorCommands: false,           // 禁用监控
  heartbeatFrequencyMS: 30000,     // 减少心跳频率
}
```

### 3. 修复 EventEmitter 内存泄漏
- 设置 `client.setMaxListeners(50)` 避免警告
- 确保每个请求后关闭连接

### 4. 添加安全关闭函数
```javascript
async function safeCloseConnection(client: MongoClient) {
  try {
    await client.close(true);
  } catch (error) {
    console.warn("关闭连接时出错:", error);
  }
}
```

### 5. 使用 try-finally 模式
- 确保连接在所有情况下都被正确关闭
- 避免连接泄漏

## 下一步

如果问题仍然存在，可以尝试：

1. 使用不同的 MongoDB 连接字符串
2. 检查 MongoDB 服务器的配置
3. 尝试使用 MongoDB Atlas 而不是本地 MongoDB
4. 检查防火墙和网络设置 