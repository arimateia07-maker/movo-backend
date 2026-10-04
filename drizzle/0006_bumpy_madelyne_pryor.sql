ALTER TABLE `reviews` ADD `reviewerRole` varchar(20) DEFAULT 'requester' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingPunctuality` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingCommunication` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingQuality` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingProfessionalism` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingClarity` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `ratingPayment` int;--> statement-breakpoint
ALTER TABLE `reviews` ADD `isPublic` boolean DEFAULT true NOT NULL;