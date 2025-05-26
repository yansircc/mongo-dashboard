import type { DocumentsData } from "./types";

interface ToolbarProps {
	onCreateDocument: () => void;
	onShowQuery: () => void;
	onClearQuery: () => void;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	showCreateForm: boolean;
	showQueryForm: boolean;
	appliedQuery: string;
	documentsData?: DocumentsData;
	currentPage: number;
}

export function Toolbar({
	onCreateDocument,
	onShowQuery,
	onClearQuery,
	globalFilter,
	onGlobalFilterChange,
	showCreateForm,
	showQueryForm,
	appliedQuery,
	documentsData,
	currentPage,
}: ToolbarProps) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={onCreateDocument}
					className="rounded-md bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700"
				>
					{showCreateForm ? "取消创建" : "创建文档"}
				</button>

				<button
					type="button"
					onClick={onShowQuery}
					className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
				>
					{showQueryForm ? "取消查询" : "查询文档"}
				</button>

				{appliedQuery && appliedQuery !== "{}" && (
					<button
						type="button"
						onClick={onClearQuery}
						className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white transition hover:bg-orange-700"
					>
						清除查询
					</button>
				)}

				{/* 全局搜索 */}
				<input
					value={globalFilter ?? ""}
					onChange={(e) => onGlobalFilterChange(e.target.value)}
					placeholder="搜索所有字段..."
					className="rounded border border-zinc-700 bg-black/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
				/>
			</div>

			{documentsData && (
				<div className="text-sm text-zinc-400">
					第 {currentPage} 页，共 {documentsData.totalPages} 页
					{appliedQuery && appliedQuery !== "{}" && (
						<span className="ml-2 text-blue-400">
							(已应用查询过滤器)
						</span>
					)}
				</div>
			)}
		</div>
	);
} 