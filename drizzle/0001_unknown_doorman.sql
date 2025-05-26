CREATE TABLE `users_table` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text,
	`role` text DEFAULT 'user',
	`permissions` text,
	`mongodbConnectionString` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);--> statement-breakpoint
CREATE INDEX `User_email_idx` ON `users_table` (`email`);--> statement-breakpoint
CREATE INDEX `User_id_idx` ON `users_table` (`id`);