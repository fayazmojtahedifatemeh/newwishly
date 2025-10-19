import { ExternalLink, AlertCircle, Loader2, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/utils";
import type { Item } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditItemDialog } from "./edit-item-dialog";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/items/${item.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "Item deleted",
        description: "The item has been removed from your wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };
  
  return (
    <>
      <Link href={`/item/${item.id}`}>
        <Card
          className="group overflow-hidden hover-elevate active-elevate-2 transition-all cursor-pointer relative"
          data-testid={`card-item-${item.id}`}
        >
          <div className="aspect-[4/5] relative bg-muted overflow-hidden">
            {mainImage ? (
              <img
                src={mainImage}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            
            {item.status === "pending" && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {item.status === "failed" && (
              <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
            
            {item.price && item.status === "processed" && (
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                <span className="text-sm font-mono font-bold" data-testid={`text-price-${item.id}`}>
                  {formatPrice(item.price)}
                </span>
              </div>
            )}
            
            {!item.inStock && item.status === "processed" && (
              <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-center py-1 text-xs font-medium">
                Out of Stock
              </div>
            )}

            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                onClick={handleEdit}
                data-testid={`button-edit-${item.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 bg-destructive/90 backdrop-blur-sm hover:bg-destructive"
                onClick={handleDelete}
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-medium text-sm line-clamp-2 mb-2" data-testid={`text-name-${item.id}`}>
              {item.name}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {item.selectedSize && (
                <Badge variant="secondary" className="text-xs">
                  {item.selectedSize}
                </Badge>
              )}
              
              {item.selectedColor && (
                <Badge variant="secondary" className="text-xs">
                  {item.selectedColor}
                </Badge>
              )}
              
              {item.storeName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{item.storeName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => e.stopPropagation()}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditItemDialog
        item={item}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
