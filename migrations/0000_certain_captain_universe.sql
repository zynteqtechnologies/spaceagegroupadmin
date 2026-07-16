CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`excerpt` text DEFAULT '',
	`category` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`image` text NOT NULL,
	`video_url` text,
	`author` text DEFAULT 'Space Age Group' NOT NULL,
	`author_role` text DEFAULT 'Media & Communications' NOT NULL,
	`read_time` text DEFAULT '5 min read' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`settings` text DEFAULT '{"allowLikes":true,"allowComments":true}' NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`parent_id` text,
	`author_name` text NOT NULL,
	`author_email` text NOT NULL,
	`content` text NOT NULL,
	`is_approved` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `csr` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`long_description` text NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`impact` text NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#c9a84c' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `csr_slug_unique` ON `csr` (`slug`);--> statement-breakpoint
CREATE TABLE `hero_images` (
	`id` text PRIMARY KEY NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`manager_name` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`headline` text,
	`address` text DEFAULT '',
	`est_year` text DEFAULT '',
	`featured` integer DEFAULT false NOT NULL,
	`category` text DEFAULT '',
	`area` text DEFAULT '',
	`units` integer DEFAULT 0 NOT NULL,
	`short_intro` text,
	`hero_images` text DEFAULT '[]' NOT NULL,
	`floor_plans` text DEFAULT '[]' NOT NULL,
	`layout_plan` text,
	`common_specifications` text DEFAULT '[]' NOT NULL,
	`commercial_specifications` text DEFAULT '[]' NOT NULL,
	`amenities` text DEFAULT '[]' NOT NULL,
	`sample_house_photos` text DEFAULT '[]' NOT NULL,
	`brochure` text,
	`virtual_tour` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`number` text NOT NULL,
	`category` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`stats` text DEFAULT '[]' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`accent` text DEFAULT '#c9a84c' NOT NULL,
	`icon` text DEFAULT 'home' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`years_of_excellence` text DEFAULT '35+' NOT NULL,
	`projects_completed` text DEFAULT '120+' NOT NULL,
	`happy_families` text DEFAULT '5000+' NOT NULL,
	`client_satisfaction` text DEFAULT '98%' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` text NOT NULL,
	`study` text NOT NULL,
	`experience` text NOT NULL,
	`description` text NOT NULL,
	`relation_to_group` text NOT NULL,
	`image` text NOT NULL,
	`social_links` text DEFAULT '{"linkedin":"","instagram":"","facebook":""}' NOT NULL,
	`tagline_thought` text DEFAULT '',
	`skills` text DEFAULT '[]' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`year` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'manager' NOT NULL,
	`reset_password_token` text,
	`reset_password_expire` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);