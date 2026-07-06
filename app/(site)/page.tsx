import HeroShowcase from "./_components/HeroShowcase";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return <HeroShowcase dishes={dishes} />;
}
