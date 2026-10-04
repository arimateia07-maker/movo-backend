CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custody_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`correspondentId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`photoUrl` text,
	`latitude` float,
	`longitude` float,
	`locationName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custody_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`correspondentId` int NOT NULL,
	`message` text,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mission_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`correspondentId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('authentication','protocol','pickup','delivery','inspection','representation','other') NOT NULL,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`urgency` enum('low','medium','high','urgent') DEFAULT 'medium',
	`location` varchar(500) NOT NULL,
	`latitude` float,
	`longitude` float,
	`deadline` timestamp,
	`budget` decimal(10,2),
	`aiGuidance` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` enum('mission_applied','application_accepted','application_rejected','mission_completed','new_message','new_review','support') NOT NULL,
	`relatedId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isStaff` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('requester','correspondent','both') DEFAULT 'requester';--> statement-breakpoint
ALTER TABLE `users` ADD `trustLevel` enum('explorer','trusted','elite','ambassador') DEFAULT 'explorer';--> statement-breakpoint
ALTER TABLE `users` ADD `totalMissions` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `averageRating` float DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;