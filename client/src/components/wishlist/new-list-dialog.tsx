import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";

const ICON_OPTIONS = [
  { value: "shopping-bag", label: "Shopping Bag" },
  { value: "shirt", label: "Shirt" },
  { value: "monitor", label: "Electronics" },
  { value: "book", label: "Books" },
  { value: "home", label: "Home" },
  { value: "sparkles", label: "Beauty" },
  { value: "utensils", label: "Kitchen" },
  { value: "dumbbell", label: "Sports" },
  { value: "gamepad2", label: "Gaming" },
  { value: "heart", label: "Favorites" },
  { value: "star", label: "Wishlist" },
  { value: "gift", label: "Gifts" },
];

interface NewListDialogProps {
  trigger?: React.ReactNode;
}

export function NewListDialog({ trigger }: NewListDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("shopping-bag");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      return await apiRequest("POST", "/api/lists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setName("");
      setIcon("shopping-bag");
      setOpen(false);
      toast({
        title: "List created",
        description: "Your new category has been created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), icon });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            data-testid="button-create-list"
          >
            <Plus className="h-4 w-4" />
            New List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new category to organize your wishlist items
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dresses, Electronics, Books"
              data-testid="input-list-name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-icon">Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger id="list-icon" data-testid="select-list-icon">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-list"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              data-testid="button-save-list"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
