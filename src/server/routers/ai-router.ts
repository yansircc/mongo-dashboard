import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { j, privateProcedure } from "../jstack";

export const aiRouter = j.router({
	// 生成 MongoDB 查询语句
	generateMongoQuery: privateProcedure
		.input(
			z.object({
				apiKey: z.string(),
				baseUrl: z.string().optional(),
				model: z.string().optional().default("gpt-4.1"),
				userQuery: z.string().describe("用户的自然语言查询描述"),
				collectionSchema: z.string().optional().describe("集合的字段结构信息"),
			}),
		)
		.mutation(async ({ ctx, c, input }) => {
			const openai = createOpenAI({
				apiKey: input.apiKey,
				baseURL: input.baseUrl,
			});

			const { userQuery, collectionSchema } = input;

			// 构建系统提示
			const systemPrompt = `你是一个专业的 MongoDB 查询语句生成器。请根据用户的自然语言描述生成准确的 MongoDB 查询 JSON。

规则：
1. 只返回有效的 MongoDB 查询 JSON，不要包含任何解释
2. 如果用户查询不明确，返回空对象 {}
3. 使用正确的 MongoDB 操作符，如 $gt, $lt, $in, $regex, $and, $or 等
4. 对于文本搜索，优先使用 $regex 进行模糊匹配
5. 对于数值比较，使用适当的比较操作符
6. 对于日期查询，使用 ISODate 格式或时间戳

${collectionSchema ? `集合字段结构参考：\n${collectionSchema}` : ''}

示例：
- "查找年龄大于18的用户" → {"age": {"$gt": 18}}
- "查找名字包含张的用户" → {"name": {"$regex": "张", "$options": "i"}}
- "查找状态为活跃或待审核的用户" → {"status": {"$in": ["active", "pending"]}}`;

			try {
				const { object } = await generateObject({
					model: openai(input.model),
					schema: z.object({
						query: z.string().describe("MongoDB 查询 JSON 字符串"),
						explanation: z.string().describe("查询语句的简单解释"),
					}),
					messages: [
						{
							role: "user",
							content: userQuery,
						},
					],
					system: systemPrompt,
				});

				// 验证生成的查询是否为有效 JSON
				try {
					JSON.parse(object.query);
				} catch (parseError) {
					throw new HTTPException(400, {
						message: "生成的查询语句不是有效的 JSON 格式",
					});
				}

				return c.superjson({
					query: object.query,
					explanation: object.explanation,
				});
			} catch (error) {
				console.error("AI 生成查询失败:", error);
				throw new HTTPException(500, {
					message: "AI 生成查询失败，请检查 API 配置或稍后重试",
				});
			}
		}),

	// 通用 AI 生成功能（保留原有功能）
	generate: privateProcedure
		.input(
			z.object({
				apiKey: z.string(),
				baseUrl: z.string().optional(),
				model: z.string().optional().default("gpt-4.1"),
				messages: z.array(
					z.object({
						role: z.enum(["user", "assistant"]),
						content: z.string(),
					}),
				),
				system: z.string().optional(),
			}),
		)
		.query(async ({ ctx, c, input }) => {
			const openai = createOpenAI({
				apiKey: input.apiKey,
				baseURL: input.baseUrl,
			});

			const { messages, system } = input;

			try {
				const { object } = await generateObject({
					model: openai(input.model),
					schema: z.object({
						query: z.string().describe("生成的内容"),
					}),
					messages,
					...(system && { system }),
				});

				return c.superjson(object);
			} catch (error) {
				console.error("AI 生成失败:", error);
				throw new HTTPException(500, {
					message: "AI 生成失败",
				});
			}
		}),
});
