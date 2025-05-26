"use client";

import { useState } from "react";

interface CreateDocumentFormProps {
	isVisible: boolean;
	isCreating: boolean;
	onClose: () => void;
	onCreate: (document: Record<string, unknown>) => void;
}

export function CreateDocumentForm({
	isVisible,
	isCreating,
	onClose,
	onCreate,
}: CreateDocumentFormProps) {
	const [newDocJson, setNewDocJson] = useState("{\n  \n}");

	const handleCreate = () => {
		try {
			const parsedDoc = JSON.parse(newDocJson);
			onCreate(parsedDoc);
			setNewDocJson("{\n  \n}");
		} catch (error) {
			alert("JSON 格式错误");
		}
	};

	if (!isVisible) return null;

	return (
		<div className="rounded-md bg-black/30 p-4">
			<h3 className="mb-3 font-medium text-lg text-zinc-200">创建新文档</h3>
			<textarea
				value={newDocJson}
				onChange={(e) => setNewDocJson(e.target.value)}
				rows={8}
				className="w-full rounded border border-zinc-700 bg-black/50 p-3 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
				placeholder="输入 JSON 格式的文档..."
			/>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={handleCreate}
					disabled={isCreating}
					className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{isCreating ? "创建中..." : "创建"}
				</button>
				<button
					type="button"
					onClick={onClose}
					className="rounded bg-zinc-600 px-4 py-2 text-sm text-white transition hover:bg-zinc-700"
				>
					取消
				</button>
			</div>
		</div>
	);
} 