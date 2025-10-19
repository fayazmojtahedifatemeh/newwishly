import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Item, List } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface EditItemDialogProps {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const [name, setName] = useState(item.name);
  const [selectedSize, setSelectedSize] = useState(item.selectedSize || "");
  const [selectedColor, setSelectedColor] = useState(item.selectedColor || "");
  const [selectedList, setSelectedList] = useState(item.listId || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery<List[]>({
    queryKey: ["/api/lists"],
  });

  useEffect(() => {
    if (open) {
      setName(item.name);
      setSelectedSize(item.selectedSize || "");
      setSelectedColor(item.selectedColor || "");
      setSelectedList(item.listId || "");
    }
  }, [open, item]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Item>) => {
      return await apiRequest("PATCH", `/api/items/${item.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items", item.id] });
      onOpenChange(false);
      toast({
        title: "Item updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    updateMutation.mutate({
      name: name.trim(),
      selectedSize: selectedSize || undefined,
      selectedColor: selectedColor || undefined,
      listId: selectedList || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the item details and preferences
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Item Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              data-testid="input-edit-name"
              autoFocus
            />
          </div>

          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-size">Size</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger id="edit-size" data-testid="select-edit-size">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No size selected</SelectItem>
                  {item.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {item.colors && item.colors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger id="edit-color" data-testid="select-edit-color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No color selected</SelectItem>
                  {item.colors.map((color) => (
                    <SelectItem key={color.name} value={color.name}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-list">Category</Label>
            <Select value={selectedList} onValueChange={setSelectedList}>
              <SelectTrigger id="edit-list" data-testid="select-edit-list">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
