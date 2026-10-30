import { createFileRoute } from "@tanstack/react-router";

const UUID = /^[0-9a-f-]{36}$/i;

export const Route = createFileRoute("/api/meal-image/$mealId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!UUID.test(params.mealId)) return new Response("Bad id", { status: 400 });
        const { neonQuery, neonExecute } = await import("@/lib/neon.server");
        try {
          const cached = await neonQuery("select mime, data from fs_meal_images where meal_id = $1", [params.mealId]);
          let row = cached.rows[0] as { mime: string; data: string } | undefined;
          if (!row) {
            const meal = (
              await neonQuery("select name, cuisine, description from fs_meals where id = $1", [params.mealId])
            ).rows[0];
            if (!meal) return new Response("Not found", { status: 404 });
            const { generateImage } = await import("@lovable.dev/ai-gateway");
            const img = await generateImage({
              model: "openai/gpt-image-2.5-sunburst",
              prompt: `Appetizing overhead food photograph of ${meal.name} (${meal.cuisine}): ${meal.description} Served on a rustic plate, warm natural light, shallow depth of field, no text.`,
              size: "1024x1024",
              quality: "low",
              output_format: "jpeg",
              output_compression: 70,
            });
            const b64 = img.data?.[0]?.b64_json;
            if (!b64) throw new Error("No image returned");
            row = { mime: "image/jpeg", data: b64 };
            await neonExecute(
              "insert into fs_meal_images (meal_id, mime, data) values ($1,$2,$3) on conflict (meal_id) do nothing",
              [params.mealId, row.mime, row.data],
            );
          }
          const bytes = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
          return new Response(bytes, {
            headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable" },
          });
        } catch (e) {
          console.error(e);
          return new Response("Image unavailable", { status: 503 });
        }
      },
    },
  },
});
