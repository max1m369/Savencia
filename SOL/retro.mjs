import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

/* =========================================================
   НАСТРОЙКИ
   ========================================================= */

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "dist");
const ASSETS = path.join(OUT, "assets");

await fs.mkdir(ASSETS, { recursive: true });

// Для локального просмотра менять не нужно.
// Перед рассылкой укажите публичную HTTPS-папку с картинками.
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
  sky: "#eaf6fa",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#c4d8df",
  white: "#ffffff"
};

const asset = name => `${BASE}/${name}`;

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const normalize = value =>
  value.replace(/\s+/g, " ").trim();

function decode(value) {
  return value
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
    .replaceAll("&amp;", "&");
}

/* =========================================================
   ТЕКСТ
   ========================================================= */

const T = {
  subject: "10 декабря — Вылет в Новый ГОД!",
  date: "10 декабря",
  headline: "— Вылет в Новый ГОД!",

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

  passengers:
    "Уважаемые пассажиры!",

  mood:
    "Просим заранее подготовить хорошее настроение и быть готовыми к незабываемому путешествию.",

  waiting:
    "Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!",

  meeting:
    "До встречи 10 декабря!",

  crew:
    "Ваш экипаж Savencia ✈️"
};

const GROUPS = [
  {
    heading: "✈️ МОСКВА и УФА(по местному времени)",
    addressHeading: "Аэропорты отправления:",

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
    heading: "✈️  БЕЛЕБЕЙ",
    addressHeading: "Аэропорт отправления:",

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

/* =========================================================
   ЛОГОТИП
   SVG — приоритетный оригинал.
   Для e-mail автоматически создаётся PNG.
   ========================================================= */

let logoSource = null;

for (const candidate of [
  path.join(ROOT, "logo.svg"),
  path.join(ROOT, "logo.png"),
  path.join(ROOT, "logo.jpg"),
  path.join(ROOT, "logo.jpeg"),
  path.join(ROOT, "logo.webp"),
  path.join(ASSETS, "g-logo.png"),
  path.join(ASSETS, "f-logo.png")
]) {
  try {
    await fs.access(candidate);
    logoSource = candidate;
    break;
  } catch {}
}

if (!logoSource) {
  throw new Error(
    "Положите logo.svg или logo.png рядом с retro.mjs."
  );
}

const logoBuffer = await fs.readFile(logoSource);
const vectorLogo = path.extname(logoSource).toLowerCase() === ".svg";

await sharp(
  logoBuffer,
  vectorLogo ? { density: 300 } : {}
)
  .flatten({ background: "#ffffff" })
  .resize({
    width: 648,
    withoutEnlargement: !vectorLogo
  })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "g-logo.png"));

if (vectorLogo) {
  await fs.writeFile(
    path.join(ASSETS, "g-logo.svg"),
    logoBuffer
  );
}

console.log(
  vectorLogo
    ? "Оригинальный SVG сохранён. PNG для письма подготовлен."
    : "Логотип подготовлен."
);

/* =========================================================
   ГРАФИКА: ТРИ ШАРА, ОДИН САМОЛЁТ
   Никакого текста внутри изображения.
   ========================================================= */

function star(cx, cy, outer, inner, rotation = 0) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle =
      -Math.PI / 2 + i * Math.PI / 5 + rotation;

    const radius = i % 2 ? inner : outer;

    return (
      `${cx + Math.cos(angle) * radius},` +
      `${cy + Math.sin(angle) * radius}`
    );
  }).join(" ");
}

const posterSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1280" height="580" viewBox="0 0 1280 580">

  <rect width="1280" height="580" fill="${C.navy}"/>

  <g stroke="#ffffff" stroke-width="2" opacity=".45">
    <path d="M244 0V121"/>
    <path d="M651 0V59"/>
    <path d="M1042 0V156"/>
  </g>

  <rect x="220" y="116" width="48" height="24"
        rx="3" fill="${C.green}"/>
  <rect x="621" y="53" width="60" height="27"
        rx="3" fill="${C.orange}"/>
  <rect x="1021" y="151" width="42" height="22"
        rx="3" fill="${C.cyan}"/>

  <circle cx="244" cy="299" r="166" fill="${C.green}"/>
  <circle cx="651" cy="295" r="221" fill="${C.orange}"/>
  <circle cx="1042" cy="311" r="146" fill="${C.cyan}"/>

  <g fill="none" stroke="#ffffff" stroke-width="3" opacity=".55">
    <path d="M154 187Q231 137 313 177"/>
    <path d="M522 133Q643 70 759 133"/>
    <path d="M965 211Q1037 173 1106 214"/>
  </g>

  <g fill="none" stroke="${C.navy}" stroke-width="2" opacity=".24">
    <path d="M123 349Q244 276 365 349"/>
    <path d="M480 383Q651 284 822 383"/>
    <path d="M935 357Q1042 291 1149 357"/>
  </g>

  <path d="M-40 497C192 523 427 442 698 266"
        fill="none" stroke="#ffffff"
        stroke-width="3" stroke-dasharray="11 15"
        opacity=".85"/>

  <g transform="translate(787 275) rotate(56) scale(1.78)">
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

  <polygon points="${star(405, 102, 21, 8, .1)}"
           fill="${C.cyan}"/>
  <polygon points="${star(1161, 92, 24, 10)}"
           fill="${C.orange}"/>
  <polygon points="${star(935, 488, 18, 7, .25)}"
           fill="${C.green}"/>
  <polygon points="${star(95, 81, 15, 6)}"
           fill="#ffffff"/>

  <g fill="#ffffff">
    <circle cx="373" cy="476" r="4"/>
    <circle cx="1115" cy="492" r="4"/>
    <circle cx="478" cy="53" r="3"/>
    <circle cx="1206" cy="328" r="3"/>
    <circle cx="62" cy="291" r="3"/>
  </g>

  <g stroke-width="4">
    <path d="M101 462L113 445" stroke="${C.cyan}"/>
    <path d="M469 498L483 516" stroke="${C.green}"/>
    <path d="M935 106L951 116" stroke="${C.orange}"/>
  </g>

</svg>
`;

await sharp(Buffer.from(posterSVG))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "g-poster.png"));

/* =========================================================
   MJML-КОМПОНЕНТЫ
   ========================================================= */

function txt(value, attributes = "") {
  return `<mj-text ${attributes}>${esc(value)}</mj-text>`;
}

function section(content, attributes = "") {
  return `
    <mj-section
      background-color="${C.paper}"
      padding="0 30px"
      ${attributes}>
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function stripe() {
  return `
    <mj-section padding="0" background-color="${C.navy}">
      <mj-group width="100%">
        <mj-column width="50%">
          <mj-divider border-color="${C.orange}"
                      border-width="5px" padding="0"/>
        </mj-column>
        <mj-column width="30%">
          <mj-divider border-color="${C.cyan}"
                      border-width="5px" padding="0"/>
        </mj-column>
        <mj-column width="20%">
          <mj-divider border-color="${C.green}"
                      border-width="5px" padding="0"/>
        </mj-column>
      </mj-group>
    </mj-section>
  `;
}

function scheduleBlock(group, index) {
  const accent = index === 0 ? C.orange : C.blue;

  return `
    <mj-wrapper padding="0 30px 27px"
                background-color="${C.paper}">

      <mj-section
        padding="21px 22px"
        background-color="#ffffff"
        border-top="5px solid ${accent}">
        <mj-column>
          ${txt(group.heading,
            `font-size="21px"
             line-height="1.35"
             font-weight="700"
             color="${C.navy}"
             padding="0"`)}
        </mj-column>
      </mj-section>

      ${group.rows.map(([time, title, description], rowIndex) => `
        <mj-section padding="0 22px" background-color="#ffffff">
          <mj-column>
            <mj-divider
              border-color="${C.line}"
              border-width="1px"
              border-style="${rowIndex === 0 ? "dashed" : "solid"}"
              padding="0"/>
          </mj-column>
        </mj-section>

        <mj-section padding="20px 22px"
                    background-color="#ffffff">

          <mj-column width="43%" vertical-align="top">
            ${txt(`${time} —`,
              `font-size="25px"
               line-height="1.2"
               font-weight="700"
               color="${C.navy}"
               padding="0 12px 12px 0"`)}
          </mj-column>

          <mj-column width="57%" vertical-align="top">
            ${txt(title,
              `font-size="18px"
               line-height="1.35"
               font-weight="700"
               color="${rowIndex === 1 ? C.orange : C.navy}"
               padding="0 0 10px"`)}
            ${txt(description,
              `font-size="16px"
               line-height="1.6"
               padding="0"`)}
          </mj-column>

        </mj-section>
      `).join("")}

      <mj-section padding="0 22px 21px"
                  background-color="#ffffff">
        <mj-column>

          <mj-divider
            border-color="${C.line}"
            border-width="1px"
            border-style="dashed"
            padding="0 0 18px"/>

          ${txt(group.addressHeading,
            `font-size="15px"
             font-weight="700"
             padding="0 0 12px"`)}

          ${group.addresses.map(([city, address]) => `
            ${city ? txt(city,
              `font-size="12px"
               font-weight="700"
               color="${C.blue}"
               padding="5px 0 5px"`) : ""}

            ${txt(address,
              `font-size="16px"
               line-height="1.6"
               padding="0 0 10px"`)}
          `).join("")}

        </mj-column>
      </mj-section>

    </mj-wrapper>
  `;
}

/* =========================================================
   ПИСЬМО
   ========================================================= */

const source = `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(T.subject)}</mj-title>
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
        .hero-date div {
          font-size:49px !important;
          line-height:1.05 !important;
        }
        .hero-title div {
          font-size:31px !important;
          line-height:1.12 !important;
        }
        .statement div {
          font-size:30px !important;
          line-height:1.18 !important;
        }
        .schedule-title div {
          font-size:28px !important;
          line-height:1.2 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e1e8e8">

    <mj-section padding="25px 30px"
                background-color="#ffffff">
      <mj-column>
        <mj-image src="${asset("g-logo.png")}"
                  alt="Groupe Savencia"
                  width="216px"
                  align="left"
                  padding="0"/>
      </mj-column>
    </mj-section>

    ${stripe()}

    <mj-section padding="28px 30px 0"
                background-color="${C.navy}">
      <mj-column>
        ${txt(T.date,
          `font-size="70px"
           line-height="1"
           font-weight="700"
           color="#ffffff"
           padding="0 0 14px"
           css-class="hero-date"`)}
        ${txt(T.headline,
          `font-size="40px"
           line-height="1.1"
           font-weight="700"
           color="#ffffff"
           padding="0"
           css-class="hero-title"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="0"
                background-color="${C.navy}">
      <mj-column>
        <mj-image src="${asset("g-poster.png")}"
                  alt=""
                  width="640px"
                  padding="0"/>
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.greeting,
        `font-size="23px"
         font-weight="700"
         padding="29px 0 17px"`)}
      ${txt(T.attention)}
      ${txt(T.journey, `padding="0 0 27px"`)}
    `)}

    <mj-section padding="25px 30px 27px"
                background-color="${C.green}">
      <mj-column>
        ${txt(T.slogan,
          `font-size="37px"
           line-height="1.14"
           font-weight="700"
           color="${C.navy}"
           padding="0"
           css-class="statement"`)}
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.airports, `padding="28px 0 17px"`)}
      ${txt(T.program)}
    `)}

    <mj-wrapper padding="0 30px 29px"
                background-color="${C.paper}">
      <mj-section padding="18px 20px"
                  background-color="${C.sky}"
                  border-left="4px solid ${C.blue}">
        <mj-column>
          ${txt(T.ticket,
            `font-size="17px"
             line-height="1.65"
             padding="0"`)}
        </mj-column>
      </mj-section>
    </mj-wrapper>

    ${section(`
      <mj-divider border-color="${C.orange}"
                  border-width="4px"
                  padding="0 0 24px"/>
      ${txt(T.schedule,
        `font-size="33px"
         line-height="1.2"
         font-weight="700"
         padding="0 0 25px"
         css-class="schedule-title"`)}
    `)}

    ${GROUPS.map(scheduleBlock).join("")}

    ${section(`
      ${txt(T.passengers,
        `font-size="22px"
         font-weight="700"
         padding="0 0 17px"`)}
      ${txt(T.mood)}
      ${txt(T.waiting, `padding="0 0 29px"`)}
    `)}

    ${stripe()}

    <mj-section padding="27px 30px 32px"
                background-color="${C.navy}">
      <mj-column>
        ${txt(T.meeting,
          `font-size="30px"
           line-height="1.2"
           font-weight="700"
           color="#ffffff"
           padding="0 0 15px"`)}
        ${txt(T.crew,
          `font-size="17px"
           color="#ffffff"
           padding="0"`)}
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`.trim();

/* =========================================================
   КОМПИЛЯЦИЯ И ПРОВЕРКИ
   ========================================================= */

const result = await mjml2html(source, {
  validationLevel: "strict"
});

if (result.errors?.length) {
  throw new Error(
    "Ошибки MJML:\n" +
    JSON.stringify(result.errors, null, 2)
  );
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

function visibleText(value) {
  return normalize(
    decode(
      value
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]*>/g, " ")
    )
  );
}

const required = [
  T.date,
  T.headline,
  T.greeting,
  T.attention,
  T.journey,
  T.slogan,
  T.airports,
  T.program,
  T.ticket,
  T.schedule,

  ...GROUPS.flatMap(group => [
    group.heading,

    ...group.rows.flatMap(([time, title, description]) => [
      `${time} — ${title}`,
      description
    ]),

    group.addressHeading,

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
        "Проверка текста не пройдена.\n" +
        "Не найден фрагмент в нужном порядке:\n" +
        fragment
      );
    }

    cursor = index + target.length;
  }

  throw new Error(
    "В тело письма попал дополнительный текст."
  );
}

for (const forbidden of [
  "Информационная рассылка в почте",
  "Тема:",
  "@media"
]) {
  if (actual.includes(forbidden)) {
    throw new Error(
      "В письмо попала служебная строка: " + forbidden
    );
  }
}

await fs.writeFile(
  path.join(OUT, "g.mjml"),
  source,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "g.html"),
  html,
  "utf8"
);

/* =========================================================
   ПРЕДПРОСМОТР
   Base64 используется только в локальном просмотрщике.
   ========================================================= */

let localHTML = html;

for (const name of ["g-logo.png", "g-poster.png"]) {
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
  <title>Savencia — праздничная авиационная афиша</title>

  <style>
    * { box-sizing:border-box; }

    body {
      margin:0;
      background:#e1e8e8;
      color:#173f4c;
      font-family:Arial,Helvetica,sans-serif;
    }

    header {
      position:sticky;
      top:0;
      z-index:10;
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      gap:10px;
      padding:15px 20px;
      background:#ffffff;
      border-bottom:1px solid #c4d8df;
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

    a {
      color:#004b62;
      margin-left:12px;
    }

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

    body.mobile iframe {
      width:375px;
    }

    body.narrow iframe {
      width:320px;
    }
  </style>
</head>

<body>
  <header>
    <h1>Праздничная авиационная афиша</h1>
    <button id="desktop" class="active" type="button">
      Компьютер · 640 px
    </button>
    <button id="mobile" type="button">
      Телефон · 375 px
    </button>
    <button id="narrow" type="button">
      Узкий экран · 320 px
    </button>
  </header>

  <div class="info">
    HTML: ${(bytes / 1024).toFixed(1)} КиБ.
    Полный текст проверен.
    <a href="g.mjml">MJML</a>
    <a href="g.html">HTML для рассылки</a>
  </div>

  <div class="stage">
    <iframe id="frame" title="Письмо Savencia"></iframe>
  </div>

  <script>
    const frame = document.getElementById("frame");
    const modes = ["desktop", "mobile", "narrow"];

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
        frame.style.height = "5000px";
      }
    }

    function setMode(mode) {
      document.body.classList.toggle(
        "mobile", mode === "mobile"
      );

      document.body.classList.toggle(
        "narrow", mode === "narrow"
      );

      modes.forEach(name => {
        document.getElementById(name).classList.toggle(
          "active", name === mode
        );
      });

      setTimeout(resizeFrame, 100);
      setTimeout(resizeFrame, 500);
    }

    modes.forEach(mode => {
      document.getElementById(mode).addEventListener(
        "click", () => setMode(mode)
      );
    });

    frame.addEventListener("load", () => {
      resizeFrame();
      setTimeout(resizeFrame, 300);
      setTimeout(resizeFrame, 900);

      try {
        frame.contentDocument.querySelectorAll("img").forEach(img => {
          if (!img.complete) {
            img.addEventListener(
              "load", resizeFrame, { once:true }
            );
            img.addEventListener(
              "error", resizeFrame, { once:true }
            );
          }
        });
      } catch {}
    });

    window.addEventListener("resize", () => {
      setTimeout(resizeFrame, 100);
    });

    if (window.innerWidth < 500) {
      setMode("mobile");
    }

    frame.srcdoc = ${embedded};
  </script>
</body>
</html>`;

await fs.writeFile(
  path.join(OUT, "g-preview.html"),
  preview,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "g-report.json"),
  JSON.stringify({
    variant: "Праздничная авиационная афиша",
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed",
    logoSource: path.basename(logoSource),
    emailLogoFormat: "PNG"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Письмо собрано.");
console.log(`Размер HTML: ${bytes} байт.`);
console.log("Полный текст проверен.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "g-preview.html"));
console.log("");
console.log(
  "Для рассылки разместите картинки на HTTPS-хостинге, " +
  "укажите ASSET_BASE и повторите сборку."
);
console.log(
  "Перед массовой отправкой проверьте тестовое письмо " +
  "в почтовых клиентах."
);
