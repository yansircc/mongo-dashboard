import { MongoClient, ObjectId } from "mongodb";
import { z } from "zod";
import { j, privateProcedure } from "../jstack";

// MongoDB 连接缓存 - 使用 WeakMap 避免内存泄漏
const connectionCache = new Map<string, MongoClient>();

// 禁用定期清理，因为在 Workers 环境中 setInterval 可能导致问题

// 获取或创建 MongoDB 连接
async function getMongoConnection(connectionString: string) {
	// 为每个请求创建新连接，避免跨请求问题
	console.log("创建 MongoDB 连接...");
	
	// 设置更保守的连接选项
	const client = new MongoClient(connectionString, {
		serverSelectionTimeoutMS: 5000, // 减少超时时间
		connectTimeoutMS: 5000,
		socketTimeoutMS: 5000,
		maxPoolSize: 1, // 减少连接池大小
		minPoolSize: 0,
		maxIdleTimeMS: 10000,
		waitQueueTimeoutMS: 2500,
		retryWrites: false, // 在 Workers 环境中禁用重试
		retryReads: false,
		directConnection: true, // 直接连接，避免复杂的拓扑发现
		monitorCommands: false, // 禁用命令监控
		heartbeatFrequencyMS: 30000, // 减少心跳频率
	});
	
	// 设置最大监听器数量，避免内存泄漏警告
	client.setMaxListeners(50);
	
	try {
		await client.connect();
		console.log("连接创建成功");
		return client;
	} catch (connectError) {
		console.error("连接失败:", connectError);
		// 确保连接被正确关闭
		try {
			await client.close(true);
		} catch {}
		throw connectError;
	}
}

// 安全关闭连接的辅助函数
async function safeCloseConnection(client: MongoClient) {
	try {
		await client.close(true);
	} catch (error) {
		console.warn("关闭连接时出错:", error);
	}
}

export const mongodbRouter = j.router({
	// 测试连接
	testConnection: privateProcedure
		.input(z.object({ connectionString: z.string() }))
		.mutation(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				await client.db().admin().ping();
				return c.superjson({ success: true, message: "连接成功" });
			} catch (error) {
				return c.superjson({
					success: false,
					message: `连接失败: ${error instanceof Error ? error.message : "未知错误"}`,
				});
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 获取所有数据库
	getDatabases: privateProcedure
		.input(z.object({ connectionString: z.string() }))
		.query(async ({ c, input }) => {
			console.log("开始获取数据库列表...");
			let client: MongoClient | null = null;
			
			try {
				client = await getMongoConnection(input.connectionString);
				console.log("MongoDB 连接成功");
				
				// 首先尝试使用 admin 数据库的 listDatabases
				try {
					console.log("尝试获取 admin 数据库权限...");
					const adminDb = client.db().admin();
					const result = await adminDb.listDatabases();
					
					// 过滤掉系统默认数据库
					const filteredDatabases = (result.databases || []).filter(
						db => !['admin', 'config', 'local'].includes(db.name)
					);
					
					console.log("成功获取数据库列表:", filteredDatabases.length, "个数据库（已过滤系统数据库）");
					return c.superjson(filteredDatabases);
				} catch (adminError) {
					// 如果没有 admin 权限，尝试列出当前连接字符串中指定的数据库
					console.warn("无法访问 admin 数据库，尝试获取当前数据库:", adminError);
					
					// 从连接字符串中提取数据库名
					let dbName = 'test'; // 默认数据库名
					try {
						const url = new URL(input.connectionString.replace('mongodb://', 'http://').replace('mongodb+srv://', 'https://'));
						dbName = url.pathname.slice(1) || 'test';
					} catch (urlError) {
						console.warn("无法解析连接字符串中的数据库名，使用默认值:", urlError);
					}
					
					console.log("尝试连接到数据库:", dbName);
					
					// 尝试连接到指定的数据库
					const db = client.db(dbName);
					await db.admin().ping();
					
					console.log("成功连接到数据库:", dbName);
					
					// 检查是否为系统数据库，如果是则不返回
					if (['admin', 'config', 'local'].includes(dbName)) {
						console.log("当前数据库为系统数据库，不返回");
						return c.superjson([]);
					}
					
					// 返回当前数据库信息
					return c.superjson([{
						name: dbName,
						sizeOnDisk: 0,
						empty: false
					}]);
				}
			} catch (error) {
				console.error("获取数据库列表失败:", error);
				console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息");
				throw new Error(
					`获取数据库列表失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 获取指定数据库的所有集合
	getCollections: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
			}),
		)
		.query(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collections = await db.listCollections().toArray();
				return c.superjson(collections);
			} catch (error) {
				console.error("获取集合列表失败:", error);
				throw new Error(
					`获取集合列表失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 获取集合中的文档（分页）
	getDocuments: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
				collectionName: z.string(),
				page: z.number().default(1),
				limit: z.number().default(20),
				filter: z.record(z.any()).optional(),
				query: z.string().optional(), // 新增：JSON 查询字符串
			}),
		)
		.query(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collection = db.collection(input.collectionName);

				const skip = (input.page - 1) * input.limit;
				let filter = input.filter || {};

				// 如果提供了 JSON 查询字符串，解析并使用它
				if (input.query && input.query.trim()) {
					try {
						const parsedQuery = JSON.parse(input.query);
						filter = { ...filter, ...parsedQuery };
					} catch (parseError) {
						throw new Error(`查询 JSON 格式错误: ${parseError instanceof Error ? parseError.message : "无效的 JSON"}`);
					}
				}

				const [documents, total] = await Promise.all([
					collection.find(filter).skip(skip).limit(input.limit).toArray(),
					collection.countDocuments(filter),
				]);

				return c.superjson({
					documents,
					total,
					page: input.page,
					limit: input.limit,
					totalPages: Math.ceil(total / input.limit),
					appliedFilter: filter, // 返回实际应用的过滤器，便于调试
				});
			} catch (error) {
				throw new Error(
					`获取文档失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 创建文档
	createDocument: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
				collectionName: z.string(),
				document: z.record(z.any()),
			}),
		)
		.mutation(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collection = db.collection(input.collectionName);

				const result = await collection.insertOne(input.document);
				return c.superjson({
					success: true,
					insertedId: result.insertedId,
					message: "文档创建成功",
				});
			} catch (error) {
				throw new Error(
					`创建文档失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 更新文档
	updateDocument: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
				collectionName: z.string(),
				documentId: z.string(),
				document: z.record(z.any()),
			}),
		)
		.mutation(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collection = db.collection(input.collectionName);

				const { _id, ...updateDoc } = input.document;
				const result = await collection.updateOne(
					{ _id: new ObjectId(input.documentId) },
					{ $set: updateDoc },
				);

				return c.superjson({
					success: true,
					modifiedCount: result.modifiedCount,
					message:
						result.modifiedCount > 0 ? "文档更新成功" : "未找到要更新的文档",
				});
			} catch (error) {
				throw new Error(
					`更新文档失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 删除文档
	deleteDocument: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
				collectionName: z.string(),
				documentId: z.string(),
			}),
		)
		.mutation(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collection = db.collection(input.collectionName);

				const result = await collection.deleteOne({
					_id: new ObjectId(input.documentId),
				});

				return c.superjson({
					success: true,
					deletedCount: result.deletedCount,
					message:
						result.deletedCount > 0 ? "文档删除成功" : "未找到要删除的文档",
				});
			} catch (error) {
				throw new Error(
					`删除文档失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),

	// 获取集合统计信息
	getCollectionStats: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
				databaseName: z.string(),
				collectionName: z.string(),
			}),
		)
		.query(async ({ c, input }) => {
			let client: MongoClient | null = null;
			try {
				client = await getMongoConnection(input.connectionString);
				const db = client.db(input.databaseName);
				const collection = db.collection(input.collectionName);

				const [count, indexes] = await Promise.all([
					collection.countDocuments(),
					collection.indexes(),
				]);

				return c.superjson({
					documentCount: count,
					indexes: indexes,
				});
			} catch (error) {
				throw new Error(
					`获取集合统计失败: ${error instanceof Error ? error.message : "未知错误"}`,
				);
			} finally {
				if (client) {
					await safeCloseConnection(client);
				}
			}
		}),
});
