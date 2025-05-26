const { MongoClient } = require('mongodb');

async function testConnection() {
  // 替换为你的 MongoDB 连接字符串
  const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  console.log('测试 MongoDB 连接...');
  console.log('连接字符串:', connectionString.replace(/\/\/.*:.*@/, '//***:***@'));
  
  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeoutMS: 30000,
    waitQueueTimeoutMS: 5000,
    retryWrites: true,
    retryReads: true,
  });

  try {
    // 连接到 MongoDB
    await client.connect();
    console.log('✅ 连接成功');

    // 测试 ping
    await client.db().admin().ping();
    console.log('✅ Ping 成功');

    // 尝试获取数据库列表
    try {
      const adminDb = client.db().admin();
      const result = await adminDb.listDatabases();
      console.log('✅ 获取数据库列表成功:', result.databases.map(db => db.name));
    } catch (adminError) {
      console.warn('⚠️  无法访问 admin 数据库:', adminError.message);
      
      // 尝试从连接字符串获取数据库名
      const url = new URL(connectionString.replace('mongodb://', 'http://').replace('mongodb+srv://', 'https://'));
      const dbName = url.pathname.slice(1) || 'test';
      console.log('尝试连接到数据库:', dbName);
      
      const db = client.db(dbName);
      await db.admin().ping();
      console.log('✅ 连接到指定数据库成功');
      
      // 尝试获取集合列表
      const collections = await db.listCollections().toArray();
      console.log('✅ 获取集合列表成功:', collections.map(col => col.name));
    }

  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await client.close();
    console.log('连接已关闭');
  }
}

testConnection().catch(console.error); 