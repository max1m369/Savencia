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
  ink: "#173f4c",
  muted: "#52666d",
  pale: "#edf7fa",
  line: "#cbdfe6",
  white: "#ffffff"
};

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const url = name => `${BASE}/${name}`;

/* ========================================================
   ИСХОДНЫЙ ТЕКСТ
   ======================================================== */

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

/* ========================================================
   ЛОКАЛЬНЫЙ ЛОГОТИП
   ======================================================== */

let logoSource = null;

for (const name of [
  "logo.png",
  "logo.jpg",
  "logo.jpeg",
  "logo.webp"
]) {
  try {
    const candidate = path.join(ROOT, name);
    await fs.access(candidate);
    logoSource = candidate;
    break;
  } catch {
    // Проверяем следующее расширение.
  }
}

if (!logoSource) {
  throw new Error(
    "Положите logo.png рядом с award.mjs."
  );
}

await sharp(await fs.readFile(logoSource))
  .flatten({ background: "#ffffff" })
  .resize({ width: 560, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "f-logo.png"));

/* ========================================================
   АВТОРСКАЯ ИЛЛЮСТРАЦИЯ:
   ТРАЕКТОРИЯ ПОЛЁТА В ФОРМЕ НОВОГОДНЕЙ ЁЛКИ.
   БЕЗ ТЕКСТА И БЕЗ ИЗМЕНЕНИЙ МОНОГРАММЫ.
   ======================================================== */

function star(cx, cy, outer, inner) {
  const points = [];

  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? outer : inner;

    points.push(
      `${cx + Math.cos(angle) * radius},` +
      `${cy + Math.sin(angle) * radius}`
    );
  }

  return points.join(" ");
}

const ornaments = [
  [468, 333, C.orange, 9],
  [737, 311, C.green, 8],
  [532, 239, C.cyan, 7],
  [678, 204, C.orange, 8],
  [573, 145, C.green, 6]
];

const sparks = [
  [150, 95, 3], [255, 174, 4], [1030, 112, 3],
  [940, 248, 4], [169, 304, 3], [1076, 342, 3],
  [358, 75, 3], [828, 82, 4], [335, 341, 2],
  [881, 369, 3], [1010, 205, 2], [218, 245, 2]
];

const heroSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1280" height="470" viewBox="0 0 1280 470">
  <rect width="1280" height="470" fill="${C.navy}"/>

  <g stroke="#ffffff" stroke-width="1" opacity=".09" fill="none">
    <circle cx="640" cy="246" r="110"/>
    <circle cx="640" cy="246" r="205"/>
    <circle cx="640" cy="246" r="305"/>
    <path d="M90 246H1190M640 0V470"/>
  </g>

  <g fill="#ffffff">
    ${sparks.map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" opacity=".6"/>`
    ).join("")}
  </g>

  <g stroke-width="3" fill="none">
    <path d="M228 111L240 130" stroke="${C.orange}"/>
    <path d="M999 293L1017 282" stroke="${C.green}"/>
    <path d="M926 90L942 99" stroke="${C.cyan}"/>
    <path d="M292 292L307 277" stroke="${C.cyan}"/>
    <path d="M1091 160L1098 179" stroke="${C.orange}"/>
  </g>

  <path
    d="M640 427
       C485 428 391 414 387 384
       C383 350 758 358 786 316
       C810 281 448 292 469 251
       C489 214 732 223 720 185
       C709 151 540 165 552 131
       C562 107 631 104 640 64"
    fill="none"
    stroke="${C.cyan}"
    stroke-width="24"
    stroke-linecap="round"
    opacity=".09"/>

  <path
    d="M640 427
       C485 428 391 414 387 384
       C383 350 758 358 786 316
       C810 281 448 292 469 251
       C489 214 732 223 720 185
       C709 151 540 165 552 131
       C562 107 631 104 640 64"
    fill="none"
    stroke="${C.cyan}"
    stroke-width="4"
    stroke-linecap="round"/>

  <path
    d="M640 427
       C485 428 391 414 387 384
       C383 350 758 358 786 316
       C810 281 448 292 469 251
       C489 214 732 223 720 185
       C709 151 540 165 552 131
       C562 107 631 104 640 64"
    fill="none"
    stroke="#ffffff"
    stroke-width="3"
    stroke-dasharray="2 18"
    stroke-linecap="round"/>

  ${ornaments.map(([x, y, color, r]) => `
    <circle cx="${x}" cy="${y}" r="${r * 2.5}"
            fill="${color}" opacity=".12"/>
    <circle cx="${x}" cy="${y}" r="${r}"
            fill="${color}"/>
  `).join("")}

  <polygon points="${star(640, 49, 25, 11)}"
           fill="${C.orange}"/>

  <g transform="translate(640 418) rotate(90) scale(.33)">
    <path d="
      M0 -116
      C10 -116 13 -99 13 -82
      L15 -27 L111 34 L111 49 L15 15
      L13 78 L48 104 L48 116 L0 99
      L-48 116 L-48 104 L-13 78
      L-15 15 L-111 49 L-111 34
      L-15 -27 L-13 -82
      C-13 -99 -10 -116 0 -116Z"
      fill="#ffffff"/>
  </g>
</svg>
`;

await sharp(Buffer.from(heroSVG))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "f-holiday.png"));

/* ========================================================
   MJML-КОМПОНЕНТЫ
   ======================================================== */

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

function colorStripe() {
  // Декоративная полоса: три акцентных цвета брендбука.
  return `
    <mj-section padding="0" background-color="#ffffff">
      <mj-group width="100%">
        <mj-column width="50%">
          <mj-divider border-width="5px"
                      border-color="${C.blue}" padding="0"/>
        </mj-column>
        <mj-column width="30%">
          <mj-divider border-width="5px"
                      border-color="${C.green}" padding="0"/>
        </mj-column>
        <mj-column width="20%">
          <mj-divider border-width="5px"
                      border-color="${C.orange}" padding="0"/>
        </mj-column>
      </mj-group>
    </mj-section>
  `;
}

function stage(row, index) {
  const [time, title, description] = row;

  const accents = [C.blue, C.orange, C.green];
  const backgrounds = ["#edf7fa", "#fff5ec", "#f5f8e9"];

  return `
    <mj-section padding="0 30px"
                background-color="#ffffff">
      <mj-column>
        <mj-spacer height="10px"/>
      </mj-column>
    </mj-section>

    <mj-section
      padding="19px 20px"
      background-color="${backgrounds[index]}"
      border-left="5px solid ${accents[index]}">

      <mj-column width="40%" vertical-align="top">
        ${txt(`${time} —`,
          `font-size="25px" line-height="1.25"
           font-weight="700" color="${C.navy}"
           padding="0 12px 10px 5px"`)}
      </mj-column>

      <mj-column width="60%" vertical-align="top">
        ${txt(title,
          `font-size="19px" line-height="1.3"
           font-weight="700" color="${C.navy}"
           padding="0 5px 10px"`)}
        ${txt(description,
          `font-size="16px" line-height="1.6"
           padding="0 5px"`)}
      </mj-column>
    </mj-section>
  `;
}

function schedule(group) {
  return `
    ${section(`
      ${txt(group.title,
        `font-size="21px" line-height="1.4"
         font-weight="700" padding="10px 0 7px"`)}
    `)}

    <mj-wrapper padding="0 30px" background-color="#ffffff">
      ${group.rows.map(stage).join("")}
    </mj-wrapper>

    ${section(`
      ${txt(group.addressTitle,
        `font-size="16px" font-weight="700"
         padding="23px 0 12px"`)}
      ${group.addresses.map(([city, address]) => `
        ${city ? txt(city,
          `font-size="13px" font-weight="700"
           color="${C.blue}" padding="5px 0 4px"`) : ""}
        ${txt(address,
          `font-size="16px" padding="0 0 12px"`)}
      `).join("")}
      <mj-divider border-width="1px"
                  border-color="${C.line}"
                  padding="13px 0 21px"/>
    `)}
  `;
}

/* ========================================================
   ПИСЬМО
   ======================================================== */

const source = `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(T.subject.replace(/^Тема: /, ""))}</mj-title>

    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text
        color="${C.ink}"
        font-size="17px"
        line-height="1.65"
        padding="0 0 17px"/>
      <mj-image padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .hero-date div {
          font-size:43px !important;
          line-height:1.05 !important;
        }
        .hero-name div {
          font-size:29px !important;
          line-height:1.15 !important;
        }
        .slogan div {
          font-size:21px !important;
          line-height:1.35 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e7eef0">

    ${section(`
      <mj-image
        src="${url("f-logo.png")}"
        alt="Groupe Savencia"
        width="224px"
        align="left"
        padding="27px 0 23px"/>
      ${txt(T.title,
        `font-size="12px" color="${C.muted}"
         padding="0 0 17px"`)}
    `)}

    ${colorStripe()}

    <mj-section padding="29px 30px 0"
                background-color="${C.navy}">
      <mj-column>
        ${txt("Тема:",
          `font-size="12px" color="#ffffff"
           padding="0 0 10px"`)}
        ${txt("10 декабря",
          `font-size="66px" line-height="1.05"
           font-weight="700" color="#ffffff"
           padding="0 0 12px" css-class="hero-date"`)}
        ${txt("— Вылет в Новый ГОД!",
          `font-size="37px" line-height="1.12"
           font-weight="700" color="#ffffff"
           padding="0" css-class="hero-name"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.navy}">
      <mj-column>
        <mj-image
          src="${url("f-holiday.png")}"
          alt=""
          width="640px"
          padding="0"/>
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.greeting,
        `font-size="22px" font-weight="700"
         padding="29px 0 16px"`)}
      ${txt(T.attention)}
      ${txt(T.journey, `padding="0 0 27px"`)}
    `)}

    <mj-section padding="23px 30px"
                background-color="${C.navy}">
      <mj-column border-left="4px solid ${C.green}">
        ${txt(T.slogan,
          `font-size="24px" line-height="1.3"
           font-weight="700" color="#ffffff"
           padding="0 0 0 18px" css-class="slogan"`)}
      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.airports, `padding="27px 0 17px"`)}
      ${txt(T.program)}
    `)}

    <mj-wrapper padding="0 30px 27px"
                background-color="#ffffff">
      <mj-section padding="20px"
                  background-color="#f5f8e9"
                  border-left="4px solid ${C.green}">
        <mj-column>
          ${txt(T.ticket,
            `font-size="17px" line-height="1.65"
             padding="0"`)}
        </mj-column>
      </mj-section>
    </mj-wrapper>

    ${section(`
      <mj-divider
        border-width="3px"
        border-color="${C.orange}"
        padding="0 0 24px"/>
      ${txt(T.schedule,
        `font-size="30px" line-height="1.15"
         font-weight="700" padding="0 0 15px"`)}
    `)}

    ${GROUPS.map(schedule).join("")}

    ${section(`
      ${txt(T.passengers,
        `font-size="22px" font-weight="700"
         padding="4px 0 16px"`)}
      ${txt(T.mood)}
      ${txt(T.waiting, `padding="0 0 28px"`)}
    `)}

    ${colorStripe()}

    <mj-section padding="27px 30px 31px"
                background-color="${C.navy}">
      <mj-column>
        ${txt(T.meeting,
          `font-size="29px" line-height="1.2"
           font-weight="700" color="#ffffff"
           padding="0 0 15px"`)}
        ${txt(T.crew,
          `font-size="17px" color="#ffffff" padding="0"`)}
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`.trim();

/* ========================================================
   КОМПИЛЯЦИЯ И ПРОВЕРКИ
   ======================================================== */

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
    "Превышен внутренний лимит 90 000 байт."
  );
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

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

const expectedFragments = [
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

const actualText = visibleText(html);
const expectedText = normalize(expectedFragments.join(" "));

if (actualText !== expectedText) {
  let cursor = 0;

  for (const fragment of expectedFragments) {
    const target = normalize(fragment);
    const index = actualText.indexOf(target, cursor);

    if (index === -1) {
      throw new Error(
        "Проверка текста не пройдена. " +
        "Не найден фрагмент в нужном порядке:\n" +
        fragment
      );
    }

    cursor = index + target.length;
  }

  throw new Error(
    "В теле письма обнаружено отличие от исходного текста."
  );
}

await fs.writeFile(
  path.join(OUT, "f.mjml"),
  source,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "f.html"),
  html,
  "utf8"
);

/* ========================================================
   ЛОКАЛЬНЫЙ ПРЕДПРОСМОТР
   BASE64 ТОЛЬКО ЗДЕСЬ, НЕ В f.html
   ======================================================== */

let localHTML = html;

for (const name of ["f-logo.png", "f-holiday.png"]) {
  const buffer = await fs.readFile(path.join(ASSETS, name));

  localHTML = localHTML.replaceAll(
    url(name),
    `data:image/png;base64,${buffer.toString("base64")}`
  );
}

const embeddedHTML = JSON.stringify(localHTML)
  .replaceAll("<", "\\u003c")
  .replaceAll(">", "\\u003e")
  .replaceAll("&", "\\u0026");

const preview = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Savencia — Новогодняя навигация</title>
  <style>
    * { box-sizing:border-box; }

    body {
      margin:0;
      background:#e7eef0;
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
      gap:12px;
      padding:16px 22px;
      background:#ffffff;
      border-bottom:1px solid #cbdfe6;
    }

    h1 {
      margin:0 auto 0 0;
      font-size:19px;
    }

    button {
      border:1px solid #9dbcc8;
      padding:10px 13px;
      background:#ffffff;
      color:#004b62;
      font:inherit;
      font-size:13px;
      cursor:pointer;
    }

    button.active {
      color:#ffffff;
      background:#004b62;
      border-color:#004b62;
    }

    .info {
      max-width:700px;
      margin:20px auto 14px;
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
      box-shadow:0 10px 35px rgba(0,45,65,.13);
    }

    body.mobile iframe { width:375px; }
  </style>
</head>
<body>
  <header>
    <h1>Новогодняя навигация</h1>
    <button id="desktop" type="button" class="active">
      Компьютер · 640 px
    </button>
    <button id="mobile" type="button">
      Телефон · 375 px
    </button>
  </header>

  <div class="info">
    HTML: ${(bytes / 1024).toFixed(1)} КиБ.
    Текст проверен.
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

    frame.srcdoc = ${embeddedHTML};
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
    variant: "Новогодняя навигация",
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Шестой вариант собран.");
console.log(`HTML: ${bytes} байт.`);
console.log("Текст полностью совпадает с заданным.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "f-preview.html"));
console.log("");
console.log(
  "Для рассылки: загрузите картинки на HTTPS-хостинг, " +
  "укажите ASSET_BASE и повторите сборку."
);
console.log(
  "Перед массовой отправкой проверьте тестовое письмо " +
  "в Gmail, Outlook и на телефоне."
);
