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

// Для локального просмотра менять не требуется.
// Перед отправкой укажите публичный HTTPS-адрес папки
// с изображениями, например папки assets на GitHub Pages.
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
  sky: "#eaf6fa",
  white: "#ffffff",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#ccdfe5"
};

const asset = name => `${BASE}/${name}`;

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const norm = value => value.replace(/\s+/g, " ").trim();

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
   СОГЛАСОВАННЫЙ ТЕКСТ
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
   ЛОГОТИП: SVG ИЛИ РАСТРОВЫЙ ОРИГИНАЛ
   ========================================================= */

let logoPath = null;

for (const candidate of [
  path.join(ROOT, "logo.svg"),
  path.join(ROOT, "logo.png"),
  path.join(ROOT, "logo.jpg"),
  path.join(ROOT, "logo.jpeg"),
  path.join(ROOT, "logo.webp"),
  path.join(ASSETS, "g-logo.svg"),
  path.join(ASSETS, "h-logo.svg"),
  path.join(ASSETS, "g-logo.png"),
  path.join(ASSETS, "h-logo.png"),
  path.join(ASSETS, "f-logo.png")
]) {
  try {
    await fs.access(candidate);
    logoPath = candidate;
    break;
  } catch {}
}

if (!logoPath) {
  throw new Error(
    "Положите logo.svg или logo.png рядом с impeccable.mjs."
  );
}

const logoData = await fs.readFile(logoPath);
const isSVG = path.extname(logoPath).toLowerCase() === ".svg";

await sharp(logoData, isSVG ? { density: 300 } : {})
  .flatten({ background: "#ffffff" })
  .resize({
    width: 648,
    withoutEnlargement: !isSVG
  })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "i-logo.png"));

if (isSVG) {
  await fs.writeFile(
    path.join(ASSETS, "i-logo.svg"),
    logoData
  );
}

/* =========================================================
   ГЕОМЕТРИЧЕСКАЯ ИЛЛЮСТРАЦИЯ
   Круговой маршрут, праздничный венок, самолёт.
   Без надписей и без использования монограммы в декоре.
   ========================================================= */

function star(cx, cy, outer, inner, rotation = 0) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5 + rotation;
    const r = i % 2 ? inner : outer;

    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
}

const decorations = [
  [640, 67, C.orange, 11],
  [835, 134, C.green, 10],
  [876, 332, C.orange, 12],
  [695, 469, C.cyan, 10],
  [475, 418, C.orange, 10],
  [409, 218, C.green, 12]
];

const wreathSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1280" height="550" viewBox="0 0 1280 550">

  <rect width="1280" height="550" fill="${C.sky}"/>

  <circle cx="640" cy="270" r="229"
          fill="none" stroke="${C.blue}" stroke-width="2"/>

  <circle cx="640" cy="270" r="202"
          fill="none" stroke="${C.cyan}"
          stroke-width="17"
          stroke-dasharray="2 18"
          stroke-linecap="round"/>

  <circle cx="640" cy="270" r="179"
          fill="none" stroke="${C.green}"
          stroke-width="11"
          stroke-dasharray="2 23"
          stroke-linecap="round"/>

  <circle cx="640" cy="270" r="151" fill="${C.navy}"/>

  <path d="M-30 440C236 472 380 390 487 317"
        fill="none"
        stroke="${C.blue}"
        stroke-width="3"
        stroke-dasharray="10 14"/>

  <path d="M830 153C939 84 1101 101 1307 45"
        fill="none"
        stroke="${C.blue}"
        stroke-width="3"
        stroke-dasharray="10 14"/>

  <g transform="translate(649 267) rotate(49) scale(1.13)">
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

  ${decorations.map(([x, y, color, radius]) => `
    <circle cx="${x}" cy="${y}" r="${radius + 7}"
            fill="${C.sky}"/>
    <circle cx="${x}" cy="${y}" r="${radius}"
            fill="${color}"/>
  `).join("")}

  <polygon points="${star(982, 313, 27, 10, .1)}"
           fill="${C.orange}"/>

  <polygon points="${star(287, 158, 24, 9)}"
           fill="${C.green}"/>

  <polygon points="${star(1063, 437, 15, 6, .2)}"
           fill="${C.blue}"/>

  <g fill="${C.navy}">
    <circle cx="208" cy="322" r="4"/>
    <circle cx="1023" cy="163" r="4"/>
    <circle cx="328" cy="455" r="3"/>
    <circle cx="1142" cy="235" r="3"/>
  </g>

  <g stroke-width="4">
    <path d="M353 80L367 98" stroke="${C.orange}"/>
    <path d="M944 469L958 453" stroke="${C.green}"/>
    <path d="M164 193L180 185" stroke="${C.cyan}"/>
  </g>

</svg>
`;

await sharp(Buffer.from(wreathSVG))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "i-wreath.png"));

/* =========================================================
   MJML-КОМПОНЕНТЫ
   ========================================================= */

const txt = (value, attrs = "") =>
  `<mj-text ${attrs}>${esc(value)}</mj-text>`;

function section(content) {
  return `
    <mj-section padding="0 30px" background-color="#ffffff">
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function slogan() {
  const parts = [
    "ТРИ ГОРОДА.",
    "ОДИН РЕЙС.",
    "ОДНА КОМАНДА."
  ];

  return `
    <mj-section padding="20px 20px"
                background-color="${C.navy}">
      ${parts.map(part => `
        <mj-column width="33.333333%" vertical-align="middle">
          ${txt(part,
            `font-size="20px"
             line-height="1.3"
             font-weight="700"
             color="#ffffff"
             align="center"
             padding="8px 5px"`)}
        </mj-column>
      `).join("")}
    </mj-section>
  `;
}

function schedule(group, groupIndex) {
  const headingColor = groupIndex === 0 ? C.navy : C.blue;

  return `
    <mj-section padding="20px 30px"
                background-color="${headingColor}">
      <mj-column>
        ${txt(group.heading,
          `font-size="21px"
           line-height="1.35"
           font-weight="700"
           color="#ffffff"
           padding="0"`)}
      </mj-column>
    </mj-section>

    ${group.rows.map(([time, title, description], i) => `
      <mj-section padding="23px 30px 20px"
                  background-color="#ffffff">

        <mj-column width="42%" vertical-align="top">
          ${txt(`${time} —`,
            `font-size="26px"
             line-height="1.2"
             font-weight="700"
             color="${C.navy}"
             padding="0 12px 12px 0"`)}
        </mj-column>

        <mj-column width="58%" vertical-align="top">
          ${txt(title,
            `font-size="19px"
             line-height="1.35"
             font-weight="700"
             color="${C.navy}"
             padding="0 0 9px"`)}
          ${txt(description,
            `font-size="16px"
             line-height="1.65"
             color="${C.ink}"
             padding="0"`)}
        </mj-column>

      </mj-section>

      ${i < 2 ? section(`
        <mj-divider border-color="${C.line}"
                    border-width="1px" padding="0"/>
      `) : ""}
    `).join("")}

    <mj-wrapper padding="0 30px 28px"
                background-color="#ffffff">
      <mj-section padding="18px 20px"
                  background-color="${C.sky}">
        <mj-column>

          ${txt(group.addressHeading,
            `font-size="15px"
             font-weight="700"
             padding="0 0 12px"`)}

          ${group.addresses.map(([city, address]) => `
            ${city ? txt(city,
              `font-size="13px"
               font-weight="700"
               color="${C.navy}"
               padding="5px 0 4px"`) : ""}

            ${txt(address,
              `font-size="16px"
               line-height="1.6"
               padding="0 0 9px"`)}
          `).join("")}

        </mj-column>
      </mj-section>
    </mj-wrapper>
  `;
}

/* =========================================================
   ПИСЬМО
   Arial — согласованный шрифт для офисных материалов.
   Эмодзи используются только там, где они есть в документе.
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
          font-size:47px !important;
          line-height:1.05 !important;
        }
        .hero-title div {
          font-size:30px !important;
          line-height:1.15 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e4eef1">

    <mj-section padding="26px 30px"
                background-color="#ffffff">
      <mj-column>
        <mj-image src="${asset("i-logo.png")}"
                  alt="Groupe Savencia"
                  width="216px"
                  align="left"
                  padding="0"/>
      </mj-column>
    </mj-section>

    <mj-section padding="26px 30px 5px"
                background-color="${C.sky}">
      <mj-column>
        ${txt(T.date,
          `font-size="66px"
           line-height="1"
           font-weight="700"
           color="${C.orange}"
           padding="0 0 13px"
           css-class="hero-date"`)}
        ${txt(T.headline,
          `font-size="40px"
           line-height="1.12"
           font-weight="700"
           color="${C.navy}"
           padding="0"
           css-class="hero-title"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.sky}">
      <mj-column>
        <mj-image src="${asset("i-wreath.png")}"
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

    ${slogan()}

    ${section(`
      ${txt(T.airports, `padding="28px 0 17px"`)}
      ${txt(T.program)}
      ${txt(T.ticket, `padding="0 0 27px"`)}
      <mj-divider border-color="${C.orange}"
                  border-width="3px"
                  padding="0 0 24px"/>
      ${txt(T.schedule,
        `font-size="31px"
         line-height="1.2"
         font-weight="700"
         padding="0 0 25px"`)}
    `)}

    ${GROUPS.map(schedule).join("")}

    ${section(`
      ${txt(T.passengers,
        `font-size="22px"
         font-weight="700"
         padding="0 0 17px"`)}
      ${txt(T.mood)}
      ${txt(T.waiting, `padding="0 0 29px"`)}
    `)}

    <mj-section padding="27px 30px 32px"
                background-color="${C.navy}"
                border-top="5px solid ${C.green}">
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
   КОМПИЛЯЦИЯ
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
    "Превышен внутренний лимит 90 000 байт."
  );
}

/* =========================================================
   ПРОВЕРКА ТЕКСТА
   ========================================================= */

function visibleText(value) {
  return norm(
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

const expected = norm(required.join(" "));
const actual = visibleText(html);

if (actual !== expected) {
  let cursor = 0;

  for (const fragment of required) {
    const target = norm(fragment);
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
    "Обнаружен дополнительный текст в теле письма."
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

/* =========================================================
   СОХРАНЕНИЕ
   ========================================================= */

await fs.writeFile(path.join(OUT, "i.mjml"), source, "utf8");
await fs.writeFile(path.join(OUT, "i.html"), html, "utf8");

/* =========================================================
   ЛОКАЛЬНЫЙ ПРОСМОТРЩИК
   В i.html Base64 нет — только HTTPS-ссылки.
   ========================================================= */

let localHTML = html;

for (const name of ["i-logo.png", "i-wreath.png"]) {
  const buffer = await fs.readFile(path.join(ASSETS, name));

  localHTML = localHTML.replaceAll(
    asset(name),
    `data:image/png;base64,${buffer.toString("base64")}`
  );
}

const preview = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Savencia — новогодний маршрут</title>
  <style>
    * { box-sizing:border-box; }

    body {
      margin:0;
      background:#e4eef1;
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
      border-bottom:1px solid #ccdfe5;
    }

    h1 {
      margin:0 auto 0 0;
      font-size:18px;
    }

    button {
      padding:10px 13px;
      border:1px solid #9bb9c4;
      background:#ffffff;
      color:#004b62;
      font:inherit;
      font-size:13px;
      cursor:pointer;
    }

    button.active {
      background:#004b62;
      color:#ffffff;
    }

    button:focus-visible,
    a:focus-visible {
      outline:3px solid #de6a09;
      outline-offset:3px;
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
      text-underline-offset:3px;
    }

    .stage {
      overflow-x:auto;
      padding:0 12px 40px;
    }

    iframe {
      display:block;
      width:640px;
      height:3600px;
      margin:auto;
      border:0;
      background:#ffffff;
      box-shadow:0 12px 36px rgba(0,45,65,.12);
    }
  </style>
</head>
<body>

  <header>
    <h1>Новогодний маршрут · вариант I</h1>

    <button class="active" data-width="640" type="button">
      Компьютер · 640 px
    </button>

    <button data-width="375" type="button">
      Телефон · 375 px
    </button>

    <button data-width="320" type="button">
      Узкий экран · 320 px
    </button>
  </header>

  <div class="info">
    HTML: ${(bytes / 1024).toFixed(1)} КиБ.
    Полный текст проверен.
    <a href="i.mjml">MJML</a>
    <a href="i.html">HTML для рассылки</a>
  </div>

  <div class="stage">
    <iframe id="frame"
            title="Письмо Savencia"
            srcdoc="${esc(localHTML)}"></iframe>
  </div>

  <script>
    const frame = document.getElementById("frame");
    const buttons = document.querySelectorAll("[data-width]");

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

    function setWidth(width) {
      frame.style.width = width + "px";

      buttons.forEach(button => {
        button.classList.toggle(
          "active",
          Number(button.dataset.width) === width
        );
      });

      setTimeout(resizeFrame, 100);
      setTimeout(resizeFrame, 500);
    }

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        setWidth(Number(button.dataset.width));
      });
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

    if (window.innerWidth < 500) setWidth(375);

    window.addEventListener("resize", () => {
      setTimeout(resizeFrame, 100);
    });
  </script>
</body>
</html>`;

await fs.writeFile(
  path.join(OUT, "i-preview.html"),
  preview,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "i-report.json"),
  JSON.stringify({
    variant: "Новогодний маршрут",
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed",
    logoSource: path.basename(logoPath),
    emailLogoFormat: "PNG",
    impeccableAutomatedAudit: "not run"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Вариант I собран.");
console.log(`Размер HTML: ${bytes} байт.`);
console.log("Основной текст, расписание и адреса проверены.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "i-preview.html"));
console.log("");
console.log(
  "Перед отправкой разместите картинки на HTTPS-хостинге, " +
  "укажите ASSET_BASE и повторите сборку."
);
console.log(
  "Отображение в Gmail и Outlook проверяется " +
  "тестовой отправкой."
);
