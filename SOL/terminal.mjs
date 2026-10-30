import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");

const MAX_BYTES = 90_000;

const BASE = (
  process.env.ASSET_BASE ||
  "https://example.com/savencia-assets"
).replace(/\/+$/, "");

const C = {
  navy: "#004b62",
  blue: "#008fd0",
  cyan: "#1bbbe9",
  orange: "#de6a09",
  green: "#b1ca40",
  paper: "#f7f5ef",
  ink: "#173f4c",
  muted: "#52666d",
  line: "#c4d8df",
  tile: "#27292b",
  tileBorder: "#101214"
};

/* ==================== Текст письма ==================== */

const T = {
  subject: "10 декабря — Вылет в Новый ГОД!",
  date: "10 декабря",
  title: "— Вылет в Новый ГОД!",

  greeting: "Дорогие коллеги!",

  attention:
    "Внимание, объявляется посадка на особый новогодний рейс!",

  journey:
    "10 декабря мы отправляемся в праздничное путешествие, " +
    "которое объединит сотрудников Savencia из трёх городов — " +
    "Москвы, Уфы и Белебея.",

  slogan: [
    "ТРИ ГОРОДА.",
    "ОДИН РЕЙС.",
    "ОДНА КОМАНДА."
  ],

  airports:
    "В этот день наши праздничные площадки превратятся в аэропорты, " +
    "а каждый из вас станет пассажиром рейса с конечным пунктом " +
    "назначения — Новый год!",

  program:
    "В программе полёта: тёплые встречи с коллегами, яркие эмоции, " +
    "заслуженные награды, приятные сюрпризы, музыка и праздничное настроение.",

  ticket:
    "На регистрации каждый получит свой посадочный билет, " +
    "который пригодится во время новогоднего розыгрыша подарков.",

  schedule: "Расписание нашего рейса",

  passengers: "Уважаемые пассажиры!",

  mood:
    "Просим заранее подготовить хорошее настроение и быть готовыми " +
    "к незабываемому путешествию.",

  waiting:
    "Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!",

  meeting: "До встречи 10 декабря!",
  crew: "Ваш экипаж Savencia ✈️"
};

const STAGES = [
  {
    title: "Регистрация на рейс (Welcome)",
    description:
      "Встреча пассажиров, посадочные билеты, фотографии, " +
      "угощения и первые праздничные активности."
  },
  {
    title: "Взлёт. Торжественная часть",
    description:
      "Церемония награждения сотрудников и праздничная программа."
  },
  {
    title: "Полёт в Новый год",
    description:
      "Музыка, фуршет, развлечения, общение и новогодние сюрпризы."
  }
];

const GROUPS = [
  {
    heading: "МОСКВА и УФА",
    note: "(по местному времени)",
    accent: C.orange,

    times: [
      "17:00–18:00",
      "18:00–20:00",
      "20:00–23:00"
    ],

    addressTitle: "✈️ Аэропорты отправления:",

    addresses: [
      {
        label: "🎄 МОСКВА:",
        text:
          "проспект Андропова, 11, корпус 2, Южный Event-Port."
      },
      {
        label: "🎄 УФА:",
        text:
          "улица Менделеева, 205А, ресторан «Пастернак»."
      }
    ]
  },

  {
    heading: "БЕЛЕБЕЙ",
    note: "",
    accent: C.blue,

    times: [
      "15:00–15:30",
      "15:30–18:00",
      "18:00–20:00"
    ],

    addressTitle: "✈️ Аэропорт отправления:",

    addresses: [
      {
        label: "🎄 БЕЛЕБЕЙ:",
        text:
          "улица Амирова, 10А, Центральный дворец культуры " +
          "Белебеевского района."
      }
    ]
  }
];

/* ==================== Общие функции ==================== */

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decode(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/&nbsp;|&ensp;|&emsp;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&hellip;/gi, "…")
    .replace(/&laquo;/gi, "«")
    .replace(/&raquo;/gi, "»")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function plain(value) {
  return decode(
    String(value)
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\s\u00a0\u200b\uFEFF]/gu, "");
}

function visibleText(html) {
  const body = html.match(
    /<body\b[^>]*>([\s\S]*?)<\/body>/i
  )?.[1];

  if (!body) {
    throw new Error("В результате компиляции не найден body.");
  }

  return plain(body);
}

function text(value, attributes = "") {
  return `<mj-text ${attributes}>${esc(value)}</mj-text>`;
}

async function findLocal(candidates) {
  for (const file of candidates) {
    if (await exists(file)) {
      return file;
    }
  }

  return null;
}

/* ==================== Изображения ==================== */

async function prepareImages() {
  let logo = await findLocal([
    path.join(ASSETS, "terminal-logo.png"),
    path.join(ASSETS, "g-logo.png"),
    path.join(ASSETS, "h-logo.png"),
    path.join(ASSETS, "i-logo.png"),
    path.join(ASSETS, "f-logo.png"),
    path.join(ROOT, "logo.png"),
    path.join(ROOT, "logo.jpg"),
    path.join(ROOT, "logo.jpeg"),
    path.join(ROOT, "logo.webp")
  ]);

  const svg = await findLocal([
    path.join(ROOT, "logo.svg"),
    path.join(ASSETS, "g-logo.svg"),
    path.join(ASSETS, "h-logo.svg")
  ]);

  if (svg) {
    const { default: sharp } = await import("sharp");

    logo = path.join(ASSETS, "terminal-logo.png");

    await sharp(svg, { density: 240 })
      .resize({ width: 648 })
      .flatten({ background: "#ffffff" })
      .png({ compressionLevel: 9 })
      .toFile(logo);
  }

  if (logo && path.dirname(logo) !== ASSETS) {
    const destination = path.join(
      ASSETS,
      "terminal-logo" + path.extname(logo).toLowerCase()
    );

    await fs.copyFile(logo, destination);
    logo = destination;
  }

  let poster = await findLocal([
    path.join(ASSETS, "g-poster.png"),
    path.join(ROOT, "g-poster.png")
  ]);

  if (poster && path.dirname(poster) !== ASSETS) {
    const destination = path.join(ASSETS, "g-poster.png");
    await fs.copyFile(poster, destination);
    poster = destination;
  }

  const logoName = logo
    ? path.basename(logo)
    : "g-logo.png";

  return {
    logoURL: `${BASE}/${logoName}`,
    posterURL: `${BASE}/g-poster.png`,
    logoLocal: logo,
    posterLocal: poster
  };
}

/* ==================== Цветные полосы ==================== */

function colorBar(mirrored = false) {
  const segments = mirrored
    ? [
        [20, C.green],
        [30, C.cyan],
        [50, C.orange]
      ]
    : [
        [50, C.orange],
        [30, C.cyan],
        [20, C.green]
      ];

  const cells = segments.map(([width, color]) =>
    `<td width="${width}%" bgcolor="${color}" ` +
    'style="height:5px;padding:0;font-size:0;line-height:0">' +
    "&#160;</td>"
  ).join("");

  return `
    <mj-section padding="0" background-color="${C.navy}">
      <mj-column padding="0">
        <mj-table
          padding="0"
          cellpadding="0"
          cellspacing="0"
          width="100%"
          table-layout="fixed"
        >
          <tr>${cells}</tr>
        </mj-table>
      </mj-column>
    </mj-section>
  `;
}

/* ==================== Однострочное табло ==================== */

/*
 * Одна строка, 14 равных ячеек.
 *
 * Москва и Уфа:
 * [ ][М][О][С][К][В][А][ ][и][ ][У][Ф][А][ ]
 *
 * Белебей:
 * свободные позиции заполнены пустыми ячейками.
 *
 * Никаких градиентов, теней и декоративных эффектов.
 */

const BOARD_COLUMNS = 14;

function board(label) {
  const letters = Array.from(label);

  if (letters.length > BOARD_COLUMNS) {
    throw new Error(`Заголовок не помещается: ${label}`);
  }

  const free = BOARD_COLUMNS - letters.length;
  const left = Math.floor(free / 2);

  const cells = [
    ...Array(left).fill(" "),
    ...letters,
    ...Array(free - left).fill(" ")
  ];

  const width = (100 / BOARD_COLUMNS).toFixed(4);

  const markup = cells.map(character =>
    `<td
      class="airport-cell"
      width="${width}%"
      align="center"
      valign="middle"
      bgcolor="${C.tile}"
      style="
        width:${width}%;
        height:52px;
        padding:0;
        border:1px solid ${C.tileBorder};
        color:#ffffff;
        font-family:Arial,Helvetica,sans-serif;
        font-size:24px;
        font-weight:700;
        line-height:52px;
        text-align:center;
        vertical-align:middle;
        mso-line-height-rule:exactly;
      "
    >${character === " " ? "&#160;" : esc(character)}</td>`
  ).join("");

  return `
    <mj-table
      padding="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      table-layout="fixed"
    >
      <tr>${markup}</tr>
    </mj-table>
  `;
}

/* ==================== Сетка расписания ==================== */

/*
 * Одна HTML-таблица на три этапа.
 * Вертикальный разделитель непрерывный.
 * Горизонтальные линии — между этапами.
 */

function scheduleGrid(group) {
  const rows = STAGES.map((stage, index) => {
    const last = index === STAGES.length - 1;

    const bottom = last
      ? ""
      : `border-bottom:1px solid ${C.line};`;

    const titleColor =
      index === 1 ? C.orange : C.navy;

    return `
      <tr>
        <td
          class="schedule-time"
          width="38%"
          valign="top"
          style="
            width:38%;
            padding:24px 14px;
            border-right:1px solid ${C.line};
            ${bottom}
            text-align:center;
            color:${C.navy};
            font-family:Arial,Helvetica,sans-serif;
            font-size:23px;
            font-weight:700;
            line-height:1.25;
          "
        >${esc(group.times[index])}</td>

        <td
          class="schedule-copy"
          width="62%"
          valign="top"
          style="
            width:62%;
            padding:24px 18px;
            ${bottom}
            text-align:center;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <div style="
            margin:0 0 10px;
            color:${titleColor};
            font-size:18px;
            font-weight:700;
            line-height:1.35;
          ">${esc(stage.title)}</div>

          <div style="
            margin:0;
            color:${C.muted};
            font-size:16px;
            line-height:1.6;
          ">${esc(stage.description)}</div>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <mj-table
      padding="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      table-layout="fixed"
    >
      ${rows}
    </mj-table>
  `;
}

/* ==================== Блок города ==================== */

function groupBlock(group) {
  const addresses = group.addresses.map(item =>
    text(
      item.label,
      `font-size="13px"
       font-weight="700"
       color="${C.blue}"
       padding="8px 0 5px"`
    ) +
    text(
      item.text,
      'font-size="16px" line-height="1.6" padding="0 0 12px"'
    )
  ).join("");

  return `
    <mj-wrapper
      padding="0 30px 27px"
      background-color="${C.paper}"
    >
      <mj-section
        padding="14px 0 0"
        background-color="#ffffff"
        border-top="4px solid ${group.accent}"
      >
        <mj-column padding="0">
          ${board(group.heading)}

          ${
            group.note
              ? text(
                  group.note,
                  `font-size="13px"
                   line-height="19px"
                   color="${C.muted}"
                   padding="10px 12px 12px"`
                )
              : ""
          }
        </mj-column>
      </mj-section>

      <mj-section
        padding="8px 14px 0"
        background-color="#ffffff"
      >
        <mj-column padding="0">
          ${scheduleGrid(group)}
        </mj-column>
      </mj-section>

      <mj-section
        padding="0 22px 20px"
        background-color="#ffffff"
      >
        <mj-column padding="0">
          <mj-divider
            border-color="${C.line}"
            border-width="1px"
            padding="0 0 21px"
          />

          ${text(
            group.addressTitle,
            `font-size="16px"
             font-weight="700"
             color="${C.navy}"
             padding="0 0 8px"`
          )}

          ${addresses}
        </mj-column>
      </mj-section>
    </mj-wrapper>
  `;
}

/* ==================== Полный MJML ==================== */

function buildMJML(images) {
  return `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(T.subject)}</mj-title>
    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>

      <mj-text
        align="center"
        font-size="17px"
        line-height="1.65"
        color="${C.ink}"
        padding="0 0 17px"
      />

      <mj-image padding="0"/>
      <mj-column padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .hero-date div {
          font-size:47px !important;
          line-height:1.06 !important;
        }

        .hero-title div {
          font-size:29px !important;
          line-height:1.15 !important;
        }

        .statement div {
          font-size:28px !important;
          line-height:1.2 !important;
        }

        .schedule-title div {
          font-size:27px !important;
          line-height:1.2 !important;
        }

        .airport-cell {
          height:39px !important;
          font-size:18px !important;
          line-height:39px !important;
        }

        .schedule-time,
        .schedule-copy {
          display:block !important;
          width:100% !important;
          box-sizing:border-box !important;
          text-align:center !important;
        }

        .schedule-time {
          padding:21px 10px 9px !important;
          border-right:0 !important;
          border-bottom:0 !important;
          font-size:23px !important;
        }

        .schedule-copy {
          padding:0 10px 21px !important;
        }
      }

      @media only screen and (max-width:359px) {
        .hero-date div {
          font-size:39px !important;
        }

        .hero-title div {
          font-size:25px !important;
        }

        .statement div {
          font-size:24px !important;
        }

        .airport-cell {
          height:35px !important;
          font-size:15px !important;
          line-height:35px !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e1e8e8">

    <mj-section padding="25px 30px" background-color="#ffffff">
      <mj-column>
        <mj-image
          src="${esc(images.logoURL)}"
          alt="Groupe Savencia"
          width="216px"
          align="left"
        />
      </mj-column>
    </mj-section>

    ${colorBar(false)}

    <mj-section
      padding="28px 30px 0"
      background-color="${C.navy}"
    >
      <mj-column>
        ${text(
          T.date,
          `align="right"
           font-size="70px"
           line-height="1"
           font-weight="700"
           color="#ffffff"
           padding="0 0 14px"
           css-class="hero-date"`
        )}

        ${text(
          T.title,
          `font-size="40px"
           line-height="1.1"
           font-weight="700"
           color="#ffffff"
           padding="0"
           css-class="hero-title"`
        )}
      </mj-column>
    </mj-section>

    <mj-section padding="0" background-color="${C.navy}">
      <mj-column>
        <mj-image
          src="${esc(images.posterURL)}"
          alt=""
          width="640px"
        />
      </mj-column>
    </mj-section>

    ${colorBar(true)}

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        ${text(
          T.greeting,
          'font-size="23px" font-weight="700" padding="29px 0 17px"'
        )}

        ${text(T.attention)}

        ${text(T.journey, 'padding="0 0 27px"')}
      </mj-column>
    </mj-section>

    <mj-section
      padding="25px 30px 27px"
      background-color="${C.green}"
    >
      <mj-column>
        <mj-text
          align="left"
          font-size="37px"
          line-height="1.14"
          font-weight="700"
          color="${C.navy}"
          padding="0"
          css-class="statement"
        >
          <div style="text-align:left;color:${C.navy}">
            ${esc(T.slogan[0])}
          </div>
          <div style="text-align:center;color:${C.blue}">
            ${esc(T.slogan[1])}
          </div>
          <div style="text-align:right;color:${C.navy}">
            ${esc(T.slogan[2])}
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        ${text(T.airports, 'padding="28px 0 17px"')}
        ${text(T.program)}
      </mj-column>
    </mj-section>

    <mj-wrapper
      padding="0 30px 29px"
      background-color="${C.paper}"
    >
      <mj-section
        padding="18px 20px"
        background-color="#eaf6fa"
        border-left="4px solid ${C.blue}"
      >
        <mj-column>
          ${text(
            T.ticket,
            'font-size="17px" line-height="1.65" padding="0"'
          )}
        </mj-column>
      </mj-section>
    </mj-wrapper>

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        <mj-divider
          border-color="${C.orange}"
          border-width="4px"
          padding="0 0 24px"
        />

        ${text(
          T.schedule,
          `font-size="33px"
           line-height="1.2"
           font-weight="700"
           padding="0 0 25px"
           css-class="schedule-title"`
        )}
      </mj-column>
    </mj-section>

    ${GROUPS.map(groupBlock).join("")}

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        ${text(
          T.passengers,
          'font-size="22px" font-weight="700" padding="0 0 17px"'
        )}

        ${text(T.mood)}

        ${text(T.waiting, 'padding="0 0 29px"')}
      </mj-column>
    </mj-section>

    ${colorBar(false)}

    <mj-section
      padding="27px 30px 32px"
      background-color="${C.navy}"
    >
      <mj-column>
        ${text(
          T.meeting,
          `font-size="30px"
           line-height="1.2"
           font-weight="700"
           color="#ffffff"
           padding="0 0 15px"`
        )}

        ${text(
          T.crew,
          'font-size="17px" color="#ffffff" padding="0"'
        )}
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
`;
}

/* ==================== Эталон текста ==================== */

function expectedText() {
  const parts = [
    T.date,
    T.title,
    T.greeting,
    T.attention,
    T.journey,
    ...T.slogan,
    T.airports,
    T.program,
    T.ticket,
    T.schedule
  ];

  for (const group of GROUPS) {
    parts.push(group.heading);

    if (group.note) {
      parts.push(group.note);
    }

    STAGES.forEach((stage, index) => {
      parts.push(
        group.times[index],
        stage.title,
        stage.description
      );
    });

    parts.push(group.addressTitle);

    for (const address of group.addresses) {
      parts.push(address.label, address.text);
    }
  }

  parts.push(
    T.passengers,
    T.mood,
    T.waiting,
    T.meeting,
    T.crew
  );

  return normalized(parts.join(" "));
}

/* ==================== Уплотнение HTML ==================== */

function compactHTML(html) {
  const protectedParts = [];

  function protect(value) {
    return (
      "___EMAIL_PROTECTED_" +
      (protectedParts.push(value) - 1) +
      "___"
    );
  }

  html = html.replace(
    /<(script|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    protect
  );

  html = html.replace(
    /<!--[\s\S]*?-->/g,
    comment => {
      if (
        /^<!--\s*\[if\b/i.test(comment) ||
        /^<!--\s*<!?\[endif\]/i.test(comment)
      ) {
        return protect(comment);
      }

      return "";
    }
  );

  html = html.replace(
    /style="([^"]*)"/gi,
    (_, style) =>
      'style="' +
      style
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/\s*;\s*/g, ";")
        .trim() +
      '"'
  );

  html = html.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (_, attrs, css) => protect(
      `<style${attrs}>` +
      css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/\s*([{};])\s*/g, "$1")
        .trim() +
      "</style>"
    )
  );

  html = html.replace(
    /<[^>]*>|[^<]+/g,
    part =>
      part.startsWith("<")
        ? part
        : part.replace(/\s+/g, " ")
  );

  html = html.replace(
    /(<\/?(?:html|head|body|table|tbody|thead|tfoot|tr|td|th|div)\b[^>]*>)\s+(?=<\/?(?:html|head|body|table|tbody|thead|tfoot|tr|td|th|div)\b)/gi,
    "$1"
  );

  return html.replace(
    /___EMAIL_PROTECTED_(\d+)___/g,
    (_, index) => protectedParts[Number(index)]
  ).trim();
}

/* ==================== Локальное превью ==================== */

async function makeLocalHTML(html, images) {
  const missing = [];

  for (const [url, file] of [
    [images.logoURL, images.logoLocal],
    [images.posterURL, images.posterLocal]
  ]) {
    if (!file || !(await exists(file))) {
      missing.push(url);
      continue;
    }

    const mime = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".gif": "image/gif"
    }[path.extname(file).toLowerCase()];

    if (!mime) {
      missing.push(url);
      continue;
    }

    const buffer = await fs.readFile(file);
    const data = `data:${mime};base64,${buffer.toString("base64")}`;

    html = html.split(esc(url)).join(data);
    html = html.split(url).join(data);
  }

  return { html, missing };
}

function makePreview(html) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Предпросмотр письма</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;background:#dfe8e9;color:#173f4c;
  font:14px Arial,Helvetica,sans-serif
}
header{
  display:flex;flex-wrap:wrap;justify-content:center;
  gap:8px;padding:16px
}
button{
  padding:10px 14px;border:1px solid #aebfc3;
  border-radius:6px;background:#fff;color:#173f4c;
  cursor:pointer;font:inherit
}
button.active{
  background:#004b62;color:#fff;border-color:#004b62
}
main{overflow-x:auto;padding:0 12px 32px}
iframe{
  display:block;width:640px;height:1800px;
  margin:0 auto;border:0;background:transparent
}
</style>
</head>
<body>
<header>
<button data-width="640" class="active">Компьютер · 640 px</button>
<button data-width="375">Телефон · 375 px</button>
<button data-width="320">Телефон · 320 px</button>
</header>
<main><iframe id="preview" title="Письмо"></iframe></main>
<textarea id="email-source" hidden>${esc(html)}</textarea>
<script>
const frame=document.getElementById("preview");
let observer;

function fit(){
  const doc=frame.contentDocument;
  if(!doc||!doc.body)return;
  frame.style.height=
    Math.ceil(doc.body.getBoundingClientRect().height+8)+"px";
}

frame.addEventListener("load",()=>{
  const doc=frame.contentDocument;
  if(!doc||!doc.body)return;

  doc.querySelectorAll("img").forEach(img=>{
    img.addEventListener("load",fit);
  });

  if(observer)observer.disconnect();

  if(window.ResizeObserver){
    observer=new ResizeObserver(fit);
    observer.observe(doc.body);
  }

  fit();
  setTimeout(fit,300);
});

frame.srcdoc=document.getElementById("email-source").value;

document.querySelectorAll("[data-width]").forEach(button=>{
  button.addEventListener("click",()=>{
    frame.style.width=button.dataset.width+"px";

    document.querySelectorAll("[data-width]").forEach(item=>{
      item.classList.toggle("active",item===button);
    });

    setTimeout(fit,100);
  });
});
</script>
</body>
</html>`;
}

/* ==================== Сборка ==================== */

async function main() {
  await fs.mkdir(ASSETS, { recursive: true });

  const images = await prepareImages();
  const mjml = buildMJML(images);

  const result = await mjml2html(mjml, {
    validationLevel: "strict"
  });

  if (result.errors?.length) {
    throw new Error(
      "Ошибки MJML:\n" +
      result.errors
        .map(error =>
          error.formattedMessage || error.message
        )
        .join("\n")
    );
  }

  if (!result.html) {
    throw new Error("MJML не вернул HTML.");
  }

  const expected = expectedText();

  if (normalized(visibleText(result.html)) !== expected) {
    throw new Error(
      "Проверка текста после компиляции не пройдена.\n" +
      "Готовые HTML-файлы не перезаписаны."
    );
  }

  const beforeBytes = Buffer.byteLength(result.html, "utf8");
  const html = compactHTML(result.html);
  const bytes = Buffer.byteLength(html, "utf8");

  if (normalized(visibleText(html)) !== expected) {
    throw new Error(
      "Проверка текста после уплотнения не пройдена.\n" +
      "Готовые HTML-файлы не перезаписаны."
    );
  }

  if (bytes >= MAX_BYTES) {
    throw new Error(
      `До уплотнения: ${beforeBytes} байт.\n` +
      `После уплотнения: ${bytes} байт.\n` +
      `Внутренний предел: ${MAX_BYTES} байт.\n` +
      "Готовые HTML-файлы не перезаписаны."
    );
  }

  const local = await makeLocalHTML(html, images);

  const report = {
    htmlBytesBeforeCompaction: beforeBytes,
    htmlBytes: bytes,
    htmlLimitBytes: MAX_BYTES,

    copyCheck: "passed against embedded approved copy",
    mjmlValidation: "passed",

    board: {
      rows: 1,
      columns: BOARD_COLUMNS,
      font: "Arial",
      shadows: false,
      gradients: false,
      liveText: true
    },

    schedule: {
      desktop: "two-column grid",
      mobile: "stacked rows"
    },

    approvedCopyChanges: [
      "Removed plane emoji from city headings",
      "Removed separator dash after time ranges",
      "Added plane emoji to airport address headings",
      "Added Christmas tree emoji to city address labels",
      "Added city address label for Belebey"
    ],

    assetBase: BASE,
    missingLocalPreviewImages: local.missing,
    emailClientRenderingTest: "not performed"
  };

  await Promise.all([
    fs.writeFile(
      path.join(DIST, "terminal.mjml"),
      mjml,
      "utf8"
    ),
    fs.writeFile(
      path.join(DIST, "terminal.html"),
      html,
      "utf8"
    ),
    fs.writeFile(
      path.join(DIST, "terminal-preview.html"),
      makePreview(local.html),
      "utf8"
    ),
    fs.writeFile(
      path.join(DIST, "terminal-report.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    )
  ]);

  console.log("");
  console.log("Готово.");
  console.log("Табло: одна строка, Arial, без эффектов.");
  console.log("Расписание: сетка с разделителями.");
  console.log("Текст: проверка пройдена.");
  console.log("MJML: строгая валидация пройдена.");
  console.log("");
  console.log("До уплотнения:", beforeBytes, "байт");
  console.log("Итоговый HTML:", bytes, "байт");
  console.log("");
  console.log("Откройте dist/terminal-preview.html");
  console.log("Если превью открыто, нажмите Ctrl+F5.");
  console.log("");
  console.log("Для рассылки: dist/terminal.html");

  if (local.missing.length) {
    console.log("");
    console.log("Локально не найдены изображения:");
    local.missing.forEach(url => console.log(url));
  }

  if (BASE.includes("example.com")) {
    console.log("");
    console.log(
      "Перед рассылкой задайте ASSET_BASE: " +
      "публичный HTTPS-адрес папки с изображениями."
    );
  }

  console.log("");
  console.log(
    "Перед отправкой проверьте письмо тестовой рассылкой."
  );
}

main().catch(error => {
  console.error("\nОшибка:\n" + error.message);
  process.exitCode = 1;
});
