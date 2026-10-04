CREATE TABLE `mission_assistance_guidance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assistanceRequestId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` varchar(1000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mission_assistance_guidance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_assistance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`missionId` int NOT NULL,
	`requesterId` int NOT NULL,
	`recipientId` int NOT NULL,
	`note` varchar(500),
	`status` enum('pending','accepted','declined','closed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`closedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `mission_assistance_requests_id` PRIMARY KEY(`id`)
);
