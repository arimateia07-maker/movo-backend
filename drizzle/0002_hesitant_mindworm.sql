ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `facebookId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `appleId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('manus','email','google','facebook','apple','phone') DEFAULT 'manus';--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;