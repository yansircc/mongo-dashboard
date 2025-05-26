"use client";

import { createAuthClient } from "@/lib/client";
import { useMongoDBStore } from "@/lib/store";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { DocumentTable } from "./document-table";

interface Database {
	name: string;
	sizeOnDisk?: number;
	empty?: boolean;
}

interface Collection {
	name: string;
	type?: string;
}

interface DatabaseExplorerProps {
	databases: Database[];
	connectionString: string;
}

export function DatabaseExplorer({
	databases,
	connectionString,
}: DatabaseExplorerProps) {
	const {
		selectedDatabase,
		selectedCollection,
		setSelectedDatabase,
		setSelectedCollection,
	} = useMongoDBStore();

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// 获取集合列表
	const { data: collections, isLoading: isLoadingCollections } = useQuery({
		queryKey: ["mongodb-collections", connectionString, selectedDatabase],
		queryFn: async () => {
			if (!selectedDatabase) return [];
			const res = await authClient.mongodb.getCollections.$get({
				connectionString,
				databaseName: selectedDatabase,
			});
			return await res.json();
		},
		enabled: !!selectedDatabase,
	});

	// 获取集合统计信息
	const { data: collectionStats } = useQuery({
		queryKey: [
			"mongodb-collection-stats",
			connectionString,
			selectedDatabase,
			selectedCollection,
		],
		queryFn: async () => {
			if (!selectedDatabase || !selectedCollection) return null;
			const res = await authClient.mongodb.getCollectionStats.$get({
				connectionString,
				databaseName: selectedDatabase,
				collectionName: selectedCollection,
			});
			return await res.json();
		},
		enabled: !!selectedDatabase && !!selectedCollection,
	});

	// 当数据库改变时，重置集合选择
	useEffect(() => {
		if (selectedDatabase && collections && collections.length > 0) {
			// 如果当前选择的集合不在新的集合列表中，重置选择
			if (selectedCollection && !collections.find((c: Collection) => c.name === selectedCollection)) {
				setSelectedCollection(null);
			}
		}
	}, [selectedDatabase, collections, selectedCollection, setSelectedCollection]);

	const handleDatabaseSelect = (dbName: string) => {
		setSelectedDatabase(dbName);
		setSelectedCollection(null);
	};

	const handleCollectionSelect = (collectionName: string) => {
		setSelectedCollection(collectionName);
	};

	const formatBytes = (bytes?: number) => {
		if (!bytes) return "0 B";
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
	};

	return (
		<div className="space-y-6">
			{/* 选择器区域 */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* 数据库选择器 */}
				<div className="space-y-2">
					<label htmlFor="database-select" className="block font-medium text-sm text-zinc-200">
						选择数据库
					</label>
					<select
						id="database-select"
						value={selectedDatabase || ""}
						onChange={(e) => handleDatabaseSelect(e.target.value)}
						className="w-full rounded-md bg-black/50 px-4 py-3 text-base text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none"
					>
						<option value="">请选择数据库</option>
						{databases.map((db) => (
							<option key={db.name} value={db.name}>
								{db.name} {db.sizeOnDisk ? `(${formatBytes(db.sizeOnDisk)})` : ""}
							</option>
						))}
					</select>
				</div>

				{/* 集合选择器 */}
				<div className="space-y-2">
					<label htmlFor="collection-select" className="block font-medium text-sm text-zinc-200">
						选择集合
					</label>
					<select
						id="collection-select"
						value={selectedCollection || ""}
						onChange={(e) => handleCollectionSelect(e.target.value)}
						disabled={!selectedDatabase || isLoadingCollections}
						className="w-full rounded-md bg-black/50 px-4 py-3 text-base text-zinc-100 ring-2 ring-transparent transition hover:bg-black/75 hover:ring-zinc-800 focus:bg-black/75 focus:ring-zinc-800 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">
							{!selectedDatabase 
								? "请先选择数据库" 
								: isLoadingCollections 
								? "加载中..." 
								: "请选择集合"}
						</option>
						{collections?.map((collection: Collection) => (
							<option key={collection.name} value={collection.name}>
								{collection.name} ({collection.type || "collection"})
							</option>
						))}
					</select>
				</div>
			</div>

			{/* 统计信息 */}
			{selectedDatabase && selectedCollection && collectionStats && (
				<div className="rounded-md bg-black/15 p-4 backdrop-blur-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center text-zinc-400">
							<div className="rounded-md bg-zinc-900 px-2 py-1 font-medium text-sm">{selectedDatabase}</div>
							<div className="mx-2 text-zinc-400">&gt;</div>
							<div className="rounded-md bg-zinc-900 px-2 py-1 font-medium text-sm">{selectedCollection}</div>
						</div>
						<div className="text-sm text-zinc-400">
							总计: {collectionStats.documentCount} 个文档
						</div>
					</div>
				</div>
			)}

			{/* 文档表格 */}
			<div className="rounded-md bg-black/15 p-6 backdrop-blur-lg">
				<div className="mb-4">
					<h2 className="font-semibold text-xl text-zinc-200">文档列表</h2>
				</div>

				{!selectedDatabase || !selectedCollection ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="text-lg text-zinc-400">请选择数据库和集合以查看文档</p>
						<p className="mt-2 text-sm text-zinc-500">
							使用上方的下拉菜单选择要浏览的数据库和集合
						</p>
					</div>
				) : (
					<DocumentTable
						connectionString={connectionString}
						databaseName={selectedDatabase}
						collectionName={selectedCollection}
					/>
				)}
			</div>
		</div>
	);
}
