import { Link } from "@tanstack/react-router";
import { ChefHat, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-warm text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </span>
          Kula<span className="-ml-2 text-primary">Smart</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>
            My orders
          </Link>
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
