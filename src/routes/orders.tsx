import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { listOrders } from "@/lib/food.functions";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Pantry Pal" },
      { name: "description", content: "Your recent meal orders." },
      { property: "og:title", content: "My orders — Pantry Pal" },
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
      {q.isPending && <Loader2 className="mx-auto mt-16 h-8 w-8 animate-spin text-primary" />}
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
            <div>
              <h3 className="font-bold">{o.meal_name}</h3>
              <p className="text-sm text-muted-foreground">{o.restaurant.name} · {new Date(o.created_at).toLocaleString()}</p>
            </div>
            <span className="font-display text-xl font-bold text-primary">${o.total.toFixed(2)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
