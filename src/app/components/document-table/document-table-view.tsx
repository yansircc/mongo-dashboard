"use client";

import { type Table, flexRender } from "@tanstack/react-table";
import { ArrowDown01, ArrowDownAZ, ArrowUp01, ArrowUpAZ } from "lucide-react";
import type { MongoDocument } from "./types";

interface DocumentTableViewProps {
	table: Table<MongoDocument>;
	documents: MongoDocument[];
	appliedQuery: string;
}

// 检测列的数据类型
function getColumnDataType(documents: MongoDocument[], columnId: string): 'number' | 'string' {
	if (documents.length === 0) return 'string';
	
	// 检查前几行数据来判断类型
	const sampleSize = Math.min(5, documents.length);
	let numberCount = 0;
	
	for (let i = 0; i < sampleSize; i++) {
		const value = documents[i]?.[columnId];
		if (typeof value === 'number' || (typeof value === 'string' && !Number.isNaN(Number(value)) && value.trim() !== '')) {
			numberCount++;
		}
	}
	
	// 如果大部分样本都是数字，则认为是数字类型
	return numberCount >= sampleSize * 0.6 ? 'number' : 'string';
}

export function DocumentTableView({
	table,
	documents,
	appliedQuery,
}: DocumentTableViewProps) {
	if (documents.length === 0) {
		return (
			<p className="py-8 text-center text-zinc-400">
				{appliedQuery && appliedQuery !== "{}" 
					? "没有找到符合查询条件的文档" 
					: "该集合中没有文档"
				}
			</p>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full table-auto text-sm">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="border-zinc-700 border-b">
							{headerGroup.headers.map((header) => {
								const columnDataType = header.id === "actions" ? 'string' : getColumnDataType(documents, header.id);
								
								return (
									<th
										key={header.id}
										className="min-w-[120px] p-3 text-left font-medium text-zinc-300"
										style={{
											width: header.id === "actions" ? "120px" : "auto",
											maxWidth: header.id === "actions" ? "120px" : "250px"
										}}
									>
										<div className="flex items-center gap-2">
											{header.isPlaceholder ? null : (
												<button
													type="button"	
													className={
														header.column.getCanSort()
															? "flex cursor-pointer select-none items-center gap-1 hover:text-zinc-100"
															: "flex items-center gap-1"
													}
													onClick={header.column.getToggleSortingHandler()}
													disabled={!header.column.getCanSort()}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
													{header.column.getIsSorted() === "asc" ? (
														columnDataType === 'number' ? (
															<ArrowUp01 size={16} />
														) : (
															<ArrowUpAZ size={16} />
														)
													) : header.column.getIsSorted() === "desc" ? (
														columnDataType === 'number' ? (
															<ArrowDown01 size={16} />
														) : (
															<ArrowDownAZ size={16} />
														)
													) : null}
												</button>
											)}
										</div>
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr
							key={row.id}
							className="h-16 border-zinc-800 border-b hover:bg-black/20"
						>
							{row.getVisibleCells().map((cell) => (
								<td 
									key={cell.id} 
									className="p-3 align-middle"
									style={{
										width: cell.column.id === "actions" ? "120px" : "auto",
										maxWidth: cell.column.id === "actions" ? "120px" : "250px",
										minWidth: "120px"
									}}
								>
									{flexRender(
										cell.column.columnDef.cell,
										cell.getContext()
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
} 