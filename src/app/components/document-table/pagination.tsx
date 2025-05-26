import type { DocumentsData } from "./types";

interface PaginationProps {
	documentsData: DocumentsData;
	currentPage: number;
	onPageChange: (page: number) => void;
}

export function Pagination({
	documentsData,
	currentPage,
	onPageChange,
}: PaginationProps) {
	if (documentsData.totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onPageChange(1)}
					disabled={currentPage === 1}
					className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-50"
				>
					首页
				</button>
				<button
					type="button"
					onClick={() => onPageChange(Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-50"
				>
					上一页
				</button>
				<span className="px-3 py-1 text-sm text-zinc-400">
					{currentPage} / {documentsData.totalPages}
				</span>
				<button
					type="button"
					onClick={() =>
						onPageChange(Math.min(documentsData.totalPages, currentPage + 1))
					}
					disabled={currentPage === documentsData.totalPages}
					className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-50"
				>
					下一页
				</button>
				<button
					type="button"
					onClick={() => onPageChange(documentsData.totalPages)}
					disabled={currentPage === documentsData.totalPages}
					className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-50"
				>
					末页
				</button>
			</div>

			<div className="text-sm text-zinc-400">
				共 {documentsData.total} 条记录
			</div>
		</div>
	);
} 