import { RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/wishlist/item-card";
import { ActivityFeed } from "@/components/wishlist/activity-feed";
import { AddItemModal } from "@/components/wishlist/add-item-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Item } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const updatePricesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/items/update-prices", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Updating prices",
        description: "Price updates are being processed in the background",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Items</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} in your wishlist
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => updatePricesMutation.mutate()}
            disabled={updatePricesMutation.isPending}
            data-testid="button-update-all-prices"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updatePricesMutation.isPending ? "animate-spin" : ""}`} />
            Update All Prices
          </Button>
          <AddItemModal />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your wishlist by adding items from any store
              </p>
              <AddItemModal />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
