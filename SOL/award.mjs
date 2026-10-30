import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const ASSETS = path.join(OUT, "assets");

await fs.mkdir(ASSETS, { recursive: true });

const BASE = (
  process.env.ASSET_BASE ||
  "https://example.com/savencia-assets"
).replace(/\/$/, "");

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

const esc = s => String(s)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const asset = name => `${BASE}/${name}`;

/* ---------------------------------------------------------
   ИСХОДНЫЙ ТЕКСТ — ЕДИНЫЙ ИСТОЧНИК ДЛЯ ВЁРСТКИ И ПРОВЕРКИ
   --------------------------------------------------------- */

const T = {
  title: "Информационная рассылка в почте",
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
  schedule: "Расписание нашего рейса",
  registration: "Регистрация на рейс (Welcome)",
  registrationDescription:
    "Встреча пассажиров, посадочные билеты, фотографии, угощения и первые праздничные активности.",
  takeoff: "Взлёт. Торжественная часть",
  takeoffDescription:
    "Церемония награждения сотрудников и праздничная программа.",
  flight: "Полёт в Новый год",
  flightDescription:
    "Музыка, фуршет, развлечения, общение и новогодние сюрпризы.",
  passengers: "Уважаемые пассажиры!",
  mood:
    "Просим заранее подготовить хорошее настроение и быть готовыми к незабываемому путешествию.",
  waiting:
    "Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!",
  meeting: "До встречи 10 декабря!",
  crew: "Ваш экипаж Savencia ✈️"
};

const GROUPS = [
  {
    title: "✈️ МОСКВА и УФА(по местному времени)",
    addressTitle: "Аэропорты отправления:",
    addresses: [
      [
        "МОСКВА:",
        "проспект Андропова, 11, корпус 2, Южный Event-Port."
      ],
      [
        "УФА:",
        "улица Менделеева, 205А, ресторан «Пастернак»."
      ]
    ],
    rows: [
      ["17:00–18:00", T.registration, T.registrationDescription],
      ["18:00–20:00", T.takeoff, T.takeoffDescription],
      ["20:00–23:00", T.flight, T.flightDescription]
    ]
  },
  {
    title: "✈️  БЕЛЕБЕЙ",
    addressTitle: "Аэропорт отправления:",
    addresses: [
      [
        "",
        "улица Амирова, 10А, Центральный дворец культуры Белебеевского района."
      ]
    ],
    rows: [
      ["15:00–15:30", T.registration, T.registrationDescription],
      ["15:30–18:00", T.takeoff, T.takeoffDescription],
      ["18:00–20:00", T.flight, T.flightDescription]
    ]
  }
];

/* ---------------------------------------------------------
   ЛОКАЛЬНЫЙ ЛОГОТИП
   --------------------------------------------------------- */

let logo = null;

for (const name of [
  "logo.png", "logo.jpg", "logo.jpeg", "logo.webp"
]) {
  const candidate = path.join(ROOT, name);

  try {
    await fs.access(candidate);
    logo = candidate;
    break;
  } catch {}
}

if (!logo) {
  throw new Error("Положите logo.png рядом с award.mjs.");
}

await sharp(await fs.readFile(logo))
  .flatten({ background: "#ffffff" })
  .resize({ width: 560, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "f-logo.png"));

/* ---------------------------------------------------------
   ИЛЛЮМИНАТОР
   Самостоятельная иллюстрация без текста.
   В письмо включается PNG.
   --------------------------------------------------------- */

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

const windowSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
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

await sharp(Buffer.from(windowSVG))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "f-window.png"));

/* ---------------------------------------------------------
   КОМПОНЕНТЫ ВЁРСТКИ
   --------------------------------------------------------- */

const txt = (value, attrs = "") =>
  `<mj-text ${attrs}>${esc(value)}</mj-text>`;

function section(content, attrs = "") {
  return `
    <mj-section background-color="#ffffff"
                padding="0 30px" ${attrs}>
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function divider(padding = "0", color = C.line, width = "1px") {
  return `
    <mj-divider border-color="${color}"
                border-width="${width}"
                padding="${padding}"/>
  `;
}

function schedule(group, groupIndex) {
  const accent = groupIndex === 0 ? C.orange : C.blue;

  const rows = group.rows.map(
    ([time, title, description], index) => `
      <mj-section padding="0 22px"
                  background-color="${C.paper}">
        <mj-column>
          ${index ? divider("0 0 18px") : ""}
          ${txt(`${time} — ${title}`,
            `font-size="22px" line-height="1.35"
             font-weight="700" color="${C.navy}"
             padding="0 0 10px"`)}
          ${txt(description,
            `font-size="16px" line-height="1.65"
             padding="0 0 21px"`)}
        </mj-column>
      </mj-section>
    `
  ).join("");

  return `
    <mj-wrapper padding="0 30px 25px"
                background-color="#ffffff">

      <mj-section padding="20px 22px"
                  background-color="${C.navy}"
                  border-top="5px solid ${accent}">
        <mj-column>
          ${txt(group.title,
            `font-size="21px" line-height="1.35"
             font-weight="700" color="#ffffff"
             padding="0"`)}
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="${C.paper}">
        <mj-column>
          <mj-spacer height="22px"/>
        </mj-column>
      </mj-section>

      ${rows}

      <mj-section padding="0 22px 22px"
                  background-color="${C.paper}">
        <mj-column>
          <mj-divider border-color="#aabfc6"
                      border-width="1px"
                      border-style="dashed"
                      padding="0 0 19px"/>

          ${txt(group.addressTitle,
            `font-size="16px" font-weight="700"
             padding="0 0 12px"`)}

          ${group.addresses.map(([city, address]) => `
            ${city ? txt(city,
              `font-size="12px" font-weight="700"
               color="${C.blue}" padding="4px 0 4px"`) : ""}
            ${txt(address,
              `font-size="16px" padding="0 0 10px"`)}
          `).join("")}
        </mj-column>
      </mj-section>

    </mj-wrapper>
  `;
}

/* ---------------------------------------------------------
   ПИСЬМО
   --------------------------------------------------------- */

const source = `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(T.subject.replace(/^Тема: /, ""))}</mj-title>
    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text font-size="17px"
               line-height="1.65"
               color="${C.ink}"
               padding="0 0 17px"/>
      <mj-image padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .big-ten div {
          font-size:145px !important;
          letter-spacing:-10px !important;
          line-height:1 !important;
        }
        .month div {
          font-size:32px !important;
        }
        .hero-title div {
          font-size:29px !important;
          line-height:1.15 !important;
        }
        .statement div {
          font-size:31px !important;
          line-height:1.15 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e7e7e0">

    ${section(`
      <mj-image src="${asset("f-logo.png")}"
                alt="Groupe Savencia"
                width="216px" align="left"
                padding="26px 0 24px"/>
      ${txt(T.title,
        `font-size="12px" color="${C.muted}"
         padding="0 0 17px"`)}
    `)}

    <mj-section padding="0" background-color="${C.paper}">
      <mj-column>
        ${divider("0", C.orange, "4px")}
      </mj-column>
    </mj-section>

    <mj-section padding="27px 24px 19px"
                background-color="${C.paper}">
      <mj-column width="50%" vertical-align="middle">
        ${txt("Тема:",
          `font-size="12px" color="${C.muted}"
           padding="0 0 8px 6px"`)}
        ${txt("10",
          `font-size="173px" line-height="1"
           letter-spacing="-12px" font-weight="700"
           color="${C.navy}" padding="0"
           css-class="big-ten"`)}
        ${txt("декабря",
          `font-size="35px" line-height="1.1"
           font-weight="700" color="${C.orange}"
           padding="0 0 20px 6px" css-class="month"`)}
        ${txt("— Вылет в Новый ГОД!",
          `font-size="31px" line-height="1.15"
           font-weight="700" color="${C.navy}"
           padding="0 4px 12px 6px"
           css-class="hero-title"`)}
      </mj-column>

      <mj-column width="50%" vertical-align="middle">
        <mj-image
          src="${asset("f-window.png")}"
          alt=""
          width="296px"
          padding="0"/>
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.greeting,
        `font-size="22px" font-weight="700"
         padding="29px 0 16px"`)}
      ${txt(T.attention)}
      ${txt(T.journey, `padding="0 0 28px"`)}
    `)}

    <mj-section padding="28px 30px"
                background-color="${C.navy}">
      <mj-column border-left="5px solid ${C.orange}">
        ${txt(T.slogan,
          `font-size="39px" line-height="1.12"
           font-weight="700" color="#ffffff"
           padding="0 0 0 20px" css-class="statement"`)}
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.airports, `padding="28px 0 17px"`)}
      ${txt(T.program)}
    `)}

    <mj-wrapper padding="0 30px 28px"
                background-color="#ffffff">
      <mj-section padding="19px 21px"
                  background-color="#f1f5e7"
                  border-left="4px solid ${C.green}">
        <mj-column>
          ${txt(T.ticket, `font-size="17px" padding="0"`)}
        </mj-column>
      </mj-section>
    </mj-wrapper>

    ${section(`
      ${divider("0 0 24px", C.orange, "3px")}
      ${txt(T.schedule,
        `font-size="31px" line-height="1.2"
         font-weight="700" padding="0 0 24px"`)}
    `)}

    ${GROUPS.map(schedule).join("")}

    ${section(`
      ${txt(T.passengers,
        `font-size="22px" font-weight="700"
         padding="3px 0 16px"`)}
      ${txt(T.mood)}
      ${txt(T.waiting, `padding="0 0 29px"`)}
    `)}

    <mj-section padding="0" background-color="${C.navy}">
      <mj-group width="100%">
        <mj-column width="65%">
          ${divider("0", C.cyan, "5px")}
        </mj-column>
        <mj-column width="20%">
          ${divider("0", C.green, "5px")}
        </mj-column>
        <mj-column width="15%">
          ${divider("0", C.orange, "5px")}
        </mj-column>
      </mj-group>
    </mj-section>

    <mj-section padding="27px 30px 32px"
                background-color="${C.navy}">
      <mj-column>
        ${txt(T.meeting,
          `font-size="30px" line-height="1.2"
           font-weight="700" color="#ffffff"
           padding="0 0 15px"`)}
        ${txt(T.crew,
          `font-size="17px" color="#ffffff" padding="0"`)}
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`.trim();

/* ---------------------------------------------------------
   КОМПИЛЯЦИЯ И КОНТРОЛЬ
   --------------------------------------------------------- */

const result = await mjml2html(source, {
  validationLevel: "strict"
});

if (result.errors?.length) {
  throw new Error(JSON.stringify(result.errors, null, 2));
}

if (typeof result.html !== "string") {
  throw new Error("MJML не вернул HTML.");
}

const html = result.html.trim();
const bytes = Buffer.byteLength(html, "utf8");

if (bytes >= 90_000) {
  throw new Error(
    `HTML занимает ${bytes} байт. ` +
    "Превышен внутренний предел 90 000 байт."
  );
}

const normalize = s => s.replace(/\s+/g, " ").trim();

function visibleText(value) {
  return normalize(
    value
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head[\s\S]*?<\/head>/i, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&#x([0-9a-f]+);/gi,
        (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&#(\d+);/g,
        (_, n) => String.fromCodePoint(Number(n)))
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

const required = [
  T.title,
  T.subject,
  T.greeting,
  T.attention,
  T.journey,
  T.slogan,
  T.airports,
  T.program,
  T.ticket,
  T.schedule,

  ...GROUPS.flatMap(group => [
    group.title,
    ...group.rows.flatMap(([time, title, description]) => [
      `${time} — ${title}`,
      description
    ]),
    group.addressTitle,
    ...group.addresses.flatMap(([city, address]) =>
      city ? [city, address] : [address]
    )
  ]),

  T.passengers,
  T.mood,
  T.waiting,
  T.meeting,
  T.crew
];

const expected = normalize(required.join(" "));
const actual = visibleText(html);

if (actual !== expected) {
  let cursor = 0;

  for (const fragment of required) {
    const target = normalize(fragment);
    const index = actual.indexOf(target, cursor);

    if (index < 0) {
      throw new Error(
        "Не найден текст в нужной последовательности:\n" +
        fragment
      );
    }

    cursor = index + target.length;
  }

  throw new Error(
    "В тексте письма обнаружены дополнительные фрагменты."
  );
}

await fs.writeFile(path.join(OUT, "f.mjml"), source, "utf8");
await fs.writeFile(path.join(OUT, "f.html"), html, "utf8");

/* ---------------------------------------------------------
   ПРОСМОТРЩИК: BASE64 ТОЛЬКО ДЛЯ ЛОКАЛЬНОГО ПРОСМОТРА
   --------------------------------------------------------- */

let localHTML = html;

for (const name of ["f-logo.png", "f-window.png"]) {
  const buffer = await fs.readFile(path.join(ASSETS, name));

  localHTML = localHTML.replaceAll(
    asset(name),
    `data:image/png;base64,${buffer.toString("base64")}`
  );
}

const embedded = JSON.stringify(localHTML)
  .replaceAll("<", "\\u003c")
  .replaceAll(">", "\\u003e")
  .replaceAll("&", "\\u0026");

const preview = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Savencia — праздник за иллюминатором</title>
  <style>
    * { box-sizing:border-box; }

    body {
      margin:0;
      background:#e7e7e0;
      color:#173f4c;
      font-family:Arial,Helvetica,sans-serif;
    }

    header {
      position:sticky;
      top:0;
      z-index:10;
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:10px;
      padding:15px 20px;
      background:#ffffff;
      border-bottom:1px solid #cbd9dc;
    }

    h1 {
      margin:0 auto 0 0;
      font-size:18px;
    }

    button {
      padding:10px 13px;
      border:1px solid #9bb9c4;
      color:#004b62;
      background:#ffffff;
      font:inherit;
      font-size:13px;
      cursor:pointer;
    }

    button.active {
      background:#004b62;
      color:#ffffff;
    }

    .info {
      max-width:700px;
      margin:18px auto;
      padding:0 16px;
      font-size:13px;
      line-height:1.6;
    }

    a { color:#004b62; margin-left:12px; }

    .stage {
      overflow-x:auto;
      padding:0 12px 40px;
    }

    iframe {
      display:block;
      width:640px;
      height:3500px;
      margin:auto;
      border:0;
      background:#ffffff;
      box-shadow:0 12px 36px rgba(0,45,65,.12);
    }

    body.mobile iframe { width:375px; }
  </style>
</head>
<body>
  <header>
    <h1>Праздник за иллюминатором</h1>
    <button id="desktop" class="active" type="button">
      Компьютер · 640 px
    </button>
    <button id="mobile" type="button">
      Телефон · 375 px
    </button>
  </header>

  <div class="info">
    HTML: ${(bytes / 1024).toFixed(1)} КиБ.
    Полный текст проверен.
    <a href="f.mjml">MJML</a>
    <a href="f.html">HTML для рассылки</a>
  </div>

  <div class="stage">
    <iframe id="frame" title="Письмо Savencia"></iframe>
  </div>

  <script>
    const frame = document.getElementById("frame");
    const desktop = document.getElementById("desktop");
    const mobile = document.getElementById("mobile");

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
        frame.style.height = "4500px";
      }
    }

    function setMobile(enabled) {
      document.body.classList.toggle("mobile", enabled);
      desktop.classList.toggle("active", !enabled);
      mobile.classList.toggle("active", enabled);

      setTimeout(resizeFrame, 100);
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

    if (window.innerWidth < 500) setMobile(true);

    frame.srcdoc = ${embedded};
  </script>
</body>
</html>`;

await fs.writeFile(
  path.join(OUT, "f-preview.html"),
  preview,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "f-report.json"),
  JSON.stringify({
    variant: "Праздник за иллюминатором",
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Новый вариант собран.");
console.log(`HTML: ${bytes} байт.`);
console.log("Текст проверен полностью.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "f-preview.html"));
console.log("");
console.log(
  "Перед отправкой разместите картинки на HTTPS-хостинге, " +
  "укажите ASSET_BASE и повторите сборку."
);
