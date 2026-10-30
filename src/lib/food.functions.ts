import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Meal, MealDetails, Order, Recipe, Restaurant } from "./types";

function fail(err: unknown, fallback: string): never {
  console.error(err);
  throw new Error(fallback);
}

export const suggestMeals = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ingredient: z.string().trim().min(2).max(40) }).parse(d))
  .handler(async ({ data }): Promise<Meal[]> => {
    const { neonQuery, neonExecute, neonUserError } = await import("./neon.server");
    const { askJson } = await import("./ai.server");
    const ingredient = data.ingredient.toLowerCase();
    const cols = "id, ingredient, name, description, cook_time, difficulty, cuisine";
    try {
      const cached = await neonQuery(
        `select ${cols} from fs_meals where ingredient = $1 order by created_at limit 5`,
        [ingredient],
      );
      if (cached.rows.length === 5) return cached.rows as Meal[];
    } catch (e) {
      fail(e, neonUserError(e));
    }
    let meals: Omit<Meal, "id" | "ingredient">[];
    try {
      const out = await askJson<{ meals: Omit<Meal, "id" | "ingredient">[] }>(
        'You are a chef. Suggest exactly 5 diverse, well-known meals. Shape: {"meals":[{"name":string,"description":string (1 sentence),"cook_time":string like "45 min","difficulty":"Easy"|"Medium"|"Hard","cuisine":string}]}',
        `Main ingredient: ${ingredient}`,
      );
      meals = (out.meals ?? []).slice(0, 5);
      if (meals.length === 0) throw new Error("no meals");
    } catch (e) {
      fail(e, "Couldn't come up with meals right now. Please try again.");
    }
    try {
      await neonExecute("delete from fs_meals where ingredient = $1", [ingredient]);
      const res = await neonExecute<{ results: { rows: Meal[] }[] }>(
        meals.map((m) => ({
          query: `insert into fs_meals (ingredient, name, description, cook_time, difficulty, cuisine) values ($1,$2,$3,$4,$5,$6) returning ${cols}`,
          params: [ingredient, m.name, m.description, m.cook_time, m.difficulty, m.cuisine],
        })),
      );
      return res.results.map((r) => r.rows[0]!);
    } catch (e) {
      fail(e, neonUserError(e));
    }
  });

export const getMealDetails = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<MealDetails | null> => {
    const { neonQuery, neonExecute, neonUserError } = await import("./neon.server");
    const { askJson } = await import("./ai.server");
    let row: any;
    try {
      const r = await neonQuery(
        "select id, ingredient, name, description, cook_time, difficulty, cuisine, recipe, restaurants from fs_meals where id = $1",
        [data.id],
      );
      row = r.rows[0];
    } catch (e) {
      fail(e, neonUserError(e));
    }
    if (!row) return null;
    if (row.recipe && row.restaurants) return row as unknown as MealDetails;
    let out: { recipe: Recipe; restaurants: Restaurant[] };
    try {
      out = await askJson(
        'You are a chef and a local food guide. Give a home recipe and 4 fictional nearby restaurants that serve this dish. Shape: {"recipe":{"servings":number,"ingredients":string[] (with quantities),"steps":string[]},"restaurants":[{"name":string,"rating":number 3.5-5,"distance_km":number 0.3-8,"price":number in USD,"delivery_minutes":number 15-50,"address":string}]}',
        `Dish: ${row.name} (${row.cuisine}). ${row.description}`,
      );
    } catch (e) {
      fail(e, "Couldn't load the recipe right now. Please try again.");
    }
    try {
      await neonExecute("update fs_meals set recipe = $2, restaurants = $3 where id = $1", [
        data.id,
        out.recipe,
        out.restaurants,
      ]);
    } catch (e) {
      console.error(e);
    }
    return { ...(row as unknown as Meal), recipe: out.recipe, restaurants: out.restaurants };
  });

const restaurantSchema = z.object({
  name: z.string().max(120),
  rating: z.number(),
  distance_km: z.number(),
  price: z.number().min(0).max(1000),
  delivery_minutes: z.number(),
  address: z.string().max(200),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ mealId: z.string().uuid(), mealName: z.string().max(120), restaurant: restaurantSchema }).parse(d),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { neonExecute, neonUserError } = await import("./neon.server");
    try {
      const total = Math.round((data.restaurant.price + 2.99) * 100) / 100;
      const r = await neonExecute(
        "insert into fs_orders (meal_id, meal_name, restaurant, total) values ($1,$2,$3,$4) returning id",
        [data.mealId, data.mealName, data.restaurant, total],
      );
      return { id: String(r.rows[0]?.id) };
    } catch (e) {
      fail(e, neonUserError(e));
    }
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<Order | null> => {
    const { neonQuery, neonUserError } = await import("./neon.server");
    try {
      const r = await neonQuery(
        "select id, meal_name, restaurant, total, to_json(created_at) as created_at from fs_orders where id = $1",
        [data.id],
      );
      const o = r.rows[0];
      return o ? ({ ...o, total: Number(o.total) } as unknown as Order) : null;
    } catch (e) {
      fail(e, neonUserError(e));
    }
  });

export const listOrders = createServerFn({ method: "GET" }).handler(async (): Promise<Order[]> => {
  const { neonQuery, neonUserError } = await import("./neon.server");
  try {
    const r = await neonQuery(
      "select id, meal_name, restaurant, total, to_json(created_at) as created_at from fs_orders order by created_at desc limit 30",
    );
    return r.rows.map((o) => ({ ...o, total: Number(o.total) }) as unknown as Order);
  } catch (e) {
    fail(e, neonUserError(e));
  }
});
