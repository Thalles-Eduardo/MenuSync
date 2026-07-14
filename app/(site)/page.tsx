import SectionStage from "./_components/SectionStage";
import Loader from "./_components/Loader";
import { dishes } from "./_data/dishes";

export default function SiteHome() {
  return (
    <>
      <Loader />
      <SectionStage dishes={dishes} />
    </>
  );
}
