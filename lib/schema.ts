// lib/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ── 1. Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['administrator', 'manager', 'user'] }).default('manager').notNull(),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpire: text('reset_password_expire'), // ISO String
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 2. Projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status', { enum: ['upcoming', 'ongoing', 'completed'] }).default('upcoming').notNull(),
  headline: text('headline'),
  address: text('address').default(''),
  estYear: text('est_year').default(''),
  featured: integer('featured', { mode: 'boolean' }).default(false).notNull(),
  category: text('category').default(''),
  area: text('area').default(''),
  units: integer('units').default(0).notNull(),
  shortIntro: text('short_intro'),
  
  // JSON Columns for Arrays/Sub-documents to align with original Document structure
  heroImages: text('hero_images', { mode: 'json' }).default('[]').notNull(),
  floorPlans: text('floor_plans', { mode: 'json' }).default('[]').notNull(),
  layoutPlan: text('layout_plan', { mode: 'json' }),
  commonSpecifications: text('common_specifications', { mode: 'json' }).default('[]').notNull(),
  commercialSpecifications: text('commercial_specifications', { mode: 'json' }).default('[]').notNull(),
  amenities: text('amenities', { mode: 'json' }).default('[]').notNull(),
  sampleHousePhotos: text('sample_house_photos', { mode: 'json' }).default('[]').notNull(),
  brochure: text('brochure', { mode: 'json' }),
  virtualTour: text('virtual_tour', { mode: 'json' }),
  
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 3. Blog Posts ──────────────────────────────────────────────────────────────
export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  excerpt: text('excerpt').default(''),
  category: text('category').notNull(),
  tags: text('tags', { mode: 'json' }).default('[]').notNull(),
  image: text('image', { mode: 'json' }).notNull(), // url, cloudinaryId
  videoUrl: text('video_url'),
  author: text('author').default('Space Age Group').notNull(),
  authorRole: text('author_role').default('Media & Communications').notNull(),
  readTime: text('read_time').default('5 min read').notNull(),
  featured: integer('featured', { mode: 'boolean' }).default(false).notNull(),
  status: text('status', { enum: ['published', 'draft'] }).default('draft').notNull(),
  settings: text('settings', { mode: 'json' }).default('{"allowLikes":true,"allowComments":true}').notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 4. Comments ───────────────────────────────────────────────────────────────
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  parentId: text('parent_id'),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  content: text('content').notNull(),
  isApproved: integer('is_approved', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 5. Corporate Social Responsibility (CSR) ──────────────────────────────────
export const csr = sqliteTable('csr', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description').notNull(),
  items: text('items', { mode: 'json' }).default('[]').notNull(),
  impact: text('impact').notNull(),
  likes: integer('likes').default(0).notNull(),
  color: text('color').default('#c9a84c').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 6. Standalone Hero Images ─────────────────────────────────────────────────
export const heroImages = sqliteTable('hero_images', {
  id: text('id').primaryKey(),
  images: text('images', { mode: 'json' }).default('[]').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 7. Media Vault Collections ────────────────────────────────────────────────
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  project: text('project_id').notNull(), // reference project ID string
  title: text('title').notNull(),
  items: text('items', { mode: 'json' }).default('[]').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 8. Manager Notifications ──────────────────────────────────────────────────
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  managerName: text('manager_name').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 9. Developer Services ─────────────────────────────────────────────────────
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  number: text('number').notNull(),
  category: text('category', { enum: ['Core Development', 'Consultation'] }).notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  stats: text('stats', { mode: 'json' }).default('[]').notNull(),
  features: text('features', { mode: 'json' }).default('[]').notNull(),
  accent: text('accent').default('#c9a84c').notNull(),
  icon: text('icon').default('home').notNull(),
  status: text('status', { enum: ['published', 'draft'] }).default('published').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 10. Dashboard Settings ────────────────────────────────────────────────────
export const siteSettings = sqliteTable('site_settings', {
  id: text('id').primaryKey(),
  yearsOfExcellence: text('years_of_excellence').default('35+').notNull(),
  projectsCompleted: text('projects_completed').default('120+').notNull(),
  happyFamilies: text('happy_families').default('5000+').notNull(),
  clientSatisfaction: text('client_satisfaction').default('98%').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 11. Team Members ──────────────────────────────────────────────────────────
export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  study: text('study').notNull(),
  experience: text('experience').notNull(),
  description: text('description').notNull(),
  relationToGroup: text('relation_to_group').notNull(),
  image: text('image', { mode: 'json' }).notNull(), // url, cloudinaryId
  socialLinks: text('social_links', { mode: 'json' }).default('{"linkedin":"","instagram":"","facebook":""}').notNull(),
  taglineThought: text('tagline_thought').default(''),
  skills: text('skills', { mode: 'json' }).default('[]').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── 12. Timeline Events ───────────────────────────────────────────────────────
export const timelineEvents = sqliteTable('timeline_events', {
  id: text('id').primaryKey(),
  year: text('year').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
