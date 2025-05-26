DROP TABLE `posts_table`;--> statement-breakpoint
ALTER TABLE `users_table` ADD `aiApiKey` text;--> statement-breakpoint
ALTER TABLE `users_table` ADD `aiBaseUrl` text;--> statement-breakpoint
ALTER TABLE `users_table` ADD `aiModel` text DEFAULT 'gpt-4.1';