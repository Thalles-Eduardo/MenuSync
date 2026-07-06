import type { Dish } from "../_data/dishes";

type Tab = "reviews" | "ingredients";

type Props = {
  dish: Dish;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow" aria-label={`${rating} de 5 estrelas`}>
      {"★".repeat(rating)}
      <span className="text-white/30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative pb-3 text-sm font-semibold transition-colors ${
        active ? "text-white" : "text-white/50 hover:text-white/80"
      }`}
    >
      {children}
      <span
        className={`absolute inset-x-0 -bottom-px h-0.5 origin-left rounded-full bg-salmon transition-transform duration-300 ease-out ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </button>
  );
}

export default function ReviewsPanel({ dish, activeTab, onTabChange }: Props) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="mb-4 flex gap-6 border-b border-white/15">
        <TabButton active={activeTab === "reviews"} onClick={() => onTabChange("reviews")}>
          Comentários
        </TabButton>
        <TabButton active={activeTab === "ingredients"} onClick={() => onTabChange("ingredients")}>
          Ingredientes
        </TabButton>
      </div>

      {activeTab === "reviews" ? (
        <ul className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
          {dish.reviews.map((review) => (
            <li key={review.author} className="review-card rounded-2xl bg-white/90 p-4 text-neutral-800">
              <div className="mb-2 flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full bg-neutral-900" />
                <span className="flex-1 text-sm font-bold">{review.author}</span>
                <Stars rating={review.rating} />
              </div>
              <p className="text-xs leading-relaxed text-neutral-600">{review.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {dish.ingredients.map((ingredient) => (
            <li key={ingredient} className="review-card rounded-xl bg-white/85 px-4 py-3 text-sm font-medium text-neutral-800">
              {ingredient}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
