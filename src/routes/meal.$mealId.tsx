import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Bike, Clock, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMealDetails, placeOrder } from "@/lib/food.functions";
import type { Restaurant } from "@/lib/types";

const mealQuery = (id: string) =>
  queryOptions({ queryKey: ["meal", id], queryFn: () => getMealDetails({ data: { id } }), staleTime: Infinity });

export const Route = createFileRoute("/meal/$mealId")({
  head: () => ({
    meta: [
      { title: "Recipe & nearby restaurants — Pantry Pal" },
      { name: "description", content: "Cook it yourself with a step-by-step recipe, or order it from a nearby restaurant." },
      { property: "og:title", content: "Recipe & nearby restaurants — Pantry Pal" },
      { property: "og:description", content: "Cook it yourself or order it nearby." },
    ],
  }),
  component: MealPage,
});

function MealPage() {
  const { mealId } = Route.useParams();
  const q = useQuery(mealQuery(mealId));
  const navigate = useNavigate();
  const order = useServerFn(placeOrder);
  const [picked, setPicked] = useState<Restaurant | null>(null);
  const m = useMutation({
    mutationFn: (r: Restaurant) => order({ data: { mealId, mealName: q.data!.name, restaurant: r } }),
    onSuccess: ({ id }, r) => {
      toast.success(`Order placed successfully with ${r.name}!`);
      navigate({ to: "/order/$orderId", params: { orderId: id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isPending)
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        Cooking up the recipe and finding restaurants…
      </div>
    );
  if (q.isError || !q.data)
    return <p className="py-32 text-center text-destructive">{q.error ? (q.error as Error).message : "Meal not found."}</p>;

  const meal = q.data;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to ideas
      </Link>
      <div className="mt-4 rounded-3xl bg-warm p-8 text-primary-foreground shadow-card">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-80">{meal.cuisine}</p>
        <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{meal.name}</h1>
        <p className="mt-3 max-w-2xl opacity-90">{meal.description}</p>
        <p className="mt-4 text-sm opacity-90">{meal.cook_time} · {meal.difficulty} · Serves {meal.recipe.servings}</p>
      </div>

      <Tabs defaultValue="recipe" className="mt-8">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="recipe">Cook it</TabsTrigger>
          <TabsTrigger value="order">Order nearby</TabsTrigger>
        </TabsList>

        <TabsContent value="recipe" className="mt-6 grid gap-8 md:grid-cols-[1fr_1.6fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Ingredients</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {meal.recipe.ingredients.map((i) => (
                <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">Method</h2>
            <ol className="mt-4 space-y-4">
              {meal.recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <p className="pt-1 text-sm leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="order" className="mt-6">
          <div className="grid gap-3">
            {meal.restaurants.map((r) => {
              const active = picked?.name === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => setPicked(r)}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 text-left transition ${active ? "border-primary shadow-card" : "border-border hover:border-primary/50"}`}
                >
                  <div>
                    <h3 className="text-lg font-bold">{r.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{r.address}</p>
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-current text-chart-3" />{r.rating.toFixed(1)}</span>
                      <span>{r.distance_km.toFixed(1)} km</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{r.delivery_minutes} min</span>
                    </div>
                  </div>
                  <span className="font-display text-2xl font-bold text-primary">${r.price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary p-5">
            <p className="text-sm text-secondary-foreground">
              {picked ? <>Ordering from <b>{picked.name}</b> · ${(picked.price + 2.99).toFixed(2)} incl. delivery</> : "Choose a restaurant above"}
            </p>
            <Button disabled={!picked || m.isPending} onClick={() => picked && m.mutate(picked)}>
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bike className="h-4 w-4" /> Place order</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
