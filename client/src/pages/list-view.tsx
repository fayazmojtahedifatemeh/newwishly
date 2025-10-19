import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/wishlist/item-card";
import { AddItemModal } from "@/components/wishlist/add-item-modal";
import type { Item, List } from "@shared/schema";

export default function ListView() {
  const { listId } = useParams();
  
  const { data: list } = useQuery<List>({
    queryKey: ["/api/lists", listId],
  });

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items", { listId }],
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{list?.name || "List"}</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            data-testid="button-update-list-prices"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Update Prices
          </Button>
          <AddItemModal />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-muted rounded-lg mb-2" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-2xl font-semibold mb-2">No items in this list</h3>
          <p className="text-muted-foreground mb-6">
            Add items to organize your wishlist
          </p>
          <AddItemModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
