import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Clock, Flame, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestMeals } from "@/lib/food.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pantry Pal — What can I cook with this?" },
      { name: "description", content: "Enter any ingredient and get five meal ideas, full recipes and nearby restaurants to order from." },
      { property: "og:title", content: "Pantry Pal — What can I cook with this?" },
      { property: "og:description", content: "Enter any ingredient and get five meal ideas, recipes and restaurants." },
    ],
  }),
  component: Index,
});

const QUICK = ["Chicken", "Rice", "Beef", "Potato", "Salmon", "Eggs"];

function Index() {
  const [ingredient, setIngredient] = useState("");
  const suggest = useServerFn(suggestMeals);
  const m = useMutation({ mutationFn: (i: string) => suggest({ data: { ingredient: i } }) });

  const run = (i: string) => {
    if (i.trim().length < 2) return;
    setIngredient(i);
    m.mutate(i.trim());
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20">
      <section className="py-14 text-center md:py-20">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">One ingredient. Five ideas.</p>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-foreground md:text-6xl">
          What's in your <span className="text-primary">kitchen</span> today?
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(ingredient);
          }}
          className="mx-auto mt-8 flex max-w-xl gap-2 rounded-full border border-border bg-card p-2 shadow-card"
        >
          <div className="flex flex-1 items-center gap-2 pl-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              placeholder="e.g. chicken"
              maxLength={40}
              className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="rounded-full px-6">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suggest"}
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => run(q)}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:border-primary"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {m.isPending && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}
      {m.isError && <p className="text-center text-destructive">{(m.error as Error).message}</p>}
      {m.data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {m.data.map((meal, i) => (
            <Link
              key={meal.id}
              to="/meal/$mealId"
              params={{ mealId: meal.id }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-card"
            >
              <span className="font-display text-4xl font-extrabold text-primary/25">0{i + 1}</span>
              <h3 className="mt-1 text-xl font-bold text-card-foreground">{meal.name}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-accent">{meal.cuisine}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{meal.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{meal.cook_time}</span>
                  <span className="flex items-center gap-1"><Flame className="h-4 w-4" />{meal.difficulty}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
