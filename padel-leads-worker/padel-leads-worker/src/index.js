<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Padel Configurator</title>
  </head>
  <body>
    <div class="app">
      <div class="hero">
        <div class="heroInner">
          <div class="heroTitle">PADELBORN</div>
          <div class="heroSub">Конфигуратор корта</div>

          <button id="backToMain" class="backBtn" type="button" aria-label="Назад в главное меню">
            ← Назад
          </button>

          <div class="heroActions">
            <button class="ctaBtn" data-modal-open type="button">
              Рассчитать
              <span class="ctaIcon">→</span>
            </button>
          </div>
        </div>
      </div>

      <main class="content">
        <section class="panel">
          <div class="panelTitle">Настройка</div>

          <!-- STEP 1 -->
          <div class="step is-open" data-step="1">
            <div class="stepHead">
              <div class="stepNum">1</div>
              <div class="stepTitle">Варианты кортов</div>
            </div>

            <div class="stepBody">
              <div class="card">
                <div class="radioRow">
                  <label class="radioLabel">
                    <input type="radio" name="court" value="base" checked />
                    <span>Классический корт</span>
                  </label>
                </div>

                <div class="radioRow">
                  <label class="radioLabel">
                    <input type="radio" name="court" value="base_panoramic" />
                    <span>Панорамный корт</span>
                  </label>
                </div>

                <div class="radioRow">
                  <label class="radioLabel">
                    <input type="radio" name="court" value="ultra_panoramic" />
                    <span>Ультра-панорамный корт</span>
                  </label>
                </div>

                <div class="radioRow">
                  <label class="radioLabel">
                    <input type="radio" name="court" value="single" />
                    <span>Single — корт</span>
                  </label>
                </div>
              </div>

              <button class="nextBtn" data-next="2" type="button">
                Далее <span class="nextIcon">›</span>
              </button>
            </div>
          </div>

          <!-- STEP 2 -->
          <div class="step" data-step="2">
            <div class="stepHead">
              <div class="stepNum">2</div>
              <div class="stepTitle">Освещение</div>
            </div>

            <div class="stepBody">
              <div class="card">
                <div class="field">
                  <div class="fieldLabel">Модель освещения</div>
                  <select id="lightsModel" class="select">
                    <option value="none">Без освещения</option>
                    <option value="padel_1">Вариант 1</option>
                    <option value="padel_2">Вариант 2</option>
                    <option value="padel_3">Вариант 3</option>
                    <option value="padel_4">Вариант 4</option>
                    <option value="padel_5">Вариант 5</option>
                    <option value="padel_6">Вариант 6</option>
                    <option value="padel_7">Вариант 7</option>
                    <option value="padel_8">Вариант 8</option>
                  </select>
                </div>

                <div class="field">
                  <div class="fieldLabel">Свет сцены</div>
                  <select id="lighting" class="select">
                    <option value="studio" selected>Студия</option>
                    <option value="soft">Мягкий</option>
                    <option value="contrast">Контрастный</option>
                  </select>
                </div>

                <div class="lightsColorCard">
                  <div class="lightsColorTitle">Цвет освещения</div>
                  <div class="lightsColorGrid">
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#1e5bff">Синий</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#111111">Чёрный</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#00a651">Зелёный</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#ff3b30">Красный</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#ff2d55">Розовый</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#ffcc00">Жёлтый</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#ff9500">Оранжевый</button>
                    <button type="button" class="colorBtn lightsColorBtn" data-lcolor="#8a4dff">Фиолетовый</button>
                  </div>
                </div>
              </div>

              <button class="nextBtn" data-next="3" type="button">
                Далее <span class="nextIcon">›</span>
              </button>
            </div>
          </div>

          <!-- STEP 3 -->
          <div class="step" data-step="3">
            <div class="stepHead">
              <div class="stepNum">3</div>
              <div class="stepTitle">Цвет конструкции</div>
            </div>

            <div class="stepBody">
              <div class="card">
                <div class="colorsTitle">Базовые цвета</div>
                <div class="colorsGrid">
                  <button type="button" class="colorBtn" data-color="#1e5bff">Синий</button>
                  <button type="button" class="colorBtn" data-color="#111111">Чёрный</button>
                  <button type="button" class="colorBtn" data-color="#00a651">Зелёный</button>
                  <button type="button" class="colorBtn" data-color="#ff3b30">Красный</button>
                  <button type="button" class="colorBtn" data-color="#ff2d55">Розовый</button>
                  <button type="button" class="colorBtn" data-color="#ffcc00">Жёлтый</button>
                  <button type="button" class="colorBtn" data-color="#ff9500">Оранжевый</button>
                  <button type="button" class="colorBtn" data-color="#8a4dff">Фиолетовый</button>
                </div>

                <div class="customColorRow">
                  <div class="customColorLabel">Свой цвет</div>
                  <input id="structureColor" type="color" value="#111111" class="colorInput" />
                  <button id="applyStructureColor" type="button" class="miniBtn">Применить</button>
                  <button id="resetStructureColors" type="button" class="miniBtn secondary">Сбросить</button>
                </div>

                <div class="row">
                  <button id="restoreAllColors" type="button" class="miniBtn secondary">Восстановить все</button>
                </div>
              </div>

              <button class="nextBtn" data-next="4" type="button">
                Далее <span class="nextIcon">›</span>
              </button>
            </div>
          </div>

          <!-- STEP 4 -->
          <div class="step" data-step="4">
            <div class="stepHead">
              <div class="stepNum">4</div>
              <div class="stepTitle">Дополнительные опции</div>
            </div>

            <div class="stepBody">
              <div class="card">
                <div class="colorsTitle">Опции</div>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="canopy" />
                  <span>Навес для падел корта</span>
                </label>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="goals" />
                  <span>Ворота для падел корта</span>
                </label>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="mobiles" />
                  <span>Мобильные основания для падел корта</span>
                </label>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="protectors" />
                  <span>Мягкая защита (протекторы) для корта</span>
                </label>

                <!-- Панель выбора цвета протекторов (появляется только при включенном чекбоксе protectors) -->
                <div id="protectorsColorsPanel" class="card lightsColorCard" style="display:none; margin-top:12px;">
                  <div class="lightsColorTitle">Цвет протекторов</div>
                  <div class="lightsColorGrid">
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#1e5bff">Синий</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#111111">Чёрный</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#00a651">Зелёный</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#ff3b30">Красный</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#ff2d55">Розовый</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#ffcc00">Жёлтый</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#ff9500">Оранжевый</button>
                    <button type="button" class="colorBtn protectorsColorBtn" data-pcolor="#8a4dff">Фиолетовый</button>
                  </div>
                </div>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="grass" />
                  <span>Искусственная трава для падел корта</span>
                </label>

                <label class="checkRow">
                  <input type="checkbox" name="extra_options" value="accessories" />
                  <span>Аксесуары для игры и тренировок</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section class="viewer">
          <div class="viewerHead">
            <div class="viewerTitle">3D просмотр</div>
            <div class="viewerHint">ЛКМ — вращение, ПКМ — сдвиг, колесо — зум</div>
            <div id="status" class="viewerStatus"></div>
            <button id="reframe" class="miniBtn secondary" type="button">Фрейм</button>
          </div>

          <div class="canvasWrap">
            <canvas id="canvas"></canvas>
          </div>
        </section>
      </main>
    </div>

    <!-- MODAL -->
    <div class="modal" data-modal tabindex="-1">
      <div class="modalCard">
        <button class="modalClose" data-modal-close type="button">✕</button>
        <div class="modalTitle">Оставьте заявку</div>

        <div class="modalForm">
          <input class="modalInput" type="text" name="full_name" placeholder="Имя" />
          <input class="modalInput" type="tel" name="phone" placeholder="Телефон" />
        </div>

        <button class="ctaBtn modalSubmit" type="button">
          Отправить
          <span class="ctaIcon">→</span>
        </button>
      </div>

      <div class="modalBackdrop" data-modal-close></div>
    </div>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>