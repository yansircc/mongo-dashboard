import type { RowData } from "@tanstack/react-table";

// 扩展 TableMeta 类型以支持更新数据
declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		updateData: (rowIndex: number, columnId: string, value: unknown) => void;
		deleteRow: (rowIndex: number) => void;
		editingCell: string | null;
		setEditingCell: (cellId: string | null) => void;
	}
}

export interface MongoDocument {
	_id: any;
	[key: string]: any;
}

export interface DocumentTableProps {
	connectionString: string;
	databaseName: string;
	collectionName: string;
}

export interface DocumentsData {
	documents: MongoDocument[];
	totalPages: number;
	page: number;
	total: number;
	limit: number;
	appliedFilter: Record<string, any>;
}

export interface AiConfig {
	apiKey?: string;
	baseUrl?: string;
	model: string;
} 