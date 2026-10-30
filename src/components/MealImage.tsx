import { useState } from "react";
import { cn } from "@/lib/utils";
import { FoodLoader } from "./FoodLoader";

export function MealImage({ mealId, alt, className }: { mealId: string; alt: string; className?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {state === "loading" && (
        <div className="absolute inset-0 grid place-items-center">
          <FoodLoader size="sm" />
        </div>
      )}
      {state === "error" && <div className="absolute inset-0 grid place-items-center text-4xl">🍽️</div>}
      <img
        src={`/api/meal-image/${mealId}`}
        alt={alt}
        loading="lazy"
        onLoad={() => setState("ok")}
        onError={() => setState("error")}
        className={cn("h-full w-full object-cover transition-opacity duration-500", state === "ok" ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
