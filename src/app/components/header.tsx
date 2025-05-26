"use client";

import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../config/navigation";

export const Header = () => {
	return (
		<header className="sticky top-0 z-50 w-full border-zinc-800/20 border-b bg-zinc-950/80 backdrop-blur-lg transition-all">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<TextLogo />
					<Nav />
				</div>

				<div className="flex items-center gap-3">
					<SignedOut>
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-md px-4 py-2 font-medium text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white"
							>
								登录
							</button>
						</SignInButton>
						<SignUpButton mode="modal">
							<button
								type="button"
								className="rounded-md bg-gradient-to-r from-zinc-200 to-zinc-300 px-4 py-2 font-medium text-sm text-zinc-900 shadow-sm transition-all duration-200 hover:from-zinc-100 hover:to-zinc-200 hover:shadow"
							>
								注册
							</button>
						</SignUpButton>
					</SignedOut>
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									userButtonAvatarBox:
										"w-9 h-9 border-2 border-zinc-700/50 hover:border-zinc-500 transition-colors",
								},
							}}
						/>
					</SignedIn>
				</div>
			</div>
		</header>
	);
};

const Nav = () => {
	const pathname = usePathname();

	return (
		<nav className="hidden items-center space-x-1 md:flex">
			{navItems.map((item) => {
				const isActive = pathname === item.href;
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`rounded-md px-3 py-2 font-medium text-sm transition-all duration-200 ${
							isActive
								? "bg-zinc-800/80 text-white"
								: "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
						}`}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
};

const TextLogo = () => {
	return (
		<Link href="/" className="flex items-center space-x-2">
			<span className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text font-bold text-transparent text-xl">
				JStack
			</span>
		</Link>
	);
};
