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
  line: "#cedde1",
  white: "#ffffff"
};

const esc = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const asset = name => `${BASE}/${name}`;

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
   ЧИТАЕМ ТОЛЬКО ТЕЛО ПРЕДЫДУЩЕГО ПИСЬМА
   Настройки mj-head никогда не извлекаются как текст.
   ========================================================= */

let previous;

try {
  previous = await fs.readFile(
    path.join(OUT, "g.mjml"),
    "utf8"
  );
} catch {
  throw new Error(
    "Не найден dist/g.mjml. " +
    "Сначала выполните node retro.mjs."
  );
}

const bodyMatch = previous.match(
  /<mj-body\b[^>]*>([\s\S]*?)<\/mj-body>/i
);

if (!bodyMatch) {
  throw new Error("В g.mjml не найдено тело письма.");
}

const bodySource = bodyMatch[1]
  .replace(/<!--[\s\S]*?-->/g, "");

const items = Array.from(
  bodySource.matchAll(
    /<mj-text\b[^>]*>([\s\S]*?)<\/mj-text>/gi
  ),
  match => norm(
    decode(match[1].replace(/<[^>]*>/g, " "))
  )
);

function position(value) {
  const index = items.indexOf(value);

  if (index < 0) {
    throw new Error(
      "Не найден обязательный фрагмент:\n" + value
    );
  }

  return index;
}

const greetingIndex = position("Дорогие коллеги!");

const sloganIndex = position(
  "ТРИ ГОРОДА. ОДИН РЕЙС. ОДНА КОМАНДА."
);

const scheduleIndex = position("Расписание нашего рейса");

const firstGroupIndex = items.findIndex(
  value => value.includes("МОСКВА и УФА")
);

const secondGroupIndex = items.findIndex(
  value => value.includes("БЕЛЕБЕЙ")
);

const closingIndex = position("Уважаемые пассажиры!");

if (!(
  greetingIndex > 0 &&
  sloganIndex > greetingIndex &&
  scheduleIndex > sloganIndex &&
  firstGroupIndex > scheduleIndex &&
  secondGroupIndex > firstGroupIndex &&
  closingIndex > secondGroupIndex
)) {
  throw new Error("Структура предыдущего письма не распознана.");
}

const subject = norm(items.slice(0, greetingIndex).join(" "));

if (subject !== "10 декабря — Вылет в Новый ГОД!") {
  throw new Error(
    "В исходном письме неожиданная строка заголовка:\n" +
    subject
  );
}

const intro = items.slice(greetingIndex, sloganIndex);
const middle = items.slice(sloganIndex + 1, scheduleIndex);
const closing = items.slice(closingIndex);

function parseGroup(values) {
  const addressIndex = values.findIndex(
    value =>
      value === "Аэропорты отправления:" ||
      value === "Аэропорт отправления:"
  );

  if (addressIndex < 0) {
    throw new Error("Не найден заголовок адресов.");
  }

  const rows = [];
  let cursor = 1;

  while (cursor < addressIndex) {
    const line = values[cursor++];

    const match = line.match(
      /^(\d{2}:\d{2}–\d{2}:\d{2}) —(?: (.+))?$/u
    );

    if (!match) {
      throw new Error(
        "Не удалось распознать время этапа:\n" + line
      );
    }

    const title = match[2] || values[cursor++];
    const description = values[cursor++];

    if (!title || !description) {
      throw new Error("Неполный этап расписания.");
    }

    rows.push({
      time: match[1],
      title,
      description
    });
  }

  if (rows.length !== 3) {
    throw new Error(
      "Для каждой группы должны быть три этапа."
    );
  }

  return {
    heading: values[0],
    rows,
    addresses: values.slice(addressIndex)
  };
}

const groups = [
  parseGroup(items.slice(firstGroupIndex, secondGroupIndex)),
  parseGroup(items.slice(secondGroupIndex, closingIndex))
];

/* =========================================================
   ЛОГОТИП
   SVG — оригинал, PNG — совместимая версия для почты.
   ========================================================= */

let logoPath = null;

for (const candidate of [
  path.join(ROOT, "logo.svg"),
  path.join(ROOT, "logo.png"),
  path.join(ROOT, "logo.jpg"),
  path.join(ROOT, "logo.jpeg"),
  path.join(ASSETS, "g-logo.svg"),
  path.join(ASSETS, "g-logo.png")
]) {
  try {
    await fs.access(candidate);
    logoPath = candidate;
    break;
  } catch {}
}

if (!logoPath) {
  throw new Error(
    "Не найден логотип. Положите logo.svg или logo.png " +
    "рядом с polish.mjs."
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
  .toFile(path.join(ASSETS, "h-logo.png"));

if (isSVG) {
  await fs.writeFile(
    path.join(ASSETS, "h-logo.svg"),
    logoData
  );
}

/* =========================================================
   НОВАЯ КОМПОЗИЦИЯ ИЛЛЮСТРАЦИИ
   Плоская графика, три шара, один маршрут.
   ========================================================= */

function star(cx, cy, outer, inner, rotation = 0) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5 + rotation;
    const r = i % 2 ? inner : outer;

    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ");
}

const artwork = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1280" height="540" viewBox="0 0 1280 540">

  <rect width="1280" height="540" fill="${C.navy}"/>

  <g stroke="#ffffff" stroke-width="2" opacity=".4">
    <path d="M194 0V133"/>
    <path d="M640 0V54"/>
    <path d="M1094 0V166"/>
  </g>

  <rect x="173" y="129" width="42" height="21"
        rx="3" fill="${C.green}"/>
  <rect x="610" y="50" width="60" height="25"
        rx="3" fill="${C.orange}"/>
  <rect x="1074" y="162" width="40" height="21"
        rx="3" fill="${C.cyan}"/>

  <circle cx="194" cy="303" r="157" fill="${C.green}"/>
  <circle cx="640" cy="287" r="216" fill="${C.orange}"/>
  <circle cx="1094" cy="322" r="143" fill="${C.cyan}"/>

  <g fill="none" stroke="#ffffff" stroke-width="3" opacity=".5">
    <path d="M108 201Q189 154 264 195"/>
    <path d="M512 136Q632 80 746 134"/>
    <path d="M1020 223Q1090 189 1156 225"/>
  </g>

  <g fill="none" stroke="${C.navy}" stroke-width="2" opacity=".25">
    <path d="M78 349Q194 284 310 349"/>
    <path d="M474 376Q640 282 806 376"/>
    <path d="M990 367Q1094 306 1198 367"/>
  </g>

  <path d="M-40 477C183 489 428 425 711 246"
        fill="none" stroke="#ffffff"
        stroke-width="3" stroke-dasharray="9 15"
        opacity=".9"/>

  <g transform="translate(790 255) rotate(57) scale(1.88)">
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

  <polygon points="${star(378, 91, 20, 8, .1)}"
           fill="${C.cyan}"/>
  <polygon points="${star(1201, 92, 22, 9)}"
           fill="${C.orange}"/>
  <polygon points="${star(928, 455, 16, 6, .2)}"
           fill="${C.green}"/>

  <g fill="#ffffff">
    <circle cx="90" cy="87" r="3"/>
    <circle cx="426" cy="468" r="3"/>
    <circle cx="932" cy="93" r="3"/>
    <circle cx="1232" cy="439" r="3"/>
  </g>

  <g stroke-width="4">
    <path d="M340 193L352 178" stroke="${C.orange}"/>
    <path d="M462 62L478 72" stroke="${C.green}"/>
    <path d="M56 430L70 418" stroke="${C.cyan}"/>
  </g>
</svg>
`;

await sharp(Buffer.from(artwork))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(ASSETS, "h-poster.png"));

/* =========================================================
   MJML
   ========================================================= */

const txt = (value, attrs = "") =>
  `<mj-text ${attrs}>${esc(value)}</mj-text>`;

function section(content) {
  return `
    <mj-section padding="0 30px"
                background-color="${C.paper}">
      <mj-column>${content}</mj-column>
    </mj-section>
  `;
}

function schedule(group, index) {
  const accent = index === 0 ? C.orange : C.blue;

  return `
    <mj-wrapper padding="0 30px 26px"
                background-color="${C.paper}">

      <mj-section padding="20px 22px"
                  background-color="${C.navy}"
                  border-top="4px solid ${accent}">
        <mj-column>
          ${txt(group.heading,
            `font-size="20px" line-height="1.4"
             font-weight="700" color="#ffffff"
             padding="0"`)}
        </mj-column>
      </mj-section>

      ${group.rows.map((row, rowIndex) => `
        ${rowIndex ? `
          <mj-section padding="0 22px" background-color="#ffffff">
            <mj-column>
              <mj-divider border-color="${C.line}"
                          border-width="1px" padding="0"/>
            </mj-column>
          </mj-section>
        ` : ""}

        <mj-section padding="21px 22px"
                    background-color="#ffffff">

          <mj-column width="43%" vertical-align="top">
            ${txt(`${row.time} —`,
              `font-size="25px" line-height="1.2"
               font-weight="700" color="${C.navy}"
               padding="0 12px 12px 0"`)}
          </mj-column>

          <mj-column width="57%" vertical-align="top">
            ${txt(row.title,
              `font-size="18px" line-height="1.35"
               font-weight="700" color="${C.navy}"
               padding="0 0 9px"`)}
            ${txt(row.description,
              `font-size="16px" line-height="1.65"
               color="${C.muted}" padding="0"`)}
          </mj-column>

        </mj-section>
      `).join("")}

      <mj-section padding="0 22px 19px"
                  background-color="#ffffff">
        <mj-column>
          <mj-divider border-color="${C.line}"
                      border-width="1px"
                      border-style="dashed"
                      padding="0 0 17px"/>

          ${group.addresses.map((value, i) => {
            const isLabel = i === 0 || /:$/.test(value);

            return txt(value, isLabel
              ? `font-size="13px" font-weight="700"
                 color="${C.navy}" padding="5px 0 5px"`
              : `font-size="16px" line-height="1.6"
                 padding="0 0 10px"`
            );
          }).join("")}
        </mj-column>
      </mj-section>

    </mj-wrapper>
  `;
}

const sloganMarkup = `
  <span style="color:${C.navy}">ТРИ ГОРОДА.</span><br/>
  <span style="color:${C.blue}">ОДИН РЕЙС.</span><br/>
  <span style="color:${C.navy}">ОДНА КОМАНДА.</span>
`;

const source = `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(subject)}</mj-title>
    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text font-size="17px" line-height="1.65"
               color="${C.ink}" padding="0 0 17px"/>
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
          font-size:36px !important;
          line-height:1.12 !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e2e9e9">

    <mj-section padding="26px 30px"
                background-color="#ffffff">
      <mj-column>
        <mj-image src="${asset("h-logo.png")}"
                  alt="Groupe Savencia"
                  width="216px" align="left" padding="0"/>
      </mj-column>
    </mj-section>

    <mj-section padding="30px 30px 0"
                background-color="${C.navy}"
                border-top="4px solid ${C.orange}">
      <mj-column>
        ${txt("10 декабря",
          `font-size="74px" line-height="1"
           font-weight="700" color="#ffffff"
           padding="0 0 13px" css-class="hero-date"`)}
        ${txt("— Вылет в Новый ГОД!",
          `font-size="39px" line-height="1.1"
           font-weight="700" color="#ffffff"
           padding="0" css-class="hero-title"`)}
      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.navy}">
      <mj-column>
        <mj-image src="${asset("h-poster.png")}"
                  alt="" width="640px" padding="0"/>
      </mj-column>
    </mj-section>

    ${section(`
      ${intro.map((value, i) => txt(value,
        i === 0
          ? `font-size="23px" font-weight="700"
             padding="30px 0 17px"`
          : `padding="0 0 18px"`
      )).join("")}
      <mj-spacer height="8px"/>
    `)}

    <mj-section padding="26px 30px 28px"
                background-color="${C.green}">
      <mj-column>
        <mj-text font-size="46px"
                 line-height="1.1"
                 font-weight="700"
                 padding="0"
                 css-class="statement">
          ${sloganMarkup}
        </mj-text>
      </mj-column>
    </mj-section>

    ${section(`
      ${middle.map((value, i) => txt(value,
        `padding="${i === 0 ? "28px" : "0"} 0 18px"`
      )).join("")}

      <mj-divider border-color="${C.orange}"
                  border-width="3px" padding="9px 0 24px"/>

      ${txt(items[scheduleIndex],
        `font-size="31px" line-height="1.2"
         font-weight="700" padding="0 0 24px"`)}
    `)}

    ${groups.map(schedule).join("")}

    ${section(`
      ${closing.slice(0, -2).map((value, i) => txt(value,
        i === 0
          ? `font-size="22px" font-weight="700"
             padding="1px 0 17px"`
          : `padding="0 0 18px"`
      )).join("")}
      <mj-spacer height="10px"/>
    `)}

    <mj-section padding="27px 30px 32px"
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
   КОМПИЛЯЦИЯ И ПРОВЕРКА ТЕКСТА
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
    "Превышен внутренний предел 90 000 байт."
  );
}

function visibleText(value) {
  return norm(
    decode(
      value
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ")
    )
  );
}

const actual = visibleText(html);
const expected = norm(items.join(" "));

if (actual !== expected) {
  throw new Error(
    "Новый вариант отличается по тексту от g.mjml. " +
    "Сборка остановлена."
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

await fs.writeFile(path.join(OUT, "h.mjml"), source, "utf8");
await fs.writeFile(path.join(OUT, "h.html"), html, "utf8");

/* =========================================================
   ЛОКАЛЬНЫЙ ПРОСМОТРЩИК
   ========================================================= */

let localHTML = html;

for (const name of ["h-logo.png", "h-poster.png"]) {
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
  <title>Savencia — вариант H</title>
  <style>
    * { box-sizing:border-box; }
    body {
      margin:0;
      background:#e2e9e9;
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
      border-bottom:1px solid #cedde1;
    }
    h1 { margin:0 auto 0 0; font-size:18px; }
    button {
      padding:10px 13px;
      border:1px solid #9bb9c4;
      background:#ffffff;
      color:#004b62;
      font:inherit;
      font-size:13px;
      cursor:pointer;
    }
    button.active { background:#004b62; color:#ffffff; }
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
    <h1>Savencia · вариант H</h1>
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
    Текст совпадает с вариантом G.
    <a href="h.mjml">MJML</a>
    <a href="h.html">HTML для рассылки</a>
    <a href="g-preview.html">Сравнить с G</a>
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

        frame.style.height = (
          Math.max(
            doc.body.scrollHeight,
            doc.documentElement.scrollHeight,
            doc.body.offsetHeight
          ) + 24
        ) + "px";
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
            img.addEventListener("load", resizeFrame, { once:true });
            img.addEventListener("error", resizeFrame, { once:true });
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
  path.join(OUT, "h-preview.html"),
  preview,
  "utf8"
);

await fs.writeFile(
  path.join(OUT, "h-report.json"),
  JSON.stringify({
    variant: "H",
    htmlBytes: bytes,
    copyCheck: "matched g.mjml",
    mjmlValidation: "passed"
  }, null, 2),
  "utf8"
);

console.log("");
console.log("Вариант H собран.");
console.log(`HTML: ${bytes} байт.`);
console.log("Текст совпадает с вариантом G.");
console.log("");
console.log("Откройте:");
console.log(path.join(OUT, "h-preview.html"));
console.log("");
console.log(
  "Перед рассылкой разместите картинки на HTTPS-хостинге, " +
  "укажите ASSET_BASE и проверьте тестовое письмо."
);
