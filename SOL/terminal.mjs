import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

/* =========================================================
   SAVENCIA

   Изменения:
   — «по местному времени» без скобок;
   — фон возвращается в исходное направление;
   — то же направление фона применяется в шапке;
   — более чёткий контур 2027 сохраняется.

   Остальное письмо не изменяется.

   Использует текущие:
   — dist/terminal.mjml
   — dist/assets

   Запуск:
   node terminal.mjs

   Повторный запуск не переворачивает фон повторно.
   ========================================================= */

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");

const SOURCE = process.env.SOURCE_MJML
  ? path.resolve(ROOT, process.env.SOURCE_MJML)
  : path.join(DIST, "terminal.mjml");

const LIMIT = 90_000;
const PAPER = "#f7f5ef";

const FILES = {
  originalBackground: "terminal-winter-pearl-original.jpg",
  background: "terminal-winter-pearl.jpg",
  header: "terminal-winter-header.png",
  refinedYear: "terminal-year-refined.png",
  originalYear: "terminal-year.png"
};

const OUTPUT = {
  mjml: path.join(DIST, "terminal.mjml"),
  html: path.join(DIST, "terminal.html"),
  preview: path.join(DIST, "terminal-preview.html"),
  report: path.join(DIST, "terminal-report.json")
};

/* =========================================================
   Общие функции
   ========================================================= */

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch {
    return false;
  }
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decode(value) {
  return String(value)
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

function normalizeText(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\s\u00a0\u200b-\u200d\ufeff]+/g, "");
}

function visibleText(fragment) {
  return normalizeText(
    decode(
      fragment
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
    )
  );
}

function bodyText(markup, isMJML = false) {
  const expression = isMJML
    ? /<mj-body\b[^>]*>([\s\S]*?)<\/mj-body>/i
    : /<body\b[^>]*>([\s\S]*?)<\/body>/i;

  const match = markup.match(expression);

  if (!match) {
    throw new Error("Не найдено тело письма.");
  }

  return visibleText(match[1]);
}

function verifyText(expected, actual, stage) {
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
    `${stage}: текст изменился сверх запрошенной правки.\n` +
    `Позиция: ${index}.\n` +
    `Ожидалось: ${expected.slice(
      Math.max(0, index - 25), index + 100
    )}\n` +
    `Получено: ${actual.slice(
      Math.max(0, index - 25), index + 100
    )}`
  );
}

function compactHTML(html) {
  const blocks = [];

  return html
    .replace(
      /<(style|script|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
      block => {
        const index = blocks.push(block) - 1;
        return `___SAVENCIA_BLOCK_${index}___`;
      }
    )
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim()
    .replace(
      /___SAVENCIA_BLOCK_(\d+)___/g,
      (_, index) => blocks[Number(index)]
    );
}

function imageReferences(mjml) {
  const result = [];
  const expression =
    /\b(?:src|background-url)\s*=\s*(["'])(.*?)\1/gi;

  let match;

  while ((match = expression.exec(mjml))) {
    const url = decode(match[2]);

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol === "https:" &&
        /\.(?:png|jpe?g|gif|webp)$/i.test(parsed.pathname)
      ) {
        result.push(url);
      }
    } catch {
      // Не является абсолютным HTTPS-адресом изображения.
    }
  }

  return [...new Set(result)];
}

/* =========================================================
   Удаление скобок только у примечания расписания
   ========================================================= */

function updateScheduleNote(source) {
  let found = 0;

  const oldText = normalizeText("(по местному времени)");
  const newText = normalizeText("по местному времени");

  const mjml = source.replace(
    /(<mj-text\b[^>]*\bcss-class=(["'])schedule-note\2[^>]*>)([\s\S]*?)(<\/mj-text>)/gi,
    (_, opening, quote, content, closing) => {
      found++;

      const actual = visibleText(content);

      if (actual !== oldText && actual !== newText) {
        throw new Error(
          "Примечание расписания содержит неожиданный текст. " +
          "Сборка остановлена для сохранения содержания."
        );
      }

      return (
        opening +
        "\n          по местному времени\n        " +
        closing
      );
    }
  );

  if (found !== 1) {
    throw new Error(
      "Ожидалось одно примечание schedule-note, " +
      `найдено: ${found}.`
    );
  }

  const expected = bodyText(source, true).replace(
    oldText,
    newText
  );

  verifyText(
    expected,
    bodyText(mjml, true),
    "Проверка правки примечания"
  );

  return { mjml, expected };
}

/* =========================================================
   Возвращаем исходное направление фона

   Используется сохранённый оригинал, а не очередное
   отражение текущего файла. Поэтому повторный запуск
   не меняет направление.
   ========================================================= */

async function prepareBackgrounds() {
  const originalPath = path.join(
    ASSETS,
    FILES.originalBackground
  );

  if (!(await exists(originalPath))) {
    throw new Error(
      "Не найден сохранённый исходный фон:\n" +
      `dist/assets/${FILES.originalBackground}\n\n` +
      "Этот файл создавался при первом отражении фона. " +
      "Восстановите его из прежней папки dist/assets."
    );
  }

  const refinedYearPath = path.join(
    ASSETS,
    FILES.refinedYear
  );

  if (!(await exists(refinedYearPath))) {
    throw new Error(
      "Не найден уточнённый контур года:\n" +
      `dist/assets/${FILES.refinedYear}\n\n` +
      "Сохраните изображения предыдущей сборки."
    );
  }

  // Это исходное, ещё не отражённое направление.
  const background = await fs.readFile(originalPath);

  const normalized = await sharp(background)
    .resize({ width: 1280 })
    .toBuffer({ resolveWithObject: true });

  if (normalized.info.height < 224) {
    throw new Error(
      "Высота фона недостаточна для создания шапки."
    );
  }

  const headerBase = await sharp(normalized.data)
    .extract({
      left: 0,
      top: 0,
      width: 1280,
      height: 224
    })
    .flatten({ background: PAPER })
    .png()
    .toBuffer();

  // Уточнённый контур сохраняется без изменения цвета.
  const year = await sharp(refinedYearPath)
    .resize({
      width: 720,
      height: 224,
      fit: "fill"
    })
    .png()
    .toBuffer();

  const header = await sharp(headerBase)
    .composite([
      {
        input: year,
        left: 560,
        top: 0
      }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Map([
    [FILES.background, background],
    [FILES.header, header]
  ]);
}

/* =========================================================
   Локальные изображения для предпросмотра
   ========================================================= */

async function localizeHTML(html, mjml, pending) {
  let result = html;
  const missing = [];

  for (const url of imageReferences(mjml)) {
    const name = decodeURIComponent(
      path.posix.basename(new URL(url).pathname)
    );

    if (
      name !== path.basename(name) ||
      name.includes("/") ||
      name.includes("\\")
    ) {
      throw new Error(
        "Некорректное имя локального изображения."
      );
    }

    let buffer = pending.get(name);

    if (!buffer) {
      const file = path.join(ASSETS, name);

      if (!(await exists(file))) {
        missing.push(`dist/assets/${name}`);
        continue;
      }

      buffer = await fs.readFile(file);
    }

    const mime = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp"
    }[path.extname(name).toLowerCase()];

    if (!mime) {
      throw new Error(
        `Неизвестный формат изображения: ${name}`
      );
    }

    const dataURL =
      `data:${mime};base64,${buffer.toString("base64")}`;

    result = result
      .split(esc(url)).join(dataURL)
      .split(url).join(dataURL);
  }

  if (missing.length) {
    throw new Error(
      "Не найдены изображения:\n" +
      [...new Set(missing)]
        .map(name => `— ${name}`)
        .join("\n")
    );
  }

  return result;
}

/* =========================================================
   Страница предпросмотра
   ========================================================= */

function previewPage(html) {
  const serialized = JSON.stringify(html)
    .replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Savencia — предпросмотр</title>
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
  max-width:640px;margin:16px auto 0;
  font-size:12px;line-height:1.5;text-align:center
}
</style>
</head>
<body>
<nav>
<button data-width="640" class="active">Компьютер · 640 px</button>
<button data-width="375">Телефон · 375 px</button>
<button data-width="320">Телефон · 320 px</button>
<button id="background-toggle">Скрыть праздничный фон</button>
</nav>

<div class="viewport">
<iframe id="email" title="Письмо Savencia"></iframe>
</div>

<p>
Фон возвращён в исходное направление.
Примечание расписания — без скобок.
Для рассылки используйте terminal.html.
</p>

<script>
const frame=document.getElementById("email");
const toggle=document.getElementById("background-toggle");
let backgroundHidden=false;

function fit(){
  const doc=frame.contentDocument;
  if(!doc || !doc.body)return;

  frame.style.height="1px";
  frame.style.height=(
    Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight
    )+8
  )+"px";
}

function updateBackground(){
  const doc=frame.contentDocument;
  if(!doc || !doc.head)return;

  let style=doc.getElementById("preview-background-fallback");

  if(backgroundHidden){
    if(!style){
      style=doc.createElement("style");
      style.id="preview-background-fallback";
      style.textContent=
        ".savencia-winter-pearl,"+
        ".savencia-winter-pearl *,"+
        ".savencia-pearl-header,"+
        ".savencia-pearl-header *"+
        "{background-image:none!important;}";
      doc.head.appendChild(style);
    }
  }else if(style){
    style.remove();
  }

  toggle.textContent=backgroundHidden
    ? "Показать праздничный фон"
    : "Скрыть праздничный фон";

  fit();
}

frame.addEventListener("load",()=>{
  updateBackground();

  for(const image of frame.contentDocument.images){
    image.addEventListener("load",fit);
  }

  fit();
  setTimeout(fit,250);
  setTimeout(fit,1000);
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

toggle.addEventListener("click",()=>{
  backgroundHidden=!backgroundHidden;
  updateBackground();
});

window.addEventListener("resize",()=>setTimeout(fit,100));
frame.srcdoc=${serialized};
</script>
</body>
</html>`;
}

/* =========================================================
   Резервная копия
   ========================================================= */

async function backupExistingOutputs() {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const directory = path.join(
    DIST,
    "backups",
    `${stamp}-restore-background`
  );

  await fs.mkdir(directory, { recursive: true });

  for (const file of Object.values(OUTPUT)) {
    if (await exists(file)) {
      await fs.copyFile(
        file,
        path.join(directory, path.basename(file))
      );
    }
  }

  if (
    path.resolve(SOURCE) !== path.resolve(OUTPUT.mjml)
  ) {
    await fs.copyFile(
      SOURCE,
      path.join(directory, "input-source.mjml")
    );
  }

  for (const name of [
    FILES.background,
    FILES.header
  ]) {
    const file = path.join(ASSETS, name);

    if (await exists(file)) {
      await fs.copyFile(
        file,
        path.join(directory, name)
      );
    }
  }

  return directory;
}

/* =========================================================
   Сборка
   ========================================================= */

async function main() {
  if (!(await exists(SOURCE))) {
    throw new Error(
      "Не найден текущий MJML:\n" +
      SOURCE +
      "\n\nСохраните dist/terminal.mjml " +
      "и папку dist/assets."
    );
  }

  const source = await fs.readFile(SOURCE, "utf8");
  const references = imageReferences(source);

  for (const name of [
    FILES.background,
    FILES.header
  ]) {
    if (
      !references.some(url =>
        path.posix.basename(new URL(url).pathname) === name
      )
    ) {
      throw new Error(
        `В текущем MJML не найден ${name}.\n` +
        "Нужна последняя сборка с фоном в шапке."
      );
    }
  }

  const { mjml, expected } = updateScheduleNote(source);
  const pending = await prepareBackgrounds();

  const compiled = await mjml2html(mjml, {
    validationLevel: "strict",
    beautify: false,
    minify: false
  });

  if (compiled.errors?.length) {
    throw new Error(
      "Ошибки MJML:\n" +
      compiled.errors
        .map(error =>
          error.formattedMessage || error.message
        )
        .join("\n")
    );
  }

  if (
    typeof compiled.html !== "string" ||
    !compiled.html.trim()
  ) {
    throw new Error("MJML не вернул HTML.");
  }

  verifyText(
    expected,
    bodyText(compiled.html),
    "Проверка HTML"
  );

  const html = compactHTML(compiled.html);

  verifyText(
    expected,
    bodyText(html),
    "Проверка после сокращения HTML"
  );

  const htmlBytes = Buffer.byteLength(html, "utf8");

  if (htmlBytes >= LIMIT) {
    throw new Error(
      `HTML занимает ${htmlBytes} байт.\n` +
      `Допустимо менее ${LIMIT} байт.\n` +
      "Отправочные файлы не перезаписаны."
    );
  }

  if (
    /data:image\//i.test(html) ||
    /<svg\b/i.test(html)
  ) {
    throw new Error(
      "В отправочном HTML обнаружен base64 " +
      "или встроенный SVG."
    );
  }

  const localHTML = await localizeHTML(
    html,
    mjml,
    pending
  );

  const preview = previewPage(localHTML);

  // Запись начинается только после успешных проверок.
  const backup = await backupExistingOutputs();

  const report = {
    generatedAt: new Date().toISOString(),
    htmlBytes,
    maxHTMLBytes: LIMIT,
    copyCheck: "passed",
    mjmlValidation: "passed",

    scheduleNote: {
      text: "по местному времени",
      parentheses: false
    },

    background: {
      orientation: "original, before horizontal mirroring",
      restoredFrom: FILES.originalBackground,
      output: FILES.background,
      header: FILES.header,
      repeatedRunsDoNotToggle: true
    },

    year: {
      source: FILES.refinedYear,
      refinedContourPreserved: true,
      mirrored: false
    },

    backup,

    notes: [
      "Удалены только скобки у примечания расписания.",
      "Остальной текст письма сохранён.",
      "Фон возвращён в исходное направление.",
      "То же направление применено в шапке.",
      "Уточнённый контур 2027 сохранён.",
      "Логотип, баннер, талон, табло и адреса не изменены.",
      "Повторный запуск не меняет направление фона.",
      "Base64 используется только в локальном предпросмотре.",
      "Размер HTML указан до обработки сервисом рассылки.",
      "Рендеринг в реальных почтовых клиентах не проверен."
    ]
  };

  for (const [name, buffer] of pending) {
    await fs.writeFile(
      path.join(ASSETS, name),
      buffer
    );
  }

  await fs.writeFile(OUTPUT.mjml, mjml, "utf8");
  await fs.writeFile(OUTPUT.html, html, "utf8");
  await fs.writeFile(OUTPUT.preview, preview, "utf8");

  await fs.writeFile(
    OUTPUT.report,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Готово.");
  console.log("Примечание: по местному времени — без скобок.");
  console.log("Фон возвращён в исходное направление.");
  console.log("Чёткий контур 2027 сохранён.");
  console.log(
    `HTML: ${htmlBytes.toLocaleString("ru-RU")} байт.`
  );
  console.log("Проверки текста и MJML: пройдены.");
  console.log("");
  console.log("Предпросмотр: dist/terminal-preview.html");
  console.log("Для отправки: dist/terminal.html");
  console.log(
    `Резервная копия: ${path.relative(ROOT, backup)}`
  );

  console.log("");
  console.log(
    "Если картинки уже опубликованы, обновите на хостинге:"
  );
  console.log(`— ${FILES.background}`);
  console.log(`— ${FILES.header}`);

  if (
    references.some(url =>
      new URL(url).hostname === "example.com"
    )
  ) {
    console.warn("");
    console.warn(
      "В письме остаются адреса example.com. " +
      "Перед рассылкой замените их реальными " +
      "публичными HTTPS-адресами изображений."
    );
  }
}

main().catch(error => {
  console.error("");
  console.error("Сборка остановлена:");
  console.error(error.message || error);
  process.exitCode = 1;
});
