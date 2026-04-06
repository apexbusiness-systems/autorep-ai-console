import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar & Header */}
      <div className="flex flex-col flex-1 w-full overflow-hidden relative">
        <header className="flex md:hidden items-center p-4 border-b border-sidebar-border bg-sidebar shrink-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
              <AppSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Door Step Auto" className="h-8 w-auto object-contain rounded-sm" />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full bg-background scroll-smooth">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};

export default AppLayout;
