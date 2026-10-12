import type { Env } from "../game/types";

/** 原创情境线稿，仅作氛围示意；不代表位置、地图或尚未获得的情报。 */
export default function StageScene({ env, hero = false }: { env?: Env; hero?: boolean }) {
  const kind = env?.disaster ?? "earthquake";
  const snow = kind === "avalanche" || kind === "mudslide";
  const water = kind === "flood" || kind === "typhoon";
  return (
    <div className={`stage-scene scene-${kind}${hero ? " scene-hero" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 960 260" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <pattern id={hero ? "h-grid" : "s-grid"} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth=".4" /></pattern>
          <linearGradient id={hero ? "h-fog" : "s-fog"} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8da39d" stopOpacity=".08" /><stop offset="1" stopColor="#8da39d" stopOpacity=".32" /></linearGradient>
        </defs>
        <rect width="960" height="260" fill={`url(#${hero ? "h-grid" : "s-grid"})`} opacity=".25" />
        <circle cx="694" cy="69" r="105" fill="none" stroke="currentColor" opacity=".15" />
        <circle cx="694" cy="69" r="79" fill="none" stroke="currentColor" strokeDasharray="2 9" opacity=".3" />
        {snow ? <path d="M-30 250 187 48 279 151 391 17 580 204 710 86 1020 260Z" fill={`url(#${hero ? "h-fog" : "s-fog"})`} stroke="currentColor" strokeOpacity=".4" /> : <>
          <path d="M-10 210V101H79V176H109V61H171V208H207V115H258V83H319V204H342V129H411V221H453V69H503V24H549V198H580V96H618V211H649V113H720V63H786V210H820V140H865V96H971V260H-10Z" fill={`url(#${hero ? "h-fog" : "s-fog"})`} stroke="currentColor" strokeOpacity=".3" />
          <path d="m89 260 128-100 13 49 44-29 75 60 24-13 81 33M493 260l-46-83 104-51 28 58 88-22 71 98M812 260l38-73 60 15 50-42" fill="#18211f" stroke="#51625e" strokeWidth="1.5" />
          <path d="m475 177 35 21 47-10m-47 10 8 26m-276-43 4 40 52 5M124 76v114m16-114v69m367-106v70m13-70v114" fill="none" stroke="currentColor" opacity=".25" />
        </>}
        {water && <path d="M0 219q30-16 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0M0 241q40-14 80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0" fill="none" stroke="#6ba49b" opacity=".6" />}
        {kind === "fire" && <path d="m204 215q-26-38 5-74-4 35 15 42 12-13 13-36 30 46-6 68m330-11q-27-24-6-66 5 21 22 32 7-12 4-28 31 40 4 62" fill="#db9f4530" stroke="#bf8748" opacity=".65" />}
        {kind === "typhoon" && <path d="m220 20-80 140m260-150-80 140m260-140-80 140m260-140-80 140m260-140-80 140" stroke="currentColor" opacity=".3" />}
        <path d="M24 44V24H44m872 0h20v20M24 216v20h20m872 0h20v-20" stroke="#b2c6be" fill="none" />
        <path d="m674 58 9 9-9 9m39-18-9 9 9 9" stroke="#ffc365" fill="none" strokeWidth="2" />
        <path d="M24 258H936" stroke="#82958e" strokeDasharray="1 8" opacity=".5" />
      </svg>
      <div className="scene-caption"><span>FIELD / 情境示意</span><span>仍有选择，仍有余量。</span></div>
    </div>
  );
}
