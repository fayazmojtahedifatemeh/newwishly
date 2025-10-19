import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme-provider";

const themes = [
  { value: "lavender-light", label: "Lavender Dreams", isDark: false },
  { value: "mint-light", label: "Mint Fresh", isDark: false },
  { value: "peach-light", label: "Peach Soft", isDark: false },
  { value: "midnight-dark", label: "Midnight Slate", isDark: true },
  { value: "forest-dark", label: "Forest Deep", isDark: true },
  { value: "plum-dark", label: "Plum Night", isDark: true },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-theme-selector"
          className="hover-elevate active-elevate-2"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            data-testid={`theme-${t.value}`}
            className="flex items-center justify-between"
          >
            <span>{t.label}</span>
            {theme === t.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
