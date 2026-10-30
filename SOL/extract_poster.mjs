import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const C = {
  navy: "#004b62",
  blue: "#008fd0",
  cyan: "#1bbbe9",
  orange: "#de6a09",
  green: "#b1ca40",
  paper: "#f7f5ef",
  sky: "#e4f5fa",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#c3d7de"
};

function star(cx, cy, outer, inner, rotation = 0) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5 + rotation;
    const radius = i % 2 ? inner : outer;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
}

const illustration = `<svg xmlns="http://www.w3.org/2000/svg"
     width="1280" height="650" viewBox="0 0 1280 650">

  <rect width="1280" height="650" fill="${C.sky}"/>

  <path d="M1010 0V92"
        stroke="${C.navy}" stroke-width="3"/>

  <rect x="979" y="89" width="62" height="28"
        rx="4" fill="${C.navy}"/>

  <circle cx="1010" cy="335" r="224"
          fill="${C.orange}"/>

  <path d="M838 194Q962 117 1080 159"
        fill="none"
        stroke="#ffffff"
        stroke-width="4"
        opacity=".5"/>

  <path d="M-50 548C250 548 445 470 698 324"
        fill="none"
        stroke="${C.blue}"
        stroke-width="3"
        stroke-dasharray="12 16"/>

  <g transform="translate(777 316) rotate(55) scale(1.65)">
    <path d="
      M0 -116
      C10 -116 13 -99 13 -82
      L15 -27
      L111 34 L111 49 L15 15
      L13 78 L48 104 L48 116
      L0 99
      L-48 116 L-48 104 L-13 78
      L-15 15 L-111 49 L-111 34
      L-15 -27 L-13 -82
      C-13 -99 -10 -116 0 -116Z"
      fill="#ffffff"/>
  </g>

  <polygon
    points="${star(190, 188, 48, 20, 0.1)}"
    fill="${C.green}"/>

  <polygon
    points="${star(429, 316, 25, 10, 0.3)}"
    fill="${C.blue}"/>

  <polygon
    points="${star(1132, 584, 30, 12)}"
    fill="${C.green}"/>

  <g fill="${C.navy}">
    <circle cx="347" cy="125" r="6"/>
    <circle cx="115" cy="376" r="5"/>
    <circle cx="593" cy="130" r="5"/>
    <circle cx="541" cy="530" r="5"/>
  </g>

  <g stroke="${C.orange}" stroke-width="5">
    <path d="M292 387L311 409"/>
    <path d="M470 193L492 184"/>
  </g>

  <g stroke="${C.blue}" stroke-width="4">
    <path d="M1153 104L1171 81"/>
    <path d="M1218 418L1231 442"/>
  </g>

  <path d="M0 631H1280"
        stroke="${C.navy}" stroke-width="3"/>
</svg>`;

await fs.writeFile("../g-poster.svg", illustration, "utf8");
await fs.copyFile("dist/assets/g-poster.png", "../g-poster.png");
await fs.copyFile("dist/assets/g-logo.png", "../g-logo.png");

console.log("g-poster.svg, g-poster.png and g-logo.png copied to root!");
