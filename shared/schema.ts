import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Wishlist Lists (Categories like "Dresses", "Electronics", etc.)
export const lists = pgTable("lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("shopping-bag"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
});

export type InsertList = z.infer<typeof insertListSchema>;
export type List = typeof lists.$inferSelect;

// Wishlist Items
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  name: text("name").notNull(),
  price: text("price"), // Store as text to preserve currency symbols and formatting
  currency: text("currency").default("USD"),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  colors: jsonb("colors").$type<{ name: string; hex?: string; swatch?: string }[]>().default([]),
  sizes: text("sizes").array().default(sql`ARRAY[]::text[]`),
  selectedSize: text("selected_size"),
  selectedColor: text("selected_color"),
  inStock: boolean("in_stock").default(true),
  listId: varchar("list_id").references(() => lists.id),
  status: text("status").notNull().default("pending"), // pending, processing, processed, failed
  errorMessage: text("error_message"),
  storeName: text("store_name"),
  scraperType: text("scraper_type"), // shopify, zara, hm, universal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  url: z.string().url("Please enter a valid URL"),
  name: z.string().optional(), // Will be populated by scraper
  price: z.string().optional(),
  images: z.array(z.string()).optional(),
  colors: z.any().optional(),
  sizes: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Price History for tracking price changes over time
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  price: text("price").notNull(),
  currency: text("currency").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  recordedAt: true,
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

// Scraper Jobs for background processing
export const scraperJobs = pgTable("scraper_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  attempts: integer("attempts").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const insertScraperJobSchema = createInsertSchema(scraperJobs).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export type InsertScraperJob = z.infer<typeof insertScraperJobSchema>;
export type ScraperJob = typeof scraperJobs.$inferSelect;

// Activity Feed Events
export const activityEvents = pgTable("activity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // price_drop, price_rise, item_added, back_in_stock
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changePercent: text("change_percent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityEvent = typeof activityEvents.$inferSelect;

// User preferences (themes, settings)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  theme: text("theme").notNull().default("lavender-light"), // lavender-light, mint-light, peach-light, midnight-dark, forest-dark, plum-dark
  currency: text("currency").default("USD"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
