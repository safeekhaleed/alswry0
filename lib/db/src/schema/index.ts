import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  isVip: boolean("is_vip").notNull().default(false),
  vipLevel: integer("vip_level").notNull().default(0),
  totalRecharged: numeric("total_recharged", { precision: 10, scale: 2 }).notNull().default("0"),
  isAdmin: boolean("is_admin").notNull().default(false),
  pushToken: text("push_token"),
  accountId: text("account_id"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const toolsTable = pgTable("tools", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("عام"),
  color: text("color").notNull().default("#7c3aed"),
  url: text("url"),
  iconUrl: text("icon_url"),
  imageUrl: text("image_url"),
  content: text("content"),
  contentType: text("content_type"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("عام"),
  duration: integer("duration").notNull().default(0),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  content: text("content"),
  contentType: text("content_type"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("عام"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  url: text("url"),
  iconUrl: text("icon_url"),
  imageUrl: text("image_url"),
  content: text("content"),
  contentType: text("content_type"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const sentNotificationsLogTable = pgTable("sent_notifications_log", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const bannersTable = pgTable("banners", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rechargeRequestsTable = pgTable("recharge_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id").notNull(),
  transferImageUrl: text("transfer_image_url"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  itemTitle: text("item_title").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
