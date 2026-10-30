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

await fs.mkdir(ASSETS, { recursive: true });

// Для локального просмотра менять не требуется.
// Перед рассылкой разместите картинки на HTTPS-хостинге
// и укажите здесь адрес папки с ними.
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
  sky: "#e4f5fa",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#c3d7de"
};

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const asset = name => `${BASE}/${name}`;

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
   ТЕКСТ ПИСЬМА
   Служебные строки «Информационная рассылка в почте»
   и «Тема:» в тело письма не включаются.
   ========================================================= */

const T = {
  emailSubject: "10 декабря — Вылет в Новый ГОД!",
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
      [
        "17:00–18:00",
        T.registration,
        T.registrationDescription
      ],
      [
        "18:00–20:00",
        T.takeoff,
        T.takeoffDescription
      ],
      [
        "20:00–23:00",
        T.flight,
        T.flightDescription
      ]
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
      [
        "15:00–15:30",
        T.registration,
        T.registrationDescription
      ],
      [
        "15:30–18:00",
        T.takeoff,
        T.takeoffDescription
      ],
      [
        "18:00–20:00",
        T.flight,
        T.flightDescription
      ]
    ]
  }
];

/* =========================================================
   ЛОГОТИП: ЛОКАЛЬНЫЙ ФАЙЛ, БЕЗ СКАЧИВАНИЯ ИЗ ИНТЕРНЕТА
   ========================================================= */

let logoPath = null;

const logoCandidates = [
  path.join(ROOT, "logo.png"),
  path.join(ROOT, "logo.jpg"),
  path.join(ROOT, "logo.jpeg"),
  path.join(ROOT, "logo.webp"),
  path.join(ASSETS, "g-logo.png"),
  path.join(ASSETS, "f-logo.png")
];

for (const candidate of logoCandidates) {
  try {
    await fs.access(candidate);
    logoPath = candidate;
    break;
  } catch {
    // Проверяем следующий файл.
  }
}

if (!logoPath) {
  throw new Error(
    "Не найден логотип. Положите logo.png рядом с retro.mjs."
  );
}

// Сначала читаем в память: это позволяет безопасно
// использовать уже существующий dist/assets/g-logo.png.
const logoBuffer = await fs.readFile(logoPath);

await sharp(logoBuffer)
  .flatten({ background: "#ffffff" })
  .resize({
    width: 560,
    withoutEnlargement: true
  })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "g-logo.png"));

console.log("Логотип подготовлен.");

/* =========================================================
   АФИШНАЯ ИЛЛЮСТРАЦИЯ
   Без надписей. В письмо включается PNG.
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

const illustration = `
<svg xmlns="http://www.w3.org/2000/svg"
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
</svg>
`;

await sharp(Buffer.from(illustration))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "g-poster.png"));

console.log("Иллюстрация подготовлена.");

/* =========================================================
   КОМПОНЕНТЫ MJML
   ========================================================= */

function txt(value, attributes = "") {
  return `<mj-text ${attributes}>${esc(value)}</mj-text>`;
}

function section(content, attributes = "") {
  return `
    <mj-section
      padding="0 30px"
      background-color="${C.paper}"
      ${attributes}>
      <mj-column>
        ${content}
      </mj-column>
    </mj-section>
  `;
}

function groupBlock(group, groupIndex) {
  const accent = groupIndex === 0 ? C.orange : C.blue;

  return `
    <mj-section
      padding="19px 30px"
      background-color="${C.navy}"
      border-top="5px solid ${accent}">
      <mj-column>
        ${txt(group.title,
          `font-size="22px"
           line-height="1.35"
           font-weight="700"
           color="#ffffff"
           padding="0"`)}
      </mj-column>
    </mj-section>

    ${group.rows.map(([time, title, description], index) => `
      <mj-section
        padding="22px 30px 18px"
        background-color="${C.paper}">

        <mj-column width="42%" vertical-align="top">
          ${txt(`${time} —`,
            `font-size="27px"
             line-height="1.2"
             font-weight="700"
             color="${index === 1 ? C.orange : C.navy}"
             padding="0 15px 12px 0"`)}
        </mj-column>

        <mj-column width="58%" vertical-align="top">
          ${txt(title,
            `font-size="19px"
             line-height="1.35"
             font-weight="700"
             padding="0 0 10px"`)}
          ${txt(description,
            `font-size="16px"
             line-height="1.65"
             padding="0"`)}
        </mj-column>

      </mj-section>

      ${section(`
        <mj-divider
          border-color="${C.line}"
          border-width="1px"
          padding="0"/>
      `)}
    `).join("")}

    ${section(`
      ${txt(group.addressTitle,
        `font-size="14px"
         font-weight="700"
         color="${C.navy}"
         padding="14px 0 5px"`)}

      ${group.addresses.map(([city, address]) => `
        ${city ? txt(city,
          `font-size="14px"
           font-weight="700"
           color="${C.navy}"
           padding="14px 0 5px"`) : ""}

        ${txt(address,
          `font-size="16px"
           padding="0 0 8px"`)}
      `).join("")}

      <mj-spacer height="27px"/>
    `)}
  `;
}

/* =========================================================
   ПИСЬМО
   ========================================================= */

const source = `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(T.emailSubject)}</mj-title>

    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>

      <mj-text
        font-size="17px"
        line-height="1.65"
        color="${C.ink}"
        padding="0 0 17px"/>

      <mj-image padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .date div {
          font-size:48px !important;
          line-height:1.05 !important;
        }

        .headline div {
          font-size:31px !important;
          line-height:1.12 !important;
        }

        .statement div {
          font-size:29px !important;
          line-height:1.18 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e3e8e3">

    <mj-section
      padding="25px 30px 24px"
      background-color="#ffffff">
      <mj-column>
        <mj-image
          src="${asset("g-logo.png")}"
          alt="Groupe Savencia"
          width="216px"
          align="left"
          padding="0"/>
      </mj-column>
    </mj-section>

    <mj-section
      padding="28px 30px 0"
      background-color="${C.sky}">
      <mj-column>

        ${txt(T.date,
          `font-size="68px"
           line-height="1"
           font-weight="700"
           color="${C.navy}"
           padding="0 0 12px"
           css-class="date"`)}

        ${txt(T.headline,
          `font-size="41px"
           line-height="1.1"
           font-weight="700"
           color="${C.navy}"
           padding="0"
           css-class="headline"`)}

      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.sky}">
      <mj-column>
        <mj-image
          src="${asset("g-poster.png")}"
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

      ${txt(T.attention, `padding="0 0 18px"`)}

      ${txt(T.journey, `padding="0 0 18px"`)}

      <mj-spacer height="8px"/>
    `)}

    <mj-section
      padding="27px 30px"
      background-color="${C.green}">
      <mj-column>

        ${txt(T.slogan,
          `font-size="36px"
           line-height="1.15"
           font-weight="700"
           color="${C.navy}"
           padding="0"
           css-class="statement"`)}

      </mj-column>
    </mj-section>

    ${section(`
      ${txt(T.airports, `padding="27px 0 18px"`)}

      ${txt(T.program, `padding="0 0 18px"`)}

      ${txt(T.ticket, `padding="0 0 18px"`)}

      <mj-divider
        border-color="${C.orange}"
        border-width="4px"
        padding="8px 0 24px"/>

      ${txt(T.schedule,
        `font-size="31px"
         line-height="1.2"
         font-weight="700"
         padding="0 0 26px"`)}
    `)}

    ${GROUPS.map(groupBlock).join("")}

    ${section(`
      ${txt(T.passengers,
        `font-size="22px"
         font-weight="700"
         padding="2px 0 17px"`)}

      ${txt(T.mood, `padding="0 0 18px"`)}

      ${txt(T.waiting, `padding="0 0 18px"`)}

      <mj-spacer height="9px"/>
    `)}

    <mj-section
      padding="28px 30px 32px"
      background-color="${C.navy}"
      border-top="5px solid ${C.orange}">
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

// Запас относительно пользовательского ограничения 100 КБ.
if (bytes >= 90_000) {
  throw new Error(
    `HTML занимает ${bytes} байт. ` +
    "Превышен внутренний лимит 90 000 байт."
  );
}

/* =========================================================
   ПРОВЕРКА ВИДИМОГО ТЕКСТА
   CSS И HEAD НЕ УЧАСТВУЮТ В СРАВНЕНИИ
   ========================================================= */

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

    if (index === -1) {
      throw new Error(
        "Проверка текста не пройдена.\n" +
        "Не найден фрагмент в нужном порядке:\n" +
        fragment
      );
    }

    cursor = index + target.length;
  }

  throw new Error(
    "В теле письма обнаружены дополнительные " +
    "или изменённые текстовые фрагменты."
  );
}

if (
  actual.includes("Информационная рассылка в почте") ||
  actual.includes("Тема:") ||
  actual.includes("@media")
) {
  throw new Error(
    "В письмо попали служебные надписи. Сборка остановлена."
  );
}

/* =========================================================
   СОХРАНЕНИЕ ФАЙЛОВ ДЛЯ РАССЫЛКИ
   ========================================================= */

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
   ЛОКАЛЬНЫЙ ПРОСМОТРЩИК
   BASE64 ИСПОЛЬЗУЕТСЯ ТОЛЬКО В НЁМ.
   В g.html ОСТАЮТСЯ ОБЫЧНЫЕ HTTPS-ССЫЛКИ.
   ========================================================= */

let localHTML = html;

for (const name of ["g-logo.png", "g-poster.png"]) {
  const image = await fs.readFile(path.join(ASSETS, name));

  localHTML = localHTML.replaceAll(
    asset(name),
    `data:image/png;base64,${image.toString("base64")}`
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
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1">

  <title>Savencia — новогодняя авиационная афиша</title>

  <style>
    * {
      box-sizing:border-box;
    }

    body {
      margin:0;
      background:#e3e8e3;
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
      border-bottom:1px solid #c3d7de;
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
  </style>
</head>

<body>
  <header>
    <h1>Новогодняя авиационная афиша</h1>

    <button id="desktop" class="active" type="button">
      Компьютер · 640 px
    </button>

    <button id="mobile" type="button">
      Телефон · 375 px
    </button>
  </header>

  <div class="info">
    HTML: ${(bytes / 1024).toFixed(1)} КиБ.
    Текст проверен.

    <a href="g.mjml">MJML</a>
    <a href="g.html">HTML для рассылки</a>
  </div>

  <div class="stage">
    <iframe
      id="frame"
      title="Предпросмотр письма Savencia">
    </iframe>
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

    desktop.addEventListener("click", () => {
      setMobile(false);
    });

    mobile.addEventListener("click", () => {
      setMobile(true);
    });

    frame.addEventListener("load", () => {
      resizeFrame();

      setTimeout(resizeFrame, 300);
      setTimeout(resizeFrame, 900);

      try {
        frame.contentDocument
          .querySelectorAll("img")
          .forEach(img => {
            if (!img.complete) {
              img.addEventListener(
                "load",
                resizeFrame,
                { once:true }
              );

              img.addEventListener(
                "error",
                resizeFrame,
                { once:true }
              );
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
    variant: "Новогодняя авиационная афиша",
    htmlBytes: bytes,
    copyCheck: "passed",
    mjmlValidation: "passed",
    removedServiceLabels: true
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Письмо собрано.");
console.log(`Размер HTML: ${bytes} байт.`);
console.log("Основной текст, расписание и адреса проверены.");
console.log("Служебные надписи удалены.");
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
  "в Gmail, Outlook и на телефоне."
);
