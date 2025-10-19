import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2, FileText } from "lucide-react";

interface ImportCSVDialogProps {
  trigger?: React.ReactNode;
}

export function ImportCSVDialog({ trigger }: ImportCSVDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (items: Array<{ url: string; name?: string }>) => {
      return await apiRequest("POST", "/api/items/import-csv", { items });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setFile(null);
      setOpen(false);
      toast({
        title: "Import successful",
        description: `Imported ${data.imported} out of ${data.total} items. They are being processed in the background.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string): Array<{ url: string; name?: string }> => {
    const lines = text.split("\n").filter(line => line.trim());
    const items: Array<{ url: string; name?: string }> = [];
    
    let hasHeader = false;
    let urlIndex = 0;
    let nameIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map(part => part.trim().replace(/^["']|["']$/g, ""));

      if (i === 0) {
        const lowerParts = parts.map(p => p.toLowerCase());
        if (lowerParts.includes("url") || lowerParts.includes("link") || lowerParts.includes("product url")) {
          hasHeader = true;
          urlIndex = lowerParts.findIndex(p => p === "url" || p === "link" || p === "product url");
          nameIndex = lowerParts.findIndex(p => p === "name" || p === "product name" || p === "title");
          continue;
        }
      }

      if (parts.length > 0 && parts[urlIndex]) {
        const url = parts[urlIndex];
        const name = nameIndex >= 0 && parts[nameIndex] ? parts[nameIndex] : undefined;
        
        if (url.startsWith("http://") || url.startsWith("https://")) {
          items.push({ url, name });
        }
      }
    }

    return items;
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        toast({
          title: "No valid items found",
          description: "Please ensure your CSV has valid URLs in the first column or a 'url' column",
          variant: "destructive",
        });
        return;
      }

      importMutation.mutate(items);
    } catch (error) {
      toast({
        title: "Failed to read file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="default"
            className="gap-2"
            data-testid="button-import-csv"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Items from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with product URLs. The file should have a 'url' column or URLs in the first column.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover-elevate cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileChange}
              data-testid="input-csv-file"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              {file ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV files only
                  </p>
                </>
              )}
            </label>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">CSV Format:</p>
            <pre className="text-xs text-muted-foreground">
              url,name{"\n"}
              https://example.com/product1,Product Name{"\n"}
              https://example.com/product2,Another Product
            </pre>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-import"
            >
              {importMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Import {file && `(${file.name})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
