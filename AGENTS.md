<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data lives in the user's Neon DB (tables `fs_meals`, `fs_orders`), accessed only via `src/lib/neon.server.ts` gateway helpers from server functions in `src/lib/food.functions.ts`; jsonb params are sent as JSON strings with `::jsonb` casts — arrays would otherwise be sent as Postgres arrays.
- AI calls go through `@lovable.dev/ai-gateway` in `src/lib/ai.server.ts` (JSON-object chat completions); meals are cached per ingredient and recipe/restaurants generated lazily on first view to save cost.
- Meal photos are AI-generated lazily by the `/api/meal-image/$mealId` server route and cached as base64 in `fs_meal_images`, so each image is generated only once.
- Cart lives in browser localStorage (`src/lib/cart.tsx`); order prices are re-read server-side from `fs_meals.restaurants`, never trusted from the browser.
