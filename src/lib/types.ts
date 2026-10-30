export type Recipe = {
  servings: number;
  ingredients: string[];
  steps: string[];
};

export type Restaurant = {
  name: string;
  rating: number;
  distance_km: number;
  price: number;
  delivery_minutes: number;
  address: string;
};

export type Meal = {
  id: string;
  ingredient: string;
  name: string;
  description: string;
  cook_time: string;
  difficulty: string;
  cuisine: string;
};

export type MealDetails = Meal & { recipe: Recipe; restaurants: Restaurant[] };

export type Order = {
  id: string;
  meal_name: string;
  restaurant: Restaurant;
  total: number;
  created_at: string;
};
