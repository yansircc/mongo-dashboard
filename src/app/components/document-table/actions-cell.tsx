import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ActionsCellProps {
	row: any;
	table: any;
}

export function ActionsCell({ row, table }: ActionsCellProps) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [countdown, setCountdown] = useState(3);

	// 倒计时逻辑
	useEffect(() => {
		let timer: NodeJS.Timeout;
		
		if (isConfirming && countdown > 0) {
			timer = setTimeout(() => {
				setCountdown(countdown - 1);
			}, 1000);
		} else if (isConfirming && countdown === 0) {
			// 倒计时结束，取消确认状态
			setIsConfirming(false);
			setCountdown(3);
		}

		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [isConfirming, countdown]);

	const handleDeleteClick = () => {
		if (!isConfirming) {
			// 第一次点击，进入确认状态
			setIsConfirming(true);
			setCountdown(3);
		} else {
			// 确认状态下点击，执行删除
			table.options.meta?.deleteRow(row.index);
			setIsConfirming(false);
			setCountdown(3);
		}
	};

	return (
		<div className="flex min-w-[120px] justify-center gap-1">
			{!isConfirming ? (
				<button
					type="button"
					onClick={handleDeleteClick}
					className="flex h-7 items-center justify-center gap-1 rounded bg-red-500/20 px-2 text-red-300 text-xs transition hover:bg-red-500/30 hover:text-red-200"
					title="删除文档"
				>
					<Trash2 size={14} />
					<span>删除</span>
				</button>
			) : (
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={handleDeleteClick}
						className="flex h-7 items-center justify-center gap-1.5 rounded bg-red-600 px-3 font-medium text-white text-xs transition hover:bg-red-700"
						title="确认删除"
					>
						<AlertTriangle size={12} />
						<span>确认删除</span>
						<span>{countdown}s</span>
					</button>
				</div>
			)}
		</div>
	);
} 