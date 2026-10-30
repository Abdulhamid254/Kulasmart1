import { cn } from "@/lib/utils";

const FOODS = ["🍗", "🍛", "🍝", "🥘", "🍲"];

export function FoodLoader({ label, size = "md" }: { label?: string; size?: "sm" | "md" }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label ?? "Loading"}>
      <div className={cn("relative", size === "sm" ? "h-12 w-16" : "h-20 w-28")}>
        {/* pot */}
        <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 rounded-b-full bg-primary", size === "sm" ? "h-6 w-12" : "h-10 w-20")} />
        <div className={cn("absolute left-1/2 -translate-x-1/2 rounded-full bg-primary/80", size === "sm" ? "bottom-6 h-1.5 w-14" : "bottom-10 h-2 w-24")} />
        {/* steam */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("animate-steam absolute rounded-full bg-muted-foreground/30", size === "sm" ? "bottom-7 h-3 w-1" : "bottom-12 h-5 w-1.5")}
            style={{ left: `${30 + i * 20}%`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </div>
      {size === "md" && (
        <div className="flex gap-1 text-2xl">
          {FOODS.map((f, i) => (
            <span key={f} className="animate-hop inline-block" style={{ animationDelay: `${i * 0.15}s` }}>{f}</span>
          ))}
        </div>
      )}
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
