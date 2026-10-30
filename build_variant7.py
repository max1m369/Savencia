mjml_content = """<mjml lang="ru">
  <mj-head>
    <mj-title>10 декабря — Вылет в Новый ГОД! | Groupe Savencia</mj-title>
    <mj-preview>10 декабря мы отправляемся в праздничное путешествие, которое объединит сотрудников Savencia из трёх городов — Москвы, Уфы и Белебея.</mj-preview>
    <mj-breakpoint width="480px"/>

    <mj-attributes>
      <mj-all font-family="Arial, Helvetica, sans-serif"/>
      <mj-text font-size="17px"
               line-height="1.65"
               color="#173f4c"
               padding="0 0 17px"/>
      <mj-image padding="0"/>
    </mj-attributes>

    <mj-style>
      @media only screen and (max-width:479px) {
        .big-ten div {
          font-size:125px !important;
          letter-spacing:-8px !important;
          line-height:1 !important;
        }
        .month div {
          font-size:28px !important;
        }
        .hero-title div {
          font-size:26px !important;
          line-height:1.15 !important;
        }
        .statement div {
          font-size:26px !important;
          line-height:1.15 !important;
        }
        .px-mobile {
          padding-left: 18px !important;
          padding-right: 18px !important;
        }
        .window-col {
          text-align: center !important;
          margin-top: 14px !important;
        }
        .window-col table {
          margin: 0 auto !important;
        }
      }
    </mj-style>
  </mj-head>

  <mj-body width="640px" background-color="#e7e7e0">

    <!-- 1. ШАПКА: ЦВЕТНОЙ ЛОГОТИП (БЕЗ ТЕХНИЧЕСКИХ СТРОК) -->
    <mj-section background-color="#ffffff" padding="24px 30px 20px" css-class="px-mobile">
      <mj-column>
        <mj-image src="logo_color.png"
                  alt="Groupe Savencia"
                  width="200px" align="left"
                  padding="0"/>
      </mj-column>
    </mj-section>

    <!-- Оранжевый разделитель -->
    <mj-section padding="0" background-color="#f7f5ef">
      <mj-column>
        <mj-divider border-color="#de6a09"
                    border-width="4px"
                    padding="0"/>
      </mj-column>
    </mj-section>

    <!-- 2. ГЕРОЙ: КРУПНАЯ ДАТА «10 ДЕКАБРЯ» И ИЛЛЮМИНАТОР САМОЛЁТА (БЕЗ «ТЕМА:») -->
    <mj-section padding="28px 24px 22px"
                background-color="#f7f5ef" css-class="px-mobile">
      <mj-column width="52%" vertical-align="middle">
        <mj-text font-size="165px" line-height="0.95"
           letter-spacing="-11px" font-weight="700"
           color="#004b62" padding="0"
           css-class="big-ten">10</mj-text>
        <mj-text font-size="34px" line-height="1.1"
           font-weight="700" color="#de6a09"
           padding="4px 0 16px 4px" css-class="month">декабря</mj-text>
        <mj-text font-size="30px" line-height="1.15"
           font-weight="700" color="#004b62"
           padding="0 4px 10px 4px"
           css-class="hero-title">— Вылет в Новый ГОД!</mj-text>
      </mj-column>

      <mj-column width="48%" vertical-align="middle" css-class="window-col">
        <mj-image
          src="f-window.png"
          alt="Иллюминатор рейса в Новый год"
          width="290px"
          padding="0"/>
      </mj-column>
    </mj-section>

    <!-- 3. ОБРАЩЕНИЕ: ДОРОГИЕ КОЛЛЕГИ -->
    <mj-section background-color="#ffffff"
                padding="30px 30px 10px" css-class="px-mobile">
      <mj-column>
        <mj-text font-size="22px" font-weight="700" color="#004b62"
           padding="0 0 16px">Дорогие коллеги!</mj-text>
        <mj-text font-size="18px" font-weight="700" color="#de6a09" line-height="1.4" padding="0 0 14px">
          Внимание, объявляется посадка на особый новогодний рейс!
        </mj-text>
        <mj-text padding="0 0 24px">
          10 декабря мы отправляемся в праздничное путешествие, которое объединит сотрудников Savencia из трёх городов — Москвы, Уфы и Белебея.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- 4. АКЦЕНТНЫЙ БАННЕР-МАНИФЕСТ С ОРАНЖЕВЫМ ШЕВРОНОМ -->
    <mj-section padding="26px 30px"
                background-color="#004b62" css-class="px-mobile">
      <mj-column border-left="5px solid #de6a09">
        <mj-text font-size="34px" line-height="1.15"
           font-weight="700" color="#ffffff"
           padding="0 0 0 18px" css-class="statement">ТРИ ГОРОДА. ОДИН РЕЙС. ОДНА КОМАНДА.</mj-text>
      </mj-column>
    </mj-section>

    <!-- 5. ПРОГРАММА ПОЛЁТА -->
    <mj-section background-color="#ffffff"
                padding="28px 30px 10px" css-class="px-mobile">
      <mj-column>
        <mj-text padding="0 0 16px">
          В этот день наши праздничные площадки превратятся в аэропорты, а каждый из вас станет пассажиром рейса с конечным пунктом назначения — Новый год!
        </mj-text>
        <mj-text padding="0 0 20px">
          В программе полёта: тёплые встречи с коллегами, яркие эмоции, заслуженные награды, приятные сюрпризы, музыка и праздничное настроение.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- ПАМЯТКА О ПОСАДОЧНОМ БИЛЕТЕ -->
    <mj-wrapper padding="0 30px 24px"
                background-color="#ffffff" css-class="px-mobile">
      <mj-section padding="18px 20px"
                  background-color="#f1f5e7"
                  border-left="4px solid #b1ca40">
        <mj-column>
          <mj-text font-size="16px" line-height="1.55" padding="0" color="#2b4010">
            <strong>🎫 Посадочный билет:</strong> На регистрации каждый получит свой персональный посадочный билет, который пригодится во время новогоднего розыгрыша подарков.
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>

    <!-- 6. РАСПИСАНИЕ НАШЕГО РЕЙСА -->
    <mj-section background-color="#ffffff"
                padding="0 30px" css-class="px-mobile">
      <mj-column>
        <mj-divider border-color="#de6a09"
                    border-width="3px"
                    padding="0 0 22px"/>
        <mj-text font-size="28px" line-height="1.2"
           font-weight="700" color="#004b62" padding="0 0 22px">Расписание нашего рейса</mj-text>
      </mj-column>
    </mj-section>

    <!-- ХАБ 1: МОСКВА И УФА -->
    <mj-wrapper padding="0 30px 24px"
                background-color="#ffffff" css-class="px-mobile">

      <mj-section padding="18px 22px"
                  background-color="#004b62"
                  border-top="5px solid #de6a09">
        <mj-column>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#ffffff"
             padding="0">&#x2708;&#xFE0E; МОСКВА и УФА (по местному времени)</mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="#f7f5ef">
        <mj-column>
          <mj-spacer height="18px"/>
        </mj-column>
      </mj-section>

      <!-- Этап 1 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">17:00–18:00 — Регистрация на рейс (Welcome)</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Встреча пассажиров, посадочные билеты, фотографии, угощения и первые праздничные активности.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Этап 2 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#cbd9dc"
                      border-width="1px"
                      padding="0 0 16px"/>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">18:00–20:00 — Взлёт. Торжественная часть</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Церемония награждения сотрудников и праздничная программа.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Этап 3 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#cbd9dc"
                      border-width="1px"
                      padding="0 0 16px"/>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">20:00–23:00 — Полёт в Новый год</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Музыка, фуршет, развлечения, общение и новогодние сюрпризы.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Адреса Москва и Уфа -->
      <mj-section padding="0 22px 20px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#aabfc6"
                      border-width="1px"
                      border-style="dashed"
                      padding="0 0 16px"/>

          <mj-text font-size="16px" font-weight="700" color="#004b62"
             padding="0 0 10px">Аэропорты отправления:</mj-text>

          <mj-text font-size="12px" font-weight="700"
             color="#008fd0" padding="3px 0 2px">МОСКВА:</mj-text>
          <mj-text font-size="15px" padding="0 0 8px">проспект Андропова, 11, корпус 2, Южный Event-Port.</mj-text>

          <mj-text font-size="12px" font-weight="700"
             color="#008fd0" padding="4px 0 2px">УФА:</mj-text>
          <mj-text font-size="15px" padding="0 0 6px">улица Менделеева, 205А, ресторан «Пастернак».</mj-text>
        </mj-column>
      </mj-section>

    </mj-wrapper>

    <!-- ХАБ 2: БЕЛЕБЕЙ -->
    <mj-wrapper padding="0 30px 24px"
                background-color="#ffffff" css-class="px-mobile">

      <mj-section padding="18px 22px"
                  background-color="#004b62"
                  border-top="5px solid #008fd0">
        <mj-column>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#ffffff"
             padding="0">&#x2708;&#xFE0E; БЕЛЕБЕЙ</mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding="0" background-color="#f7f5ef">
        <mj-column>
          <mj-spacer height="18px"/>
        </mj-column>
      </mj-section>

      <!-- Этап 1 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">15:00–15:30 — Регистрация на рейс (Welcome)</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Встреча пассажиров, посадочные билеты, фотографии, угощения и первые праздничные активности.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Этап 2 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#cbd9dc"
                      border-width="1px"
                      padding="0 0 16px"/>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">15:30–18:00 — Взлёт. Торжественная часть</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Церемония награждения сотрудников и праздничная программа.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Этап 3 -->
      <mj-section padding="0 22px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#cbd9dc"
                      border-width="1px"
                      padding="0 0 16px"/>
          <mj-text font-size="20px" line-height="1.35"
             font-weight="700" color="#004b62"
             padding="0 0 8px">18:00–20:00 — Полёт в Новый год</mj-text>
          <mj-text font-size="15px" line-height="1.6"
             padding="0 0 18px">Музыка, фуршет, развлечения, общение и новогодние сюрпризы.</mj-text>
        </mj-column>
      </mj-section>

      <!-- Адрес Белебей -->
      <mj-section padding="0 22px 20px"
                  background-color="#f7f5ef">
        <mj-column>
          <mj-divider border-color="#aabfc6"
                      border-width="1px"
                      border-style="dashed"
                      padding="0 0 16px"/>

          <mj-text font-size="16px" font-weight="700" color="#004b62"
             padding="0 0 10px">Аэропорт отправления:</mj-text>

          <mj-text font-size="15px" padding="0 0 6px">улица Амирова, 10А, Центральный дворец культуры Белебеевского района.</mj-text>
        </mj-column>
      </mj-section>

    </mj-wrapper>

    <!-- 7. ФИНАЛЬНЫЙ ПРИЗЫВ: УВАЖАЕМЫЕ ПАССАЖИРЫ -->
    <mj-section background-color="#ffffff"
                padding="10px 30px 24px" css-class="px-mobile">
      <mj-column>
        <mj-text font-size="22px" font-weight="700" color="#004b62"
           padding="0 0 12px">Уважаемые пассажиры!</mj-text>
        <mj-text padding="0 0 10px">Просим заранее подготовить хорошее настроение и быть готовыми к незабываемому путешествию.</mj-text>
        <mj-text padding="0 0 18px">Наш новогодний рейс уже готовится к вылету. На борту ждём каждого!</mj-text>
      </mj-column>
    </mj-section>

    <!-- Трёхцветная полоса Savencia -->
    <mj-section padding="0" background-color="#004b62">
      <mj-group width="100%">
        <mj-column width="65%">
          <mj-divider border-color="#1bbbe9" border-width="5px" padding="0"/>
        </mj-column>
        <mj-column width="20%">
          <mj-divider border-color="#b1ca40" border-width="5px" padding="0"/>
        </mj-column>
        <mj-column width="15%">
          <mj-divider border-color="#de6a09" border-width="5px" padding="0"/>
        </mj-column>
      </mj-group>
    </mj-section>

    <!-- 8. ПОДВАЛ: ЭКИПАЖ SAVENCIA -->
    <mj-section padding="26px 30px 30px"
                background-color="#004b62" css-class="px-mobile">
      <mj-column>
        <mj-text font-size="28px" line-height="1.2"
           font-weight="700" color="#ffffff"
           padding="0 0 12px">До встречи 10 декабря!</mj-text>
        <mj-text font-size="17px" color="#38bdf8" padding="0">Ваш экипаж Savencia &#x2708;&#xFE0E;</mj-text>
      </mj-column>
    </mj-section>

  </mj-body>
</mjml>
"""

with open('variant7_editorial_window.mjml', 'w', encoding='utf-8') as f:
    f.write(mjml_content)

print("Saved variant7_editorial_window.mjml successfully.")
