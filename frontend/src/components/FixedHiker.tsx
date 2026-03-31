import HikerSVG from './HikerSVG';

export default function FixedHiker() {
  return (
    <div className="hidden lg:flex fixed bottom-0 right-[30px] z-[200] items-end hiker-bob pointer-events-none">
      <HikerSVG />
    </div>
  );
}
