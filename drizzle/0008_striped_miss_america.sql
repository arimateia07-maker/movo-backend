CREATE TABLE `push_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`expoPushToken` varchar(255) NOT NULL,
	`platform` enum('android','ios') NOT NULL,
	`deliveryMode` enum('remote','in_app') NOT NULL DEFAULT 'remote',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('mission_applied','application_accepted','application_rejected','mission_completed','new_message','new_review','support','assistance_request','assistance_response','assistance_guidance') NOT NULL;