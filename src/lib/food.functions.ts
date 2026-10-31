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
      await neonExecute("update fs_meals set recipe = $2::jsonb, restaurants = $3::jsonb where id = $1", [
        data.id,
        JSON.stringify(out.recipe),
        JSON.stringify(out.restaurants),
      ]);
    } catch (e) {
      console.error(e);
    }
    return { ...(row as unknown as Meal), recipe: out.recipe, restaurants: out.restaurants };
  });

const DELIVERY_FEE = 2.99;

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        items: z
          .array(
            z.object({
              mealId: z.string().uuid(),
              mealName: z.string().max(120),
              restaurant: z.object({ name: z.string().max(120) }).passthrough(),
              qty: z.number().int().min(1).max(20),
            }),
          )
          .min(1)
          .max(30),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { neonQuery, neonExecute, neonUserError } = await import("./neon.server");
    try {
      // Prices come from the stored restaurant data, never from the browser.
      const ids = [...new Set(data.items.map((i) => i.mealId))];
      const meals = await neonQuery("select id, name, restaurants from fs_meals where id = any($1)", [ids]);
      const byId = new Map(meals.rows.map((m) => [String(m.id), m]));
      const items: OrderItem[] = data.items.map((i) => {
        const meal = byId.get(i.mealId);
        const r = (meal?.restaurants as Restaurant[] | null)?.find((x) => x.name === i.restaurant.name);
        if (!meal || !r) throw new Error("Item no longer available");
        return { mealId: i.mealId, mealName: String(meal.name), restaurant: r, qty: i.qty };
      });
      const restaurantCount = new Set(items.map((i) => i.restaurant.name)).size;
      const subtotal = items.reduce((s, i) => s + i.restaurant.price * i.qty, 0);
      const total = Math.round((subtotal + restaurantCount * DELIVERY_FEE) * 100) / 100;
      const summary = items.map((i) => (i.qty > 1 ? `${i.qty}× ${i.mealName}` : i.mealName)).join(", ").slice(0, 300);
      const r = await neonExecute(
        "insert into fs_orders (meal_id, meal_name, restaurant, items, total) values ($1,$2,$3::jsonb,$4::jsonb,$5) returning id",
        [items[0]!.mealId, summary, JSON.stringify(items[0]!.restaurant), JSON.stringify(items), total],
      );
      return { id: String(r.rows[0]?.id) };
    } catch (e) {
      if (e instanceof Error && e.message === "Item no longer available") throw e;
      fail(e, neonUserError(e));
    }
  });

const ORDER_COLS =
  "id, meal_id, meal_name, restaurant, items, total, to_json(created_at) as created_iso";

function toOrder(o: any): Order {
  const items: OrderItem[] =
    o.items ?? (o.restaurant ? [{ mealId: o.meal_id, mealName: o.meal_name, restaurant: o.restaurant, qty: 1 }] : []);
  return { id: String(o.id), summary: String(o.meal_name), items, total: Number(o.total), created_at: String(o.created_iso) };
}

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<Order | null> => {
    const { neonQuery, neonUserError } = await import("./neon.server");
    try {
      const r = await neonQuery(`select ${ORDER_COLS} from fs_orders where id = $1`, [data.id]);
      return r.rows[0] ? toOrder(r.rows[0]) : null;
    } catch (e) {
      fail(e, neonUserError(e));
    }
  });

export const listOrders = createServerFn({ method: "GET" }).handler(async (): Promise<Order[]> => {
  const { neonQuery, neonUserError } = await import("./neon.server");
  try {
    const r = await neonQuery(`select ${ORDER_COLS} from fs_orders order by created_at desc, id desc limit 30`);
    return r.rows.map(toOrder);
  } catch (e) {
    fail(e, neonUserError(e));
  }
});
