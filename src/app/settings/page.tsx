"use client";

import { createAuthClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { User as UserData } from "@/server/db/schema";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Database, Eye, EyeOff, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface AiConfig {
	apiKey: string;
	baseUrl: string;
	model: string;
}

export default function MongoDBSettingsPage() {
	const [connectionString, setConnectionString] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	// AI 配置状态
	const [aiConfig, setAiConfig] = useState<AiConfig>({
		apiKey: "",
		baseUrl: "",
		model: "gpt-4o-mini",
	});
	const [showAiApiKey, setShowAiApiKey] = useState(false);
	const [aiTestResult, setAiTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// 遮蔽连接字符串中的密码
	const maskConnectionString = (connStr: string): string => {
		if (!connStr) return "";
		
		// 匹配 mongodb:// 或 mongodb+srv:// 格式中的密码部分
		const mongodbRegex = /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@.+)$/;
		const match = connStr.match(mongodbRegex);
		
		if (match) {
			const [, protocol, username, password, hostAndDb] = match;
			const maskedPassword = "*".repeat(Math.min(password?.length || 0, 8));
			return `${protocol}${username}:${maskedPassword}${hostAndDb}`;
		}
		
		return connStr;
	};

	// 遮蔽API密钥
	const maskApiKey = (apiKey: string): string => {
		if (!apiKey) return "";
		if (apiKey.length <= 8) return "*".repeat(apiKey.length);
		return apiKey.slice(0, 4) + "*".repeat(Math.min(apiKey.length - 8, 20)) + apiKey.slice(-4);
	};

	// 获取显示用的连接字符串
	const displayConnectionString = showPassword ? connectionString : maskConnectionString(connectionString);
	const displayApiKey = showAiApiKey ? aiConfig.apiKey : maskApiKey(aiConfig.apiKey);

	// 同步用户信息
	const { mutate: syncUser } = useMutation({
		mutationFn: async () => {
			const res = await authClient.user.syncUser.$post();
			return await res.json();
		},
	});

	// 获取用户信息
	const { data: userData } = useQuery<UserData>({
		queryKey: ["user"],
		queryFn: async () => {
			const res = await authClient.user.getUser.$get();
			return await res.json();
		},
	});

	// 获取AI配置
	const { data: aiConfigData } = useQuery<AiConfig>({
		queryKey: ["ai-config"],
		queryFn: async () => {
			const res = await authClient.user.getAiConfig.$get();
			return await res.json();
		},
	});

	// 更新 MongoDB 连接字符串到数据库
	const { mutate: updateConnectionString } = useMutation({
		mutationFn: async (connStr: string) => {
			const res = await authClient.user.updateMongodbConnectionString.$post({
				connectionString: connStr,
			});
			return await res.json();
		},
	});

	// 更新AI配置
	const { mutate: updateAiConfig } = useMutation({
		mutationFn: async (config: AiConfig) => {
			const res = await authClient.user.updateAiConfig.$post({
				apiKey: config.apiKey,
				baseUrl: config.baseUrl,
				model: config.model,
			});
			return await res.json();
		},
		onSuccess: () => {
			setAiTestResult({
				success: true,
				message: "AI 配置已保存",
			});
		},
		onError: (error) => {
			setAiTestResult({
				success: false,
				message: `保存失败: ${error.message}`,
			});
		},
	});

	const { mutate: testConnection, isPending: isTesting } = useMutation({
		mutationFn: async (connStr: string) => {
			const res = await authClient.mongodb.testConnection.$post({
				connectionString: connStr,
			});
			return await res.json();
		},
		onSuccess: (result) => {
			setTestResult(result);
			if (result.success) {
				// 保存连接字符串到 localStorage
				if (typeof window !== "undefined") {
					localStorage.setItem("mongodb-connection-string", connectionString);
				}
				// 保存连接字符串到数据库
				updateConnectionString(connectionString);
			}
		},
		onError: (error) => {
			setTestResult({
				success: false,
				message: `测试失败: ${error.message}`,
			});
		},
	});

	const handleTestConnection = () => {
		if (!connectionString.trim()) {
			setTestResult({
				success: false,
				message: "请输入 MongoDB 连接字符串",
			});
			return;
		}
		testConnection(connectionString);
	};

	const handleSaveAiConfig = () => {
		if (!aiConfig.apiKey.trim()) {
			setAiTestResult({
				success: false,
				message: "请输入 API 密钥",
			});
			return;
		}
		updateAiConfig(aiConfig);
	};

	const handleSaveAndNavigate = () => {
		if (testResult?.success) {
			window.location.href = "/";
		}
	};

	// 初始化：同步用户信息并加载保存的连接字符串
	useEffect(() => {
		// 同步用户信息
		syncUser();

		// 从 localStorage 或数据库加载保存的连接字符串
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("mongodb-connection-string");
			if (saved) {
				setConnectionString(saved);
			} else if (userData?.mongodbConnectionString) {
				setConnectionString(userData.mongodbConnectionString);
				localStorage.setItem("mongodb-connection-string", userData.mongodbConnectionString);
			}
		}
	}, [syncUser, userData]);

	// 加载AI配置
	useEffect(() => {
		if (aiConfigData) {
			setAiConfig({
				apiKey: aiConfigData.apiKey || "",
				baseUrl: aiConfigData.baseUrl || "",
				model: aiConfigData.model || "gpt-4o-mini",
			});
		}
	}, [aiConfigData]);

	return (
		<main className="relative isolate flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
			<div className="-z-10 absolute inset-0 bg-[url('/noise.svg')] opacity-50 mix-blend-soft-light [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

			<div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
				<h1
					className={cn(
						"inline-flex flex-col gap-1 text-center tracking-tight transition",
						"font-display font-semibold text-4xl leading-none sm:text-5xl md:text-6xl lg:text-[4rem]",
						"bg-gradient-to-r from-20% bg-clip-text text-transparent",
						"from-white to-gray-50",
					)}
				>
					<span className="flex items-center gap-3">
						<Settings className="h-12 w-12" />
						系统设置
					</span>
				</h1>

				<p className="mb-8 text-pretty text-center text-[#ececf399] text-lg/7 sm:text-wrap sm:text-center md:text-xl/8">
					配置您的 MongoDB 连接和 AI 助手以开始使用数据库管理功能
				</p>

				<div className="w-full max-w-4xl space-y-8">
					{/* MongoDB 配置 */}
					<div className="rounded-md bg-black/15 px-8 py-6 text-zinc-100/75 backdrop-blur-lg">
						<div className="mb-6 flex items-center gap-3">
							<Database className="h-6 w-6 text-blue-400" />
							<h2 className="font-semibold text-xl text-zinc-200">MongoDB 数据库配置</h2>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<label
									htmlFor="connectionString"
									className="block font-medium text-sm text-zinc-200"
								>
									MongoDB 连接字符串
								</label>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="flex items-center gap-2 rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-300"
									title={showPassword ? "隐藏密码" : "显示密码"}
								>
									{showPassword ? (
										<>
											<EyeOff size={14} />
											隐藏
										</>
									) : (
										<>
											<Eye size={14} />
											显示
										</>
									)}
								</button>
							</div>
							<div className="relative">
								<textarea
									id="connectionString"
									placeholder="mongodb://username:password@host:port/database 或 mongodb+srv://..."
									value={displayConnectionString}
									onChange={(e) => {
										// 如果当前是遮蔽状态，用户输入时自动切换到显示状态
										if (!showPassword) {
											setShowPassword(true);
										}
										setConnectionString(e.target.value);
									}}
									onFocus={() => {
										// 聚焦时自动显示明文，方便编辑
										if (!showPassword) {
											setShowPassword(true);
										}
									}}
									rows={3}
									className="w-full resize-none rounded-md bg-black/50 px-4 py-3 text-base/6 text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none"
								/>
							</div>
							<p className="text-xs text-zinc-400">
								示例: mongodb+srv://user:password@cluster.mongodb.net/database
							</p>
						</div>

						<div className="mt-6 flex gap-4">
							<button
								type="button"
								onClick={handleTestConnection}
								disabled={isTesting || !connectionString.trim()}
								className="h-10 rounded-md bg-blue-600 px-6 py-2 font-medium text-base/6 text-white ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-blue-700 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isTesting ? "测试中..." : "测试连接"}
							</button>

							{testResult?.success && (
								<button
									type="button"
									onClick={handleSaveAndNavigate}
									className="h-10 rounded-md bg-green-600 px-6 py-2 font-medium text-base/6 text-white ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-green-700 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100"
								>
									保存并继续
								</button>
							)}
						</div>

						{testResult && (
							<div
								className={cn(
									"mt-4 rounded-md border p-4",
									testResult.success
										? "border-green-500/20 bg-green-500/10 text-green-300"
										: "border-red-500/20 bg-red-500/10 text-red-300",
								)}
							>
								<p className="text-sm">{testResult.message}</p>
							</div>
						)}
					</div>

					{/* AI 配置 */}
					<div className="rounded-md bg-black/15 px-8 py-6 text-zinc-100/75 backdrop-blur-lg">
						<div className="mb-6 flex items-center gap-3">
							<Bot className="h-6 w-6 text-purple-400" />
							<h2 className="font-semibold text-xl text-zinc-200">AI 助手配置</h2>
						</div>

						<div className="space-y-6">
							{/* API 密钥 */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<label htmlFor="aiApiKey" className="block font-medium text-sm text-zinc-200">
										API 密钥
									</label>
									<button
										type="button"
										onClick={() => setShowAiApiKey(!showAiApiKey)}
										className="flex items-center gap-2 rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-300"
										title={showAiApiKey ? "隐藏密钥" : "显示密钥"}
									>
										{showAiApiKey ? (
											<>
												<EyeOff size={14} />
												隐藏
											</>
										) : (
											<>
												<Eye size={14} />
												显示
											</>
										)}
									</button>
								</div>
								<input
									id="aiApiKey"
									type="text"
									placeholder="sk-..."
									value={displayApiKey}
									onChange={(e) => {
										if (!showAiApiKey) {
											setShowAiApiKey(true);
										}
										setAiConfig(prev => ({ ...prev, apiKey: e.target.value }));
									}}
									onFocus={() => {
										if (!showAiApiKey) {
											setShowAiApiKey(true);
										}
									}}
									className="w-full rounded-md bg-black/50 px-4 py-3 text-base/6 text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none"
								/>
								<p className="text-xs text-zinc-400">
									支持 OpenAI、Claude、或其他兼容 OpenAI API 的服务
								</p>
							</div>

							{/* 基础 URL */}
							<div className="space-y-2">
								<label htmlFor="aiBaseUrl" className="block font-medium text-sm text-zinc-200">
									基础 URL (可选)
								</label>
								<input
									id="aiBaseUrl"
									type="text"
									placeholder="https://api.openai.com/v1 (默认)"
									value={aiConfig.baseUrl}
									onChange={(e) => setAiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
									className="w-full rounded-md bg-black/50 px-4 py-3 text-base/6 text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none"
								/>
								<p className="text-xs text-zinc-400">
									如果使用第三方 API 服务，请填写对应的基础 URL
								</p>
							</div>

							{/* 模型选择 */}
							<div className="space-y-2">
								<label htmlFor="aiModel" className="block font-medium text-sm text-zinc-200">
									模型
								</label>
								<input
									id="aiModel"
									type="text"
									placeholder="gpt-4.1"
									value={aiConfig.model}
									onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
									className="w-full rounded-md bg-black/50 px-4 py-3 text-base/6 text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none"
								/>
								<p className="text-xs text-zinc-400">
									输入要使用的模型名称，例如: gpt-4.1、gpt-4o-mini 等
								</p>
							</div>
						</div>

						<div className="mt-6">
							<button
								type="button"
								onClick={handleSaveAiConfig}
								className="h-10 rounded-md bg-purple-600 px-6 py-2 font-medium text-base/6 text-white ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-purple-700 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100"
							>
								保存 AI 配置
							</button>
						</div>

						{aiTestResult && (
							<div
								className={cn(
									"mt-4 rounded-md border p-4",
									aiTestResult.success
										? "border-green-500/20 bg-green-500/10 text-green-300"
										: "border-red-500/20 bg-red-500/10 text-red-300",
								)}
							>
								<p className="text-sm">{aiTestResult.message}</p>
							</div>
						)}
					</div>

					{/* 格式说明 */}
					<div className="rounded-md bg-black/15 px-8 py-6 text-zinc-100/75 backdrop-blur-lg">
						<h3 className="mb-4 font-medium text-lg text-zinc-200">
							连接字符串格式说明
						</h3>
						<div className="space-y-3 text-sm text-zinc-400">
							<div>
								<strong className="text-zinc-300">标准格式:</strong>
								<code className="mt-1 block rounded bg-black/30 p-2 text-xs">
									mongodb://[username:password@]host[:port][/database]
								</code>
							</div>
							<div>
								<strong className="text-zinc-300">MongoDB Atlas (推荐):</strong>
								<code className="mt-1 block rounded bg-black/30 p-2 text-xs">
									mongodb+srv://username:password@cluster.mongodb.net/database
								</code>
							</div>
							<div>
								<strong className="text-zinc-300">本地开发:</strong>
								<code className="mt-1 block rounded bg-black/30 p-2 text-xs">
									mongodb://localhost:27017/mydatabase
								</code>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
