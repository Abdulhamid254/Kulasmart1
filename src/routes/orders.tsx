import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FoodLoader } from "@/components/FoodLoader";
import { MealImage } from "@/components/MealImage";
import { listOrders } from "@/lib/food.functions";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — KulaSmart" },
      { name: "description", content: "Your recent meal orders." },
      { property: "og:title", content: "My orders — KulaSmart" },
      { property: "og:description", content: "Your recent meal orders." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const q = useQuery({ queryKey: ["orders"], queryFn: () => listOrders() });
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
      <h1 className="text-4xl font-extrabold">My orders</h1>
      {q.isPending && <div className="mt-16"><FoodLoader label="Fetching your orders…" /></div>}
      {q.isError && <p className="mt-8 text-destructive">{(q.error as Error).message}</p>}
      {q.data?.length === 0 && (
        <p className="mt-8 text-muted-foreground">No orders yet. <Link to="/" className="text-primary underline">Find a meal</Link></p>
      )}
      <div className="mt-6 space-y-3">
        {q.data?.map((o) => (
          <Link
            key={o.id}
            to="/order/$orderId"
            params={{ orderId: o.id }}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary"
          >
            <div className="flex min-w-0 items-center gap-4">
              {o.items[0] && <MealImage mealId={o.items[0].mealId} alt={o.summary} className="h-14 w-14 shrink-0 rounded-xl" />}
              <div className="min-w-0">
                <h3 className="truncate font-bold">{o.summary}</h3>
                <p className="truncate text-sm text-muted-foreground">
                  {[...new Set(o.items.map((i) => i.restaurant.name))].join(", ")} · {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <span className="font-display text-xl font-bold text-primary">${o.total.toFixed(2)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
