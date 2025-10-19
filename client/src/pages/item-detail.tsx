import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ChevronLeft, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Item, PriceHistory } from "@shared/schema";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ItemDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const { data: item, isLoading } = useQuery<Item>({
    queryKey: ["/api/items", id],
  });

  const { data: priceHistory = [] } = useQuery<PriceHistory[]>({
    queryKey: ["/api/items", id, "price-history"],
    enabled: !!id,
  });

  const findSimilarMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/items/${id}/find-similar`, {});
    },
    onSuccess: () => {
      toast({
        title: "Finding similar items",
        description: "Results will appear in a moment",
      });
    },
  });

  const updateSizeMutation = useMutation({
    mutationFn: async (size: string) => {
      return await apiRequest("PATCH", `/api/items/${id}`, { selectedSize: size });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", id] });
    },
  });

  const updateColorMutation = useMutation({
    mutationFn: async (color: string) => {
      return await apiRequest("PATCH", `/api/items/${id}`, { selectedColor: color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-semibold mb-2">Item not found</h2>
            <p className="text-muted-foreground mb-4">
              This item doesn't exist or has been removed
            </p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = priceHistory.map((entry) => ({
    date: new Date(entry.recordedAt).toLocaleDateString(),
    price: parseFloat(entry.price.replace(/[^0-9.]/g, "")),
  }));

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to All Items
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[selectedImageIndex]}
                alt={item.name}
                className="w-full h-full object-cover"
                data-testid="img-main"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>
          
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded-md overflow-hidden border-2 hover-elevate ${
                    selectedImageIndex === index ? "border-primary" : "border-transparent"
                  }`}
                  data-testid={`img-thumb-${index}`}
                >
                  <img
                    src={img}
                    alt={`${item.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-item-name">
              {item.name}
            </h1>
            {item.storeName && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                data-testid="link-store"
              >
                <ExternalLink className="h-3 w-3" />
                {item.storeName}
              </a>
            )}
          </div>

          {item.price && (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono" data-testid="text-current-price">
                {formatPrice(item.price)}
              </span>
              {!item.inStock && (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          )}

          {/* Size Selector */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Select
                value={item.selectedSize || ""}
                onValueChange={(value) => updateSizeMutation.mutate(value)}
                data-testid="select-size"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {item.sizes.map((size) => (
                    <SelectItem key={size} value={size} data-testid={`size-option-${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color Selector */}
          {item.colors && item.colors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {item.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => updateColorMutation.mutate(color.name)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium hover-elevate ${
                      item.selectedColor === color.name
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}
                    data-testid={`color-option-${color.name}`}
                  >
                    {color.hex && (
                      <span
                        className="inline-block w-4 h-4 rounded-full mr-2 border"
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => findSimilarMutation.mutate()}
            disabled={findSimilarMutation.isPending}
            data-testid="button-find-similar"
          >
            <Search className="h-4 w-4" />
            Find Similar Items
          </Button>

          <Button
            asChild
            className="w-full"
            data-testid="button-visit-store"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Store
            </a>
          </Button>
        </div>
      </div>

      {/* Price History */}
      {chartData.length > 1 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Price History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
