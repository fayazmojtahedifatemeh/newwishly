import { TrendingDown, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRelativeTime } from "@/lib/utils";
import type { ActivityEvent, Item } from "@shared/schema";

interface ActivityEventWithItem extends ActivityEvent {
  item?: Item;
}

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery<ActivityEventWithItem[]>({
    queryKey: ["/api/activity"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-12 w-12 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Add items to see price changes and updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => {
            const isPriceDrop = activity.eventType === "price_drop";
            const isPriceRise = activity.eventType === "price_rise";
            const isAdded = activity.eventType === "item_added";
            
            return (
              <div
                key={activity.id}
                className="flex gap-4 items-start"
                data-testid={`activity-${activity.id}`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isPriceDrop ? "bg-success/10 text-success" :
                    isPriceRise ? "bg-destructive/10 text-destructive" :
                    "bg-primary/10 text-primary"
                  }`}
                >
                  {isPriceDrop && <TrendingDown className="h-5 w-5" />}
                  {isPriceRise && <TrendingUp className="h-5 w-5" />}
                  {isAdded && <ShoppingBag className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.item?.name || "Unknown Item"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {isPriceDrop && "Price dropped"}
                      {isPriceRise && "Price increased"}
                      {isAdded && "Added to wishlist"}
                      {activity.changePercent && ` ${activity.changePercent}`}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(new Date(activity.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
