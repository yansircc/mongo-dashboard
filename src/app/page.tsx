"use client";

import { createAuthClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DatabaseExplorer } from "./components/database-explorer";

interface UserData {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role?: string;
	permissions?: string;
	mongodbConnectionString?: string;
	createdAt: Date;
	updatedAt: Date;
}

export default function HomePage() {
	const [connectionString, setConnectionString] = useState<string | null>(null);
	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// 同步用户信息
	const { mutate: syncUser } = useMutation({
		mutationFn: async () => {
			const res = await authClient.user.syncUser.$post();
			return await res.json();
		},
	});

	// 获取用户信息
	const { data: userData } = useQuery<UserData>({
		queryKey: ["user"],
		queryFn: async () => {
			const res = await authClient.user.getUser.$get();
			return await res.json();
		},
	});

	// 初始化：同步用户信息并加载连接字符串
	useEffect(() => {
		// 同步用户信息
		syncUser();
	}, [syncUser]);

	// 从数据库或 localStorage 加载连接字符串
	useEffect(() => {
		if (userData?.mongodbConnectionString) {
			// 优先使用数据库中的连接字符串
			setConnectionString(userData.mongodbConnectionString);
			// 同步到 localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("mongodb-connection-string", userData.mongodbConnectionString);
			}
		} else if (typeof window !== "undefined") {
			// 如果数据库中没有，则从 localStorage 加载
			const saved = localStorage.getItem("mongodb-connection-string");
			if (saved) {
				setConnectionString(saved);
			}
		}
	}, [userData]);

	// 获取数据库列表
	const { data: databases, isLoading: isLoadingDatabases, error: databasesError } = useQuery({
		queryKey: ["mongodb-databases", connectionString],
		queryFn: async () => {
			if (!connectionString) return [];
			try {
				const res = await authClient.mongodb.getDatabases.$get({
					connectionString,
				});
				if (!res.ok) {
					throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				}
				return await res.json();
			} catch (error) {
				console.error("获取数据库列表失败:", error);
				throw error;
			}
		},
		enabled: !!connectionString,
		retry: 2,
		retryDelay: 1000,
	});

	if (!connectionString) {
		return (
			<main className="relative isolate flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
				<div className="-z-10 absolute inset-0 bg-[url('/noise.svg')] opacity-50 mix-blend-soft-light [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

				<div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
					<h1
						className={cn(
							"inline-flex flex-col gap-1 text-center tracking-tight transition",
							"font-display font-semibold text-2xl leading-none sm:text-5xl md:text-6xl lg:text-[4rem]",
							"bg-gradient-to-r from-20% bg-clip-text text-transparent",
							"from-white to-gray-50",
						)}
					>
						<span>MongoDB 管理</span>
					</h1>

					<p className="mb-8 text-pretty text-center text-[#ececf399] text-lg/7 sm:text-wrap sm:text-center md:text-xl/8">
						请先配置 MongoDB 连接字符串
					</p>

					<Link
						href="/settings"
						className="inline-flex h-10 items-center rounded-md bg-blue-600 px-6 py-2 font-medium text-base/6 text-white ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-blue-700 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100"
					>
						前往设置
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="relative isolate flex min-h-screen flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
			<div className="-z-10 absolute inset-0 bg-[url('/noise.svg')] opacity-50 mix-blend-soft-light [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1
						className={cn(
							"inline-flex flex-col gap-1 tracking-tight transition",
							"font-display font-semibold text-3xl leading-none sm:text-2xl md:text-5xl",
							"bg-gradient-to-r from-20% bg-clip-text text-transparent",
							"from-white to-gray-50",
						)}
					>
						<span>MongoDB 管理</span>
					</h1>

					<Link
						href="/settings"
						className="inline-flex h-8 items-center rounded-md bg-zinc-700 px-4 py-1 font-medium text-sm text-zinc-200 ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-zinc-600 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100"
					>
						连接设置
					</Link>
				</div>

				{isLoadingDatabases ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-[#ececf399] text-lg">加载数据库列表中...</p>
					</div>
				) : databasesError ? (
					<div className="flex flex-col items-center justify-center space-y-4 py-12">
						<div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-red-300">
							<h3 className="mb-2 font-medium text-lg">连接失败</h3>
							<p className="text-sm">
								{databasesError instanceof Error 
									? databasesError.message 
									: "无法连接到 MongoDB 数据库"}
							</p>
						</div>
						<Link
							href="/settings"
							className="inline-flex h-10 items-center rounded-md bg-blue-600 px-6 py-2 font-medium text-base/6 text-white ring-2 ring-transparent ring-offset-2 ring-offset-black transition hover:bg-blue-700 hover:ring-zinc-100 focus-visible:outline-none focus-visible:ring-zinc-100"
						>
							检查连接设置
						</Link>
					</div>
				) : (
					<DatabaseExplorer
						databases={databases || []}
						connectionString={connectionString}
					/>
				)}
			</div>
		</main>
	);
}
