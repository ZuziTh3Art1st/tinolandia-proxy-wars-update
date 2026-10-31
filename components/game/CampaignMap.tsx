"use client";

import { useEffect, useMemo, useState } from "react";
import { GameState } from "@/lib/types";

type Point = [number, number];
type BoundaryFeature = {
  properties: { ADMIN?: string; ISO_A2?: string; ADM0_A3?: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][][] | number[][][] };
};

const COORDS = Object.fromEntries([
  ["AF",[34,66]], ["AL",[41,20]], ["DZ",[28,3]], ["AO",[-12,18]], ["AR",[-38,-64]], ["AU",[-25,134]], ["AT",[47,14]], ["BD",[24,90]], ["BE",[51,5]], ["BJ",[9,2]], ["BR",[-10,-53]], ["CA",[57,-106]], ["CD",[-3,23]], ["CH",[47,8]], ["CL",[-33,-71]], ["CN",[35,104]], ["CO",[4,-73]], ["CU",[22,-79]], ["DE",[51,10]], ["DJ",[12,43]], ["DM",[15,-61]], ["DO",[19,-70]], ["DZ",[28,3]], ["EC",[-2,-77]], ["EG",[27,30]], ["ER",[15,39]], ["ES",[40,-4]], ["ET",[9,40]], ["FI",[64,26]], ["FJ",[-18,178]], ["FR",[47,2]], ["GB",[54,-2]], ["GE",[42,44]], ["GH",[8,-2]], ["GR",[39,22]], ["GT",[15,-90]], ["HT",[19,-72]], ["ID",[-2,118]], ["IE",[53,-8]], ["IL",[31,35]], ["IN",[22,79]], ["IQ",[33,44]], ["IR",[32,53]], ["IS",[65,-19]], ["IT",[42,12]], ["JM",[18,-77]], ["JP",[37,138]], ["KE",[0,38]], ["KR",[36,128]], ["MA",[32,-6]], ["MG",[-19,47]], ["ML",[18,-4]], ["MM",[21,96]], ["MX",[23,-102]], ["MZ",[-19,35]], ["NG",[9,8]], ["NL",[52,5]], ["NP",[28,84]], ["NZ",[-42,173]], ["PE",[-10,-76]], ["PH",[13,122]], ["PK",[30,70]], ["PL",[52,20]], ["PT",[39,-8]], ["RU",[60,100]], ["SA",[24,45]], ["SC",[-5,55]], ["SD",[15,30]], ["SE",[62,16]], ["SG",[1,104]], ["SO",[5,46]], ["SZ",[-26,31]], ["TH",[16,101]], ["TR",[39,35]], ["TZ",[-6,35]], ["UA",[49,32]], ["UG",[1,32]], ["US",[39,-98]], ["VE",[8,-66]], ["VN",[16,108]], ["WF",[-13,-176]], ["ZA",[-29,25]], ["ZM",[-14,28]], ["ZW",[-19,30]], ["KM",[-12,44]], ["CV",[16,-24]], ["KI",[1,173]], ["TO",[-21,-175]], ["WS",[-13,-172]], ["FM",[7,158]], ["SB",[-9,160]], ["VU",[-16,167]], ["NR",[-1,167]], ["TV",[-8,178]], ["PG",[-6,147]], ["PW",[7,134]], ["MH",[7,171]], ["KI",[1,173]], ["LC",[14,-61]], ["VC",[13,-61]], ["GD",[12,-61]], ["AG",[17,-61]], ["KN",[17,-63]], ["BB",[13,-59]], ["BS",[25,-77]], ["BZ",[17,-88]], ["CR",[10,-84]], ["PA",[9,-80]], ["GY",[5,-59]], ["SR",[4,-56]], ["PY",[-23,-58]], ["BO",[-17,-65]], ["UY",[-33,-56]], ["CF",[7,21]], ["CM",[6,12]], ["CI",[7,-5]], ["SN",[14,-14]], ["TN",[34,9]], ["LY",[27,17]], ["MR",[20,-10]], ["NE",[17,9]], ["TD",[15,19]], ["BF",[12,-2]], ["GA",[0,11]], ["GQ",[2,10]], ["GM",[13,-16]], ["GN",[11,-10]], ["GW",[12,-15]], ["SL",[8,-12]], ["LR",[6,-9]], ["TG",[8,1]], ["RW",[-2,30]], ["BI",[-3,30]], ["MW",[-13,34]], ["LS",[-29,28]], ["BW",[-22,24]], ["NA",[-22,17]], ["MU",[-20,57]], ["ST",[1,7]], ["SS",[7,30]], ["XK",[42,21]], ["BA",[44,18]], ["HR",[45,16]], ["SI",[46,15]], ["MK",[41,22]], ["MD",[47,29]], ["BY",[53,28]], ["EE",[59,26]], ["LV",[57,25]], ["LT",[56,24]], ["NO",[62,10]], ["DK",[56,10]], ["CZ",[49,15]], ["SK",[48,19]], ["HU",[47,19]], ["RO",[46,25]], ["BG",[43,25]], ["RS",[44,21]], ["ME",[42,19]], ["BA",[44,18]], ["CY",[35,33]], ["LB",[34,36]], ["JO",[31,36]], ["KW",[29,48]], ["QA",[25,51]], ["BH",[26,50]], ["AE",[24,54]], ["OM",[21,57]], ["YE",[15,48]], ["AZ",[40,48]], ["AM",[40,45]], ["KZ",[48,68]], ["UZ",[41,64]], ["TM",[39,59]], ["KG",[41,75]], ["TJ",[39,71]], ["MN",[47,103]], ["KP",[40,127]], ["KH",[13,105]], ["LA",[19,103]], ["MY",[4,102]], ["BN",[5,115]], ["TL",[-9,126]], ["LK",[7,81]], ["MV",[3,73]], ["BT",[27,90]], ["TW",[24,121]], ["PS",[32,35]], ["SY",[35,38]], ["JO",[31,36]], ["KW",[29,48]], ["SA",[24,45]], ["YE",[15,48]], ["TJ",[39,71]], ["OM",[21,57]], ["QA",[25,51]], ["BH",[26,50]], ["AE",[24,54]], ["JO",[31,36]], ["LA",[19,103]], ["KH",[13,105]], ["MY",[4,102]], ["BN",[5,115]], ["SG",[1,104]], ["TW",[24,121]], ["KP",[40,127]], ["KR",[36,128]], ["JP",[37,138]], ["PH",[13,122]], ["ID",[-2,118]], ["PG",[-6,147]], ["TO",[-21,-175]], ["WF",[-13,-176]], ["KM",[-12,44]], ["SC",[-5,55]], ["HT",[19,-72]], ["DM",[15,-61]], ["CL",[-33,-71]], ["SZ",[-26,31]], ["MA",[32,-6]], ["AF",[34,66]], ["IN",[22,79]], ["NG",[9,8]], ["JP",[37,138]], ["BR",[-10,-53]], ["EG",[27,30]], ["US",[39,-98]], ["CN",[35,104]], ["RU",[60,100]], ["ZA",[-29,25]], ["GB",[54,-2]], ["AU",[-25,134]], ["TR",[39,35]], ["IT",[42,12]], ["BD",[24,90]], ["ET",[9,40]], ["KE",[0,38]], ["IR",[32,53]], ["TZ",[-6,35]], ["MY",[4,102]], ["MX",[23,-102]], ["PE",[-10,-76]], ["AR",[-38,-64]], ["CA",[57,-106]], ["NG",[9,8]], ["ZA",[-29,25]], ["EG",[27,30]], ["UG",[1,32]], ["SD",[15,30]], ["DZ",[28,3]], ["AO",[-12,18]], ["CD",[-3,23]], ["MZ",[-19,35]], ["GH",[8,-2]], ["CI",[7,-5]], ["JP",[37,138]], ["IN",[22,79]], ["NP",[28,84]], ["PK",[30,70]], ["AF",[34,66]], ["CN",[35,104]], ["ID",[-2,118]], ["TH",[16,101]], ["VN",[16,108]], ["PH",[13,122]], ["IR",[32,53]], ["SA",[24,45]], ["TR",[39,35]], ["UA",[49,32]], ["FR",[47,2]], ["DE",[51,10]], ["ES",[40,-4]], ["SE",[62,16]], ["NO",[62,10]], ["FI",[64,26]], ["PL",[52,20]], ["IT",[42,12]], ["NL",[52,5]], ["GR",[39,22]], ["PT",[39,-8]], ["RU",[60,100]], ["US",[39,-98]], ["BR",[-10,-53]], ["CO",[4,-73]], ["VE",[8,-66]], ["CL",[-33,-71]], ["PE",[-10,-76]], ["EC",[-2,-77]], ["MX",[23,-102]], ["AR",[-38,-64]], ["AU",[-25,134]], ["NZ",[-42,173]], ["FJ",[-18,178]], ["PG",[-6,147]], ["WF",[-13,-176]], ["WS",[-13,-172]], ["TO",[-21,-175]], ["KI",[1,173]], ["TV",[-8,178]], ["NR",[-1,167]], ["SB",[-9,160]], ["VU",[-16,167]], ["FM",[7,158]], ["PW",[7,134]], ["MH",[7,171]], ["AS",[-14,-170]], ["CK",[-21,-159]], ["NU",[-19,-170]], ["TK",[-9,-172]], ["AX",[60,20]], ["FO",[62,-7]], ["GI",[36,-5]], ["AD",[42,1]], ["MC",[44,7]], ["SM",[44,12]], ["VA",[42,12]], ["LI",[47,9]], ["LU",[49,6]], ["MT",[36,14]], ["IS",[65,-19]], ["IE",[53,-8]], ["GB",[54,-2]], ["AL",[41,20]], ["ME",[42,19]], ["XK",[42,21]], ["BA",[44,18]], ["RS",[44,21]], ["HR",[45,16]], ["SI",[46,15]], ["MK",[41,22]], ["BG",[43,25]], ["RO",[46,25]], ["MD",[47,29]], ["BY",[53,28]], ["EE",[59,26]], ["LV",[57,25]], ["LT",[56,24]], ["UA",[49,32]], ["CY",[35,33]], ["GE",[42,44]], ["AM",[40,45]], ["AZ",[40,48]], ["IL",[31,35]], ["PS",[32,35]], ["LB",[34,36]], ["SY",[35,38]], ["JO",[31,36]], ["IQ",[33,44]], ["KW",[29,48]], ["BH",[26,50]], ["QA",[25,51]], ["AE",[24,54]], ["OM",[21,57]], ["YE",[15,48]], ["LK",[7,81]], ["BT",[27,90]], ["MV",[3,73]], ["MY",[4,102]], ["SG",[1,104]], ["BN",[5,115]], ["TL",[-9,126]], ["KH",[13,105]], ["LA",[19,103]], ["MN",[47,103]], ["KP",[40,127]], ["KR",[36,128]], ["TW",[24,121]], ["PG",[-6,147]], ["GU",[13,145]], ["MP",[15,145]], ["PR",[18,-66]], ["KY",[20,-81]], ["TC",[21,-71]], ["VG",[18,-64]], ["VI",[18,-65]], ["AW",[12,-70]], ["CW",[12,-69]], ["SX",[18,-63]], ["MF",[18,-63]], ["BL",[18,-63]], ["GP",[16,-61]], ["MQ",[14,-61]], ["GF",[4,-53]], ["FK",[-51,-59]], ["GS",[-54,-37]], ["FO",[-51,-59]], ["GG",[49,-2]], ["JE",[49,-2]], ["IM",[54,-4]], ["GI",[36,-5]], ["RE",[-21,55]], ["YT",[-13,45]], ["SH",[-16,-6]], ["IO",[-6,72]], ["CC",[-12,97]], ["CX",[-11,96]], ["NF",[-21,166]], ["PN",[-25,-130]], ["BV",[-54,3]], ["HM",[-53,73]], ["TF",[-49,70]], ["AQ",[-80,0]], ["UM",[19,-166]], ["PR",[18,-66]], ["VI",[18,-65]], ["AS",[-14,-170]], ["MP",[15,145]], ["GU",[13,145]], ["UM",[19,-166]], ["XK",[42,21]], ["TW",[24,121]], ["EH",[24,-13]], ["SJ",[78,16]], ["GS",[-54,-37]], ["AQ",[-80,0]], ["TF",[-49,70]], ["HM",[-53,73]], ["BV",[-54,3]]
] as [string, Point][]) as Record<string, Point>;

const GROUPS: Record<string, string> = {
  Africa: "DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW",
  Europe: "AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA",
  Asia: "AF AM AZ BH BD BT BN KH CN GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP KR OM PK PS PH QA SA SG LK SY TW TJ TH TL TR TM AE UZ VN YE",
  Oceania: "AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PG PW SB TK TO TV VU WF WS",
};

const ANCHORS: Record<string, Point[]> = {
  Africa: [[-15,15],[-5,34],[8,12],[20,2],[28,-4],[31,-25],[38,-7],[45,-18],[16,-15],[29,12]],
  Europe: [[-3,54],[10,58],[12,49],[22,45],[28,54],[35,39],[42,47],[4,42],[20,62],[30,48]],
  Asia: [[44,34],[58,25],[70,40],[78,23],[90,28],[103,35],[108,15],[119,25],[135,37],[145,50],[95,5]],
  Oceania: [[134,-25],[147,-7],[172,-41],[159,-8],[178,-18],[115,-32]],
  Americas: [[-100,40],[-75,5],[-62,-12],[-72,-35],[-70,20],[-82,13],[-93,16],[-105,58],[-77,-8],[-58,-34]],
};

function hash(code: string) {
  return [...code].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function coordinate(country: GameState["countries"][number]): Point {
  // The country lookup table is stored as [latitude, longitude]; the SVG
  // projection and fallback anchors use [longitude, latitude].
  if (COORDS[country.code]) {
    const [lat, lon] = COORDS[country.code];
    return [lon, lat];
  }
  const group = Object.entries(GROUPS).find(([, codes]) => codes.split(" ").includes(country.code))?.[0] ?? "Americas";
  const points = ANCHORS[group];
  const seed = hash(country.code);
  const base = points[seed % points.length];
  const jx = ((seed >>> 5) % 9 - 4) * 0.6;
  const jy = ((seed >>> 9) % 9 - 4) * 0.45;
  return [base[0] + jx, base[1] + jy];
}

function project([lon, lat]: Point): Point {
  return [45 + ((lon + 180) / 360) * 910, 30 + ((82 - lat) / 164) * 350];
}

function boundaryPath(feature: BoundaryFeature) {
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates as number[][][]]
    : feature.geometry.coordinates as number[][][][];
  return polygons.map((polygon) => polygon.map((ring) => ring.map(([lon, lat], index) => {
    const [x, y] = project([lon, lat]);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z").join(" ")).join(" ");
}

export function CampaignMap({ game, onPick, pickable = false, selectedSource, selectedTarget, isOwner = false }: { game: GameState; onPick?: (code: string) => void; pickable?: boolean; selectedSource?: string | null; selectedTarget?: string | null; isOwner?: boolean }) {
  const [zoom, setZoom] = useState(1);
  const [features, setFeatures] = useState<BoundaryFeature[]>([]);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [showSoldiers, setShowSoldiers] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/assets/maps/world-countries.geojson").then((response) => response.json()).then((data: { features?: BoundaryFeature[] }) => {
      if (!cancelled) setFeatures(data.features ?? []);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const countriesByCode = useMemo(() => new Map(game.countries.map((country) => [country.code, country])), [game.countries]);
  const markers = game.countries.map((country) => ({ country, point: project(coordinate(country)), owner: game.players.find((player) => player.id === country.ownerId) }));
  const engagement = game.attack ? { from: game.attack.sourceId, to: game.attack.targetId } : game.lastBattle ? { from: game.lastBattle.attackerCode, to: game.lastBattle.defenderCode } : null;
  const from = engagement && markers.find((marker) => marker.country.code === engagement.from)?.point;
  const to = engagement && markers.find((marker) => marker.country.code === engagement.to)?.point;
  const route = from && to ? `M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2} ${Math.min(from[1], to[1]) - 45} ${to[0]} ${to[1]}` : "";

  const detailCode = focusedCode ?? selectedTarget ?? selectedSource;
  const detailCountry = detailCode ? countriesByCode.get(detailCode) : undefined;
  const detailFeature = detailCode ? features.find((feature) => (feature.properties.ISO_A2 ?? "").toUpperCase() === detailCode || feature.properties.ADM0_A3 === "KOS" && detailCode === "XK") : undefined;
  const detailOwner = detailCountry ? game.players.find((player) => player.id === detailCountry.ownerId) : undefined;
  const pickFeature = (feature: BoundaryFeature) => {
    const code = (feature.properties.ISO_A2 ?? "").toUpperCase() || (feature.properties.ADM0_A3 === "KOS" ? "XK" : "");
    if (!code) return;
    setFocusedCode(code);
    setShowSoldiers(false);
    if (pickable && countriesByCode.has(code)) onPick?.(code);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[#102936]">
      <div className="relative">
      <svg viewBox={`${500 - 500 / zoom} ${205 - 175 / zoom} ${1000 / zoom} ${350 / zoom}`} role="group" aria-label="Interactive world campaign map. Select a territory to view its commander and troop count." className="block h-[250px] w-full sm:h-[290px] lg:h-[330px]" onWheel={(event) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); setZoom((value) => Math.max(1, Math.min(3, value + (event.deltaY < 0 ? .15 : -.15)))); } }}>
        <defs>
          <linearGradient id="world-ocean" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#173b4c"/><stop offset=".52" stopColor="#24566a"/><stop offset="1" stopColor="#102d3b"/></linearGradient>
          <linearGradient id="world-land" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#eee4c8"/><stop offset="1" stopColor="#cbbf9e"/></linearGradient>
          <pattern id="world-grain" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".7" fill="#d5eadc" fillOpacity=".2"/><circle cx="12" cy="10" r=".55" fill="#d5eadc" fillOpacity=".14"/></pattern>
          <filter id="territory-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#071b23" floodOpacity=".35"/></filter>
        </defs>
        <rect width="1000" height="420" fill="url(#world-ocean)"/>
        <rect width="1000" height="420" fill="url(#world-grain)"/>
        {[ -60, -30, 0, 30, 60 ].map((lat) => { const y = project([0, lat])[1]; return <path key={`lat-${lat}`} d={`M35 ${y}H965`} stroke="#b9d5d8" strokeOpacity=".18" strokeDasharray="2 7"/>; })}
        {[-120,-60,0,60,120].map((lon) => { const x = project([lon, 0])[0]; return <path key={`lon-${lon}`} d={`M${x} 25V390`} stroke="#b9d5d8" strokeOpacity=".13" strokeDasharray="2 7"/>; })}
        <g filter="url(#territory-shadow)" strokeLinejoin="round">
          {features.map((feature, index) => {
            const code = (feature.properties.ISO_A2 ?? "").toUpperCase() || (feature.properties.ADM0_A3 === "KOS" ? "XK" : "");
            const country = countriesByCode.get(code);
            const owner = country ? game.players.find((player) => player.id === country.ownerId) : undefined;
            const selected = code === selectedSource || code === selectedTarget || code === focusedCode;
            const fill = owner ? owner.kind === "human" ? "#1800ad" : owner.color : "url(#world-land)";
            return <path key={`${code}-${index}`} d={boundaryPath(feature)} fill={fill} fillOpacity={owner ? .92 : .94} stroke={selected ? "#fff5d8" : owner ? "#f5dec0" : "#788b7d"} strokeWidth={selected ? 2.2 : owner ? 1.25 : .65} className={pickable ? "cursor-pointer transition-[filter,fill] hover:brightness-110" : undefined} role={country && pickable ? "button" : undefined} tabIndex={country && pickable ? 0 : -1} aria-label={`${feature.properties.ADMIN ?? code}${country ? `, ${country.soldiers} soldiers, commanded by ${owner?.name ?? "unknown"}` : ", not in this campaign"}`} onClick={() => pickFeature(feature)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pickFeature(feature); } }}><title>{`${feature.properties.ADMIN ?? code}${country ? ` · ${country.soldiers} troops · ${owner?.name ?? "Unknown commander"}` : " · not in this campaign"}`}</title></path>;
          })}
        </g>
        {route && <path d={route} fill="none" stroke="#1800ad" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="7 6" className="map-route"/>}
        {markers.map(({ country, point: [x,y], owner }) => {
          const active = engagement?.from === country.code || engagement?.to === country.code;
          const color = owner?.kind === "human" ? "#1800ad" : owner?.color ?? "#527a7c";
          const chosen = selectedSource === country.code || selectedTarget === country.code;
          return <g key={country.code} role="button" tabIndex={0} aria-label={`${country.name}, ${country.soldiers} soldiers${owner ? `, commanded by ${owner.name}` : ""}${pickable ? ". Select nation" : ""}`} onClick={() => { setFocusedCode(country.code); setShowSoldiers(false); if (pickable) onPick?.(country.code); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFocusedCode(country.code); setShowSoldiers(false); if (pickable) onPick?.(country.code); } }} className="cursor-pointer outline-none">
            <title>{`${country.name}: ${country.soldiers} soldiers · ${owner?.name ?? "Unknown commander"}`}</title>
            <line x1={x + 4} y1={y - 3} x2={x + 11} y2={y - 13} stroke="#f7f0dc" strokeWidth="1.2" strokeDasharray="1.5 2.5"/>
            <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            {active && <circle r="15" fill={color} opacity=".15" className="map-pulse"/>}
            {chosen && <circle r="13" fill="none" stroke="#1800ad" strokeWidth="2.5"/>}
            <circle r={active ? 8 : 6.5} fill={color} stroke="#fff5dc" strokeWidth="2" className="transition-transform hover:scale-150"/>
            <circle r="2" fill="#fff5dc"/>
            <text x="11" y="-12" fontSize="9" fontWeight="800" fill="#fffaf0" paintOrder="stroke" stroke="#183b47" strokeWidth="3">{country.code}</text>
            <text x="11" y="-2" fontSize="8" fontWeight="700" fill="#f5e6bd" paintOrder="stroke" stroke="#183b47" strokeWidth="2">{country.soldiers} troops</text>
            </g>
          </g>;
        })}
        <text x="28" y="24" fontSize="9" letterSpacing="2" fill="#f7efd9" paintOrder="stroke" stroke="#173b4c" strokeWidth="3">TINOLANDIA · WORLD CAMPAIGN</text>
      </svg>
      <div className="absolute right-2 top-2 flex gap-1 rounded-md border border-[var(--line)] bg-white/90 p-1 shadow-sm"><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - .25))} className="grid h-7 w-7 place-items-center rounded text-base hover:bg-[#eef1f0]">−</button><span className="grid min-w-10 place-items-center text-[10px] text-[var(--muted-ink)]">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + .25))} className="grid h-7 w-7 place-items-center rounded text-base hover:bg-[#eef1f0]">+</button></div>
      {detailCode && <div className="absolute bottom-3 left-3 max-w-[calc(100%_-_1.5rem)] rounded-md border border-white/30 bg-[#112f3b]/95 px-3 py-2.5 text-white shadow-lg backdrop-blur-sm"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#b8c2ff]">Territory intelligence</p><p className="mt-0.5 text-sm font-semibold">{detailCountry?.name ?? detailFeature?.properties.ADMIN ?? detailCode}</p>{detailCountry ? <><p className="mt-1 text-[11px] text-white/80">{detailOwner?.name ?? "Unassigned"} · {detailCountry.soldiers} troops · base {detailCountry.initialSoldiers}</p><button type="button" aria-expanded={showSoldiers} onClick={() => setShowSoldiers((visible) => !visible)} className="mt-2 rounded border border-white/25 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-white/20">{showSoldiers ? "Hide soldiers" : "Show soldiers"} · {detailCountry.soldiers}</button>{showSoldiers && <div className="mt-2 max-h-36 overflow-y-auto rounded border border-white/15 bg-black/10 p-1.5" aria-label={`${detailCountry.soldiers} soldiers represented as sprites`}><div className="grid grid-cols-8 justify-items-center gap-x-1 gap-y-0.5">{Array.from({ length: detailCountry.soldiers }, (_, index) => <span key={index} aria-hidden="true" className="formation-soldier h-10 w-8" style={{ backgroundImage: "url('/assets/soldiers/soldier-idle-strip.png')", animationDelay: `${(index % 6) * -0.13}s` }} />)}</div><p className="mt-1 text-center text-[9px] text-white/70">{detailCountry.soldiers} soldiers · sprites by <a href="https://zerie.itch.io/tiny-rpg-character-asset-pack" target="_blank" rel="noreferrer" className="underline underline-offset-2">Zerie</a></p></div>}</> : <p className="mt-1 text-[11px] text-white/75">Not part of this campaign · click a colored territory to inspect its forces.</p>}</div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-white/75 px-3 py-2 text-[10px] text-[var(--muted-ink)]">
        <span>{pickable ? "Select a country or marker to issue orders · Ctrl/⌘ + scroll to zoom" : "Country borders and campaign positions · Natural Earth boundaries"}</span>
        <span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#1800ad]"/>{isOwner ? "Your command" : "Campaign owner"}</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-gradient-to-r from-[#5288a8] via-[#b4665a] to-[#a88a67]"/>Rival commander colors</span></span>
        <span className="text-[9px]">Country geometry: Natural Earth (public domain)</span>
        {engagement && <span className="font-medium text-[var(--accent-dark)]">Latest route: {markers.find((m) => m.country.code === engagement.from)?.country.name} → {markers.find((m) => m.country.code === engagement.to)?.country.name}</span>}
      </div>
    </div>
  );
}
