import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-6xl font-bold text-gold/30">404</p>
          <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button variant="gold-outline" asChild>
            <a href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Console</a>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
