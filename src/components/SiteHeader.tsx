import { Link } from "@tanstack/react-router";
import { ChefHat } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-warm text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </span>
          Pantry Pal
        </Link>
        <Link
          to="/orders"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
          activeProps={{ className: "text-primary" }}
        >
          My orders
        </Link>
      </div>
    </header>
  );
}
