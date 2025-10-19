import { 
  type Item, 
  type InsertItem, 
  type List, 
  type InsertList,
  type PriceHistory,
  type InsertPriceHistory,
  type ScraperJob,
  type InsertScraperJob,
  type ActivityEvent,
  type UserPreferences,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Items
  getItem(id: string): Promise<Item | undefined>;
  getAllItems(): Promise<Item[]>;
  getItemsByListId(listId: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;

  // Lists
  getList(id: string): Promise<List | undefined>;
  getAllLists(): Promise<List[]>;
  createList(list: InsertList): Promise<List>;
  deleteList(id: string): Promise<boolean>;

  // Price History
  getPriceHistory(itemId: string): Promise<PriceHistory[]>;
  addPriceHistory(entry: InsertPriceHistory): Promise<PriceHistory>;

  // Scraper Jobs
  getScraperJob(id: string): Promise<ScraperJob | undefined>;
  getPendingJobs(): Promise<ScraperJob[]>;
  createScraperJob(job: InsertScraperJob): Promise<ScraperJob>;
  updateScraperJob(id: string, updates: Partial<ScraperJob>): Promise<ScraperJob | undefined>;

  // Activity
  getRecentActivity(limit?: number): Promise<ActivityEvent[]>;
  addActivityEvent(event: Omit<ActivityEvent, "id" | "createdAt">): Promise<ActivityEvent>;

  // User Preferences
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private items: Map<string, Item>;
  private lists: Map<string, List>;
  private priceHistory: Map<string, PriceHistory[]>;
  private scraperJobs: Map<string, ScraperJob>;
  private activityEvents: ActivityEvent[];
  private userPreferences: UserPreferences | undefined;

  constructor() {
    this.items = new Map();
    this.lists = new Map();
    this.priceHistory = new Map();
    this.scraperJobs = new Map();
    this.activityEvents = [];
    this.userPreferences = undefined;

    // Initialize with default "All Items" list
    this.lists.set("all", {
      id: "all",
      name: "All Items",
      icon: "shopping-bag",
      createdAt: new Date(),
    });
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getItemsByListId(listId: string): Promise<Item[]> {
    return Array.from(this.items.values())
      .filter((item) => item.listId === listId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const now = new Date();
    const item: Item = {
      url: insertItem.url,
      name: insertItem.name || "",
      price: insertItem.price || null,
      currency: insertItem.currency || null,
      images: insertItem.images || [],
      colors: insertItem.colors || null,
      sizes: insertItem.sizes || null,
      selectedSize: insertItem.selectedSize || null,
      selectedColor: insertItem.selectedColor || null,
      inStock: insertItem.inStock ?? true,
      listId: insertItem.listId || null,
      status: insertItem.status || "pending",
      errorMessage: insertItem.errorMessage || null,
      storeName: insertItem.storeName || null,
      scraperType: insertItem.scraperType || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updated = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Lists
  async getList(id: string): Promise<List | undefined> {
    return this.lists.get(id);
  }

  async getAllLists(): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter((list) => list.id !== "all")
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createList(insertList: InsertList): Promise<List> {
    const id = randomUUID();
    const list: List = {
      id,
      name: insertList.name,
      icon: insertList.icon || "shopping-bag",
      createdAt: new Date(),
    };
    this.lists.set(id, list);
    return list;
  }

  async deleteList(id: string): Promise<boolean> {
    return this.lists.delete(id);
  }

  // Price History
  async getPriceHistory(itemId: string): Promise<PriceHistory[]> {
    return this.priceHistory.get(itemId) || [];
  }

  async addPriceHistory(entry: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    const priceEntry: PriceHistory = {
      ...entry,
      id,
      recordedAt: new Date(),
    };

    const history = this.priceHistory.get(entry.itemId) || [];
    history.push(priceEntry);
    this.priceHistory.set(entry.itemId, history);

    return priceEntry;
  }

  // Scraper Jobs
  async getScraperJob(id: string): Promise<ScraperJob | undefined> {
    return this.scraperJobs.get(id);
  }

  async getPendingJobs(): Promise<ScraperJob[]> {
    return Array.from(this.scraperJobs.values())
      .filter((job) => job.status === "pending")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createScraperJob(insertJob: InsertScraperJob): Promise<ScraperJob> {
    const id = randomUUID();
    const job: ScraperJob = {
      id,
      itemId: insertJob.itemId,
      status: insertJob.status || "pending",
      attempts: insertJob.attempts || 0,
      errorMessage: insertJob.errorMessage || null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.scraperJobs.set(id, job);
    return job;
  }

  async updateScraperJob(id: string, updates: Partial<ScraperJob>): Promise<ScraperJob | undefined> {
    const job = this.scraperJobs.get(id);
    if (!job) return undefined;

    const updated = {
      ...job,
      ...updates,
    };
    this.scraperJobs.set(id, updated);
    return updated;
  }

  // Activity
  async getRecentActivity(limit: number = 20): Promise<ActivityEvent[]> {
    return this.activityEvents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async addActivityEvent(event: Omit<ActivityEvent, "id" | "createdAt">): Promise<ActivityEvent> {
    const activityEvent: ActivityEvent = {
      ...event,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.activityEvents.push(activityEvent);
    return activityEvent;
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return this.userPreferences;
  }

  async updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!this.userPreferences) {
      this.userPreferences = {
        id: randomUUID(),
        theme: "lavender-light",
        currency: "USD",
        updatedAt: new Date(),
      };
    }

    this.userPreferences = {
      ...this.userPreferences,
      ...prefs,
      updatedAt: new Date(),
    };

    return this.userPreferences;
  }
}

export const storage = new MemStorage();
