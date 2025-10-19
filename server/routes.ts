import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeUrl, detectPlatform } from "./scraper";
import { suggestCategory, searchByImage, findSimilar } from "./gemini";
import { insertItemSchema, insertListSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all items or filtered by listId
  app.get("/api/items", async (req, res) => {
    try {
      const { listId } = req.query;
      
      let items;
      if (listId && typeof listId === "string") {
        items = await storage.getItemsByListId(listId);
      } else {
        items = await storage.getAllItems();
      }
      
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get single item
  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Create new item (with auto-categorization)
  app.post("/api/items", async (req, res) => {
    try {
      const data = insertItemSchema.parse(req.body);
      
      // Create item in pending state with placeholder name
      const item = await storage.createItem({
        url: data.url,
        name: data.name || "Loading...",
        status: "pending",
        images: data.images || [],
        colors: data.colors || [],
        sizes: data.sizes || [],
        listId: data.listId,
      });

      // Create scraper job for background processing
      await storage.createScraperJob({
        itemId: item.id,
        status: "pending",
        attempts: 0,
      });

      // Process immediately for MVP (in production, this would be handled by a worker)
      try {
        const scraperType = await detectPlatform(data.url);
        const scrapedData = await scrapeUrl(data.url);
        
        // Get AI category suggestion
        const categorySuggestion = await suggestCategory(
          scrapedData.name,
          scrapedData.storeName
        );

        // Find or create the suggested list
        let targetListId = data.listId;
        if (!targetListId && categorySuggestion.confidence > 0.5) {
          const allLists = await storage.getAllLists();
          const existingList = allLists.find(
            (list) => list.name.toLowerCase() === categorySuggestion.suggestedCategory.toLowerCase()
          );

          if (existingList) {
            targetListId = existingList.id;
          } else {
            // Create new list
            const newList = await storage.createList({
              name: categorySuggestion.suggestedCategory,
              icon: "shopping-bag", // In production, map category to icon
            });
            targetListId = newList.id;
          }
        }

        // Update item with scraped data
        const updatedItem = await storage.updateItem(item.id, {
          name: scrapedData.name,
          price: scrapedData.price,
          currency: scrapedData.currency,
          images: scrapedData.images,
          colors: scrapedData.colors || [],
          sizes: scrapedData.sizes || [],
          inStock: scrapedData.inStock,
          storeName: scrapedData.storeName,
          scraperType,
          listId: targetListId,
          status: "processed",
        });

        // Add price history
        if (scrapedData.price) {
          await storage.addPriceHistory({
            itemId: item.id,
            price: scrapedData.price,
            currency: scrapedData.currency || "USD",
          });
        }

        // Add activity event
        await storage.addActivityEvent({
          itemId: item.id,
          eventType: "item_added",
          newValue: scrapedData.name,
          changePercent: null,
          oldValue: null,
        });

        res.json(updatedItem);
      } catch (scrapeError) {
        // Update item with failed status
        await storage.updateItem(item.id, {
          status: "failed",
          errorMessage: scrapeError instanceof Error ? scrapeError.message : "Unknown error",
        });
        
        res.json(item);
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Update item
  app.patch("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.updateItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      const success = await storage.deleteItem(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Get price history for an item
  app.get("/api/items/:id/price-history", async (req, res) => {
    try {
      const history = await storage.getPriceHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price history" });
    }
  });

  // Find similar items
  app.post("/api/items/:id/find-similar", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const results = await findSimilar(item.name);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to find similar items" });
    }
  });

  // Search by image
  app.post("/api/items/search-by-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const results = await searchByImage(imageBase64);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search by image" });
    }
  });

  // Update all prices
  app.post("/api/items/update-prices", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      
      // In production, this would queue jobs for all items
      // For MVP, we just acknowledge the request
      res.json({ 
        message: "Price updates queued",
        count: items.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to queue price updates" });
    }
  });

  // CSV import
  app.post("/api/items/import-csv", async (req, res) => {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      const created = [];
      for (const itemData of items) {
        try {
          const item = await storage.createItem({
            url: itemData.url,
            name: itemData.name || "Imported Item",
            status: "pending",
            images: [],
            colors: [],
            sizes: [],
          });

          // Create scraper job
          await storage.createScraperJob({
            itemId: item.id,
            status: "pending",
            attempts: 0,
          });

          created.push(item);
        } catch (error) {
          console.error("Failed to import item:", itemData, error);
        }
      }

      res.json({ 
        imported: created.length,
        total: items.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to import items" });
    }
  });

  // Lists endpoints
  app.get("/api/lists", async (req, res) => {
    try {
      const lists = await storage.getAllLists();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  app.get("/api/lists/:id", async (req, res) => {
    try {
      const list = await storage.getList(req.params.id);
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch list" });
    }
  });

  app.post("/api/lists", async (req, res) => {
    try {
      const data = insertListSchema.parse(req.body);
      const list = await storage.createList(data);
      res.json(list);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.delete("/api/lists/:id", async (req, res) => {
    try {
      const success = await storage.deleteList(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "List not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete list" });
    }
  });

  // Activity feed
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivity(limit);
      
      // Enrich with item data
      const enriched = await Promise.all(
        activities.map(async (activity) => {
          const item = await storage.getItem(activity.itemId);
          return { ...activity, item };
        })
      );
      
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // User preferences
  app.get("/api/preferences", async (req, res) => {
    try {
      const prefs = await storage.getUserPreferences();
      res.json(prefs || { theme: "lavender-light", currency: "USD" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/preferences", async (req, res) => {
    try {
      const prefs = await storage.updateUserPreferences(req.body);
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
