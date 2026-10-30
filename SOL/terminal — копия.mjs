import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mjml2html from "mjml";
import sharp from "sharp";

/* =========================================================
   SAVENCIA — новогоднее письмо

   Изменения:
   — посадочный талон по новому референсу;
   — текст талона из нового референса;
   — штрихкод сверху, самолёт снизу;
   — ПК: по 2 пустые ячейки табло с каждой стороны;
   — телефон: по 1 пустой ячейке;
   — Arial Bold 22px, высота ячеек 46px.

   Запуск:
   node terminal.mjs

   Сохранить главный баннер и папку dist/assets.
   ========================================================= */

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");

const LIMIT = 90_000;
const FONT = "Arial,Helvetica,sans-serif";

const BOARD = {
  desktopPadding: 2,
  mobilePadding: 1,
  height: 46,
  fontSize: 22
};

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
  sky: "#eaf6fa",
  ink: "#173f4c",
  muted: "#52666d",
  grid: "#94b3bd",
  addressLine: "#ffffff",
  tileTop: "#27292b",
  tileBottom: "#303234",
  tileBorder: "#101214",
  seam: "#080a0b",
  ticketBackground: "#ffffff",
  ticketTitle: "#172b35",
  ticketMuted: "#65727a"
};

const FILES = {
  logo: "terminal-logo.png",
  year: "terminal-year.png",
  hero: "terminal-hero.jpg",
  slogan: "terminal-slogan-flight.png",
  ticket: "terminal-ticket-art.png",
  arrow: "terminal-address-arrow.png",
  navigation: "terminal-airport-navigation.png"
};

const HERO_SOURCE_COPY = "terminal-hero-source.jpg";

const COPY = {
  subject: "10 декабря — Вылет в Новый ГОД!",
  date: "10 декабря",
  heroTitle: "— Вылет в Новый ГОД!",
  greeting: "Дорогие коллеги!",
  attention:
    "Внимание, объявляется посадка на особый новогодний рейс!",
  journey:
    "10 декабря мы отправляемся в праздничное путешествие, которое объединит сотрудников Savencia из трёх городов — Москвы, Уфы и Белебея.",
  slogan: [
    "ТРИ ГОРОДА.",
    "ОДИН РЕЙС.",
    "ОДНА КОМАНДА."
  ],
  airports:
    "В этот день наши праздничные площадки превратятся в аэропорты, а каждый из вас станет пассажиром рейса с конечным пунктом назначения — Новый год!",
  program:
    "В программе полёта: тёплые встречи с коллегами, яркие эмоции, заслуженные награды, приятные сюрпризы, музыка и праздничное настроение.",

  ticketEyebrow: "★ НОВОГОДНИЙ РОЗЫГРЫШ ПРИЗОВ",
  ticketTitle:
    "Ваш посадочный талон — ключ к подаркам!",
  ticketDescription:
    "На регистрации каждый сотрудник получит свой персональный билет. Обязательно сохраните его до конца полёта!",

  schedule: "Расписание нашего рейса",
  passengers: "Уважаемые пассажиры!",
  mood:
    "Просим заранее подготовить хорошее настроение и быть готовыми к незабываемому путешествию.",
  waiting:
    "Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!",
  meeting: "До встречи 10 декабря!",
  crew: "Ваш экипаж Savencia ✈️"
};

const STAGES = [
  {
    title: "Регистрация на рейс (Welcome)",
    description:
      "Встреча пассажиров, посадочные билеты, фотографии, угощения и первые праздничные активности.",
    color: C.navy
  },
  {
    title: "Взлёт. Торжественная часть",
    description:
      "Церемония награждения сотрудников и праздничная программа.",
    color: C.orange
  },
  {
    title: "Полёт в Новый год",
    description:
      "Музыка, фуршет, развлечения, общение и новогодние сюрпризы.",
    color: C.navy
  }
];

const GROUPS = [
  {
    label: "МОСКВА И УФА",
    note: "(по местному времени)",
    accent: C.orange,
    times: [
      ["17:00", "18:00"],
      ["18:00", "20:00"],
      ["20:00", "23:00"]
    ],
    addressHeading: "Аэропорты отправления:",
    addresses: [
      {
        city: "МОСКВА:",
        address:
          "проспект Андропова, 11, корпус 2, Южный Event-Port."
      },
      {
        city: "УФА:",
        address:
          "улица Менделеева, 205А, ресторан «Пастернак»."
      }
    ]
  },
  {
    label: "БЕЛЕБЕЙ",
    note: "",
    accent: C.blue,
    times: [
      ["15:00", "15:30"],
      ["15:30", "18:00"],
      ["18:00", "20:00"]
    ],
    addressHeading: "Аэропорт отправления:",
    addresses: [
      {
        city: "БЕЛЕБЕЙ:",
        address:
          "улица Амирова, 10А, Центральный дворец культуры Белебеевского района."
      }
    ]
  }
];

const SCHEDULE_NOTE = [...new Set(
  GROUPS.map(group => group.note).filter(Boolean)
)].join(" ");

/* =========================================================
   Общие функции
   ========================================================= */

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

function assetURL(name) {
  return `${BASE}/${name}`;
}

function src(name) {
  return esc(assetURL(name));
}

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return String(value)
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

  const text = match[1]
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "");

  return normalizeText(decode(text));
}

function expectedText() {
  const parts = [
    COPY.date,
    COPY.heroTitle,
    COPY.greeting,
    COPY.attention,
    COPY.journey,
    ...COPY.slogan,
    COPY.airports,
    COPY.program,
    COPY.ticketEyebrow,
    COPY.ticketTitle,
    COPY.ticketDescription,
    COPY.schedule,
    SCHEDULE_NOTE
  ];

  for (const group of GROUPS) {
    parts.push(group.label);

    STAGES.forEach((stage, index) => {
      parts.push(
        ...group.times[index],
        stage.title,
        stage.description
      );
    });

    parts.push(group.addressHeading);

    for (const address of group.addresses) {
      parts.push(address.city, address.address);
    }
  }

  parts.push(
    COPY.passengers,
    COPY.mood,
    COPY.waiting,
    COPY.meeting,
    COPY.crew
  );

  return normalizeText(parts.join(""));
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
    `${stage}: текст не прошёл проверку.\n` +
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

/* =========================================================
   Компоненты
   ========================================================= */

function table(content, padding = "0", options = {}) {
  return `
    <mj-table
      ${options.cssClass
        ? `css-class="${esc(options.cssClass)}"`
        : ""}
      padding="${padding}"
      border="${options.border || "none"}"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      table-layout="fixed">
      ${content}
    </mj-table>
  `;
}

function colorStrip(mirrored = false) {
  const segments = mirrored
    ? [[30, C.cyan], [40, C.orange], [30, C.green]]
    : [[30, C.green], [40, C.orange], [30, C.cyan]];

  return `
    <mj-section padding="0" background-color="${C.navy}">
      <mj-column>
        ${table(`
          <tr>
            ${segments.map(([width, color]) => `
              <td
                width="${width}%"
                height="5"
                bgcolor="${color}"
                style="height:5px;padding:0;
                  font-size:0;line-height:0;">
                &#160;
              </td>
            `).join("")}
          </tr>
        `)}
      </mj-column>
    </mj-section>
  `;
}

/* =========================================================
   Посадочный талон по референсу
   ========================================================= */

function boardingPass() {
  return `
    <mj-wrapper
      padding="0 30px 29px"
      background-color="${C.paper}">

      <mj-section
        padding="0"
        background-color="${C.ticketBackground}">
        <mj-column>

          ${table(`
            <tr>
              <td
                class="ticket-shell"
                bgcolor="${C.ticketBackground}"
                style="padding:8px;
                  background-color:${C.ticketBackground};">

                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="width:100%;
                    table-layout:fixed;
                    border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td
                        class="ticket-copy"
                        width="73%"
                        align="left"
                        valign="middle"
                        bgcolor="${C.ticketBackground}"
                        style="width:73%;
                          padding:15px 22px 15px 16px;
                          background-color:${C.ticketBackground};
                          font-family:${FONT};
                          text-align:left;
                          vertical-align:middle;">

                        <div
                          class="ticket-eyebrow"
                          style="margin:0 0 10px;
                            color:${C.orange};
                            font-family:${FONT};
                            font-size:11px;
                            line-height:1.55;
                            font-weight:700;
                            letter-spacing:1.5px;
                            text-align:left;">
                          ${esc(COPY.ticketEyebrow)}
                        </div>

                        <div
                          class="ticket-title"
                          style="margin:0 0 7px;
                            color:${C.ticketTitle};
                            font-family:${FONT};
                            font-size:19px;
                            line-height:1.4;
                            font-weight:700;
                            text-align:left;">
                          ${esc(COPY.ticketTitle)}
                        </div>

                        <div
                          class="ticket-description"
                          style="margin:0;
                            color:${C.ticketMuted};
                            font-family:${FONT};
                            font-size:16px;
                            line-height:1.5;
                            font-weight:400;
                            text-align:left;">
                          ${esc(COPY.ticketDescription)}
                        </div>
                      </td>

                      <td
                        class="ticket-stub"
                        width="27%"
                        align="center"
                        valign="middle"
                        bgcolor="${C.orange}"
                        style="width:27%;
                          padding:20px 12px;
                          border-left:2px dashed ${C.ticketBackground};
                          background-color:${C.orange};
                          text-align:center;
                          vertical-align:middle;">

                        <img
                          class="ticket-art"
                          src="${src(FILES.ticket)}"
                          width="84"
                          height="116"
                          alt=""
                          role="presentation"
                          style="display:block;
                            width:84px;
                            max-width:100%;
                            height:auto;
                            margin:0 auto;
                            border:0;"/>
                      </td>
                    </tr>
                  </tbody>
                </table>

              </td>
            </tr>
          `, "0", {
            border: `2px dashed ${C.orange}`,
            cssClass: "boarding-pass"
          })}

        </mj-column>
      </mj-section>
    </mj-wrapper>
  `;
}

/* =========================================================
   Табло: ПК — 2 ячейки, телефон — 1
   ========================================================= */

function board(label) {
  const side = Array.from(
    { length: BOARD.desktopPadding },
    (_, index) => ({
      character: " ",
      mobileHidden:
        index < BOARD.desktopPadding - BOARD.mobilePadding
    })
  );

  const cells = [
    ...side,
    ...Array.from(label).map(character => ({
      character,
      mobileHidden: false
    })),
    ...[...side].reverse()
  ];

  const gradient =
    `linear-gradient(to bottom,` +
    `${C.tileTop} 0%,${C.tileTop} 49%,` +
    `${C.seam} 49%,${C.seam} 51%,` +
    `${C.tileBottom} 51%,${C.tileBottom} 100%)`;

  return table(`
    <tr>
      ${cells.map(cell => `
        <td
          class="airport-cell${cell.mobileHidden ? " board-extra" : ""}"
          height="${BOARD.height}"
          align="center"
          valign="middle"
          bgcolor="${C.tileTop}"
          style="height:${BOARD.height}px;
            padding:0;
            border:1px solid ${C.tileBorder};
            background-image:${gradient};
            color:#ffffff;
            font-family:${FONT};
            font-size:${BOARD.fontSize}px;
            line-height:${BOARD.height}px;
            font-weight:700;
            white-space:nowrap;
            text-align:center;
            vertical-align:middle;
            mso-line-height-rule:exactly;">
          ${cell.character === " " ? "&#160;" : esc(cell.character)}
        </td>
      `).join("")}
    </tr>
  `, "0", {
    cssClass: "flight-board"
  });
}

/* =========================================================
   Расписание
   ========================================================= */

function schedule(group) {
  return table(
    STAGES.map((stage, index) => {
      const [start, end] = group.times[index];

      return `
        <tr>
          <td
            class="schedule-time"
            width="28%"
            align="center"
            valign="middle"
            bgcolor="${C.paper}"
            style="width:28%;
              padding:6px 20px 6px 0;
              border:0;
              border-right:2px solid ${C.navy};
              background-color:${C.paper};
              color:${C.navy};
              font-family:${FONT};
              text-align:center;
              vertical-align:middle;">

            <div
              class="time-value"
              style="margin:0;
                font-size:36px;
                line-height:1.16;
                font-weight:700;
                white-space:nowrap;
                text-align:center;">
              ${esc(start)}<br/>${esc(end)}
            </div>
          </td>

          <td
            class="schedule-copy"
            width="72%"
            align="left"
            valign="middle"
            bgcolor="${C.paper}"
            style="width:72%;
              padding:6px 0 6px 28px;
              border:0;
              background-color:${C.paper};
              font-family:${FONT};
              text-align:left;
              vertical-align:middle;">

            <div
              class="stage-title"
              style="margin:0 0 11px;
                color:${stage.color};
                font-size:21px;
                line-height:1.2;
                font-weight:700;
                letter-spacing:-.35px;
                text-align:left;">
              ${esc(stage.title)}
            </div>

            <div
              class="stage-description"
              style="margin:0;
                color:${C.muted};
                font-size:16px;
                line-height:1.6;
                text-align:left;">
              ${esc(stage.description)}
            </div>
          </td>
        </tr>

        ${index < STAGES.length - 1 ? `
          <tr>
            <td
              colspan="2"
              height="26"
              bgcolor="${C.paper}"
              style="height:26px;
                padding:0;
                border:0;
                background-color:${C.paper};
                font-size:0;
                line-height:0;">
              &#160;
            </td>
          </tr>
        ` : ""}
      `;
    }).join(""),
    "0",
    { cssClass: "schedule-layout" }
  );
}

/* =========================================================
   Аэропорты
   ========================================================= */

function addressPanel(address, index, count) {
  const width = count === 1 ? "100%" : "50%";

  return `
    <td
      class="address-panel${index > 0 ? " address-second" : ""}"
      width="${width}"
      align="left"
      valign="top"
      bgcolor="${C.navy}"
      style="width:${width};
        padding:22px 20px 27px;
        ${index > 0
          ? `border-left:2px solid ${C.addressLine};`
          : ""}
        background-color:${C.navy};
        font-family:${FONT};
        text-align:left;
        vertical-align:top;">

      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr>
            <td
              align="left"
              valign="top"
              style="padding:0 8px 12px 0;
                text-align:left;
                vertical-align:top;">
              <div
                style="margin:0;
                  color:${C.cyan};
                  font-family:${FONT};
                  font-size:14px;
                  line-height:1.35;
                  font-weight:700;
                  letter-spacing:.4px;
                  text-align:left;">
                ${esc(address.city)}
              </div>
            </td>

            <td
              width="25"
              align="right"
              valign="top"
              style="width:25px;
                padding:0 0 12px;
                text-align:right;
                vertical-align:top;">
              <img
                src="${src(FILES.arrow)}"
                width="24"
                height="24"
                alt=""
                role="presentation"
                style="display:block;
                  width:24px;
                  height:24px;
                  border:0;"/>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        class="address-main"
        style="margin:0;
          color:#ffffff;
          font-family:${FONT};
          font-size:21px;
          line-height:1.4;
          font-weight:400;
          text-align:left;">
        ${esc(address.address)}
      </div>
    </td>
  `;
}

function addresses(group) {
  return table(`
    <tr>
      <td
        align="center"
        bgcolor="#ffffff"
        style="padding:24px 8px 23px;
          border-bottom:2px solid ${C.navy};
          background-color:#ffffff;
          font-family:${FONT};
          text-align:center;">

        <div
          class="address-heading"
          style="margin:0;
            color:${C.navy};
            font-family:${FONT};
            font-size:26px;
            line-height:1.15;
            font-weight:700;
            letter-spacing:-.65px;
            white-space:nowrap;
            text-align:center;">
          ${esc(group.addressHeading)}
        </div>
      </td>
    </tr>

    <tr>
      <td
        class="address-holder"
        bgcolor="${C.navy}"
        style="padding:0;background-color:${C.navy};">

        <table
          class="address-columns"
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          bgcolor="${C.navy}"
          style="width:100%;
            table-layout:fixed;
            border-collapse:collapse;
            background-color:${C.navy};">
          <tbody class="address-columns-body">
            <tr class="address-columns-row">
              ${group.addresses.map((address, index) =>
                addressPanel(address, index, group.addresses.length)
              ).join("")}
            </tr>
          </tbody>
        </table>

      </td>
    </tr>

    <tr>
      <td
        bgcolor="#ffffff"
        style="padding:0;
          border-top:2px solid ${C.navy};
          background-color:#ffffff;
          font-size:0;
          line-height:0;">
        <img
          src="${src(FILES.navigation)}"
          width="576"
          alt=""
          role="presentation"
          style="display:block;
            width:100%;
            max-width:576px;
            height:auto;
            border:0;"/>
      </td>
    </tr>
  `, "0", {
    border: `2px solid ${C.navy}`,
    cssClass: "airport-addresses"
  });
}

function flightGroup(group) {
  return `
    <mj-section
      css-class="flight-board-full"
      padding="0"
      background-color="${C.paper}"
      border-top="4px solid ${group.accent}">
      <mj-column>
        ${board(group.label)}
      </mj-column>
    </mj-section>

    <mj-wrapper
      css-class="flight-content"
      padding="0 30px 27px"
      background-color="${C.paper}">

      <mj-section padding="0" background-color="${C.paper}">
        <mj-column>
          <mj-spacer height="28px" padding="0"/>
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="${C.paper}">
        <mj-column>
          ${schedule(group)}
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="${C.paper}">
        <mj-column>
          <mj-spacer height="32px" padding="0"/>
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="#ffffff">
        <mj-column>
          ${addresses(group)}
        </mj-column>
      </mj-section>

    </mj-wrapper>
  `;
}

/* =========================================================
   Полный MJML
   ========================================================= */

function createMJML(hero) {
  const backgroundHeight = Math.round(
    640 * hero.height / hero.width
  );

  return `
<mjml lang="ru">
  <mj-head>
    <mj-title>${esc(COPY.subject)}</mj-title>
    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text
        align="center"
        font-size="17px"
        line-height="1.65"
        color="${C.ink}"
        padding="0 0 17px"/>
      <mj-image padding="0"/>
      <mj-column padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .hero-date div {
          font-size:38px !important;
          line-height:1.05 !important;
          letter-spacing:-1px !important;
        }
        .hero-title div {
          font-size:22px !important;
          line-height:1.12 !important;
          letter-spacing:-.35px !important;
        }
        .hero-date {
          padding:0 16px 5px !important;
        }
        .hero-title {
          padding:0 16px 15px !important;
        }
        .slogan-line {
          font-size:28px !important;
          line-height:1.18 !important;
          letter-spacing:-.6px !important;
        }
        .schedule-title div {
          font-size:27px !important;
          line-height:1.2 !important;
        }

        .airport-cell {
          height:${BOARD.height}px !important;
          font-size:${BOARD.fontSize}px !important;
          line-height:${BOARD.height}px !important;
          padding:0 !important;
        }
        .board-extra {
          display:none !important;
          width:0 !important;
          min-width:0 !important;
          max-width:0 !important;
          padding:0 !important;
          border:0 !important;
          font-size:0 !important;
          line-height:0 !important;
        }

        .schedule-time {
          width:28% !important;
          padding:6px 11px 6px 0 !important;
          border:0 !important;
          border-right:2px solid ${C.navy} !important;
          background-color:${C.paper} !important;
          text-align:center !important;
          vertical-align:middle !important;
        }
        .time-value {
          font-size:29px !important;
          line-height:1.18 !important;
          text-align:center !important;
        }
        .schedule-copy {
          width:72% !important;
          padding:6px 0 6px 16px !important;
          border:0 !important;
          background-color:${C.paper} !important;
          text-align:left !important;
          vertical-align:middle !important;
        }
        .stage-title {
          font-size:17px !important;
          line-height:1.25 !important;
          letter-spacing:0 !important;
          margin-bottom:9px !important;
          text-align:left !important;
        }
        .stage-description {
          font-size:14px !important;
          line-height:1.5 !important;
          text-align:left !important;
        }

        .address-heading {
          font-size:21px !important;
          line-height:1.15 !important;
          letter-spacing:-.65px !important;
          white-space:nowrap !important;
        }
        .address-columns {
          display:block !important;
          width:100% !important;
          max-width:100% !important;
          table-layout:auto !important;
        }
        .address-columns-body,
        .address-columns-row {
          display:block !important;
          width:100% !important;
        }
        .address-panel {
          display:block !important;
          float:none !important;
          width:100% !important;
          max-width:100% !important;
          box-sizing:border-box !important;
          padding:22px 18px 25px !important;
          border-left:0 !important;
          background-color:${C.navy} !important;
        }
        .address-second {
          border-top:2px solid ${C.addressLine} !important;
        }
        .address-main {
          font-size:20px !important;
          line-height:1.4 !important;
        }

        .ticket-shell {
          padding:6px !important;
        }
        .ticket-copy {
          padding:15px 12px 15px 8px !important;
          text-align:left !important;
        }
        .ticket-eyebrow {
          font-size:10px !important;
          line-height:1.5 !important;
          letter-spacing:.8px !important;
          margin-bottom:9px !important;
        }
        .ticket-title {
          font-size:17px !important;
          line-height:1.35 !important;
          margin-bottom:8px !important;
        }
        .ticket-description {
          font-size:15px !important;
          line-height:1.5 !important;
        }
        .ticket-stub {
          padding:18px 8px !important;
        }
        .ticket-art {
          width:64px !important;
          max-width:100% !important;
          height:auto !important;
        }
      }

      @media only screen and (max-width:359px) {
        .hero-date div {
          font-size:33px !important;
          letter-spacing:-.8px !important;
        }
        .hero-title div {
          font-size:19px !important;
          letter-spacing:-.3px !important;
        }
        .hero-date {
          padding:0 13px 4px !important;
        }
        .hero-title {
          padding:0 13px 12px !important;
        }
        .slogan-line {
          font-size:24px !important;
        }
        .time-value {
          font-size:25px !important;
        }
        .schedule-time {
          padding-right:8px !important;
        }
        .schedule-copy {
          padding-left:12px !important;
        }
        .stage-title {
          font-size:16px !important;
        }
        .stage-description {
          font-size:13px !important;
        }
        .address-heading {
          font-size:18px !important;
          letter-spacing:-.55px !important;
        }

        .ticket-copy {
          padding:14px 9px 14px 6px !important;
        }
        .ticket-eyebrow {
          letter-spacing:.5px !important;
        }
        .ticket-title {
          font-size:16px !important;
        }
        .ticket-description {
          font-size:14px !important;
        }
        .ticket-stub {
          padding:16px 6px !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e1e8e8">

    <mj-section
      padding="0"
      background-color="#ffffff"
      background-url="${src(FILES.year)}"
      background-repeat="no-repeat"
      background-size="360px 112px"
      background-position="right center">
      <mj-column>
        ${table(`
          <tr>
            <td
              height="112"
              align="left"
              valign="middle"
              style="height:112px;
                padding:0 0 0 30px;
                text-align:left;
                vertical-align:middle;
                font-size:0;
                line-height:0;">
              <img
                src="${src(FILES.logo)}"
                width="216"
                alt="Groupe Savencia"
                style="display:block;
                  width:216px;
                  max-width:75%;
                  height:auto;
                  border:0;"/>
            </td>
          </tr>
        `)}
      </mj-column>
    </mj-section>

    ${colorStrip()}

    <mj-hero
      mode="fluid-height"
      background-width="640px"
      background-height="${backgroundHeight}px"
      background-url="${src(FILES.hero)}"
      background-color="${C.navy}"
      background-position="center center"
      vertical-align="bottom"
      padding="0"
      inner-padding="0">

      <mj-text
        css-class="hero-date"
        align="right"
        color="#ffffff"
        font-size="62px"
        line-height="1.04"
        font-weight="700"
        letter-spacing="-1.8px"
        padding="0 26px 7px">
        ${esc(COPY.date)}
      </mj-text>

      <mj-text
        css-class="hero-title"
        align="right"
        color="#ffffff"
        font-size="32px"
        line-height="1.12"
        font-weight="700"
        letter-spacing="-.5px"
        padding="0 26px 23px">
        ${esc(COPY.heroTitle)}
      </mj-text>
    </mj-hero>

    ${colorStrip(true)}

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        <mj-text
          font-size="23px"
          font-weight="700"
          padding="29px 0 17px">
          ${esc(COPY.greeting)}
        </mj-text>
        <mj-text>${esc(COPY.attention)}</mj-text>
        <mj-text padding="0 0 27px">
          ${esc(COPY.journey)}
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section
      padding="25px 24px 27px"
      background-color="${C.green}"
      background-url="${src(FILES.slogan)}"
      background-repeat="no-repeat"
      background-size="cover"
      background-position="center center">
      <mj-column>
        <mj-text
          padding="0"
          font-size="37px"
          line-height="1.16"
          font-weight="700">

          <div
            class="slogan-line"
            style="color:${C.navy};
              text-align:left;
              letter-spacing:-.8px;">
            ${esc(COPY.slogan[0])}
          </div>

          <div
            class="slogan-line"
            style="margin-top:6px;
              color:${C.blue};
              text-align:center;
              letter-spacing:-.8px;">
            ${esc(COPY.slogan[1])}
          </div>

          <div
            class="slogan-line"
            style="margin-top:6px;
              color:${C.navy};
              text-align:right;
              letter-spacing:-.8px;">
            ${esc(COPY.slogan[2])}
          </div>
        </mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        <mj-text padding="28px 0 17px">
          ${esc(COPY.airports)}
        </mj-text>
        <mj-text>${esc(COPY.program)}</mj-text>
      </mj-column>
    </mj-section>

    ${boardingPass()}

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        <mj-text
          css-class="schedule-title"
          font-size="33px"
          line-height="1.2"
          font-weight="700"
          padding="0 0 8px">
          ${esc(COPY.schedule)}
        </mj-text>

        <mj-text
          css-class="schedule-note"
          font-size="13px"
          line-height="19px"
          color="${C.muted}"
          padding="0 0 25px">
          ${esc(SCHEDULE_NOTE)}
        </mj-text>
      </mj-column>
    </mj-section>

    ${GROUPS.map(flightGroup).join("")}

    <mj-section padding="0 30px" background-color="${C.paper}">
      <mj-column>
        <mj-text
          font-size="22px"
          font-weight="700"
          padding="0 0 17px">
          ${esc(COPY.passengers)}
        </mj-text>
        <mj-text>${esc(COPY.mood)}</mj-text>
        <mj-text padding="0 0 29px">
          ${esc(COPY.waiting)}
        </mj-text>
      </mj-column>
    </mj-section>

    ${colorStrip()}

    <mj-section
      padding="27px 30px 32px"
      background-color="${C.navy}">
      <mj-column>
        <mj-text
          font-size="30px"
          line-height="1.2"
          font-weight="700"
          color="#ffffff"
          padding="0 0 15px">
          ${esc(COPY.meeting)}
        </mj-text>

        <mj-text
          font-size="17px"
          color="#ffffff"
          padding="0">
          ${esc(COPY.crew)}
        </mj-text>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
  `.trim();
}

/* =========================================================
   Главное изображение
   ========================================================= */

async function prepareHero() {
  let source = null;

  if (process.env.HERO_SOURCE) {
    source = path.resolve(ROOT, process.env.HERO_SOURCE);

    if (!(await exists(source))) {
      throw new Error(
        `Не найден файл из HERO_SOURCE:\n${source}`
      );
    }
  } else {
    for (const name of [
      "hero.jpg",
      "hero.jpeg",
      "hero.png",
      "hero.webp"
    ]) {
      const candidate = path.join(ROOT, name);

      if (await exists(candidate)) {
        source = candidate;
        break;
      }
    }
  }

  if (!source) {
    for (const name of [HERO_SOURCE_COPY, FILES.hero]) {
      const candidate = path.join(ASSETS, name);

      if (await exists(candidate)) {
        source = candidate;
        break;
      }
    }
  }

  if (!source) {
    throw new Error(
      "Не найден главный баннер.\n" +
      "Положите hero.jpg рядом с terminal.mjs."
    );
  }

  const normalized = await sharp(source)
    .rotate()
    .resize({ width: 1280, withoutEnlargement: true })
    .flatten({ background: C.navy })
    .jpeg({
      quality: 94,
      mozjpeg: true,
      chromaSubsampling: "4:4:4"
    })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = normalized.info;

  const overlay = Buffer.from(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}">
      <defs>
        <linearGradient
          id="shade"
          x1="0%" y1="0%"
          x2="0%" y2="100%">
          <stop
            offset="0%"
            stop-color="#002d3a"
            stop-opacity="0"/>
          <stop
            offset="46%"
            stop-color="#002d3a"
            stop-opacity="0"/>
          <stop
            offset="70%"
            stop-color="#002d3a"
            stop-opacity=".26"/>
          <stop
            offset="100%"
            stop-color="#002330"
            stop-opacity=".84"/>
        </linearGradient>
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#shade)"/>
    </svg>
  `);

  const buffer = await sharp(normalized.data)
    .composite([{ input: overlay }])
    .jpeg({
      quality: 86,
      mozjpeg: true,
      chromaSubsampling: "4:4:4"
    })
    .toBuffer();

  return {
    source,
    sourceBuffer: normalized.data,
    buffer,
    width,
    height
  };
}

/* =========================================================
   Декоративная графика
   ========================================================= */

async function pngFromSVG(svg) {
  return sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function snowflake(cx, cy, radius, opacity, rotation = 0) {
  const branches = Array.from({ length: 6 }, (_, index) => `
    <g transform="rotate(${index * 60})">
      <path d="M0 0 V-${radius}"/>
      <path d="
        M0 -${radius * 0.56}
        L-${radius * 0.22} -${radius * 0.78}
        M0 -${radius * 0.56}
        L${radius * 0.22} -${radius * 0.78}"/>
    </g>
  `).join("");

  return `
    <g
      transform="translate(${cx} ${cy}) rotate(${rotation})"
      fill="none"
      stroke="#ffffff"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="${opacity}">
      ${branches}
    </g>
  `;
}

const PLANE_PATH = `
  M0-47 C5-47 7-39 7-32
  L7-9 L43 14 L43 24 L7 12
  L7 35 L19 44 L19 51 L0 45
  L-19 51 L-19 44 L-7 35
  L-7 12 L-43 24 L-43 14
  L-7-9 L-7-32 C-7-39-5-47 0-47Z
`;

async function createTicketArt() {
  // Только декоративный штрихкод.
  // Не предназначен для сканирования.
  const widths = [
    1.5, 2, 1, 3, 1.5, 1,
    2.5, 1, 2, 1.5, 3, 1
  ];

  const gap = 3;
  const totalWidth = widths.reduce((sum, width) =>
    sum + width, 0
  ) + gap * (widths.length - 1);

  let x = (84 - totalWidth) / 2;

  const bars = widths.map(width => {
    const markup = `
      <rect
        x="${x}"
        y="13"
        width="${width}"
        height="43"
        fill="#ffffff"/>
    `;

    x += width + gap;
    return markup;
  }).join("");

  return pngFromSVG(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="252"
      height="348"
      viewBox="0 0 84 116">

      ${bars}

      <g transform="translate(42 82) rotate(90) scale(.25)">
        <path d="${PLANE_PATH}" fill="#ffffff"/>
      </g>
    </svg>
  `);
}

async function createSloganBackground() {
  return pngFromSVG(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1280"
      height="376"
      viewBox="0 0 640 188">

      <rect width="640" height="188" fill="${C.green}"/>

      ${snowflake(568, 47, 24, 0.72, 12)}
      ${snowflake(44, 137, 18, 0.60, -8)}

      <path
        d="M12 165 C53 183 91 173 122 145
           C134 134 142 129 151 126"
        fill="none"
        stroke="${C.navy}"
        stroke-width="1.2"
        stroke-dasharray="2 7"
        stroke-linecap="round"
        opacity=".30"/>

      <path
        d="M282 14 C353 -3 410 5 458 17
           C480 22 493 19 508 10"
        fill="none"
        stroke="${C.navy}"
        stroke-width="1.1"
        stroke-dasharray="2 8"
        stroke-linecap="round"
        opacity=".22"/>

      <g transform="translate(148 126) rotate(42) scale(.24)">
        <path
          d="${PLANE_PATH}"
          fill="${C.navy}"
          opacity=".76"/>
      </g>

      <g
        stroke="#ffffff"
        stroke-width="1.2"
        stroke-linecap="round"
        opacity=".45">
        <path d="M93 111 V119 M89 115 H97"/>
        <path d="M604 95 V101 M601 98 H607"/>
      </g>
    </svg>
  `);
}

async function createArrow() {
  return pngFromSVG(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="96"
      height="96"
      viewBox="0 0 24 24">
      <path
        d="M5 19 L19 5 M6 5 H19 V18"
        fill="none"
        stroke="${C.cyan}"
        stroke-width="2.3"
        stroke-linecap="square"
        stroke-linejoin="miter"/>
    </svg>
  `);
}

async function createNavigation() {
  return pngFromSVG(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1160"
      height="80"
      viewBox="0 0 580 40">

      <rect width="580" height="40" fill="#ffffff"/>

      <g transform="translate(27 20) rotate(40) scale(.29)">
        <path d="${PLANE_PATH}" fill="${C.navy}"/>
      </g>

      <path
        d="M60 20 H91 M82 12 L91 20 L82 28"
        fill="none"
        stroke="${C.navy}"
        stroke-width="3"/>
      <path d="M111 9 V31" stroke="${C.grid}"/>

      <g fill="${C.navy}" opacity=".88">
        <rect x="130" y="12" width="3" height="16"/>
        <rect x="137" y="12" width="6" height="16"/>
        <rect x="147" y="12" width="2" height="16"/>
        <rect x="153" y="12" width="4" height="16"/>
        <rect x="161" y="12" width="2" height="16"/>
        <rect x="167" y="12" width="5" height="16"/>
      </g>

      <path d="M194 20 H383" stroke="${C.grid}"/>
      <path
        d="M194 20 H240"
        stroke="${C.blue}"
        stroke-width="3"/>
      <path d="M408 9 V31" stroke="${C.grid}"/>

      <g
        stroke="${C.navy}"
        stroke-width="2.4"
        fill="none"
        stroke-linejoin="round">
        <rect x="429" y="13" width="24" height="18" rx="1"/>
        <path d="M436 13 V8 H446 V13"/>
        <path d="M435 17 V27 M447 17 V27"/>
      </g>

      <path
        d="M480 20 H512 M503 12 L512 20 L503 28"
        fill="none"
        stroke="${C.navy}"
        stroke-width="3"/>

      <g fill="${C.navy}" opacity=".85">
        <path d="M535 10 H540 L531 30 H526Z"/>
        <path d="M545 10 H550 L541 30 H536Z"/>
        <path d="M555 10 H560 L551 30 H546Z"/>
      </g>
    </svg>
  `);
}

async function prepareImages(hero) {
  const pending = new Map([
    [FILES.hero, hero.buffer],
    [HERO_SOURCE_COPY, hero.sourceBuffer],
    [FILES.ticket, await createTicketArt()],
    [FILES.arrow, await createArrow()],
    [FILES.slogan, await createSloganBackground()],
    [FILES.navigation, await createNavigation()]
  ]);

  const missing = [];

  for (const name of Object.values(FILES)) {
    if (
      !pending.has(name) &&
      !(await exists(path.join(ASSETS, name)))
    ) {
      missing.push(`dist/assets/${name}`);
    }
  }

  if (missing.length) {
    throw new Error(
      "Не найдены изображения из предыдущей сборки:\n" +
      missing.map(name => `— ${name}`).join("\n") +
      "\n\nСохраните прежнюю папку dist/assets."
    );
  }

  return pending;
}

/* =========================================================
   Локальный предпросмотр
   ========================================================= */

async function localizeHTML(html, pending) {
  let result = html;

  for (const name of Object.values(FILES)) {
    const buffer = pending.get(name) ||
      await fs.readFile(path.join(ASSETS, name));

    const mime = /\.jpe?g$/i.test(name)
      ? "image/jpeg"
      : "image/png";

    const dataURL =
      `data:${mime};base64,${buffer.toString("base64")}`;

    result = result
      .split(esc(assetURL(name))).join(dataURL)
      .split(assetURL(name)).join(dataURL);
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
    Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight
    )+8
  )+"px";
}

frame.addEventListener("load",()=>{
  fit();
  for(const image of frame.contentDocument.images){
    image.addEventListener("load",fit);
  }
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

window.addEventListener("resize",()=>setTimeout(fit,100));
frame.srcdoc=${serialized};
</script>
</body>
</html>`;
}

/* =========================================================
   Проверки структуры
   ========================================================= */

function lastNonEmptyIndex(values) {
  for (let index = values.length - 1; index >= 0; index--) {
    if (values[index]) return index;
  }
  return -1;
}

function verifyStructure(mjml) {
  const count = expression =>
    (mjml.match(expression) || []).length;

  const expectedCells = GROUPS.reduce(
    (total, group) =>
      total +
      Array.from(group.label).length +
      BOARD.desktopPadding * 2,
    0
  );

  const expectedHidden = GROUPS.length *
    (BOARD.desktopPadding - BOARD.mobilePadding) * 2;

  if (
    count(/class="airport-cell(?: board-extra)?"/g) !==
    expectedCells
  ) {
    throw new Error("Неверное количество ячеек табло.");
  }

  if (
    count(/class="airport-cell board-extra"/g) !==
    expectedHidden
  ) {
    throw new Error(
      "Неверное количество скрываемых пустых ячеек."
    );
  }

  const boards = [
    ...mjml.matchAll(
      /<mj-table\b[^>]*css-class="flight-board"[^>]*>([\s\S]*?)<\/mj-table>/g
    )
  ];

  if (boards.length !== GROUPS.length) {
    throw new Error("Ожидалось два табло.");
  }

  boards.forEach((match, index) => {
    const cells = [
      ...match[1].matchAll(
        /<td\b[^>]*class="airport-cell(?: board-extra)?"[^>]*>([\s\S]*?)<\/td>/g
      )
    ];

    const desktop = cells.map(cell =>
      decode(cell[1]).trim()
    );

    const mobile = cells
      .filter(cell =>
        !/class="airport-cell board-extra"/.test(cell[0])
      )
      .map(cell => decode(cell[1]).trim());

    const firstDesktop = desktop.findIndex(Boolean);
    const lastDesktop = lastNonEmptyIndex(desktop);
    const firstMobile = mobile.findIndex(Boolean);
    const lastMobile = lastNonEmptyIndex(mobile);

    if (
      firstDesktop !== BOARD.desktopPadding ||
      desktop.length - 1 - lastDesktop !==
        BOARD.desktopPadding
    ) {
      throw new Error(
        `Табло ${GROUPS[index].label}: ` +
        `на ПК должно быть по ${BOARD.desktopPadding} ` +
        "пустые ячейки с каждой стороны."
      );
    }

    if (
      firstMobile !== BOARD.mobilePadding ||
      mobile.length - 1 - lastMobile !==
        BOARD.mobilePadding
    ) {
      throw new Error(
        `Табло ${GROUPS[index].label}: ` +
        "на телефоне должна быть по одной пустой ячейке."
      );
    }
  });

  if (
    count(/class="time-value"/g) !==
    GROUPS.length * STAGES.length
  ) {
    throw new Error("Неверное количество интервалов времени.");
  }

  if (count(/<mj-hero\b/g) !== 1) {
    throw new Error("В письме должен быть один mj-hero.");
  }

  if (
    count(/css-class="airport-addresses"/g) !==
    GROUPS.length
  ) {
    throw new Error("Ожидалось две таблицы аэропортов.");
  }

  if (
    count(/class="address-columns"/g) !==
    GROUPS.length
  ) {
    throw new Error(
      "Ожидалось две вложенные адресные таблицы."
    );
  }

  if (
    count(/src="[^"]*\/terminal-airport-navigation\.png"/g) !==
    GROUPS.length
  ) {
    throw new Error(
      "Аэропортовая полоса должна встречаться два раза."
    );
  }

  if (count(/css-class="schedule-note"/g) !== 1) {
    throw new Error(
      "Примечание о местном времени должно быть одно."
    );
  }

  if (/<mj-divider\b/i.test(mjml)) {
    throw new Error(
      "Линия над расписанием должна быть удалена."
    );
  }

  const addressTables = [
    ...mjml.matchAll(
      /<mj-table\b([^>]*css-class="airport-addresses"[^>]*)>([\s\S]*?)<\/mj-table>/g
    )
  ];

  for (const match of addressTables) {
    if (!match[1].includes(`border="2px solid ${C.navy}"`)) {
      throw new Error("Неверный цвет рамки аэропортов.");
    }

    if (/\bcolspan\s*=/i.test(match[2])) {
      throw new Error(
        "Внешняя адресная таблица должна быть одноколоночной."
      );
    }
  }

  const ticket = mjml.match(
    /<mj-table\b([^>]*css-class="boarding-pass"[^>]*)>([\s\S]*?)<\/mj-table>/i
  );

  if (
    !ticket ||
    count(/css-class="boarding-pass"/g) !== 1
  ) {
    throw new Error(
      "В письме должен быть один посадочный талон."
    );
  }

  if (
    !ticket[1].includes(`border="2px dashed ${C.orange}"`)
  ) {
    throw new Error(
      "У талона должна быть оранжевая пунктирная рамка."
    );
  }

  const copyCell = ticket[2].match(
    /<td\b[^>]*class="ticket-copy"[^>]*>/i
  );

  if (
    !copyCell ||
    !copyCell[0].includes('align="left"') ||
    !copyCell[0].includes(
      `bgcolor="${C.ticketBackground}"`
    )
  ) {
    throw new Error(
      "Текст талона должен быть слева на белом фоне."
    );
  }

  if (
    count(/class="ticket-eyebrow"/g) !== 1 ||
    count(/class="ticket-title"/g) !== 1 ||
    count(/class="ticket-description"/g) !== 1
  ) {
    throw new Error(
      "В талоне должны быть надзаголовок, заголовок и описание."
    );
  }

  if (
    !ticket[2].includes(
      `border-left:2px dashed ${C.ticketBackground}`
    )
  ) {
    throw new Error(
      "Не найден пунктир отрывного корешка."
    );
  }

  if (
    count(/src="[^"]*\/terminal-ticket-art\.png"/g) !== 1
  ) {
    throw new Error(
      "Ожидалась одна иллюстрация корешка."
    );
  }
}

/* =========================================================
   Резервное копирование
   ========================================================= */

async function backupExistingOutputs() {
  const names = [
    "terminal.mjml",
    "terminal.html",
    "terminal-preview.html",
    "terminal-report.json"
  ];

  const existing = [];

  for (const name of names) {
    if (await exists(path.join(DIST, name))) {
      existing.push(name);
    }
  }

  if (!existing.length) return null;

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const directory = path.join(DIST, "backups", stamp);
  await fs.mkdir(directory, { recursive: true });

  for (const name of existing) {
    await fs.copyFile(
      path.join(DIST, name),
      path.join(directory, name)
    );
  }

  for (const name of [
    FILES.hero,
    HERO_SOURCE_COPY,
    FILES.slogan,
    FILES.ticket,
    FILES.arrow,
    FILES.navigation
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
  let baseURL;

  try {
    baseURL = new URL(BASE);
  } catch {
    throw new Error(
      "ASSET_BASE должен быть корректным HTTPS-адресом."
    );
  }

  if (
    baseURL.protocol !== "https:" ||
    baseURL.search ||
    baseURL.hash ||
    baseURL.username ||
    baseURL.password
  ) {
    throw new Error(
      "ASSET_BASE должен быть HTTPS-адресом папки " +
      "без параметров и данных авторизации."
    );
  }

  await fs.mkdir(ASSETS, { recursive: true });

  const hero = await prepareHero();
  const pending = await prepareImages(hero);
  const mjml = createMJML(hero);
  const expected = expectedText();

  verifyStructure(mjml);

  verifyText(
    expected,
    bodyText(mjml, true),
    "Проверка текста MJML"
  );

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
    "Проверка текста HTML"
  );

  const html = compactHTML(compiled.html);

  verifyText(
    expected,
    bodyText(html),
    "Проверка текста после сокращения HTML"
  );

  const htmlBytes = Buffer.byteLength(html, "utf8");

  if (htmlBytes >= LIMIT) {
    throw new Error(
      `HTML занимает ${htmlBytes} байт.\n` +
      `Предел — менее ${LIMIT} байт.\n` +
      "Файлы письма не перезаписаны."
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

  const localHTML = await localizeHTML(html, pending);
  const preview = previewPage(localHTML);
  const backup = await backupExistingOutputs();

  const report = {
    generatedAt: new Date().toISOString(),
    htmlBytes,
    maxHTMLBytes: LIMIT,
    copyCheck: "passed",
    mjmlValidation: "passed",
    structureCheck: "passed",

    board: {
      desktopPaddingCellsPerSide: BOARD.desktopPadding,
      mobilePaddingCellsPerSide: BOARD.mobilePadding,
      fontSize: BOARD.fontSize,
      height: BOARD.height,
      width: "responsive",
      labels: GROUPS.map(group => group.label)
    },

    ticket: {
      style: "reference boarding pass",
      background: C.ticketBackground,
      outline: `2px dashed ${C.orange}`,
      textAlign: "left",
      copyWidth: "73%",
      stubWidth: "27%",
      stubColor: C.orange,
      illustration: FILES.ticket,
      illustrationGenerated: true,
      illustrationOrder: "barcode above plane",
      barcode: "decorative, not scannable",
      textIsLive: true,
      wordingSource: "latest user reference",
      copy: {
        eyebrow: COPY.ticketEyebrow,
        title: COPY.ticketTitle,
        description: COPY.ticketDescription
      }
    },

    layout: {
      emailWidth: 640,
      contentInset: 30,
      scheduleHeadingDivider: false,
      scheduleEventTextAlign: "left",
      scheduleVerticalAlign: "middle",
      mobileAddressWidth: "100% available width",
      addressBorder: `2px solid ${C.navy}`,
      addressDivider: `2px solid ${C.addressLine}`,
      festiveBackgroundAdded: false
    },

    hero: {
      source: hero.source,
      output: FILES.hero,
      width: hero.width,
      height: hero.height,
      textPosition: "bottom right",
      textIsLive: true
    },

    assetBase: BASE,
    assets: Object.values(FILES).map(assetURL),
    backup,

    notes: [
      "Талон оформлен по последнему референсу.",
      "Текст талона взят из последнего референса.",
      "Остальной текст письма сохранён.",
      "Штрихкод размещён выше самолёта.",
      "Штрихкод декоративный, не для сканирования.",
      "На ПК по две пустые ячейки с каждой стороны табло.",
      "На телефоне по одной пустой ячейке с каждой стороны.",
      "Размер букв табло 22px, высота ячеек 46px.",
      "Ширина ячеек адаптивная.",
      "Мобильные адреса занимают всю ширину адресного блока.",
      "Логотип не изменяется.",
      "Новый праздничный фон не добавлен.",
      "Base64 используется только в локальном предпросмотре.",
      "Размер HTML указан до обработки сервисом рассылки.",
      "Рендеринг в реальных почтовых клиентах не проверен."
    ]
  };

  // Запись только после успешных проверок.
  for (const [name, buffer] of pending) {
    await fs.writeFile(
      path.join(ASSETS, name),
      buffer
    );
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
    preview,
    "utf8"
  );

  await fs.writeFile(
    path.join(DIST, "terminal-report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("");
  console.log("Готово.");
  console.log(
    `HTML: ${htmlBytes.toLocaleString("ru-RU")} байт.`
  );
  console.log("Посадочный талон обновлён по референсу.");
  console.log("Штрихкод сверху, самолёт снизу.");
  console.log(
    `Табло: Arial Bold ${BOARD.fontSize}px, ` +
    `высота ${BOARD.height}px.`
  );
  console.log(
    `ПК: по ${BOARD.desktopPadding} пустые ячейки с каждой стороны.`
  );
  console.log(
    `Телефон: по ${BOARD.mobilePadding} пустой ячейке с каждой стороны.`
  );
  console.log(
    "Проверки текста, структуры и MJML: пройдены."
  );
  console.log("");
  console.log("Предпросмотр: dist/terminal-preview.html");
  console.log("Для отправки: dist/terminal.html");

  if (backup) {
    console.log(
      `Резервная копия: ${path.relative(ROOT, backup)}`
    );
  }

  if (baseURL.hostname === "example.com") {
    console.warn("");
    console.warn(
      "Перед рассылкой замените example.com: " +
      "разместите изображения на публичном HTTPS-хостинге " +
      "и пересоберите с ASSET_BASE."
    );
  }
}

main().catch(error => {
  console.error("");
  console.error("Сборка остановлена:");
  console.error(error.message || error);
  process.exitCode = 1;
});
