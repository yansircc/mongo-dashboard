"use client";

import { createAuthClient } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { ActionsCell } from "./actions-cell";
import { CreateDocumentForm } from "./create-document-form";
import { DocumentTableView } from "./document-table-view";
import { EditableCell } from "./editable-cell";
import { Pagination } from "./pagination";
import { QueryForm } from "./query-form";
import { Toolbar } from "./toolbar";
import type { AiConfig, DocumentTableProps, DocumentsData, MongoDocument } from "./types";

export function DocumentTable({
	connectionString,
	databaseName,
	collectionName,
}: DocumentTableProps) {
	// 状态管理
	const [page, setPage] = useState(1);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [editingCell, setEditingCell] = useState<string | null>(null);
	
	// 查询相关状态
	const [showQueryForm, setShowQueryForm] = useState(false);
	const [appliedQuery, setAppliedQuery] = useState("");
	
	// AI 查询相关状态
	const [aiLoading, setAiLoading] = useState(false);
	const [generatedQuery, setGeneratedQuery] = useState<string>("");

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);
	const queryClient = useQueryClient();

	// 获取 AI 配置
	const { data: aiConfigData } = useQuery({
		queryKey: ["ai-config"],
		queryFn: async () => {
			const res = await authClient.user.getAiConfig.$get();
			return await res.json();
		},
	});

	// 生成 AI 查询
	const { mutate: generateAiQuery } = useMutation({
		mutationFn: async (userQuery: string) => {
			if (!aiConfigData?.apiKey) {
				throw new Error("请先配置 AI API 密钥");
			}

			// 生成集合字段结构信息
			const collectionSchema = documents.length > 0 && documents[0]
				? JSON.stringify(Object.keys(documents[0]).filter(key => key !== "_id"))
				: undefined;

			const res = await authClient.ai.generateMongoQuery.$post({
				apiKey: aiConfigData.apiKey,
				baseUrl: aiConfigData.baseUrl || undefined,
				model: aiConfigData.model,
				userQuery,
				collectionSchema,
			});
			return await res.json();
		},
		onSuccess: (data) => {
			// 将生成的查询设置到状态中，传递给查询表单
			setGeneratedQuery(data.query);
			setAiLoading(false);
		},
		onError: (error) => {
			setAiLoading(false);
			alert(`AI 生成失败: ${error.message}`);
		},
	});

	// 获取文档列表
	const { data: documentsData, isLoading, error } = useQuery({
		queryKey: [
			"mongodb-documents",
			connectionString,
			databaseName,
			collectionName,
			page,
			appliedQuery,
		],
		queryFn: async () => {
			const res = await authClient.mongodb.getDocuments.$get({
				connectionString,
				databaseName,
				collectionName,
				page,
				limit: 10,
				query: appliedQuery || undefined,
			});
			return await res.json();
		},
	});

	// 创建文档
	const { mutate: createDocument, isPending: isCreating } = useMutation({
		mutationFn: async (document: Record<string, unknown>) => {
			const res = await authClient.mongodb.createDocument.$post({
				connectionString,
				databaseName,
				collectionName,
				document,
			});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [
					"mongodb-documents",
					connectionString,
					databaseName,
					collectionName,
				],
			});
			setShowCreateForm(false);
		},
	});

	// 更新文档
	const { mutate: updateDocument } = useMutation({
		mutationFn: async ({
			documentId,
			document,
		}: { documentId: string; document: Record<string, unknown> }) => {
			const res = await authClient.mongodb.updateDocument.$post({
				connectionString,
				databaseName,
				collectionName,
				documentId,
				document,
			});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [
					"mongodb-documents",
					connectionString,
					databaseName,
					collectionName,
				],
			});
		},
	});

	// 删除文档
	const { mutate: deleteDocument } = useMutation({
		mutationFn: async (documentId: string) => {
			const res = await authClient.mongodb.deleteDocument.$post({
				connectionString,
				databaseName,
				collectionName,
				documentId,
			});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [
					"mongodb-documents",
					connectionString,
					databaseName,
					collectionName,
				],
			});
		},
	});

	const documents = (documentsData?.documents || []) as MongoDocument[];

	// 动态生成列定义
	const columns = useMemo<ColumnDef<MongoDocument>[]>(() => {
		if (documents.length === 0) return [];

		const allKeys = new Set<string>();
		documents.forEach((doc) => {
			Object.keys(doc).forEach((key) => {
				// 排除 _id 字段
				if (key !== "_id") {
					allKeys.add(key);
				}
			});
		});

		const columnHelper = createColumnHelper<MongoDocument>();

		const dynamicColumns = Array.from(allKeys).map((key) =>
			columnHelper.accessor(key as any, {
				header: key,
				cell: EditableCell,
				enableSorting: true,
			})
		);

		// 添加操作列
		dynamicColumns.push(
			columnHelper.accessor("actions", {
				id: "actions",
				header: "操作",
				cell: (props) => <ActionsCell {...props} />,
				enableSorting: false,
			})
		);

		return dynamicColumns;
	}, [documents]);

	// 表格实例
	const table = useReactTable({
		data: documents,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		meta: {
			updateData: (rowIndex: number, columnId: string, value: unknown) => {
				const document = documents[rowIndex];
				if (document) {
					const updatedDoc = { ...document, [columnId]: value };
					updateDocument({
						documentId: String(document._id),
						document: updatedDoc,
					});
				}
			},
			deleteRow: (rowIndex: number) => {
				const document = documents[rowIndex];
				if (document) {
					deleteDocument(String(document._id));
				}
			},
			editingCell,
			setEditingCell,
		},
	});

	// 事件处理函数
	const handleApplyQuery = (query: string) => {
		setAppliedQuery(query);
		setShowQueryForm(false);
		setPage(1);
	};

	const handleClearQuery = () => {
		setAppliedQuery("");
		setPage(1);
	};

	const handleAiGenerate = (query: string) => {
		setAiLoading(true);
		generateAiQuery(query);
	};

	const handleGeneratedQueryUsed = () => {
		setGeneratedQuery("");
	};

	if (isLoading) {
		return <p className="text-zinc-400">加载文档中...</p>;
	}

	if (error) {
		return (
			<div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
				<p className="text-red-400">
					查询失败: {error instanceof Error ? error.message : "未知错误"}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* 工具栏 */}
			<Toolbar
				onCreateDocument={() => setShowCreateForm(!showCreateForm)}
				onShowQuery={() => setShowQueryForm(!showQueryForm)}
				onClearQuery={handleClearQuery}
				globalFilter={globalFilter}
				onGlobalFilterChange={setGlobalFilter}
				showCreateForm={showCreateForm}
				showQueryForm={showQueryForm}
				appliedQuery={appliedQuery}
				documentsData={documentsData as DocumentsData}
				currentPage={page}
			/>

			{/* MongoDB 查询表单（包含 AI 功能） */}
			<QueryForm
				isVisible={showQueryForm}
				appliedQuery={appliedQuery}
				onApplyQuery={handleApplyQuery}
				onClose={() => setShowQueryForm(false)}
				aiConfig={aiConfigData as AiConfig}
				onGenerateAiQuery={handleAiGenerate}
				isAiLoading={aiLoading}
				generatedQuery={generatedQuery}
				onGeneratedQueryUsed={handleGeneratedQueryUsed}
			/>

			{/* 创建文档表单 */}
			<CreateDocumentForm
				isVisible={showCreateForm}
				isCreating={isCreating}
				onClose={() => setShowCreateForm(false)}
				onCreate={createDocument}
			/>

			{/* 文档表格 */}
			<DocumentTableView
				table={table}
				documents={documents}
				appliedQuery={appliedQuery}
			/>

			{/* 分页控制 */}
			{documentsData && (
				<Pagination
					documentsData={documentsData as DocumentsData}
					currentPage={page}
					onPageChange={setPage}
				/>
			)}
		</div>
	);
} 