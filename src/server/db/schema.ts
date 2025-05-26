import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTableCreator,
	text,
} from "drizzle-orm/sqlite-core";

const sqliteTable = sqliteTableCreator((name) => `${name}_table`);

// 定义用户表
export const users = sqliteTable(
	"users",
	{
		id: text("id").primaryKey(), // 使用 Clerk 的用户 ID
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		avatar: text("avatar"),
		role: text("role").default("user"),
		permissions: text("permissions"),
		mongodbConnectionString: text("mongodbConnectionString"), // 存储用户的 MongoDB 连接字符串
		// AI 配置
		aiApiKey: text("aiApiKey"), // AI API 密钥
		aiBaseUrl: text("aiBaseUrl"), // AI API 基础 URL
		aiModel: text("aiModel").default("gpt-4.1"), // AI 模型
		createdAt: integer("createdAt", { mode: "timestamp" })
			.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
			.notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("User_email_idx").on(table.email),
		index("User_id_idx").on(table.id),
	],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;