"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiConfig } from "./types";

interface QueryFormProps {
	isVisible: boolean;
	appliedQuery: string;
	onApplyQuery: (query: string) => void;
	onClose: () => void;
	// AI 相关 props
	aiConfig?: AiConfig;
	onGenerateAiQuery: (userQuery: string) => void;
	isAiLoading: boolean;
	generatedQuery?: string; // AI 生成的查询结果
	onGeneratedQueryUsed?: () => void; // 通知父组件查询已被使用
}

export function QueryForm({
	isVisible,
	appliedQuery,
	onApplyQuery,
	onClose,
	aiConfig,
	onGenerateAiQuery,
	isAiLoading,
	generatedQuery,
	onGeneratedQueryUsed,
}: QueryFormProps) {
	const [queryJson, setQueryJson] = useState("{}");
	const [aiQuery, setAiQuery] = useState("");
	const [showAiInput, setShowAiInput] = useState(false);

	// 当 AI 生成查询后，自动填充到输入框
	useEffect(() => {
		if (generatedQuery) {
			setQueryJson(generatedQuery);
			setShowAiInput(false);
			setAiQuery("");
			// 通知父组件查询已被使用
			onGeneratedQueryUsed?.();
		}
	}, [generatedQuery, onGeneratedQueryUsed]);

	const handleApplyQuery = () => {
		try {
			// 验证 JSON 格式
			JSON.parse(queryJson);
			onApplyQuery(queryJson);
		} catch (error) {
			alert("JSON 格式错误，请检查查询语句");
		}
	};

	const handleAiGenerate = () => {
		if (!aiQuery.trim()) {
			alert("请输入查询描述");
			return;
		}
		
		// 检查是否配置了 AI
		if (!aiConfig?.apiKey) {
			// 跳转到设置页面
			window.location.href = '/settings';
			return;
		}
		
		onGenerateAiQuery(aiQuery);
	};

	if (!isVisible) return null;

	return (
		<div className="rounded-md bg-black/30 p-4">
			<h3 className="mb-3 font-medium text-lg text-zinc-200">MongoDB 查询</h3>
			<p className="mb-3 text-sm text-zinc-400">
				输入 MongoDB 查询 JSON，例如: {`{"name": "张三"}`}、{`{"age": {"$gt": 18}}`}、{`{"status": {"$in": ["active", "pending"]}}`}
			</p>
			
			{/* MongoDB 查询输入框 */}
			<textarea
				value={queryJson}
				onChange={(e) => setQueryJson(e.target.value)}
				rows={6}
				className="w-full rounded border border-zinc-700 bg-black/50 p-3 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
				placeholder="输入 MongoDB 查询 JSON..."
			/>

			{/* AI 辅助按钮 */}
			<div className="mt-2 flex items-center gap-2">
				<button
					type="button"
					onClick={() => setShowAiInput(!showAiInput)}
					className="flex items-center gap-2 rounded bg-purple-600/20 px-3 py-1.5 text-purple-300 text-sm transition hover:bg-purple-600/30"
				>
					<span>🤖</span>
					{showAiInput ? "收起 AI 助手" : "AI 帮写查询"}
				</button>
				{!aiConfig?.apiKey && (
					<div className="flex items-center gap-2">
						<span className="text-orange-400 text-xs">
							需要先配置 AI
						</span>
						<button
							type="button"
							onClick={() => {
								window.location.href = '/settings';
							}}
							className="flex items-center gap-1 rounded bg-orange-600/20 px-2 py-1 text-orange-300 text-xs transition hover:bg-orange-600/30"
						>
							<Settings size={12} />
							去设置
						</button>
					</div>
				)}
			</div>

			{/* AI 查询输入框 */}
			{showAiInput && (
				<div className="mt-3 rounded border border-purple-500/20 bg-purple-500/5 p-3">
					<p className="mb-2 text-purple-300 text-sm">
						用自然语言描述你想要查询的数据，AI 会帮你生成 MongoDB 查询语句
					</p>
					<textarea
						value={aiQuery}
						onChange={(e) => setAiQuery(e.target.value)}
						rows={3}
						className="w-full rounded border border-purple-500/30 bg-black/50 p-2 text-sm text-zinc-100 focus:border-purple-400 focus:outline-none"
						placeholder="例如：查找年龄大于25岁的用户、查找名字包含张的记录、查找状态为活跃的数据..."
					/>
					<div className="mt-2 flex gap-2">
						<button
							type="button"
							onClick={handleAiGenerate}
							disabled={isAiLoading || !aiConfig?.apiKey}
							className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white transition hover:bg-purple-700 disabled:opacity-50"
						>
							{isAiLoading ? "AI 生成中..." : "生成查询"}
						</button>
						<button
							type="button"
							onClick={() => {
								setShowAiInput(false);
								setAiQuery("");
							}}
							className="rounded bg-zinc-600 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700"
						>
							取消
						</button>
					</div>
				</div>
			)}

			{/* 主要操作按钮 */}
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={handleApplyQuery}
					className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
				>
					应用查询
				</button>
				<button
					type="button"
					onClick={onClose}
					className="rounded bg-zinc-600 px-4 py-2 text-sm text-white transition hover:bg-zinc-700"
				>
					取消
				</button>
				<button
					type="button"
					onClick={() => setQueryJson("{}")}
					className="rounded bg-orange-600 px-4 py-2 text-sm text-white transition hover:bg-orange-700"
				>
					重置
				</button>
			</div>

			{/* 当前应用的查询显示 */}
			{appliedQuery && appliedQuery !== "{}" && (
				<div className="mt-3 rounded border border-blue-500/20 bg-blue-500/10 p-3">
					<p className="mb-1 text-blue-300 text-sm">当前应用的查询:</p>
					<code className="font-mono text-blue-200 text-xs">{appliedQuery}</code>
				</div>
			)}
		</div>
	);
} 