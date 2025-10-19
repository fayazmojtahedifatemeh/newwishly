import { useState } from "react";
import { Plus, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function AddItemModal() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addItemMutation = useMutation({
    mutationFn: async (data: { url: string }) => {
      return await apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setUrl("");
      setOpen(false);
      toast({
        title: "Item added",
        description: "Your item is being processed in the background",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const searchByImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/items/search-by-image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to search by image");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Image search complete",
        description: `Found ${data.results?.length || 0} results`,
      });
      // Results will be shown in a bottom sheet modal
    },
    onError: (error: Error) => {
      toast({
        title: "Image search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddByUrl = () => {
    if (!url.trim()) return;
    addItemMutation.mutate({ url: url.trim() });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      searchByImageMutation.mutate(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="default"
          className="gap-2"
          data-testid="button-add-item"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add an item by URL or upload an image to find products
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" data-testid="tab-url">
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </TabsTrigger>
            <TabsTrigger value="image" data-testid="tab-image">
              <Upload className="h-4 w-4 mr-2" />
              From Image
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/product"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddByUrl()}
                data-testid="input-url"
                autoFocus
              />
            </div>
            
            <Button
              onClick={handleAddByUrl}
              disabled={!url.trim() || addItemMutation.isPending}
              className="w-full"
              data-testid="button-submit-url"
            >
              {addItemMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Item
            </Button>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover-elevate cursor-pointer">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-image"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {searchByImageMutation.isPending ? (
                    <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {searchByImageMutation.isPending
                      ? "Searching for products..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
