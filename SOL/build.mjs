import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

/* =========================================================
   ПАПКИ И НАСТРОЙКИ
   ========================================================= */

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const ASSETS = path.join(OUT, "assets");

// Для локального просмотра менять не требуется.
// Перед отправкой разместите картинки на HTTPS-хостинге
// и укажите адрес этой папки здесь.
const ASSET_BASE = (
  process.env.ASSET_BASE ||
  "https://example.com/savencia-assets"
).replace(/\/$/, "");

await fs.mkdir(ASSETS, { recursive: true });

const C = {
  blue: "#004b62",
  dairy: "#008fd0",
  light: "#1bbbe9",
  orange: "#de6a09",
  green: "#b1ca40",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#cbdfe6",
  white: "#ffffff"
};

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const asset = name => `${ASSET_BASE}/${name}`;

/* =========================================================
   ТЕКСТ: ИСХОДНЫЙ ДОКУМЕНТ + ПРЕДОСТАВЛЕННЫЕ АДРЕСА
   ========================================================= */

const COPY = {
  documentTitle: "Информационная рассылка в почте",
  subject: "Тема: 10 декабря — Вылет в Новый ГОД!",
  greeting: "Дорогие коллеги!",
  attention:
    "Внимание, объявляется посадка на особый новогодний рейс!",
  journey:
    "10 декабря мы отправляемся в праздничное путешествие, которое объединит сотрудников Savencia из трёх городов — Москвы, Уфы и Белебея.",
  slogan:
    "ТРИ ГОРОДА. ОДИН РЕЙС. ОДНА КОМАНДА.",
  airports:
    "В этот день наши праздничные площадки превратятся в аэропорты, а каждый из вас станет пассажиром рейса с конечным пунктом назначения — Новый год!",
  program:
    "В программе полёта: тёплые встречи с коллегами, яркие эмоции, заслуженные награды, приятные сюрпризы, музыка и праздничное настроение.",
  ticket:
    "На регистрации каждый получит свой посадочный билет, который пригодится во время новогоднего розыгрыша подарков.",
  schedule:
    "Расписание нашего рейса",
  cities:
    "✈️ МОСКВА и УФА(по местному времени)",
  belebey:
    "✈️  БЕЛЕБЕЙ",
  registration:
    "Регистрация на рейс (Welcome)",
  registrationDescription:
    "Встреча пассажиров, посадочные билеты, фотографии, угощения и первые праздничные активности.",
  takeoff:
    "Взлёт. Торжественная часть",
  takeoffDescription:
    "Церемония награждения сотрудников и праздничная программа.",
  flight:
    "Полёт в Новый год",
  flightDescription:
    "Музыка, фуршет, развлечения, общение и новогодние сюрпризы.",
  airportsHeading:
    "Аэропорты отправления:",
  moscow:
    "МОСКВА:",
  moscowAddress:
    "проспект Андропова, 11, корпус 2, Южный Event-Port.",
  ufa:
    "УФА:",
  ufaAddress:
    "улица Менделеева, 205А, ресторан «Пастернак».",
  airportHeading:
    "Аэропорт отправления:",
  belebeyAddress:
    "улица Амирова, 10А, Центральный дворец культуры Белебеевского района.",
  passengers:
    "Уважаемые пассажиры!",
  mood:
    "Просим заранее подготовить хорошее настроение и быть готовыми к незабываемому путешествию.",
  waiting:
    "Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!",
  seeYou:
    "До встречи 10 декабря!",
  crew:
    "Ваш экипаж Savencia ✈️"
};

const SCHEDULES = [
  {
    heading: COPY.cities,
    rows: [
      [
        "17:00–18:00",
        COPY.registration,
        COPY.registrationDescription
      ],
      [
        "18:00–20:00",
        COPY.takeoff,
        COPY.takeoffDescription
      ],
      [
        "20:00–23:00",
        COPY.flight,
        COPY.flightDescription
      ]
    ],
    addressHeading: COPY.airportsHeading,
    addresses: [
      [COPY.moscow, COPY.moscowAddress],
      [COPY.ufa, COPY.ufaAddress]
    ]
  },
  {
    heading: COPY.belebey,
    rows: [
      [
        "15:00–15:30",
        COPY.registration,
        COPY.registrationDescription
      ],
      [
        "15:30–18:00",
        COPY.takeoff,
        COPY.takeoffDescription
      ],
      [
        "18:00–20:00",
        COPY.flight,
        COPY.flightDescription
      ]
    ],
    addressHeading: COPY.airportHeading,
    addresses: [
      ["", COPY.belebeyAddress]
    ]
  }
];

/* =========================================================
   ПЯТЬ ВИЗУАЛЬНЫХ ВАРИАНТОВ
   ========================================================= */

const STYLES = {
  a: {
    name: "А — Табло вылетов",
    page: "#eaf1f4",
    hero: C.blue,
    heroText: C.white,
    band: C.blue,
    bandText: C.white,
    city: C.blue,
    cityText: C.white,
    row: "#f0f7fa",
    time: C.blue,
    border: "solid",
    art: "flight-a.png",
    layout: "classic"
  },
  b: {
    name: "Б — Ночной взлёт",
    page: "#dae6eb",
    hero: "#062d3f",
    heroText: C.white,
    band: "#062d3f",
    bandText: C.white,
    city: "#062d3f",
    cityText: C.white,
    row: "#f7f8f8",
    time: C.orange,
    border: "solid",
    art: "flight-b.png",
    layout: "classic"
  },
  c: {
    name: "В — Посадочный билет",
    page: "#edf1ee",
    hero: C.white,
    heroText: C.blue,
    band: "#e9f6fa",
    bandText: C.blue,
    city: "#e9f6fa",
    cityText: C.blue,
    row: C.white,
    time: C.blue,
    border: "dashed",
    art: "flight-c.png",
    layout: "ticket"
  },
  d: {
    name: "Г — Большая дата",
    page: "#e8e2d9",
    hero: C.white,
    heroText: C.blue,
    band: C.white,
    bandText: C.blue,
    city: C.white,
    cityText: C.blue,
    row: C.white,
    time: C.blue,
    border: "solid",
    art: null,
    layout: "editorial"
  },
  e: {
    name: "Д — Маршрутная лента",
    page: "#e5edf0",
    hero: C.blue,
    heroText: C.white,
    band: C.blue,
    bandText: C.white,
    city: C.blue,
    cityText: C.white,
    row: C.dairy,
    time: C.white,
    border: "solid",
    art: null,
    layout: "route"
  }
};

/* =========================================================
   ИЛЛЮСТРАЦИИ БЕЗ ТЕКСТА
   PNG ДЛЯ ПИСЕМ, НЕ SVG И НЕ BASE64
   ========================================================= */

const airplaneTop = `
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
`;

function svgA() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="1200" height="320" viewBox="0 0 1200 320">
    <rect width="1200" height="320" fill="${C.blue}"/>
    <g opacity=".14" stroke="#ffffff" fill="none">
      <path d="M0 80H1200M0 160H1200M0 240H1200"/>
      <path d="
        M200 0V320M400 0V320M600 0V320
        M800 0V320M1000 0V320"/>
    </g>
    <path d="M90 235C300 235 350 80 610 80S880 235 1100 165"
          fill="none" stroke="${C.light}" stroke-width="4"
          stroke-dasharray="10 12"/>
    <g fill="${C.green}">
      <circle cx="90" cy="235" r="9"/>
      <circle cx="610" cy="80" r="9"/>
      <circle cx="1100" cy="165" r="9"/>
    </g>
    <g transform="translate(795 153) rotate(56) scale(.79)">
      ${airplaneTop}
    </g>
  </svg>`;
}

function svgB() {
  let lights = "";

  for (let i = 0; i < 9; i++) {
    const y = 226 + i * 17;
    const spread = 40 + i * 44;
    const r = 2 + i * 0.65;

    for (const x of [600 - spread, 600 + spread]) {
      lights += `
        <circle cx="${x}" cy="${y}" r="${r * 3}"
                fill="#de6a09" opacity=".15"/>
        <circle cx="${x}" cy="${y}" r="${r}"
                fill="#ffc474"/>
      `;
    }
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="1200" height="400" viewBox="0 0 1200 400">
    <defs>
      <radialGradient id="sky">
        <stop stop-color="#17637a"/>
        <stop offset="1" stop-color="#062d3f"/>
      </radialGradient>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#ffffff"/>
        <stop offset="1" stop-color="#a8c8d3"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="400" fill="url(#sky)"/>
    <path d="M520 220L110 400H1090L680 220Z" fill="#031e2d"/>
    <path d="M600 250V400" stroke="#d7edf2"
          stroke-width="3" stroke-dasharray="13 17"
          opacity=".45"/>
    ${lights}
    <path d="M590 132L600 35L610 132Z" fill="#d4e7ec"/>
    <path d="M550 164L93 214L94 225L554 194Z" fill="#e3eff3"/>
    <path d="M650 164L1107 214L1106 225L646 194Z"
          fill="#e3eff3"/>
    <path d="M551 134L438 111L438 120L552 156Z"
          fill="#aacbd7"/>
    <path d="M649 134L762 111L762 120L648 156Z"
          fill="#aacbd7"/>
    <ellipse cx="600" cy="169" rx="51" ry="66"
             fill="url(#body)"/>
    <path d="M565 143Q600 121 635 143L630 155H570Z"
          fill="#123e51"/>
    <g stroke="#d1e5ec" stroke-width="8" fill="#072735">
      <circle cx="445" cy="216" r="32"/>
      <circle cx="755" cy="216" r="32"/>
    </g>
    <g stroke="#a9c7d3" stroke-width="6">
      <path d="M600 231V263M562 220V256M638 220V256"/>
    </g>
    <g fill="#020f17">
      <rect x="589" y="257" width="22" height="17" rx="4"/>
      <rect x="551" y="249" width="22" height="17" rx="4"/>
      <rect x="627" y="249" width="22" height="17" rx="4"/>
    </g>
    <circle cx="568" cy="207" r="5" fill="#ffe2a3"/>
    <circle cx="632" cy="207" r="5" fill="#ffe2a3"/>
  </svg>`;
}

function svgC() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="1200" height="280" viewBox="0 0 1200 280">
    <rect width="1200" height="280" fill="#e9f6fa"/>
    <path d="M80 190H400Q500 190 550 140T700 90H1120"
          fill="none" stroke="${C.dairy}" stroke-width="4"
          stroke-dasharray="12 13"/>
    <g fill="#ffffff" stroke="${C.blue}" stroke-width="5">
      <circle cx="80" cy="190" r="12"/>
      <circle cx="600" cy="117" r="12"/>
      <circle cx="1120" cy="90" r="12"/>
    </g>
    <circle cx="880" cy="136" r="99" fill="${C.blue}"/>
    <g transform="translate(880 136) rotate(58) scale(.59)">
      ${airplaneTop}
    </g>
    <path d="M25 25V255M1175 25V255"
          stroke="#b2d3de" stroke-width="2"
          stroke-dasharray="6 10"/>
  </svg>`;
}

function svgArrow() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="240" height="180" viewBox="0 0 240 180">
    <rect width="240" height="180" fill="${C.blue}"/>
    <path d="M25 72H141L101 32H151L218 90L151 148H101
             L141 108H25Z" fill="#ffffff"/>
  </svg>`;
}

for (const [name, svg] of [
  ["flight-a.png", svgA()],
  ["flight-b.png", svgB()],
  ["flight-c.png", svgC()],
  ["arrow.png", svgArrow()]
]) {
  await sharp(Buffer.from(svg))
    .png({ palette: true, compressionLevel: 9 })
    .toFile(path.join(ASSETS, name));
}

/* =========================================================
   ЛОГОТИП: ТОЛЬКО ЛОКАЛЬНЫЙ ФАЙЛ
   ========================================================= */

let logoPath = null;

for (const name of [
  "logo.png",
  "logo.jpg",
  "logo.jpeg",
  "logo.webp"
]) {
  const candidate = path.join(ROOT, name);

  try {
    await fs.access(candidate);
    logoPath = candidate;
    break;
  } catch {
    // Проверяем следующее расширение.
  }
}

if (!logoPath) {
  throw new Error(
    "Положите logo.png рядом с build.mjs. " +
    "Также поддерживаются logo.jpg, logo.jpeg и logo.webp."
  );
}

await sharp(await fs.readFile(logoPath))
  .flatten({ background: "#ffffff" })
  .resize({ width: 560, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "logo.png"));

console.log("Логотип подготовлен.");

/* =========================================================
   ОБЩИЕ MJML-КОМПОНЕНТЫ
   ========================================================= */

function text(value, attributes = "") {
  return `<mj-text ${attributes}>${esc(value)}</mj-text>`;
}

function section(content, attributes = "") {
  return `
    <mj-section padding="0 28px" background-color="#ffffff"
                ${attributes}>
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function rule(style, padding = "0 0 24px") {
  return `
    <mj-divider
      border-color="${style.layout === "editorial" ? C.orange : C.line}"
      border-width="${style.layout === "editorial" ? "3px" : "1px"}"
      border-style="${style.border}"
      padding="${padding}"/>
  `;
}

function header(style) {
  const logoWidth = style.layout === "editorial" ? "210px" : "224px";

  return section(`
    <mj-image
      src="${asset("logo.png")}"
      alt="Groupe Savencia"
      width="${logoWidth}"
      align="left"
      padding="26px 0 24px"/>
    ${text(COPY.documentTitle,
      `font-size="12px" color="${C.muted}" padding="0 0 17px"`)}
  `);
}

/* =========================================================
   ОБЛОЖКИ
   ========================================================= */

function hero(style) {
  if (style.layout === "editorial") {
    // Части вместе дают точную исходную строку темы.
    // Крупные цифры остаются живым текстом.
    return section(`
      ${text("Тема:",
        `font-size="13px" color="${C.muted}" padding="5px 0 0"`)}
      ${text("10",
        `font-size="330px" line-height="1"
         letter-spacing="-20px" font-weight="700"
         color="${C.blue}" padding="0"
         css-class="giant-date"`)}
      ${text("декабря",
        `font-size="60px" line-height="1.05"
         font-weight="700" padding="0"
         css-class="date-month"`)}
      ${text("— Вылет в Новый ГОД!",
        `font-size="29px" line-height="1.2"
         font-weight="700" padding="8px 0 26px"
         css-class="editorial-title"`)}
    `);
  }

  if (style.layout === "route") {
    return `
      <mj-section padding="28px"
                  background-color="${C.blue}">
        <mj-column width="25%" vertical-align="middle">
          <mj-image src="${asset("arrow.png")}"
                    alt="" width="132px"
                    align="left" padding="0 12px 12px 0"/>
        </mj-column>
        <mj-column width="75%" vertical-align="middle">
          ${text(COPY.subject,
            `font-size="35px" line-height="1.15"
             font-weight="700" color="#ffffff"
             padding="0" css-class="hero-title"`)}
        </mj-column>
      </mj-section>
    `;
  }

  return `
    <mj-section padding="30px 28px 24px"
                background-color="${style.hero}">
      <mj-column>
        ${text(COPY.subject,
          `font-size="32px" line-height="1.18"
           font-weight="700" color="${style.heroText}"
           padding="0" css-class="hero-title"`)}
      </mj-column>
    </mj-section>
    <mj-section padding="0" background-color="${style.hero}">
      <mj-column>
        <mj-image src="${asset(style.art)}"
                  alt="" width="640px" padding="0"/>
      </mj-column>
    </mj-section>
  `;
}

/* =========================================================
   ВСТУПЛЕНИЕ
   ========================================================= */

function slogan(style) {
  if (style.layout === "editorial") {
    return section(`
      ${text(COPY.slogan,
        `font-size="24px" line-height="1.3"
         font-weight="700" padding="3px 0 24px"`)}
      ${rule(style, "0 0 24px")}
    `);
  }

  return `
    <mj-section padding="23px 28px"
                background-color="${style.band}">
      <mj-column>
        ${text(COPY.slogan,
          `font-size="22px" line-height="1.35"
           font-weight="700" color="${style.bandText}"
           padding="0"`)}
      </mj-column>
    </mj-section>
  `;
}

function introduction(style) {
  const editorial = style.layout === "editorial";

  return section(`
    ${text(COPY.greeting,
      `font-size="21px" font-weight="700"
       padding="${editorial ? "0" : "28px"} 0 16px"`)}
    ${text(COPY.attention)}
    ${text(COPY.journey, `padding="0 0 24px"`)}
  `)
  + slogan(style)
  + section(`
    ${text(COPY.airports,
      `padding="${editorial ? "0" : "25px"} 0 15px"`)}
    ${text(COPY.program)}
    ${text(COPY.ticket, `padding="0 0 27px"`)}
    ${rule(style)}
    ${text(COPY.schedule,
      `font-size="27px" line-height="1.2"
       font-weight="700" padding="0 0 25px"`)}
  `);
}

/* =========================================================
   РАСПИСАНИЕ: А / Б / В
   ========================================================= */

function classicSchedule(block, style) {
  const heading = `
    <mj-section padding="0 28px" background-color="#ffffff">
      <mj-column background-color="${style.city}">
        ${text(block.heading,
          `font-size="19px" line-height="1.45"
           font-weight="700" color="${style.cityText}"
           padding="19px 18px"`)}
      </mj-column>
    </mj-section>
  `;

  const rows = block.rows.map(
    ([time, title, description], index) => `
      <mj-section padding="0 28px" background-color="#ffffff">
        <mj-column
          background-color="${style.row}"
          border-left="3px solid ${index === 0 ? C.orange : C.dairy}">
          ${text(`${time} — ${title}`,
            `font-size="18px" line-height="1.45"
             font-weight="700" color="${style.time}"
             padding="20px 18px 9px"`)}
          ${text(description,
            `font-size="16px" line-height="1.6"
             padding="0 18px 20px"`)}
          ${index < 2 ? `
            <mj-divider border-color="${C.line}"
                        border-style="${style.border}"
                        border-width="1px"
                        padding="0 18px"/>
          ` : ""}
        </mj-column>
      </mj-section>
    `
  ).join("");

  return heading + rows + addresses(block, style);
}

/* =========================================================
   РАСПИСАНИЕ: Г — БОЛЬШАЯ ДАТА
   ========================================================= */

function editorialSchedule(block, style) {
  const heading = section(`
    ${text(block.heading,
      `font-size="20px" line-height="1.4"
       font-weight="700" padding="0 0 18px"`)}
  `);

  const rows = block.rows.map(
    ([time, title, description]) => `
      <mj-section padding="0 28px" background-color="#ffffff">
        <mj-column width="40%" vertical-align="top">
          ${text(`${time} —`,
            `font-size="27px" line-height="1.15"
             font-weight="700" color="${C.blue}"
             padding="20px 12px 12px 0"`)}
        </mj-column>
        <mj-column width="60%" vertical-align="top">
          ${text(title,
            `font-size="18px" line-height="1.4"
             font-weight="700" padding="20px 0 9px"
             css-class="editorial-row-title"`)}
          ${text(description,
            `font-size="16px" line-height="1.6"
             padding="0 0 20px"`)}
        </mj-column>
      </mj-section>
      ${section(`
        <mj-divider border-color="${C.line}"
                    border-width="1px" padding="0"/>
      `)}
    `
  ).join("");

  return heading + rows + addresses(block, style);
}

/* =========================================================
   РАСПИСАНИЕ: Д — МАРШРУТНАЯ ЛЕНТА
   ========================================================= */

function routeSchedule(block, style) {
  const heading = `
    <mj-section padding="0" background-color="${C.blue}">
      <mj-column>
        ${text(block.heading,
          `font-size="22px" line-height="1.35"
           font-weight="700" color="#ffffff"
           padding="22px 28px"`)}
      </mj-column>
    </mj-section>
  `;

  const backgrounds = [C.dairy, C.light, "#e9f6fa"];
  const foregrounds = [C.white, C.blue, C.blue];

  const rows = block.rows.map(
    ([time, title, description], index) => {
      const bg = backgrounds[index];
      const fg = foregrounds[index];

      return `
        <mj-section padding="0"
                    background-color="#ffffff">
          <mj-column>
            <mj-divider border-color="#ffffff"
                        border-width="6px" padding="0"/>
          </mj-column>
        </mj-section>

        <mj-section padding="22px 28px"
                    background-color="${bg}">
          <mj-column
            width="43%"
            vertical-align="top"
            border-left="3px solid ${C.blue}">
            ${text(`${time} —`,
              `font-size="30px" line-height="1.15"
               font-weight="700" color="${fg}"
               padding="4px 16px 14px"`)}
          </mj-column>

          <mj-column width="57%" vertical-align="top">
            ${text(title,
              `font-size="21px" line-height="1.25"
               font-weight="700" color="${fg}"
               padding="4px 0 12px 16px"`)}
            ${text(description,
              `font-size="16px" line-height="1.6"
               color="${fg}" padding="0 0 2px 16px"`)}
          </mj-column>
        </mj-section>
      `;
    }
  ).join("");

  return heading + rows + addresses(block, style);
}

/* =========================================================
   АДРЕСА И ЗАВЕРШЕНИЕ
   ========================================================= */

function addresses(block, style) {
  const route = style.layout === "route";

  return section(`
    ${text(block.addressHeading,
      `font-size="17px" font-weight="700"
       padding="24px 0 12px"`)}
    ${block.addresses.map(([city, address]) => `
      ${city ? text(city,
        `font-size="14px" font-weight="700"
         color="${C.blue}" padding="7px 0 4px"`) : ""}
      ${text(address, `padding="0 0 13px"`)}
    `).join("")}
    <mj-divider
      border-color="${route ? C.orange : C.line}"
      border-style="${style.border}"
      border-width="${route ? "3px" : "1px"}"
      padding="13px 0 28px"/>
  `);
}

function ending(style) {
  return section(`
    ${text(COPY.passengers,
      `font-size="21px" font-weight="700" padding="0 0 16px"`)}
    ${text(COPY.mood)}
    ${text(COPY.waiting, `padding="0 0 27px"`)}
  `)
  + `
    <mj-section
      padding="27px 28px 32px"
      background-color="${style.layout === "editorial" ? C.blue : style.band}">
      <mj-column>
        ${text(COPY.seeYou,
          `font-size="25px" line-height="1.3" font-weight="700"
           color="${style.layout === "editorial" ? C.white : style.bandText}"
           padding="0 0 14px"`)}
        ${text(COPY.crew,
          `font-size="17px"
           color="${style.layout === "editorial" ? C.white : style.bandText}"
           padding="0"`)}
      </mj-column>
    </mj-section>
  `;
}

/* =========================================================
   СОБИРАЕМ MJML
   ========================================================= */

function makeMJML(style) {
  const renderSchedule =
    style.layout === "editorial"
      ? editorialSchedule
      : style.layout === "route"
        ? routeSchedule
        : classicSchedule;

  return `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(COPY.subject.replace(/^Тема: /, ""))}</mj-title>
    <mj-breakpoint width="480px"/>
    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text font-size="17px"
               line-height="1.65"
               color="${C.ink}"
               padding="0 0 16px"/>
      <mj-image padding="0"/>
    </mj-attributes>
    <mj-style>
      @media only screen and (max-width:479px) {
        .hero-title div {
          font-size:29px !important;
          line-height:1.15 !important;
        }
        .giant-date div {
          font-size:210px !important;
          letter-spacing:-13px !important;
          line-height:1 !important;
        }
        .date-month div {
          font-size:40px !important;
          line-height:1.1 !important;
        }
        .editorial-title div {
          font-size:25px !important;
          line-height:1.2 !important;
        }
        .editorial-row-title div {
          padding-top:0 !important;
        }
      }
    </mj-style>
  </mj-head>
  <mj-body width="640px" background-color="${style.page}">
    ${header(style)}
    ${hero(style)}
    ${introduction(style)}
    ${SCHEDULES.map(block => renderSchedule(block, style)).join("")}
    ${ending(style)}
  </mj-body>
</mjml>
  `.trim();
}

/* =========================================================
   ПРОВЕРКА ТЕКСТА И РАЗМЕРА
   ========================================================= */

const REQUIRED = [
  COPY.documentTitle,
  COPY.subject,
  COPY.greeting,
  COPY.attention,
  COPY.journey,
  COPY.slogan,
  COPY.airports,
  COPY.program,
  COPY.ticket,
  COPY.schedule,

  ...SCHEDULES.flatMap(block => [
    block.heading,

    ...block.rows.flatMap(([time, title, description]) => [
      `${time} — ${title}`,
      description
    ]),

    block.addressHeading,

    ...block.addresses.flatMap(([city, address]) =>
      city ? [city, address] : [address]
    )
  ]),

  COPY.passengers,
  COPY.mood,
  COPY.waiting,
  COPY.seeYou,
  COPY.crew
];

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function visibleText(html) {
  return normalize(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head[\s\S]*?<\/head>/i, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&#x([0-9a-f]+);/gi,
        (_, value) => String.fromCodePoint(parseInt(value, 16)))
      .replace(/&#(\d+);/g,
        (_, value) => String.fromCodePoint(Number(value)))
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
      .replaceAll("&nbsp;", " ")
      .replaceAll("&ndash;", "–")
      .replaceAll("&mdash;", "—")
      .replaceAll("&laquo;", "«")
      .replaceAll("&raquo;", "»")
      .replaceAll("&amp;", "&")
  );
}

function verifyCopy(html, key) {
  const actual = visibleText(html);

  // Проверяем весь текст, его последовательность и отсутствие
  // дополнительных текстовых фрагментов в теле письма.
  const expected = normalize(REQUIRED.join(" "));

  if (actual !== expected) {
    let cursor = 0;

    for (const fragment of REQUIRED) {
      const target = normalize(fragment);
      const index = actual.indexOf(target, cursor);

      if (index === -1) {
        throw new Error(
          `${key}: не найден текст в нужном порядке: ${fragment}`
        );
      }

      cursor = index + target.length;
    }

    throw new Error(
      `${key}: текст отличается от документа. ` +
      "Проверьте добавленные или изменённые фрагменты."
    );
  }
}

const report = [];
const previewData = [];

for (const [key, style] of Object.entries(STYLES)) {
  console.log(`Собираем: ${style.name}`);

  const source = makeMJML(style);

  // await работает и с асинхронной, и с синхронной версией API.
  const result = await mjml2html(source, {
    validationLevel: "strict"
  });

  if (result.errors?.length) {
    throw new Error(
      `${key}: ошибки MJML:\n` +
      JSON.stringify(result.errors, null, 2)
    );
  }

  if (typeof result.html !== "string") {
    throw new Error(
      `${key}: MJML не вернул HTML. ` +
      "Проверьте установленную версию пакета."
    );
  }

  // Условные комментарии Outlook не удаляем.
  const html = result.html.trim();

  verifyCopy(html, key);

  const bytes = Buffer.byteLength(html, "utf8");

  // Проверяем десятичный предел с запасом относительно 100 КБ.
  if (bytes >= 90_000) {
    throw new Error(
      `${key}: HTML занимает ${bytes} байт. ` +
      "Превышен внутренний лимит 90 000 байт."
    );
  }

  await fs.writeFile(
    path.join(OUT, `${key}.mjml`),
    source,
    "utf8"
  );

  await fs.writeFile(
    path.join(OUT, `${key}.html`),
    html,
    "utf8"
  );

  /*
   * Base64 — исключительно для локального просмотрщика.
   * В отправляемых a.html–e.html остаются HTTPS-ссылки.
   */
  let localHTML = html;

  const imageNames = [
    "logo.png",
    ...(style.art ? [style.art] : []),
    ...(style.layout === "route" ? ["arrow.png"] : [])
  ];

  for (const name of imageNames) {
    const buffer = await fs.readFile(path.join(ASSETS, name));

    localHTML = localHTML.replaceAll(
      asset(name),
      `data:image/png;base64,${buffer.toString("base64")}`
    );
  }

  previewData.push({
    key,
    name: style.name,
    bytes,
    html: localHTML
  });

  report.push({
    variant: key,
    name: style.name,
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed"
  });
}

/* =========================================================
   ПРОСМОТРЩИК: ВЫБОР ВАРИАНТА И ШИРИНЫ
   ========================================================= */

// Защищаем встроенный JSON от закрывающих HTML-тегов.
const previewJSON = JSON.stringify(previewData)
  .replaceAll("<", "\\u003c")
  .replaceAll(">", "\\u003e")
  .replaceAll("&", "\\u0026");

const gallery = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Пять вариантов письма Savencia</title>
  <style>
    * { box-sizing:border-box; }

    body {
      margin:0;
      background:#e6ecef;
      color:#173f4c;
      font-family:Arial,Helvetica,sans-serif;
    }

    .toolbar {
      position:sticky;
      top:0;
      z-index:10;
      padding:18px 22px;
      background:#ffffff;
      border-bottom:1px solid #c6d6dd;
    }

    .topline {
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:12px;
      margin-bottom:14px;
    }

    h1 {
      margin:0 auto 0 0;
      font-size:20px;
    }

    .variants {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
    }

    button {
      border:1px solid #b4cad4;
      border-radius:0;
      background:#ffffff;
      color:#004b62;
      font:inherit;
      font-size:13px;
      padding:10px 12px;
      cursor:pointer;
    }

    button.active {
      background:#004b62;
      color:#ffffff;
      border-color:#004b62;
    }

    .meta {
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      gap:15px;
      max-width:740px;
      margin:22px auto 14px;
      padding:0 16px;
      font-size:13px;
    }

    .meta strong {
      font-size:17px;
      margin-right:auto;
    }

    a { color:#004b62; }

    .stage {
      padding:0 16px 40px;
      overflow-x:auto;
    }

    iframe {
      display:block;
      width:640px;
      height:3200px;
      margin:0 auto;
      border:0;
      background:#ffffff;
      box-shadow:0 10px 32px rgba(0,35,50,.12);
    }

    body.mobile iframe { width:375px; }

    .note {
      max-width:740px;
      margin:0 auto 18px;
      padding:0 16px;
      color:#52666d;
      font-size:12px;
      line-height:1.5;
    }

    @media(max-width:480px) {
      .toolbar { padding:12px; }
      h1 { font-size:17px; }
      .stage { padding-left:8px; padding-right:8px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="topline">
      <h1>Пять вариантов Savencia</h1>
      <button type="button" id="desktop" class="active">
        Компьютер · 640 px
      </button>
      <button type="button" id="mobile">
        Телефон · 375 px
      </button>
    </div>
    <div class="variants" id="variants"></div>
  </div>

  <div class="meta">
    <strong id="name"></strong>
    <span id="size"></span>
    <a id="mjmlLink">MJML</a>
    <a id="htmlLink">HTML</a>
  </div>

  <p class="note">
    Локальный предпросмотр. Отправляемые HTML-файлы используют
    HTTPS-ссылки на картинки. Перед рассылкой замените адрес
    example.com на свой хостинг и проверьте тестовое письмо.
  </p>

  <div class="stage">
    <iframe id="frame" title="Предпросмотр письма"></iframe>
  </div>

  <script>
    const variants = ${previewJSON};
    const frame = document.getElementById("frame");
    const buttons = document.getElementById("variants");
    const desktop = document.getElementById("desktop");
    const mobile = document.getElementById("mobile");
    let current = 0;

    function resizeFrame() {
      try {
        const doc = frame.contentDocument;
        if (!doc || !doc.body) return;

        frame.style.height = "1px";

        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight
        );

        frame.style.height = (height + 24) + "px";
      } catch {
        frame.style.height = "4000px";
      }
    }

    function select(index) {
      current = index;
      const item = variants[index];

      document.getElementById("name").textContent = item.name;
      document.getElementById("size").textContent =
        "HTML: " + (item.bytes / 1024).toFixed(1) + " КиБ";

      document.getElementById("mjmlLink").href =
        item.key + ".mjml";

      document.getElementById("htmlLink").href =
        item.key + ".html";

      buttons.querySelectorAll("button").forEach((button, i) => {
        button.classList.toggle("active", i === index);
      });

      frame.title = item.name;
      frame.style.height = "3200px";
      frame.srcdoc = item.html;
    }

    variants.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.name;
      button.addEventListener("click", () => select(index));
      buttons.appendChild(button);
    });

    function setMobile(enabled) {
      document.body.classList.toggle("mobile", enabled);
      desktop.classList.toggle("active", !enabled);
      mobile.classList.toggle("active", enabled);
      setTimeout(resizeFrame, 150);
      setTimeout(resizeFrame, 500);
    }

    desktop.addEventListener("click", () => setMobile(false));
    mobile.addEventListener("click", () => setMobile(true));

    frame.addEventListener("load", () => {
      resizeFrame();
      setTimeout(resizeFrame, 300);
      setTimeout(resizeFrame, 900);

      try {
        frame.contentDocument.querySelectorAll("img").forEach(img => {
          if (!img.complete) {
            img.addEventListener("load", resizeFrame, { once:true });
            img.addEventListener("error", resizeFrame, { once:true });
          }
        });
      } catch {}
    });

    window.addEventListener("resize", () => {
      setTimeout(resizeFrame, 100);
    });

    if (window.innerWidth < 500) {
      setMobile(true);
    }

    select(0);
  </script>
</body>
</html>`;

await fs.writeFile(
  path.join(OUT, "preview.html"),
  gallery,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.table(report);

console.log("");
console.log("Готово. Откройте:");
console.log(path.join(OUT, "preview.html"));
console.log("");
console.log(
  "Проверены: компиляция MJML, полный текст и размер HTML."
);
console.log(
  "Отображение в Gmail/Outlook проверяется отдельно " +
  "тестовой отправкой."
);
