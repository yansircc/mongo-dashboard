"use client";

import { Edit3, Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface EditableCellProps {
	getValue: () => any;
	row: any;
	column: any;
	table: any;
}

export function EditableCell({
	getValue,
	row,
	column,
	table,
}: EditableCellProps) {
	const initialValue = getValue();
	const [value, setValue] = useState(initialValue);
	const [showFullContent, setShowFullContent] = useState(false);
	const cellId = `${row.id}-${column.id}`;
	const isEditing = table.options.meta?.editingCell === cellId;

	// 同步外部数据变化
	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	const handleSave = () => {
		table.options.meta?.updateData(row.index, column.id, value);
		table.options.meta?.setEditingCell(null);
	};

	const handleCancel = () => {
		setValue(initialValue);
		table.options.meta?.setEditingCell(null);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	const renderValue = (val: any): string => {
		if (val === null) return "null";
		if (val === undefined) return "undefined";
		if (typeof val === "object") {
			// 对于显示模式，使用紧凑的JSON格式（无缩进）
			return JSON.stringify(val);
		}
		return String(val);
	};

	const renderFullValue = (val: any): string => {
		if (val === null) return "null";
		if (val === undefined) return "undefined";
		if (typeof val === "object") {
			// 对于完整内容显示，使用格式化的JSON
			return JSON.stringify(val, null, 2);
		}
		return String(val);
	};

	if (isEditing) {
		// 对于复杂对象，使用 textarea
		if (typeof initialValue === "object" && initialValue !== null) {
			return (
				<div className="relative min-w-[300px]">
					<textarea
						value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
						onChange={(e) => {
							try {
								const parsed = JSON.parse(e.target.value);
								setValue(parsed);
							} catch {
								setValue(e.target.value);
							}
						}}
						onKeyDown={handleKeyDown}
						className="min-h-[120px] w-full resize-y rounded border border-blue-500 bg-black/50 p-2 font-mono text-sm text-zinc-100 focus:border-blue-400 focus:outline-none"
					/>
					<div className="mt-2 flex justify-start gap-2">
						<button
							type="button"
							onClick={handleSave}
							className="flex-shrink-0 rounded bg-green-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-green-700"
						>
							保存
						</button>
						<button
							type="button"
							onClick={handleCancel}
							className="flex-shrink-0 rounded bg-gray-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-gray-700"
						>
							取消
						</button>
					</div>
				</div>
			);
		}

		// 对于简单值，使用 input
		return (
			<div className="relative min-w-[200px]">
				<input
					type="text"
					value={String(value)}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					className="w-full rounded border border-blue-500 bg-black/50 p-2 text-sm text-zinc-100 focus:border-blue-400 focus:outline-none"
				/>
				<div className="mt-2 flex justify-start gap-2">
					<button
						type="button"
						onClick={handleSave}
						className="flex-shrink-0 rounded bg-green-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-green-700"
					>
						保存
					</button>
					<button
						type="button"
						onClick={handleCancel}
						className="flex-shrink-0 rounded bg-gray-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-gray-700"
					>
						取消
					</button>
				</div>
			</div>
		);
	}

	// 显示完整内容的模态框
	if (showFullContent) {
		const displayValue = renderFullValue(initialValue);
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowFullContent(false)} onKeyDown={(e) => e.key === "Escape" && setShowFullContent(false)}>
				<div className="max-h-[80vh] max-w-[80vw] overflow-auto rounded-lg bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === "Escape" && setShowFullContent(false)}>
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-medium text-lg text-zinc-200">完整内容</h3>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => {
									setShowFullContent(false);
									table.options.meta?.setEditingCell(cellId);
								}}
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700"
							>
								编辑
							</button>
							<button
								type="button"
								onClick={() => setShowFullContent(false)}
								className="rounded bg-zinc-600 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700"
							>
								关闭
							</button>
						</div>
					</div>
					<pre className="whitespace-pre-wrap rounded bg-black/50 p-4 font-mono text-sm text-zinc-100">
						{displayValue}
					</pre>
				</div>
			</div>
		);
	}

	// 显示模式
	const displayValue = renderValue(initialValue);
	// 限制显示字符数为50个字符
	const maxDisplayLength = 50;
	const isLongContent = displayValue.length > maxDisplayLength;
	const truncatedValue = isLongContent ? displayValue.slice(0, maxDisplayLength) + "..." : displayValue;
	
	// 检查是否需要显示小眼睛图标：
	// 1. 原始内容超过50个字符
	// 2. 或者截断后的内容在当前容器宽度下会被CSS省略号截断
	const shouldShowEyeIcon = isLongContent || truncatedValue.length > 30; // 30个字符大约是容器宽度的临界点
	
	return (
		<div className="group relative w-full min-w-[120px] max-w-[300px]">
			<div className="rounded p-2 text-zinc-300">
				<div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm leading-tight">
					{truncatedValue}
				</div>
				
				{/* 操作按钮 - 只在hover时显示 */}
				<div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
					{shouldShowEyeIcon && (
						<button
							type="button"
							onClick={() => setShowFullContent(true)}
							className="flex h-6 w-6 items-center justify-center rounded bg-zinc-700/80 text-zinc-300 transition-colors hover:bg-zinc-600 hover:text-zinc-100"
							title={`查看完整内容 (${displayValue.length} 字符)`}
						>
							<Eye size={12} />
						</button>
					)}
					<button
						type="button"
						onClick={() => table.options.meta?.setEditingCell(cellId)}
						className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/80 text-blue-200 transition-colors hover:bg-blue-500 hover:text-white"
						title="编辑"
					>
						<Edit3 size={12} />
					</button>
				</div>
			</div>
		</div>
	);
} 