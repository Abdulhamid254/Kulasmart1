import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bike, Check, CheckCircle2, ChefHat, Home, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrder } from "@/lib/food.functions";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Your order is on the way — Pantry Pal" },
      { name: "description", content: "Track your meal delivery live." },
      { property: "og:title", content: "Your order is on the way — Pantry Pal" },
      { property: "og:description", content: "Track your meal delivery live." },
    ],
  }),
  component: OrderPage,
});

const STAGES = [
  { label: "Order confirmed", icon: Check },
  { label: "Preparing your meal", icon: ChefHat },
  { label: "Picked up", icon: Package },
  { label: "On the way", icon: Bike },
  { label: "Delivered", icon: Home },
];
const TOTAL_SECONDS = 40;

function OrderPage() {
  const { orderId } = Route.useParams();
  const q = useQuery({ queryKey: ["order", orderId], queryFn: () => getOrder({ data: { id: orderId } }) });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => Math.min(e + 1, TOTAL_SECONDS)), 1000);
    return () => clearInterval(t);
  }, []);

  if (q.isPending) return <div className="grid place-items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!q.data) return <p className="py-32 text-center text-destructive">Order not found.</p>;

  const o = q.data;
  const progress = elapsed / TOTAL_SECONDS;
  const stage = Math.min(STAGES.length - 1, Math.floor(progress * (STAGES.length - 1) + 0.0001));
  const done = elapsed >= TOTAL_SECONDS;
  const minsLeft = Math.max(0, Math.ceil(o.restaurant.delivery_minutes * (1 - progress)));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-20">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
        <h1 className="mt-3 text-3xl font-extrabold">Order placed successfully!</h1>
        <p className="mt-2 text-muted-foreground">
          <b className="text-foreground">{o.meal_name}</b> from <b className="text-foreground">{o.restaurant.name}</b> · ${o.total.toFixed(2)}
        </p>

        <div className="mt-10">
          <p className="font-display text-2xl font-bold text-primary">
            {done ? "Enjoy your meal! 🍽️" : `${STAGES[stage].label}… ~${minsLeft} min`}
          </p>
          <div className="relative mt-8 h-12">
            <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-muted" />
            <div className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-warm transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
            <div
              className="absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-all duration-1000"
              style={{ left: `calc(${progress * 100}% - ${progress * 2.5}rem)` }}
            >
              <Bike className={`h-5 w-5 ${done ? "" : "animate-bob"}`} />
            </div>
          </div>
        </div>

        <ol className="mt-10 space-y-3 text-left">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const state = i < stage || done ? "done" : i === stage ? "now" : "todo";
            return (
              <li key={s.label} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${state === "done" ? "bg-accent text-accent-foreground" : state === "now" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {state === "now" && !done ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={state === "todo" ? "text-muted-foreground" : "font-medium"}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/orders">My orders</Link></Button>
          <Button asChild><Link to="/">Find another meal</Link></Button>
        </div>
      </div>
    </main>
  );
}
