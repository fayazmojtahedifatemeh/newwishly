import { Plus, ShoppingBag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { getCategoryIcon } from "@/lib/utils";
import type { List } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: lists = [] } = useQuery<List[]>({
    queryKey: ["/api/lists"],
  });

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName.split("-").map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join("")];
    return IconComponent || ShoppingBag;
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 px-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Wishly</h1>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/"}
                  data-testid="link-all-items"
                >
                  <Link href="/">
                    <ShoppingBag className="h-5 w-5" />
                    <span>All Items</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {lists.map((list) => {
                const IconComponent = getIcon(list.icon);
                return (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/list/${list.id}`}
                      data-testid={`link-list-${list.id}`}
                    >
                      <Link href={`/list/${list.id}`}>
                        <IconComponent className="h-5 w-5" />
                        <span>{list.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          data-testid="button-create-list"
        >
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
