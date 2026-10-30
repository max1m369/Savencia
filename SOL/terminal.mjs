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
  blue: "#008fd0",
  orange: "#de6a09",
  ink: "#173f4c",
  line: "#c4d8df",
  sky: "#eaf6fa",
  paper: "#f7f5ef"
};

const TICKET_TEXT =
  "На регистрации каждый получит свой посадочный билет, который пригодится во время новогоднего розыгрыша подарков.";

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
    throw new Error("Не найдено тело письма.");
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
  const blocks = [];

  let result = html.replace(
    /<(style|script|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    block => {
      const index = blocks.push(block) - 1;
      return `___SAVENCIA_SAFE_${index}___`;
    }
  );

  // Условные комментарии Outlook не удаляем.
  result = result
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return result.replace(
    /___SAVENCIA_SAFE_(\d+)___/g,
    (_, index) => blocks[Number(index)]
  );
}

function findBase(mjml) {
  if (process.env.ASSET_BASE) {
    return process.env.ASSET_BASE.replace(/\/+$/, "");
  }

  for (const match of mjml.matchAll(
    /\bsrc\s*=\s*(["'])(.*?)\1/gi
  )) {
    const value = decode(match[2]);

    if (
      /^https:\/\//i.test(value) &&
      /logo\.png/i.test(value)
    ) {
      return new URL(".", value).href.replace(/\/+$/, "");
    }
  }

  throw new Error("Не удалось определить адрес папки изображений.");
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

      const addressMatch = content.match(
        /<div\b[^>]*\bclass\s*=\s*["'][^"']*\baddress-main\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
      );

      if (!classMatch || !cityMatch || !addressMatch) {
        throw new Error(
          "Адресный блок отличается от последней версии: " +
          "не найден address-city или address-main."
        );
      }

      const city = plain(cityMatch[1])
        .replace(/\s+/g, " ")
        .trim();

      const address = plain(addressMatch[1])
        .replace(/\s+/g, " ")
        .trim();

      const oldOrder = norm(plain(content));
      const newOrder = norm(city + address);

      if (!expected.includes(oldOrder)) {
        throw new Error("Адрес не найден в эталонном тексте.");
      }

      // Единственное согласованное изменение порядка текста:
      // город переносится над адресом.
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
          <div class="address-city"
            style="
              margin:0 0 11px;
              color:${C.blue};
              font-size:14px;
              font-weight:700;
              line-height:1.35;
              letter-spacing:.35px;
              text-align:left;
            ">${esc(city)}</div>

          <div class="address-main"
            style="
              margin:0;
              color:${C.ink};
              font-size:20px;
              font-weight:400;
              line-height:1.4;
              text-align:left;
            ">${esc(address)}</div>
        </td>
      `;
    }
  );

  if (count !== 3) {
    throw new Error(
      `Найдено адресов: ${count}, ожидалось 3.`
    );
  }

  return { mjml: result, expected };
}

function lightenBoards(mjml) {
  let count = 0;

  const result = mjml.replace(
    /<td\b[^>]*\bclass\s*=\s*["'][^"']*\bairport-cell\b[^"']*["'][^>]*>/gi,
    tag => {
      if (!/background-image\s*:\s*linear-gradient\(/i.test(tag)) {
        throw new Error(
          "В ячейке табло не найден фон с центральным швом."
        );
      }

      count++;

      return tag.replace(
        /background-image\s*:\s*linear-gradient\([\s\S]*?\)\s*;?/i,
        "background-image:linear-gradient(" +
          "to bottom," +
          "#303234 0%," +
          "#303234 49%," +
          "#080a0b 49%," +
          "#080a0b 51%," +
          "#27292b 51%," +
          "#27292b 100%);"
      );
    }
  );

  if (count !== 28) {
    throw new Error(
      `Найдено ячеек табло: ${count}, ожидалось 28.`
    );
  }

  return result;
}

async function makeTicketArt() {
  // Полосы — декоративный мотив, а не действующий штрихкод.
  const bars = [
    [23, 3], [29, 2], [34, 4], [41, 2],
    [47, 3], [53, 2], [58, 4], [65, 2],
    [71, 3], [78, 2], [83, 4], [90, 3]
  ];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="336" height="270" viewBox="0 0 112 90">

      ${bars.map(([x, width]) =>
        `<rect x="${x}" y="10" width="${width}"
          height="39" fill="#ffffff" opacity=".95"/>`
      ).join("")}

      <g transform="translate(57 70) rotate(90) scale(.22)">
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
          fill="#ffffff"/>
      </g>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function replaceTicket(mjml, base) {
  let count = 0;

  const result = mjml.replace(
    /<mj-section\b[^>]*>[\s\S]*?<\/mj-section>/gi,
    section => {
      if (!norm(plain(section)).includes(norm(TICKET_TEXT))) {
        return section;
      }

      // Защита от случайной замены более крупной секции.
      if (norm(plain(section)) !== norm(TICKET_TEXT)) {
        throw new Error(
          "Блок посадочного билета содержит дополнительный текст. " +
          "Автоматическая замена остановлена."
        );
      }

      count++;

      return `
        <mj-section padding="0" background-color="${C.sky}">
          <mj-column padding="0">
            <mj-table
              padding="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              table-layout="fixed">
              <tr>
                <td
                  class="ticket-copy"
                  width="78%"
                  align="center"
                  valign="middle"
                  bgcolor="${C.sky}"
                  style="
                    width:78%;
                    padding:22px 23px;
                    border-left:4px solid ${C.blue};
                    text-align:center;
                    vertical-align:middle;
                    color:${C.ink};
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:17px;
                    line-height:1.65;
                  ">${esc(TICKET_TEXT)}</td>

                <td
                  class="ticket-stub"
                  width="22%"
                  align="center"
                  valign="middle"
                  bgcolor="${C.orange}"
                  style="
                    width:22%;
                    padding:18px 10px;
                    border-left:2px dashed ${C.paper};
                    text-align:center;
                    vertical-align:middle;
                  ">
                  <img
                    class="ticket-art"
                    src="${esc(`${base}/terminal-ticket-art.png`)}"
                    width="84"
                    alt=""
                    role="presentation"
                    style="
                      display:block;
                      width:84px;
                      max-width:100%;
                      height:auto;
                      margin:0 auto;
                      border:0;
                    "/>
                </td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>
      `;
    }
  );

  if (count !== 1) {
    throw new Error(
      `Найдено блоков посадочного билета: ${count}, ожидался 1.`
    );
  }

  return result;
}

function addStyles(mjml) {
  const cleaned = mjml.replace(
    /<!-- SAVENCIA_TICKET_CITY_START -->[\s\S]*?<!-- SAVENCIA_TICKET_CITY_END -->/g,
    ""
  );

  const styles = `
    <!-- SAVENCIA_TICKET_CITY_START -->
    <mj-style>
      .address-city {
        color:${C.blue} !important;
        font-size:14px !important;
        line-height:1.35 !important;
        font-weight:700 !important;
        text-align:left !important;
        margin:0 0 11px !important;
      }

      .address-main {
        margin:0 !important;
        text-align:left !important;
      }

      @media only screen and (max-width:479px) {
        .address-city {
          color:${C.blue} !important;
          font-size:14px !important;
          margin:0 0 11px !important;
        }

        .ticket-copy {
          padding:19px 14px !important;
          font-size:16px !important;
          line-height:1.6 !important;
        }

        .ticket-stub {
          padding:16px 7px !important;
        }

        .ticket-art {
          width:64px !important;
          max-width:100% !important;
        }
      }

      @media only screen and (max-width:359px) {
        .ticket-copy {
          padding:17px 11px !important;
        }

        .ticket-stub {
          padding:14px 5px !important;
        }
      }
    </mj-style>
    <!-- SAVENCIA_TICKET_CITY_END -->
  `;

  if (!/<\/mj-head>/i.test(cleaned)) {
    throw new Error("Не найден mj-head.");
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
      throw new Error(`Неожиданный формат картинки: ${name}`);
    }

    let buffer = pending.get(name);

    if (!buffer) {
      const file = path.join(ASSETS, name);

      if (!(await exists(file))) {
        throw new Error(
          `Не найдено изображение для превью: dist/assets/${name}`
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
  const serialized = JSON.stringify(html)
    .replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Предпросмотр Savencia</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;padding:20px 12px 40px;
  background:#e1e8e8;color:#173f4c;
  font-family:Arial,Helvetica,sans-serif
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
button.active{
  background:#004b62;border-color:#004b62;color:#fff
}
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

  const base = findBase(original);

  if (new URL(base).protocol !== "https:") {
    throw new Error("ASSET_BASE должен начинаться с https://");
  }

  await fs.mkdir(ASSETS, { recursive: true });

  const addressResult = replaceAddresses(
    original,
    originalExpected
  );

  let mjml = addressResult.mjml;
  mjml = lightenBoards(mjml);
  mjml = replaceTicket(mjml, base);
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

  if (
    typeof compiled.html !== "string" ||
    !compiled.html.trim()
  ) {
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

  const ticketArt = await makeTicketArt();

  const pending = new Map([
    ["terminal-ticket-art.png", ticketArt]
  ]);

  const refs = references(mjml);
  const localHTML = await localize(html, refs, pending);

  const backup = path.join(
    DIST,
    "terminal-before-ticket-city.mjml"
  );

  if (!(await exists(backup))) {
    await fs.writeFile(backup, original, "utf8");
  }

  await fs.writeFile(
    path.join(ASSETS, "terminal-ticket-art.png"),
    ticketArt
  );

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
      htmlBytes: bytes,
      maxHTMLBytes: LIMIT,
      copyCheck: "passed",
      allowedTextChange: "city moved before address",
      mjmlValidation: "passed",
      cityColor: C.blue,
      boardTopColor: "#303234",
      boardBottomColor: "#27292b",
      ticketStyle: "text with orange perforated stub",
      assetBase: base,
      assets: refs,
      notes: [
        "Города расположены над адресами.",
        "Полосы на корешке декоративные, не действующий штрихкод.",
        "Остальные секции и изображения сохранены из исходника.",
        "Рендеринг в реальных почтовых клиентах не проверен.",
        "Размер HTML указан до обработки сервисом рассылки."
      ]
    }, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Готово.");
  console.log(`HTML: ${bytes.toLocaleString("ru-RU")} байт.`);
  console.log("Города — над адресами, голубым цветом.");
  console.log("Верхние половинки табло — немного светлее.");
  console.log("Посадочный билет — с оранжевым корешком.");
  console.log("Текст и MJML: проверки пройдены.");
  console.log("");
  console.log("Открыть: dist/terminal-preview.html");
  console.log("Для отправки: dist/terminal.html");

  if (new URL(base).hostname === "example.com") {
    console.warn("");
    console.warn(
      "Перед рассылкой замените ссылки example.com " +
      "действующим HTTPS-хостингом изображений."
    );
  }
}

main().catch(error => {
  console.error("");
  console.error("Сборка остановлена:");
  console.error(error.message || error);
  process.exitCode = 1;
});
