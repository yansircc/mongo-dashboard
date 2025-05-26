import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MongoDBState {
	selectedDatabase: string | null;
	selectedCollection: string | null;
	setSelectedDatabase: (database: string | null) => void;
	setSelectedCollection: (collection: string | null) => void;
	resetSelection: () => void;
}

export const useMongoDBStore = create<MongoDBState>()(
	persist(
		(set) => ({
			selectedDatabase: null,
			selectedCollection: null,
			setSelectedDatabase: (database) => set({ selectedDatabase: database }),
			setSelectedCollection: (collection) => set({ selectedCollection: collection }),
			resetSelection: () => set({ selectedDatabase: null, selectedCollection: null }),
		}),
		{
			name: "mongodb-selection",
		},
	),
); 