import HomeExperience from "./_components/HomeExperience";
import AboutSection from "./_components/AboutSection";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <HomeExperience dishes={dishes} />
      <AboutSection />
    </>
  );
}
