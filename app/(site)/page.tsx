import HeroShowcase from "./_components/HeroShowcase";
import IntroExperience from "./_components/intro/IntroExperience";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <IntroExperience />
      <HeroShowcase dishes={dishes} />
    </>
  );
}
