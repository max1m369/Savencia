import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");

const SOURCE = process.env.SOURCE_MJML
  ? path.resolve(ROOT, process.env.SOURCE_MJML)
  : path.join(DIST, "terminal.mjml");

const LIMIT = 90_000;

const C = {
  navy: "#004b62",
  green: "#b1ca40",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#c4d8df"
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decode(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch {
    return false;
  }
}

function plain(markup) {
  return decode(
    markup
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
  );
}

function norm(value) {
  return value
    .normalize("NFC")
    .replace(/[\s\u00a0\u200b-\u200d\ufeff]+/g, "");
}

function bodyText(markup, isMJML = false) {
  const expression = isMJML
    ? /<mj-body\b[^>]*>([\s\S]*?)<\/mj-body>/i
    : /<body\b[^>]*>([\s\S]*?)<\/body>/i;

  const match = markup.match(expression);

  if (!match) {
    throw new Error("В документе не найдено тело письма.");
  }

  return norm(plain(match[1]));
}

function verify(expected, actual, stage) {
  if (expected === actual) return;

  let index = 0;

  while (
    index < expected.length &&
    index < actual.length &&
    expected[index] === actual[index]
  ) {
    index++;
  }

  throw new Error(
    `${stage}: текст не прошёл проверку.\n` +
    `Позиция: ${index}.\n` +
    `Ожидалось: ${expected.slice(Math.max(0, index - 25), index + 90)}\n` +
    `Получено: ${actual.slice(Math.max(0, index - 25), index + 90)}`
  );
}

function compactHTML(html) {
  const protectedBlocks = [];

  let result = html.replace(
    /<(style|script|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    block => {
      const index = protectedBlocks.push(block) - 1;
      return `___SAVENCIA_PROTECTED_${index}___`;
    }
  );

  // Условные комментарии Outlook сохраняем.
  result = result
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return result.replace(
    /___SAVENCIA_PROTECTED_(\d+)___/g,
    (_, index) => protectedBlocks[Number(index)]
  );
}

function findLogoURL(mjml) {
  const tags = mjml.match(/<(?:mj-image|img)\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const match = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);

    if (
      match &&
      /(?:terminal|g|f)-logo\.png|logo\.svg|logo\.png/i.test(match[2])
    ) {
      return decode(match[2]);
    }
  }

  throw new Error("Не найдена ссылка на логотип в исходном MJML.");
}

async function prepareTransparentLogo() {
  const candidates = [
    process.env.LOGO_SOURCE
      ? path.resolve(ROOT, process.env.LOGO_SOURCE)
      : null,
    path.join(ROOT, "logo.svg"),
    path.join(ROOT, "logo.png"),
    path.join(ROOT, "logo.webp"),
    path.join(ASSETS, "g-logo.svg"),
    path.join(ASSETS, "g-logo.png"),
    path.join(ASSETS, "terminal-logo.png")
  ].filter(Boolean);

  for (const file of candidates) {
    if (!(await exists(file))) continue;

    const buffer = await fs.readFile(file);

    // Никакого flatten: сохраняем исходный альфа-канал.
    const rendered = await sharp(buffer, { density: 240 })
      .resize({
        width: 648,
        withoutEnlargement: true
      })
      .ensureAlpha()
      .png({ compressionLevel: 9 })
      .toBuffer();

    const stats = await sharp(rendered).stats();

    // Проверяем не только наличие альфа-канала,
    // но и фактическую прозрачность.
    if (!stats.isOpaque) {
      return {
        buffer: rendered,
        source: file
      };
    }
  }

  throw new Error(
    "Не найден прозрачный оригинал логотипа.\n" +
    "Положите исходный logo.svg или прозрачный logo.png рядом с terminal.mjs.\n" +
    "Старая копия с белой подложкой не подходит: прозрачность в ней уже утрачена."
  );
}

function star(x, y, radius, opacity = 0.65) {
  const inner = radius * 0.23;

  return `
    <path d="
      M${x} ${y-radius}
      L${x+inner} ${y-inner}
      L${x+radius} ${y}
      L${x+inner} ${y+inner}
      L${x} ${y+radius}
      L${x-inner} ${y+inner}
      L${x-radius} ${y}
      L${x-inner} ${y-inner}Z"
      fill="${C.navy}"
      opacity="${opacity}"/>
  `;
}

function drop(x, y, scale, angle) {
  return `
    <g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">
      <path d="
        M0-25
        C8-15 17-4 17 6
        C17 16 10 23 0 23
        C-10 23-17 16-17 6
        C-17-4-8-15 0-25Z"
        fill="#ffffff"/>
    </g>
  `;
}

async function makeSloganBackground() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="1280" height="360" viewBox="0 0 1280 360">

      <rect width="1280" height="360" fill="${C.green}"/>

      <!-- Капли разного размера и с разным наклоном -->
      ${drop(1105, 103, 2.25, 42)}
      ${drop(153, 250, 1.75, -39)}

      <!-- Несимметричные небольшие звёзды -->
      ${star(1007, 68, 13, 0.62)}
      ${star(1196, 193, 8, 0.55)}
      ${star(244, 222, 10, 0.58)}
      ${star(91, 301, 6, 0.5)}

      <!-- Верхний маршрут: не пересекает основную строку слогана -->
      <path
        d="M590 39 C715 -3 831 4 938 38 C987 54 1024 35 1053 14"
        fill="none"
        stroke="${C.navy}"
        stroke-width="2.6"
        stroke-opacity=".43"
        stroke-dasharray="5 18"
        stroke-linecap="round"/>

      <!-- Нижний маршрут ведёт к маленькому самолёту -->
      <path
        d="M42 271 C72 331 151 349 222 319 C260 303 291 278 324 251"
        fill="none"
        stroke="${C.navy}"
        stroke-width="2.6"
        stroke-opacity=".48"
        stroke-dasharray="5 17"
        stroke-linecap="round"/>

      <!-- Тихий пунктирный хвост справа -->
      <path
        d="M1195 226 C1209 271 1183 318 1227 345"
        fill="none"
        stroke="${C.navy}"
        stroke-width="2.4"
        stroke-opacity=".34"
        stroke-dasharray="4 18"
        stroke-linecap="round"/>

      <!-- Небольшой бирюзовый самолёт, без чёрного -->
      <g transform="translate(344 238) rotate(48) scale(.67)">
        <path d="
          M0-47
          C5-47 7-39 7-32
          L7-9
          L43 14
          L43 24
          L7 12
          L7 35
          L19 44
          L19 51
          L0 45
          L-19 51
          L-19 44
          L-7 35
          L-7 12
          L-43 24
          L-43 14
          L-7-9
          L-7-32
          C-7-39-5-47 0-47Z"
          fill="${C.navy}"
          opacity=".84"/>
      </g>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function replaceHeader(mjml, base) {
  let count = 0;

  const result = mjml.replace(
    /<mj-section\b[^>]*>[\s\S]*?<\/mj-section>/gi,
    section => {
      if (
        count ||
        !/(?:terminal|g|f)-logo\.png|logo\.svg|logo\.png/i.test(section)
      ) {
        return section;
      }

      count++;

      return `
        <mj-section
          padding="0"
          background-color="#ffffff"
          background-url="${esc(`${base}/terminal-year.png`)}"
          background-repeat="no-repeat"
          background-size="360px 112px"
          background-position="right center">
          <mj-column padding="0">
            <mj-table padding="0" cellpadding="0" cellspacing="0"
              width="100%" table-layout="fixed">
              <tr>
                <td height="112" align="left" valign="middle"
                  style="height:112px;padding:0 0 0 30px;
                    text-align:left;vertical-align:middle;
                    font-size:0;line-height:0;">
                  <img
                    src="${esc(`${base}/terminal-logo.png`)}"
                    width="216"
                    alt="Groupe Savencia"
                    style="display:block;width:216px;max-width:75%;
                      height:auto;border:0;"/>
                </td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>
      `;
    }
  );

  if (count !== 1) {
    throw new Error("Не удалось найти единственную шапку с логотипом.");
  }

  return result;
}

function replaceAddresses(mjml, originalExpected) {
  let count = 0;
  let expected = originalExpected;

  const result = mjml.replace(
    /<td\b([^>]*\bclass\s*=\s*["'][^"']*\b(?:address-cell|address-single)\b[^"']*["'][^>]*)>([\s\S]*?)<\/td>/gi,
    (_, attributes, content) => {
      const classMatch = attributes.match(
        /\bclass\s*=\s*(["'])(.*?)\1/i
      );

      const cityMatch = content.match(
        /<div\b[^>]*\bclass\s*=\s*["'][^"']*\baddress-city\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
      );

      if (!classMatch || !cityMatch) {
        throw new Error("Не удалось прочитать город в адресном блоке.");
      }

      const city = plain(cityMatch[1]).replace(/\s+/g, " ").trim();

      const rest = content.replace(cityMatch[0], "");

      const address = plain(rest).replace(/\s+/g, " ").trim();

      if (!city || !address) {
        throw new Error("В адресном блоке отсутствует город или адрес.");
      }

      // Учитываем только согласованную перестановку.
      const oldOrder = norm(plain(content));
      const newOrder = norm(address + city);

      if (!expected.includes(oldOrder)) {
        throw new Error("Адресный блок не найден в эталонном тексте.");
      }

      expected = expected.replace(oldOrder, newOrder);

      const classes = classMatch[2];
      const multiple = /\baddress-cell\b/.test(classes);
      const second = /\baddress-second\b/.test(classes);

      count++;

      return `
        <td
          class="${esc(classes)}"
          width="${multiple ? "50%" : "100%"}"
          align="left"
          valign="top"
          style="
            width:${multiple ? "50%" : "100%"};
            padding:22px 18px 25px;
            ${second ? `border-left:1px solid ${C.line};` : ""}
            text-align:left;
            vertical-align:top;
            font-family:Arial,Helvetica,sans-serif;
          ">
          <div class="address-main"
            style="
              margin:0 0 13px;
              color:${C.ink};
              font-size:20px;
              font-weight:400;
              line-height:1.4;
              text-align:left;
            ">${esc(address)}</div>

          <div class="address-city"
            style="
              margin:0;
              color:${C.muted};
              font-size:13px;
              font-weight:700;
              line-height:1.35;
              letter-spacing:.3px;
              text-align:left;
            ">${esc(city)}</div>
        </td>
      `;
    }
  );

  if (count !== 3) {
    throw new Error(
      `Найдено адресов: ${count}, ожидалось 3. Исходник отличается от последней версии.`
    );
  }

  return { mjml: result, expected };
}

function replaceSlogan(mjml, base) {
  let count = 0;

  const result = mjml.replace(
    /<mj-section\b[^>]*>[\s\S]*?<\/mj-section>/gi,
    section => {
      if (!/\bslogan-line\b/.test(section)) return section;

      count++;

      return `
        <mj-section
          padding="25px 24px 27px"
          background-color="${C.green}"
          background-url="${esc(`${base}/terminal-slogan-flight.png`)}"
          background-repeat="no-repeat"
          background-size="cover"
          background-position="center center">
          <mj-column>
            <mj-text padding="0" font-size="37px"
              line-height="1.16" font-weight="700">
              <div class="slogan-line"
                style="color:#004b62;text-align:left;
                  letter-spacing:-.8px;">
                ТРИ ГОРОДА.
              </div>
              <div class="slogan-line"
                style="margin-top:6px;color:#008fd0;
                  text-align:center;letter-spacing:-.8px;">
                ОДИН РЕЙС.
              </div>
              <div class="slogan-line"
                style="margin-top:6px;color:#004b62;
                  text-align:right;letter-spacing:-.8px;">
                ОДНА КОМАНДА.
              </div>
            </mj-text>
          </mj-column>
        </mj-section>
      `;
    }
  );

  if (count !== 1) {
    throw new Error(
      `Найдено секций слогана: ${count}, ожидалась 1.`
    );
  }

  return result;
}

function replaceHeadings(mjml) {
  return mjml.replace(
    /<div\b[^>]*\bclass\s*=\s*["'][^"']*\baddress-heading\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    (_, content) => {
      const value = plain(
        content.replace(/<br\s*\/?>/gi, " ")
      ).replace(/\s+/g, " ").trim();

      return `<div class="address-heading"
        style="margin:0;color:${C.navy};
          font-family:Arial,Helvetica,sans-serif;
          font-size:26px;font-weight:700;line-height:1.15;
          letter-spacing:-.65px;white-space:nowrap;
          text-align:center;">${esc(value)}</div>`;
    }
  );
}

function addStyles(mjml) {
  const cleaned = mjml.replace(
    /<!-- SAVENCIA_ADDRESS_FLIGHT_START -->[\s\S]*?<!-- SAVENCIA_ADDRESS_FLIGHT_END -->/g,
    ""
  );

  const styles = `
    <!-- SAVENCIA_ADDRESS_FLIGHT_START -->
    <mj-style>
      .address-cell,
      .address-single,
      .address-main,
      .address-city {
        text-align:left !important;
        vertical-align:top !important;
      }

      .address-city {
        font-size:13px !important;
        line-height:1.35 !important;
        font-weight:700 !important;
      }

      @media only screen and (max-width:479px) {
        .address-cell,
        .address-single {
          padding:22px 16px 25px !important;
          text-align:left !important;
        }

        .address-main {
          font-size:20px !important;
          line-height:1.4 !important;
        }

        .address-city {
          font-size:13px !important;
          line-height:1.35 !important;
        }

        .address-heading {
          font-size:21px !important;
          line-height:1.15 !important;
          letter-spacing:-.65px !important;
          white-space:nowrap !important;
        }

        .slogan-line {
          font-size:28px !important;
          line-height:1.18 !important;
          letter-spacing:-.6px !important;
        }
      }

      @media only screen and (max-width:359px) {
        .address-heading {
          font-size:18px !important;
          letter-spacing:-.55px !important;
        }

        .slogan-line {
          font-size:24px !important;
          letter-spacing:-.6px !important;
        }
      }
    </mj-style>
    <!-- SAVENCIA_ADDRESS_FLIGHT_END -->
  `;

  if (!/<\/mj-head>/i.test(cleaned)) {
    throw new Error("В исходнике отсутствует mj-head.");
  }

  return cleaned.replace(/<\/mj-head>/i, `${styles}</mj-head>`);
}

function references(mjml) {
  return [...new Set(
    [...mjml.matchAll(
      /\b(?:src|background-url)\s*=\s*(["'])(.*?)\1/gi
    )]
      .map(match => decode(match[2]))
      .filter(value => /^https:\/\//i.test(value))
  )];
}

async function localize(html, refs, pending) {
  let result = html;

  for (const reference of refs) {
    const name = decodeURIComponent(
      path.posix.basename(new URL(reference).pathname)
    );

    const extension = path.extname(name).toLowerCase();

    const mime = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif"
    }[extension];

    if (!mime) {
      throw new Error(`Неожиданный формат изображения: ${name}`);
    }

    let buffer = pending.get(name);

    if (!buffer) {
      const file = path.join(ASSETS, name);

      if (!(await exists(file))) {
        throw new Error(
          `Для превью отсутствует dist/assets/${name}`
        );
      }

      buffer = await fs.readFile(file);
    }

    const dataURL = `data:${mime};base64,${buffer.toString("base64")}`;

    result = result
      .split(esc(reference)).join(dataURL)
      .split(reference).join(dataURL);
  }

  return result;
}

function previewPage(html) {
  const serialized = JSON.stringify(html).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Предпросмотр Savencia</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;padding:20px 12px 40px;background:#e1e8e8;
  font-family:Arial,Helvetica,sans-serif;color:#173f4c
}
nav{
  display:flex;flex-wrap:wrap;justify-content:center;
  gap:8px;margin-bottom:16px
}
button{
  padding:11px 15px;border:1px solid #b6c9cd;
  border-radius:5px;background:#fff;color:#173f4c;
  font:700 13px Arial,sans-serif;cursor:pointer
}
button.active{background:#004b62;border-color:#004b62;color:#fff}
.viewport{width:100%;overflow-x:auto}
iframe{
  display:block;width:640px;height:1200px;
  margin:0 auto;border:0;background:#e1e8e8
}
p{
  margin:16px auto 0;max-width:640px;
  font-size:12px;line-height:1.5;text-align:center
}
</style>
</head>
<body>
<nav>
<button data-width="640" class="active">Компьютер · 640 px</button>
<button data-width="375">Телефон · 375 px</button>
<button data-width="320">Телефон · 320 px</button>
</nav>
<div class="viewport">
<iframe id="email" title="Письмо Savencia"></iframe>
</div>
<p>Локальный просмотр. Для рассылки — terminal.html.</p>
<script>
const frame=document.getElementById("email");

function fit(){
  const doc=frame.contentDocument;
  if(!doc || !doc.body)return;
  frame.style.height="1px";
  frame.style.height=(
    Math.max(doc.body.scrollHeight,doc.documentElement.scrollHeight)+8
  )+"px";
}

frame.addEventListener("load",()=>{
  fit();
  for(const img of frame.contentDocument.images){
    img.addEventListener("load",fit);
  }
  setTimeout(fit,200);
  setTimeout(fit,800);
});

for(const button of document.querySelectorAll("[data-width]")){
  button.addEventListener("click",()=>{
    frame.style.width=button.dataset.width+"px";
    for(const item of document.querySelectorAll("[data-width]")){
      item.classList.toggle("active",item===button);
    }
    setTimeout(fit,150);
  });
}

window.addEventListener("resize",()=>setTimeout(fit,100));
frame.srcdoc=${serialized};
</script>
</body>
</html>`;
}

async function main() {
  if (!(await exists(SOURCE))) {
    throw new Error(
      "Не найден dist/terminal.mjml из предыдущей сборки. " +
      "Папку dist нужно сохранить."
    );
  }

  const original = await fs.readFile(SOURCE, "utf8");
  const originalExpected = bodyText(original, true);

  const previousLogoURL = findLogoURL(original);

  const base = (
    process.env.ASSET_BASE ||
    new URL(".", previousLogoURL).href
  ).replace(/\/+$/, "");

  if (new URL(base).protocol !== "https:") {
    throw new Error("ASSET_BASE должен начинаться с https://");
  }

  await fs.mkdir(ASSETS, { recursive: true });

  // Сначала готовим новые изображения в памяти.
  // До прохождения проверок существующие активы не перезаписываем.
  const logo = await prepareTransparentLogo();
  const sloganBackground = await makeSloganBackground();

  let mjml = replaceHeader(original, base);

  const addressResult = replaceAddresses(mjml, originalExpected);
  mjml = addressResult.mjml;

  mjml = replaceHeadings(mjml);
  mjml = replaceSlogan(mjml, base);
  mjml = addStyles(mjml);

  verify(
    addressResult.expected,
    bodyText(mjml, true),
    "Проверка MJML"
  );

  const compiled = await mjml2html(mjml, {
    validationLevel: "strict",
    beautify: false,
    minify: false
  });

  if (compiled.errors?.length) {
    throw new Error(
      compiled.errors
        .map(error => error.formattedMessage || error.message)
        .join("\n")
    );
  }

  if (typeof compiled.html !== "string" || !compiled.html.trim()) {
    throw new Error("MJML не вернул HTML.");
  }

  verify(
    addressResult.expected,
    bodyText(compiled.html),
    "Проверка HTML"
  );

  const html = compactHTML(compiled.html);

  verify(
    addressResult.expected,
    bodyText(html),
    "Проверка после сокращения HTML"
  );

  const bytes = Buffer.byteLength(html, "utf8");

  if (bytes >= LIMIT) {
    throw new Error(
      `HTML занимает ${bytes} байт. Предел — ${LIMIT} байт. ` +
      "Выходные файлы не обновлены."
    );
  }

  if (/data:image\//i.test(html) || /<svg\b/i.test(html)) {
    throw new Error(
      "В HTML для отправки попал base64 или встроенный SVG."
    );
  }

  const pending = new Map([
    ["terminal-logo.png", logo.buffer],
    ["terminal-slogan-flight.png", sloganBackground]
  ]);

  const refs = references(mjml);
  const localHTML = await localize(html, refs, pending);

  const backup = path.join(
    DIST,
    "terminal-before-address-flight.mjml"
  );

  if (!(await exists(backup))) {
    await fs.writeFile(backup, original, "utf8");
  }

  for (const [name, buffer] of pending) {
    await fs.writeFile(path.join(ASSETS, name), buffer);
  }

  await fs.writeFile(
    path.join(DIST, "terminal.mjml"),
    mjml,
    "utf8"
  );

  await fs.writeFile(
    path.join(DIST, "terminal.html"),
    html,
    "utf8"
  );

  await fs.writeFile(
    path.join(DIST, "terminal-preview.html"),
    previewPage(localHTML),
    "utf8"
  );

  await fs.writeFile(
    path.join(DIST, "terminal-report.json"),
    JSON.stringify({
      source: SOURCE,
      logoSource: logo.source,
      logoTransparency: "verified",
      htmlBytes: bytes,
      maxHTMLBytes: LIMIT,
      copyCheck: "passed",
      allowedTextChange: "address moved before city",
      mjmlValidation: "passed",
      assetBase: base,
      assets: refs,
      notes: [
        "Адреса крупнее городов и стоят первыми.",
        "Адресные блоки выровнены влево и вверх.",
        "Прозрачность логотипа проверена по пикселям.",
        "Капли, самолёт и маршруты — декоративный PNG.",
        "Капли стилизованы, не извлечены из официального вектора.",
        "Рендеринг в реальных почтовых клиентах не проверен."
      ]
    }, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Готово.");
  console.log(`HTML: ${bytes.toLocaleString("ru-RU")} байт.`);
  console.log("Прозрачность логотипа: подтверждена.");
  console.log("Адреса: крупные, слева сверху; города — ниже и меньше.");
  console.log("Зелёная секция: крупные капли, самолёт и пунктир.");
  console.log("Текст и MJML: проверки пройдены.");
  console.log("");
  console.log("Открыть: dist/terminal-preview.html");
  console.log("Для отправки: dist/terminal.html");

  if (new URL(base).hostname === "example.com") {
    console.warn("");
    console.warn(
      "Перед рассылкой нужно опубликовать картинки " +
      "и заменить ссылки example.com действующим HTTPS-хостингом."
    );
  }
}

main().catch(error => {
  console.error("");
  console.error("Сборка остановлена:");
  console.error(error.message || error);
  process.exitCode = 1;
});
