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
   БЕРЁМ ТЕКСТ ИЗ ПРЕДЫДУЩЕГО ВАРИАНТА
   ========================================================= */

let previous;

try {
  previous = await fs.readFile(
    path.join(OUT, "f.mjml"),
    "utf8"
  );
} catch {
  throw new Error(
    "Не найден dist/f.mjml. " +
    "Сначала выполните node award.mjs, " +
    "затем node retro.mjs."
  );
}

const items = Array.from(
  previous.matchAll(
    /<mj-text\b[^>]*>([\s\S]*?)<\/mj-text>/gi
  ),
  match => normalize(
    decode(match[1].replace(/<[^>]*>/g, " "))
  )
);

const greetingIndex = items.indexOf("Дорогие коллеги!");

if (greetingIndex < 2) {
  throw new Error(
    "Не удалось распознать структуру f.mjml."
  );
}

const documentTitle = items[0];
const subject = normalize(
  items.slice(1, greetingIndex).join(" ")
);
const body = items.slice(greetingIndex);

if (subject !== "Тема: 10 декабря — Вылет в Новый ГОД!") {
  throw new Error(
    "Тема в исходном файле отличается от ожидаемой:\n" +
    subject
  );
}

const sloganIndex = body.indexOf(
  "ТРИ ГОРОДА. ОДИН РЕЙС. ОДНА КОМАНДА."
);

const scheduleIndex = body.indexOf(
  "Расписание нашего рейса"
);

const firstGroupIndex = body.findIndex(
  value => value.includes("МОСКВА и УФА")
);

const secondGroupIndex = body.findIndex(
  value => value.includes("БЕЛЕБЕЙ")
);

const closingIndex = body.indexOf(
  "Уважаемые пассажиры!"
);

if (
  sloganIndex < 0 ||
  scheduleIndex <= sloganIndex ||
  firstGroupIndex <= scheduleIndex ||
  secondGroupIndex <= firstGroupIndex ||
  closingIndex <= secondGroupIndex
) {
  throw new Error(
    "Структура исходного письма не распознана. " +
    "Нужен f.mjml из предыдущего варианта."
  );
}

const intro = body.slice(0, sloganIndex);

const middle = body.slice(
  sloganIndex + 1,
  scheduleIndex
);

const groups = [
  body.slice(firstGroupIndex, secondGroupIndex),
  body.slice(secondGroupIndex, closingIndex)
];

const closing = body.slice(closingIndex);

/* =========================================================
   ЛОГОТИП
   ========================================================= */

let logoPath = null;

for (const candidate of [
  path.join(ASSETS, "f-logo.png"),
  path.join(ROOT, "logo.png"),
  path.join(ROOT, "logo.jpg"),
  path.join(ROOT, "logo.jpeg"),
  path.join(ROOT, "logo.webp")
]) {
  try {
    await fs.access(candidate);
    logoPath = candidate;
    break;
  } catch {}
}

if (!logoPath) {
  throw new Error(
    "Не найден логотип. " +
    "Положите logo.png рядом с retro.mjs."
  );
}

await sharp(await fs.readFile(logoPath))
  .flatten({ background: "#ffffff" })
  .resize({ width: 560, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ASSETS, "g-logo.png"));

/* =========================================================
   АФИШНАЯ ИЛЛЮСТРАЦИЯ БЕЗ НАДПИСЕЙ
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
        fill="none" stroke="#ffffff"
        stroke-width="4" opacity=".5"/>

  <path d="M-50 548C250 548 445 470 698 324"
        fill="none" stroke="${C.blue}"
        stroke-width="3" stroke-dasharray="12 16"/>

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

  <polygon points="${star(190, 188, 48, 20, 0.1)}"
           fill="${C.green}"/>

  <polygon points="${star(429, 316, 25, 10, 0.3)}"
           fill="${C.blue}"/>

  <polygon points="${star(1132, 584, 30, 12)}"
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

/* =========================================================
   MJML-КОМПОНЕНТЫ
   ========================================================= */

const txt = (value, attrs = "") =>
  `<mj-text ${attrs}>${esc(value)}</mj-text>`;

function section(content, attrs = "") {
  return `
    <mj-section padding="0 30px"
                background-color="${C.paper}" ${attrs}>
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function groupBlock(values, groupIndex) {
  const heading = values[0];
  const rows = [];
  const addresses = [];

  for (let i = 1; i < values.length; i++) {
    const match = values[i].match(
      /^(\d{2}:\d{2}–\d{2}:\d{2}) — (.+)$/u
    );

    if (match) {
      if (!values[i + 1]) {
        throw new Error("Не найдено описание этапа.");
      }

      rows.push({
        time: match[1],
        title: match[2],
        description: values[++i]
      });
    } else {
      addresses.push(values[i]);
    }
  }

  if (rows.length !== 3) {
    throw new Error(
      "Ожидались три этапа расписания для каждой группы."
    );
  }

  const accent = groupIndex === 0 ? C.orange : C.blue;

  return `
    <mj-section padding="19px 30px"
                background-color="${C.navy}"
                border-top="5px solid ${accent}">
      <mj-column>
        ${txt(heading,
          `font-size="22px" line-height="1.35"
           font-weight="700" color="#ffffff"
           padding="0"`)}
      </mj-column>
    </mj-section>

    ${rows.map((row, index) => `
      <mj-section padding="22px 30px 18px"
                  background-color="${C.paper}">
        <mj-column width="42%" vertical-align="top">
          ${txt(`${row.time} —`,
            `font-size="27px" line-height="1.2"
             font-weight="700"
             color="${index === 1 ? C.orange : C.navy}"
             padding="0 15px 12px 0"`)}
        </mj-column>

        <mj-column width="58%" vertical-align="top">
          ${txt(row.title,
            `font-size="19px" line-height="1.35"
             font-weight="700" padding="0 0 10px"`)}
          ${txt(row.description,
            `font-size="16px" line-height="1.65"
             padding="0"`)}
        </mj-column>
      </mj-section>

      ${section(`
        <mj-divider border-color="${C.line}"
                    border-width="1px" padding="0"/>
      `)}
    `).join("")}

    ${section(`
      ${addresses.map((value, index) => {
        const label = index === 0 || /:$/.test(value);

        return txt(value,
          label
            ? `font-size="14px" font-weight="700"
               color="${C.navy}" padding="14px 0 5px"`
            : `font-size="16px" padding="0 0 8px"`
        );
      }).join("")}
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
    <mj-title>${esc(subject.replace(/^Тема: /, ""))}</mj-title>
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

    <mj-section padding="25px 30px 18px"
                background-color="#ffffff">
      <mj-column>
        <mj-image src="${asset("g-logo.png")}"
                  alt="Groupe Savencia"
                  width="216px" align="left"
                  padding="0 0 22px"/>
        ${txt(documentTitle,
          `font-size="12px" color="${C.muted}" padding="0"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="28px 30px 0"
                background-color="${C.sky}">
      <mj-column>
        ${txt("Тема:",
          `font-size="12px" color="${C.muted}"
           padding="0 0 12px"`)}
        ${txt("10 декабря",
          `font-size="68px" line-height="1"
           font-weight="700" color="${C.navy}"
           padding="0 0 12px" css-class="date"`)}
        ${txt("— Вылет в Новый ГОД!",
          `font-size="41px" line-height="1.1"
           font-weight="700" color="${C.navy}"
           padding="0" css-class="headline"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.sky}">
      <mj-column>
        <mj-image src="${asset("g-poster.png")}"
                  alt="" width="640px" padding="0"/>
      </mj-column>
    </mj-section>

    ${section(`
      ${intro.map((value, index) => txt(value,
        index === 0
          ? `font-size="23px" font-weight="700"
             padding="29px 0 17px"`
          : `padding="0 0 18px"`
      )).join("")}
      <mj-spacer height="8px"/>
    `)}

    <mj-section padding="27px 30px"
                background-color="${C.green}">
      <mj-column>
        ${txt(body[sloganIndex],
          `font-size="36px" line-height="1.15"
           font-weight="700" color="${C.navy}"
           padding="0" css-class="statement"`)}
      </mj-column>
    </mj-section>

    ${section(`
      ${middle.map((value, index) => txt(value,
        `padding="${index === 0 ? "27px" : "0"} 0 18px"`
      )).join("")}

      <mj-divider border-color="${C.orange}"
                  border-width="4px" padding="8px 0 24px"/>

      ${txt(body[scheduleIndex],
        `font-size="31px" line-height="1.2"
         font-weight="700" padding="0 0 26px"`)}
    `)}

    ${groups.map(groupBlock).join("")}

    ${section(`
      ${closing.slice(0, -2).map((value, index) => txt(value,
        index === 0
          ? `font-size="22px" font-weight="700"
             padding="2px 0 17px"`
          : `padding="0 0 18px"`
      )).join("")}
      <mj-spacer height="9px"/>
    `)}

    <mj-section padding="28px 30px 32px"
                background-color="${C.navy}"
                border-top="5px solid ${C.orange}">
      <mj-column>
        ${txt(closing.at(-2),
          `font-size="30px" line-height="1.2"
           font-weight="700" color="#ffffff"
           padding="0 0 15px"`)}
        ${txt(closing.at(-1),
          `font-size="17px" color="#ffffff" padding="0"`)}
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`.trim();

/* =========================================================
   КОМПИЛЯЦИЯ И ПРОВЕРКА СОВПАДЕНИЯ ТЕКСТА
   ========================================================= */

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
    "Превышен внутренний лимит 90 000 байт."
  );
}

const actual = normalize(
  decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head[\s\S]*?<\/head>/i, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  )
);

const expected = normalize(
  [documentTitle, subject, ...body].join(" ")
);

if (actual !== expected) {
  throw new Error(
    "Текст нового письма отличается от исходного f.mjml. " +
    "Сборка остановлена."
  );
}

await fs.writeFile(path.join(OUT, "g.mjml"), source, "utf8");
await fs.writeFile(path.join(OUT, "g.html"), html, "utf8");

/* =========================================================
   ЛОКАЛЬНЫЙ ПРЕДПРОСМОТР
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
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Savencia — новогодняя авиационная афиша</title>
  <style>
    * { box-sizing:border-box; }

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

    h1 { margin:0 auto 0 0; font-size:18px; }

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

    .stage { overflow-x:auto; padding:0 12px 40px; }

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
    Текст совпадает с предыдущим письмом.
    <a href="g.mjml">MJML</a>
    <a href="g.html">HTML для рассылки</a>
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
  path.join(OUT, "g-preview.html"),
  preview,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "g-report.json"),
  JSON.stringify({
    variant: "Новогодняя авиационная афиша",
    htmlBytes: bytes,
    copyCheck: "matched f.mjml",
    mjmlValidation: "passed"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Новый вариант собран.");
console.log(`HTML: ${bytes} байт.`);
console.log("Текст совпадает с f.mjml.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "g-preview.html"));
