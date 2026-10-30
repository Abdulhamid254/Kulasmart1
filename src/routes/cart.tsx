import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bike, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MealImage } from "@/components/MealImage";
import { DELIVERY_FEE, useCart } from "@/lib/cart";
import { placeOrder } from "@/lib/food.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — KulaSmart" },
      { name: "description", content: "Review your meals and place one order." },
      { property: "og:title", content: "Your cart — KulaSmart" },
      { property: "og:description", content: "Review your meals and place one order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const order = useServerFn(placeOrder);
  const restaurants = [...new Set(cart.items.map((i) => i.restaurant.name))];
  const delivery = restaurants.length * DELIVERY_FEE;
  const m = useMutation({
    mutationFn: () =>
      order({
        data: {
          items: cart.items.map((i) => ({ mealId: i.mealId, mealName: i.mealName, restaurant: i.restaurant, qty: i.qty })),
        },
      }),
    onSuccess: ({ id }) => {
      toast.success(`Order placed successfully with ${restaurants.join(", ")}!`);
      cart.clear();
      navigate({ to: "/order/$orderId", params: { orderId: id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
      <h1 className="text-4xl font-extrabold">Your cart</h1>
      {cart.items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Your cart is empty. <Link to="/" className="text-primary underline">Find something tasty</Link>
        </p>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {cart.items.map((i) => (
              <div key={i.key} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
                <MealImage mealId={i.mealId} alt={i.mealName} className="h-20 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{i.mealName}</h3>
                  <p className="truncate text-sm text-muted-foreground">{i.restaurant.name}</p>
                  <p className="text-sm font-semibold text-primary">${(i.restaurant.price * i.qty).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" onClick={() => cart.setQty(i.key, i.qty - 1)} aria-label="Decrease">
                    {i.qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </Button>
                  <span className="w-8 text-center font-semibold">{i.qty}</span>
                  <Button size="icon" variant="outline" onClick={() => cart.setQty(i.key, i.qty + 1)} aria-label="Increase">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 rounded-2xl bg-secondary p-5 text-sm text-secondary-foreground">
            <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between">
              <span>Delivery ({restaurants.length} restaurant{restaurants.length > 1 ? "s" : ""})</span>
              <span>${delivery.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-xl font-bold text-foreground">
              <span>Total</span><span>${(cart.subtotal + delivery).toFixed(2)}</span>
            </div>
            <Button className="mt-3 w-full" size="lg" disabled={m.isPending} onClick={() => m.mutate()}>
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bike className="h-4 w-4" /> Place order</>}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
