"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

type GlobePin = { code: string; name: string; lat: number; lon: number };
type Point = [number, number];

const PINS: GlobePin[] = [
  { code: "ZA", name: "South Africa", lat: -30.6, lon: 22.9 },
  { code: "NG", name: "Nigeria", lat: 9.1, lon: 8.7 },
  { code: "EG", name: "Egypt", lat: 26.8, lon: 30.8 },
  { code: "GB", name: "United Kingdom", lat: 55.4, lon: -3.4 },
  { code: "US", name: "United States", lat: 37.1, lon: -95.7 },
  { code: "BR", name: "Brazil", lat: -14.2, lon: -51.9 },
  { code: "IN", name: "India", lat: 20.6, lon: 79.0 },
  { code: "CN", name: "China", lat: 35.9, lon: 104.2 },
  { code: "JP", name: "Japan", lat: 36.2, lon: 138.3 },
  { code: "AU", name: "Australia", lat: -25.3, lon: 133.8 },
  { code: "TR", name: "Türkiye", lat: 38.9, lon: 35.2 },
  { code: "RU", name: "Russia", lat: 61.5, lon: 105.3 },
];

// Simplified coastline polygons used to shade the globe without loading a map service.
const LAND: Point[][] = [
  [[-168,72],[-145,70],[-130,55],[-124,48],[-128,40],[-117,32],[-108,24],[-97,18],[-83,9],[-78,8],[-80,25],[-66,45],[-53,52],[-60,62],[-95,75],[-130,74]],
  [[-81,12],[-70,10],[-50,-2],[-35,-8],[-44,-23],[-54,-34],[-66,-55],[-75,-40],[-80,-8]],
  [[-18,36],[2,37],[25,32],[34,12],[50,10],[42,-12],[30,-34],[18,-35],[8,-18],[-2,-5],[-16,12]],
  [[-10,36],[-8,55],[12,70],[35,72],[58,68],[75,78],[112,76],[150,60],[170,52],[150,42],[135,34],[126,20],[110,8],[97,18],[80,8],[65,25],[48,30],[37,42],[28,45],[20,36]],
  [[112,-11],[130,-10],[145,-16],[154,-28],[145,-40],[128,-43],[115,-32]],
  [[43,-13],[50,-15],[49,-25],[44,-24]],
];

function contains(polygon: Point[], lon: number, lat: number) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function Globe3D({ selectedCode, onSelectCountry }: { selectedCode?: string; onSelectCountry: (code: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinsRef = useRef<Array<GlobePin & { x: number; y: number }>>([]);
  const hoverRef = useRef<string | null>(null);
  const pointerInsideRef = useRef(false);
  const callbackRef = useRef(onSelectCountry);

  useEffect(() => { callbackRef.current = onSelectCountry; }, [onSelectCountry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let rotation = -0.45;
    let width = 0;
    let height = 0;
    let ratio = 1;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(220, bounds.width);
      height = Math.max(220, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.405;
      context.clearRect(0, 0, width, height);

      const halo = context.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.22);
      halo.addColorStop(0, "rgba(104, 134, 139, .12)");
      halo.addColorStop(1, "rgba(104, 134, 139, 0)");
      context.fillStyle = halo;
      context.beginPath(); context.arc(cx, cy, radius * 1.22, 0, Math.PI * 2); context.fill();

      const sphere = context.createRadialGradient(cx - radius * .34, cy - radius * .42, radius * .08, cx, cy, radius * 1.2);
      sphere.addColorStop(0, "#ffffff"); sphere.addColorStop(.72, "#e5ecec"); sphere.addColorStop(1, "#cbd6d7");
      context.fillStyle = sphere;
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();

      context.save();
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.clip();

      const project = (lon: number, lat: number) => {
        const phi = lat * Math.PI / 180;
        const lambda = lon * Math.PI / 180 + rotation;
        const x = Math.cos(phi) * Math.sin(lambda);
        const y = Math.sin(phi);
        const z = Math.cos(phi) * Math.cos(lambda);
        return { x: cx + x * radius, y: cy - y * radius, z };
      };

      context.strokeStyle = "rgba(91, 112, 115, .16)";
      context.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        context.beginPath();
        for (let lon = -180; lon <= 180; lon += 3) {
          const point = project(lon, lat);
          if (point.z > 0) context.lineTo(point.x, point.y); else context.moveTo(cx, point.y);
        }
        context.stroke();
      }
      for (let lon = -150; lon < 180; lon += 30) {
        context.beginPath();
        for (let lat = -88; lat <= 88; lat += 2) {
          const point = project(lon, lat);
          if (point.z > 0) context.lineTo(point.x, point.y); else context.moveTo(cx, point.y);
        }
        context.stroke();
      }

      context.fillStyle = "rgba(91, 119, 111, .72)";
      for (const polygon of LAND) {
        for (let lat = -56; lat <= 78; lat += 4) {
          for (let lon = -178; lon <= 178; lon += 4) {
            if (!contains(polygon, lon, lat)) continue;
            const point = project(lon, lat);
            if (point.z <= 0) continue;
            context.globalAlpha = .42 + point.z * .46;
            context.beginPath(); context.arc(point.x, point.y, 1.25, 0, Math.PI * 2); context.fill();
          }
        }
      }
      context.globalAlpha = 1;

      const visible: Array<GlobePin & { x: number; y: number }> = [];
      for (const pin of PINS) {
        const point = project(pin.lon, pin.lat);
        if (point.z <= 0) continue;
        visible.push({ ...pin, x: point.x, y: point.y });
        const active = pin.code === selectedCode;
        const hovered = pin.code === hoverRef.current;
        context.beginPath(); context.arc(point.x, point.y, active || hovered ? 6 : 4, 0, Math.PI * 2);
        context.fillStyle = active ? "#b65f43" : "#395e62"; context.fill();
        context.strokeStyle = "#fff"; context.lineWidth = 1.5; context.stroke();
        if (active || hovered) {
          context.font = "600 11px Arial"; context.fillStyle = "#263538";
          context.fillText(pin.name, point.x + 9, point.y - 8);
        }
      }
      pinsRef.current = visible;
      context.restore();

      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(74, 99, 102, .25)"; context.lineWidth = 1; context.stroke();
      if (!pointerInsideRef.current) rotation += .0016;
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = window.requestAnimationFrame(draw);
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
  }, [selectedCode]);

  const locate = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerInsideRef.current = true;
    const found = pinsRef.current.find((pin) => Math.hypot(pin.x - x, pin.y - y) < 20);
    hoverRef.current = found?.code ?? null;
    event.currentTarget.style.cursor = found ? "pointer" : "grab";
  };

  const select = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const found = pinsRef.current.find((pin) => Math.hypot(pin.x - x, pin.y - y) < 20);
    if (found) callbackRef.current(found.code);
  };

  return <canvas ref={canvasRef} onPointerEnter={() => { pointerInsideRef.current = true; }} onPointerMove={locate} onPointerLeave={(event) => { pointerInsideRef.current = false; hoverRef.current = null; event.currentTarget.style.cursor = "grab"; }} onClick={select} role="img" aria-label="Rotating globe with selectable country markers" className="h-[300px] w-full touch-pan-y" />;
}
