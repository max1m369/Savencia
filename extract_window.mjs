import fs from "node:fs/promises";
import path from "node:path";
import sharp from "./SOL/node_modules/sharp/lib/index.js";

const C = {
  navy: "#004b62",
  blue: "#008fd0",
  cyan: "#1bbbe9",
  orange: "#de6a09",
  green: "#b1ca40",
  paper: "#f7f5ef",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#cbd9dc"
};

function star(cx, cy, outer, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? inner : outer;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
}

const stars = [
  [224, 146, 2], [350, 174, 2], [463, 220, 3],
  [252, 266, 2], [403, 315, 2], [316, 373, 2],
  [491, 366, 2], [220, 405, 2], [373, 119, 2],
  [472, 466, 2], [261, 485, 2], [438, 141, 2]
];

const lights = Array.from({ length: 24 }, (_, i) => {
  const x = 165 + i * 15;
  const y = 576 + Math.sin(i * 0.7) * 12;
  const color = i % 4 === 0 ? C.orange : C.cyan;

  return `
    <circle cx="${x}" cy="${y}" r="5"
            fill="${color}" opacity=".18"/>
    <circle cx="${x}" cy="${y}" r="1.8"
            fill="${color}"/>
  `;
}).join("");

const windowSVG = `<svg xmlns="http://www.w3.org/2000/svg"
     width="720" height="860" viewBox="0 0 720 860">
  <defs>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#ffffff"/>
      <stop offset=".4" stop-color="#e4e6e2"/>
      <stop offset=".72" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#bfc8c7"/>
    </linearGradient>

    <linearGradient id="inner" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#a7b6b8"/>
      <stop offset=".4" stop-color="#edf0ea"/>
      <stop offset="1" stop-color="#b9c4c4"/>
    </linearGradient>

    <linearGradient id="sky" x1="0" y1="0" x2=".8" y2="1">
      <stop stop-color="#032d42"/>
      <stop offset=".6" stop-color="${C.navy}"/>
      <stop offset="1" stop-color="#0d7190"/>
    </linearGradient>

    <linearGradient id="wing" x1="0" y1="0" x2=".7" y2="1">
      <stop stop-color="#ffffff"/>
      <stop offset="1" stop-color="#a1c2cc"/>
    </linearGradient>

    <radialGradient id="glow">
      <stop stop-color="${C.orange}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>

    <clipPath id="glass">
      <rect x="163" y="104" width="394" height="612"
            rx="187"/>
    </clipPath>
  </defs>

  <rect width="720" height="860" fill="${C.paper}"/>

  <ellipse cx="373" cy="785" rx="204" ry="24"
           fill="${C.navy}" opacity=".035"/>
  <ellipse cx="373" cy="785" rx="151" ry="13"
           fill="${C.navy}" opacity=".04"/>

  <rect x="107" y="48" width="506" height="734"
        rx="246" fill="#d1d7d3"/>
  <rect x="101" y="39" width="506" height="734"
        rx="246" fill="url(#rim)"/>
  <rect x="139" y="77" width="430" height="660"
        rx="208" fill="url(#inner)"/>
  <rect x="157" y="98" width="406" height="624"
        rx="194" fill="#527380"/>

  <g clip-path="url(#glass)">
    <rect x="163" y="104" width="394" height="612"
          fill="url(#sky)"/>

    <circle cx="424" cy="256" r="142" fill="url(#glow)"/>

    <g fill="#ffffff">
      ${stars.map(([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" opacity=".75"/>`
      ).join("")}
    </g>

    <path d="M188 448C243 343 340 390 408 284"
          fill="none" stroke="${C.orange}"
          stroke-width="14" opacity=".08"/>

    <path d="M188 448C243 343 340 390 408 284"
          fill="none" stroke="${C.orange}"
          stroke-width="2" stroke-dasharray="2 11"
          stroke-linecap="round"/>

    <polygon points="${star(419, 266, 23, 9)}"
             fill="${C.orange}"/>

    <g fill="none" stroke="${C.cyan}" stroke-width="1.5"
       opacity=".7">
      <path d="M420 209V192M463 224L477 213
               M474 267H493M460 306L474 319"/>
    </g>

    <path d="M160 587Q287 528 570 570V735H150Z"
          fill="#0a4860"/>
    <path d="M150 620Q350 562 590 607V735H150Z"
          fill="#06384d"/>

    ${lights}

    <path d="M111 650L480 430L505 407L500 464L296 651Z"
          fill="url(#wing)"/>

    <path d="M480 430L497 373L505 407L500 464Z"
          fill="${C.blue}"/>

    <path d="M168 643L479 448"
          stroke="#789eaf" stroke-width="2"/>

    <path d="M219 637L424 510"
          stroke="#789eaf" stroke-width="1"/>

    <circle cx="497" cy="409" r="10"
            fill="${C.green}" opacity=".15"/>
    <circle cx="497" cy="409" r="3"
            fill="${C.green}"/>

    <path d="M188 161Q205 119 259 114"
          fill="none" stroke="#ffffff"
          stroke-width="8" opacity=".12"
          stroke-linecap="round"/>

    <path d="M533 216V418"
          stroke="#ffffff" stroke-width="13"
          opacity=".035" stroke-linecap="round"/>
  </g>

  <path d="M190 91Q354 17 521 107"
        fill="none" stroke="#ffffff"
        stroke-width="3" opacity=".85"/>

  <rect x="306" y="744" width="104" height="6"
        rx="3" fill="#aebcbb" opacity=".65"/>
</svg>
`;

await fs.writeFile("f-window.svg", windowSVG, "utf8");

// Also generate high-quality crisp transparent/exact PNG using sharp
await sharp(Buffer.from(windowSVG))
  .png({ palette: true, compressionLevel: 9 })
  .toFile("f-window.png");

console.log("f-window.svg and f-window.png successfully created!");
