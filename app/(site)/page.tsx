import HeroShowcase from "./_components/HeroShowcase";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HeroShowcase dishes={dishes} />
    </>
  );
}
