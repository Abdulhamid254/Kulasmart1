# Food Suggestions App

Note: Lovable builds on TanStack Start (React), not Next.js. The app will look and work exactly as described; only the underlying framework differs.

## What you get

1. **Home page**: type an ingredient (e.g. "chicken"), press Suggest.
2. **5 meal cards** appear (e.g. Chicken Tikka, Chicken Alfredo...), each with a short description, cook time and difficulty.
3. **Meal page** (click a card) with two tabs:
   - **Recipe**: ingredients list and step-by-step instructions.
   - **Order nearby**: 3-4 mock nearby restaurants serving that meal (name, rating, distance, price, delivery time).
4. **Order flow**: pick a restaurant, confirm, see "Order placed successfully with <restaurant>", then an animated delivery tracker (Preparing -> Picked up -> On the way -> Arriving) with a moving scooter loader and countdown.
5. **Recent orders** list, saved in your Neon database.

## Data and AI

- **OpenAI models** (through Lovable's built-in AI service, no OpenAI key needed) generate meal suggestions, recipes and mock restaurants as structured data.
- **Neon database** stores searches, generated meals/recipes (so repeat searches are instant and cheaper), and placed orders.
- You'll be shown a card to link your Neon connection.

## Design

Warm food-inspired look: cream background, tomato-red accent, herb-green highlights, bold serif headings with a clean sans body, food imagery-style cards.

## Technical details

- Link Neon via connector; create tables once through the gateway: `searches(id, ingredient, created_at)`, `meals(id, ingredient, name, description, cook_time, difficulty, recipe jsonb, restaurants jsonb)`, `orders(id, meal_name, restaurant jsonb, total, status, created_at)`.
- Server functions (`createServerFn`) for: `suggestMeals(ingredient)` (cache-check Neon, else AI with tool-calling JSON schema, then insert), `getMealDetails(mealId)` (lazy-generate recipe + restaurants), `placeOrder`, `listOrders`. Neon calls use the gateway helper (`neonQuery`/`neonExecute`) with parameterized SQL.
- AI via `@lovable.dev/ai-gateway` using an OpenAI model (e.g. `openai/gpt-5-mini`).
- Routes: `/`, `/meal/$mealId`, `/order/$orderId` (tracker, client-side timed stages), `/orders`.
