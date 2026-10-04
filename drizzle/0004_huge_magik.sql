CREATE TABLE `service_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64) DEFAULT 'briefcase',
	`isBuiltIn` boolean NOT NULL DEFAULT false,
	`isApproved` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `missions` MODIFY COLUMN `category` enum('authentication','protocol','pickup','delivery','inspection','representation','custom','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `customCategoryId` int;--> statement-breakpoint
ALTER TABLE `missions` ADD `customServiceName` varchar(255);--> statement-breakpoint
ALTER TABLE `missions` ADD `customServiceDescription` text;