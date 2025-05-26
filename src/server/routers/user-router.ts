import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../db/schema";
import { j, privateProcedure } from "../jstack";

export const userRouter = j.router({
	// 同步用户信息
	syncUser: privateProcedure.mutation(async ({ c, ctx }) => {
		const { user, db } = ctx;
		
		try {
			// 检查用户是否已存在
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.id, user.id))
				.get();

			if (existingUser) {
				// 更新现有用户信息
				await db
					.update(users)
					.set({
						name: user.name,
						email: user.email,
						avatar: user.avatar,
						role: user.role,
						permissions: user.permissions,
						updatedAt: new Date(),
					})
					.where(eq(users.id, user.id))
					.run();
			} else {
				// 创建新用户
				await db
					.insert(users)
					.values({
						id: user.id,
						name: user.name,
						email: user.email,
						avatar: user.avatar,
						role: user.role,
						permissions: user.permissions,
					})
					.run();
			}

			return c.json({ success: true, message: "用户信息同步成功" });
		} catch (error) {
			console.error("同步用户信息失败:", error);
			throw new Error("同步用户信息失败");
		}
	}),

	// 获取用户信息
	getUser: privateProcedure.query(async ({ c, ctx }) => {
		const { user, db } = ctx;

		const dbUser = await db
			.select()
			.from(users)
			.where(eq(users.id, user.id))
			.get();

		return c.json(dbUser);
	}),

	// 更新 MongoDB 连接字符串
	updateMongodbConnectionString: privateProcedure
		.input(
			z.object({
				connectionString: z.string(),
			}),
		)
		.mutation(async ({ c, ctx, input }) => {
			const { user, db } = ctx;

			await db
				.update(users)
				.set({
					mongodbConnectionString: input.connectionString,
					updatedAt: new Date(),
				})
				.where(eq(users.id, user.id))
				.run();

			return c.json({ success: true, message: "MongoDB 连接字符串已更新" });
		}),

	// 更新 AI 配置
	updateAiConfig: privateProcedure
		.input(
			z.object({
				apiKey: z.string().optional(),
				baseUrl: z.string().optional(),
				model: z.string().optional(),
			}),
		)
		.mutation(async ({ c, ctx, input }) => {
			const { user, db } = ctx;

			const updateData: any = {
				updatedAt: new Date(),
			};

			if (input.apiKey !== undefined) {
				updateData.aiApiKey = input.apiKey;
			}
			if (input.baseUrl !== undefined) {
				updateData.aiBaseUrl = input.baseUrl;
			}
			if (input.model !== undefined) {
				updateData.aiModel = input.model;
			}

			await db
				.update(users)
				.set(updateData)
				.where(eq(users.id, user.id))
				.run();

			return c.json({ success: true, message: "AI 配置已更新" });
		}),

	// 获取 AI 配置
	getAiConfig: privateProcedure.query(async ({ c, ctx }) => {
		const { user, db } = ctx;

		const dbUser = await db
			.select({
				aiApiKey: users.aiApiKey,
				aiBaseUrl: users.aiBaseUrl,
				aiModel: users.aiModel,
			})
			.from(users)
			.where(eq(users.id, user.id))
			.get();

		return c.json({
			apiKey: dbUser?.aiApiKey || "",
			baseUrl: dbUser?.aiBaseUrl || "",
			model: dbUser?.aiModel || "gpt-4o-mini",
		});
	}),
}); 