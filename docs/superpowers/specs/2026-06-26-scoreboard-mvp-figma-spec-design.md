# Scoreboard MVP Figma Prototype Spec

Дата: 2026-06-26  
Статус: согласованный дизайн прототипа  
Область: MVP frontend прототип, не финальный визуальный дизайн

## 1. Назначение

Документ описывает Figma-spec для MVP frontend комплекса "Электронное баскетбольное табло".

Цель прототипа - согласовать состав экранов, иерархию информации, расположение блоков, базовые состояния и основные сценарии до реализации. Прототип не является финальным UI-kit и не фиксирует окончательные брендовые цвета, анимации, декоративные фоны или production-polish.

Основания:

- `docs/ТЗ_«Электронное_баскетбольное_табло».md`;
- `docs/data-model.md`;
- `docs/api-and-component-contracts.md`;
- `apps/client/README.md`.

## 2. MVP Scope

В прототип входят все frontend-экраны MVP:

1. LED-табло:
   - игра;
   - перерыв;
   - разминка / до начала матча;
   - представление составов;
   - тест / проверка оборудования;
   - нет активного матча.
2. Операторские экраны:
   - главная панель матча;
   - выбор матча;
   - игровой день;
   - команды;
   - карточка команды;
   - игроки;
   - карточка игрока;
   - матчи;
   - карточка матча;
   - настройки табло / профили оформления;
   - системный статус;
   - восстановление после сбоя;
   - подтверждения критических действий;
   - пустые состояния.
3. Пульты:
   - пульт хронометриста;
   - пульт оператора счёта.

Не входит в MVP-прототип:

- финальный брендовый визуальный стиль;
- финальные логотипы и медиа;
- анимации;
- видеофоны;
- рекламные и спонсорские блоки;
- OBS overlay;
- 3x3;
- полноценный drag-and-drop конструктор раскладок;
- программное управление физическим табло 24/14;
- программное управление VP410 или получение обратной связи от VP410;
- автоматическая сирена через комплекс.

## 3. Общие Принципы Прототипа

Прототип выполняется в low/mid fidelity. Он должен быть достаточно конкретным для оценки сценариев и последующей разработки, но не должен имитировать финальный дизайн.

Общие правила:

- Использовать реальные названия экранов и блоков.
- Использовать тестовые данные, близкие к матчу: команды, счёт, фолы, время, период, shot clock.
- Не прятать ошибки и degraded mode в комментарии без фреймов или variants.
- Для каждого экрана указать назначение, основные блоки, состояния и acceptance notes.
- Все критические действия должны иметь подтверждение.
- UI не рассчитывает официальный матч сам, а показывает подтверждённый snapshot backend / Timer Service.

## 4. Визуальная Система Прототипа

### 4.1 LED-табло

Базовый Figma frame: `1920x1080`.

Layout:

- safe area: `64px` со всех сторон;
- сетка: `12 columns`, gap `24px`, margin `64px`;
- фон: тёмный, почти чёрный;
- композиция live-экрана: команда A слева, центральные таймеры, команда B справа;
- логотипы команд важны, но не должны конкурировать со счётом;
- shot clock всегда видим в игровом режиме.

Рекомендуемая иерархия размеров:

- счёт: `180-220px`;
- game clock: `150-190px`;
- shot clock: `120-160px`;
- период, фолы, тайм-ауты: `40-72px`;
- вспомогательная статистика: меньше основных игровых данных.

### 4.2 Операторская Панель

Базовый Figma frame: `1440x900`.

Принципы:

- рабочий интерфейс без лендинговой композиции;
- высокая плотность, но без перегрузки live-действий;
- верхняя строка всегда показывает текущий матч, статус системы и active display mode;
- во время live-матча основные действия находятся на одном уровне вложенности;
- журнал событий всегда доступен;
- degraded mode не должен скрывать последний подтверждённый snapshot.

### 4.3 Пульты

Базовые frames:

- `1024x768` для tablet/desktop remote;
- `390x844` для mobile-check.

Принципы:

- крупные кнопки для сенсорного ввода;
- минимум вложенности;
- выбранная команда/игрок всегда явно видны;
- команды времени и score commands дают понятный feedback;
- опасные действия требуют confirm modal.

### 4.4 Browser LED Preview

Прототип открывается напрямую через `file:///.../apps/client/prototype/index.html#led-game` без dev server.

Обычный режим:

- над LED-frame расположена компактная служебная панель просмотра;
- панель содержит название текущего LED-режима и icon button `Развернуть`;
- служебная панель не является частью изображения, которое выводится на реальный LED.

Fullscreen / focus mode:

- боковая навигация и внешние отступы скрываются;
- фон браузера становится чёрным;
- LED-frame занимает максимально доступную область с сохранением `16:9`;
- строки игроков увеличиваются до `18-20px`, а точки фолов остаются различимыми;
- счёт, game clock и shot clock сохраняют более высокий визуальный приоритет;
- выход выполняется через `Esc` или icon button `Свернуть`;
- если browser Fullscreen API недоступен для `file://`, CSS focus mode всё равно должен заполнить viewport.

## 5. Figma File Structure

Файл: `Scoreboard MVP Prototype`.

Pages:

- `00 Cover`;
- `01 Foundations`;
- `02 Components`;
- `03 LED Display`;
- `04 Operator Control`;
- `05 Timer Remote`;
- `06 Score Remote`;
- `07 Flows`;
- `08 Notes / Acceptance`.

### 5.1 `00 Cover`

Содержит:

- название проекта;
- версию: `MVP Prototype v0.1`;
- дату;
- scope: `MVP frontend prototype`;
- явную пометку: `Not final visual design`;
- список того, что не входит в MVP.

### 5.2 `01 Foundations`

Design tokens для прототипа:

Colors:

- `bg/display`;
- `text/primary`;
- `text/secondary`;
- `score/home`;
- `score/away`;
- `clock/game`;
- `clock/shot`;
- `state/warning`;
- `state/danger`;
- `state/success`;
- `surface/control`;
- `border/default`.

Typography:

- `display-score`;
- `display-clock`;
- `display-shot-clock`;
- `display-label`;
- `control-title`;
- `control-body`;
- `remote-button`.

Spacing:

- `4`;
- `8`;
- `12`;
- `16`;
- `24`;
- `32`;
- `48`;
- `64`.

Safe area:

- LED: `64px`;
- operator: `24px`;
- remote: `16px`.

### 5.3 `02 Components`

Компоненты и variants:

- `Display / Team Block`: home / away, normal fouls / fifth team foul;
- `Display / Score Number`: normal / corrected / stale;
- `Display / Game Clock`: `mm:ss` / `ss.d` / paused / stale;
- `Display / Shot Clock`: `24` / `14` / under-10 / under-5 / expired;
- `Display / Team Fouls`: neutral `0-4` / yellow `5+`;
- `Display / Timeout Dots`: none used / partial / all used;
- `Control / Status Banner`: ok / warning / danger / degraded;
- `Control / Event Log Row`;
- `Control / Critical Confirm Modal`;
- `Remote / Button`: normal / pressed / disabled / danger / warning;
- `Remote / Clock Panel`;
- `Shared / Empty State`.

## 6. LED Display Frames

### 6.1 `LED / 1920x1080 / Game`

Назначение: основной зрительский экран во время live-матча.

Обязательные элементы:

- логотип команды A;
- логотип команды B;
- короткие названия команд;
- счёт A/B;
- game clock;
- shot clock `24/14`;
- период;
- командные фолы текущего периода;
- тайм-ауты;
- командные фолы без текстового `PENALTY`: при `5+` значение `ФОЛЫ 5` получает яркий жёлтый фон;
- небольшой system indicator для служебного состояния связи.
- постоянный список пяти игроков каждой команды внутри соответствующего командного блока;
- для игрока: номер, имя в формате `Фамилия И.О.`, набранные очки и персональные фолы;
- персональные фолы показываются пятью точками: заполненная точка означает полученный фол, пустая - оставшийся лимит.

Пример данных:

- `УРАЛ 78`;
- `СТАРТ 81`;
- `4 ПЕРИОД`;
- `02:18`;
- `14`;
- `Фолы 4 / 5`;
- `Тайм-ауты ●●○`.

Правила:

- счёт является самым крупным элементом;
- game clock второй по визуальному приоритету;
- shot clock выделен danger/accent цветом;
- последние 5 секунд shot clock показываются с десятыми: `4.9`;
- последняя минута game clock может показываться с десятыми: `59.9`;
- при `5+` командных фолах жёлтым выделяется только компактный блок `ФОЛЫ 5`, а не весь блок команды;
- надпись `PENALTY` и индикатор владения на LED-экране не используются;
- строки игроков имеют формат `№ | Фамилия И.О. | Очки | ●●○○○`;
- составы обеих команд видны одновременно и не перекрывают счёт, game clock или shot clock;
- счёт и таймеры сохраняют более высокий визуальный приоритет, чем статистика игроков;
- при краткой потере WebSocket экран не заменяется аварийным состоянием, а продолжает показывать последний подтверждённый snapshot.

### 6.2 `LED / 1920x1080 / Break`

Назначение: состояние между периодами.

Элементы:

- команды и логотипы;
- общий счёт;
- надпись `ПЕРЕРЫВ`;
- countdown до следующего периода;
- таблица счёта по периодам;
- подпись следующего периода.

Пример:

- `ПЕРЕРЫВ`;
- `До 4 периода: 01:42`;
- `1Q 18-21 / 2Q 22-20 / 3Q 19-18`.

Правила:

- shot clock скрыт;
- break clock заменяет game clock;
- таблица периодов не конкурирует с общим счётом;
- экран визуально отличается от live-режима.

### 6.3 `LED / 1920x1080 / Warmup`

Назначение: экран до начала матча.

Элементы:

- название турнира или игрового дня;
- команды и логотипы;
- статус `РАЗМИНКА`;
- countdown до начала;
- площадка;
- плановое время начала.

Пример:

- `Кубок ФОК`;
- `УРАЛ vs СТАРТ`;
- `Начало через 12:35`.

Правила:

- live-счёт не является главным элементом;
- shot clock скрыт;
- экран должен выглядеть как готовый матч, а не пустая заглушка.

### 6.4 `LED / 1920x1080 / Roster Presentation`

Назначение: представление составов перед матчем.

Элементы:

- команда в фокусе;
- логотип;
- список игроков;
- номер игрока;
- имя игрока;
- marker стартовой пятёрки;
- optional photo placeholder.

Variants:

- `Team A roster`;
- `Team B roster`;
- `Player highlight`.

Правила:

- не больше 8-10 игроков на один экран;
- если состав длиннее, нужен page indicator;
- если фото нет, показывать номер или инициалы;
- счёт и live-таймеры не нужны.

### 6.5 `LED / 1920x1080 / Test`

Назначение: проверка LED, VP410, safe area, цветов и читаемости.

Элементы:

- safe area frame `64px`;
- color bars;
- grayscale bars;
- тестовые цифры `188 - 188`;
- тестовый game clock `88:88`;
- тестовый shot clock `24.0`;
- placeholder логотипов;
- timestamp генерации кадра;
- label размера экрана.

Правила:

- все ключевые зоны заполнены тестовыми значениями;
- оператор должен видеть обрезку краёв;
- экран должен помогать проверить контраст и читаемость цифр.

### 6.6 `LED / 1920x1080 / No Active Match`

Назначение: служебная заглушка при отсутствии активного матча.

Элементы:

- название комплекса или площадки;
- `Нет активного матча`;
- дата и время;
- system status;
- нейтральный фон.

Правила:

- не показывать последний счёт;
- если backend недоступен, писать `Нет связи с сервером`;
- экран должен отличаться от перерыва и разминки.

## 7. Operator Control Frames

### 7.1 `Control / 1440x900 / Match Dashboard`

Назначение: основной экран проведения live-матча.

Элементы:

- header: матч, статус, период, active display mode;
- live snapshot: счёт, clocks, фолы, timeouts;
- quick actions: start/stop, display mode, timeout, possession, period transition;
- Team A action zone;
- Team B action zone;
- event log;
- warning/status banner.

States:

- `pre-match`;
- `live`;
- `paused`;
- `break`;
- `degraded`;
- `recovering`.

Правила:

- live-действия на одном уровне;
- журнал событий всегда виден;
- опасные действия через modal;
- degraded mode не скрывает текущее состояние.

### 7.2 `Control / 1440x900 / Match Select`

Элементы:

- список матчей;
- дата;
- команды;
- статус: `scheduled`, `prepared`, `active`, `finished`;
- actions: `Подготовить`, `Открыть`, `Продолжить`;
- active/recoverable match highlight.

Правила:

- второй активный матч заблокирован;
- восстановимый матч всегда сверху.

### 7.3 `Control / 1440x900 / Game Day`

Элементы:

- дата;
- турнир;
- площадка;
- расписание матчей;
- readiness badges: teams, rosters, display profile, clocks;
- next match action;
- empty state: `На этот день матчи не добавлены`.

### 7.4 `Control / 1440x900 / Teams List`

Элементы:

- таблица команд;
- логотип;
- название;
- город;
- поиск;
- create action;
- empty state.

### 7.5 `Control / 1440x900 / Team Detail`

Элементы:

- форма команды;
- logo upload placeholder;
- primary/secondary colors;
- roster table;
- add player action;
- save/cancel;
- validation states.

States:

- normal;
- validation error;
- empty roster;
- unsaved changes.

### 7.6 `Control / 1440x900 / Players List`

Элементы:

- таблица игроков;
- фото или инициалы;
- ФИО;
- команда;
- номер;
- поиск;
- фильтр по команде;
- create action.

### 7.7 `Control / 1440x900 / Player Detail`

Элементы:

- ФИО;
- фото;
- команда;
- номер;
- активность;
- save/cancel;
- validation errors.

### 7.8 `Control / 1440x900 / Matches List`

Элементы:

- дата и время;
- команды;
- площадка;
- профиль табло;
- статус;
- create/open actions.

### 7.9 `Control / 1440x900 / Match Detail`

Элементы:

- команды A/B;
- составы;
- длительность периода;
- профиль табло;
- плановое время;
- readiness checklist;
- prepare match button.

Правила:

- если checklist не пройден, prepare/start disabled;
- причина блокировки видна рядом.

### 7.10 `Control / 1440x900 / Scoreboard Layout Settings`

Элементы:

- список профилей;
- LED preview;
- colors;
- logo mapping;
- background setting;
- typography setting;
- block visibility toggles;
- save/apply actions;
- safe default profile.

Правила:

- это не drag-and-drop builder;
- preview показывает изменения сразу;
- live apply требует confirm;
- ошибка конфигурации не ломает active display.

### 7.11 `Control / 1440x900 / System Status`

Элементы:

- backend status;
- Timer Service status;
- DB status;
- WebSocket status;
- display client status;
- VP410 note: `не проверяется программно`;
- physical 24/14 note: `ручной контур`;
- recent errors;
- open test screen action.

### 7.12 `Control / 1440x900 / Recovery`

Элементы:

- найденный active match;
- последний подтверждённый snapshot;
- счёт;
- game clock;
- shot clock;
- период;
- фолы;
- последние события;
- restore action;
- manual correction action;
- close as needs review action.

Правила:

- продолжение невозможно без явного выбора;
- correction reason обязателен;
- любые ручные правки после сбоя идут как correction events.

### 7.13 `Control / 1440x900 / Critical Confirm Modal`

Компонент используется для:

- завершить период;
- завершить матч;
- сбросить shot clock;
- восстановить snapshot;
- удалить или архивировать сущность;
- применить профиль табло к live-матчу.

Содержимое:

- название действия;
- последствия;
- текущий snapshot, если действие live-критичное;
- primary action;
- cancel;
- warning color для опасных действий.

### 7.14 `Control / 1440x900 / Empty States`

Пустые состояния нужны для:

- нет матчей;
- нет команд;
- нет игроков;
- пустой состав;
- нет профилей табло;
- нет active match;
- нет журнала событий.

## 8. Timer Remote Frames

### 8.1 Frames

- `Timer Remote / 1024x768 / Ready`;
- `Timer Remote / 1024x768 / Running`;
- `Timer Remote / 1024x768 / Shot Danger`;
- `Timer Remote / 1024x768 / Degraded`;
- `Timer Remote / 390x844 / Ready`.

### 8.2 Elements

- game clock;
- shot clock;
- period;
- `START / STOP`;
- `24`;
- `14`;
- `RESET`;
- timeout;
- period controls;
- connection status.

### 8.3 Rules

- `START / STOP` - самый крупный интерактивный элемент;
- `24` и `14` рядом, одинакового размера;
- shot clock color states:
  - normal `>10`;
  - warning `5-10`;
  - danger `<5`;
- корректировки времени меньше основных игровых кнопок;
- критические действия требуют confirm modal;
- Timer Service degraded блокирует официальные команды времени.

States:

- ready;
- running;
- paused;
- shot clock danger;
- timer service degraded;
- connection lost.

## 9. Score Remote Frames

### 9.1 Frames

- `Score Remote / 1024x768 / No Player Selected`;
- `Score Remote / 1024x768 / Player Selected`;
- `Score Remote / 1024x768 / Fifth Foul Warning`;
- `Score Remote / 1024x768 / Command Rejected`;
- `Score Remote / 390x844 / Player Selected`.

### 9.2 Elements

- team selector;
- player selector;
- selected player panel;
- `+1`;
- `+2`;
- `+3`;
- `-1 / correction`;
- foul controls;
- timeout;
- possession;
- score/fouls mini snapshot;
- recent action feedback.

### 9.3 Rules

- выбранная команда всегда явно подсвечена;
- выбранный игрок виден рядом с кнопками очков;
- нельзя начислить очки игроку, если игрок не выбран, кроме отдельного team-only correction flow;
- после очков или фола событие появляется в журнале;
- отмена последнего действия делается через correction flow, а не молчаливое удаление.

States:

- no player selected;
- player selected;
- team penalty;
- fifth foul warning;
- command rejected;
- connection lost.

## 10. Prototype Flows

На странице `07 Flows` нужны prototype arrows для сценариев:

- подготовка матча;
- старт матча;
- начисление очков;
- фол и достижение лимита командных фолов;
- старт/стоп времени;
- reset shot clock `24`;
- reset shot clock `14`;
- перерыв;
- восстановление после сбоя;
- переключение LED display mode;
- применение профиля табло к live-матчу.

Каждый flow должен показывать:

- стартовый экран;
- действие оператора;
- подтверждение, если требуется;
- итоговое состояние или ошибку.

## 11. Acceptance Criteria

Прототип считается готовым, если:

- есть все страницы Figma из раздела 5;
- каждый MVP-экран представлен отдельным frame;
- `LED / Game` содержит счёт, game clock, shot clock `24/14`, фолы, логотипы, период и тайм-ауты;
- все LED-режимы покрыты отдельными frames;
- все операторские MVP-экраны покрыты отдельными frames;
- пульт хронометриста и пульт счёта покрыты tablet/desktop frames и mobile-check frames;
- критические действия имеют `CriticalConfirmModal`;
- пустые списки имеют `EmptyState`;
- отказные и degraded states описаны и представлены notes или variants;
- в `00 Cover` явно написано, что это прототип, а не финальный визуальный дизайн.

## 12. Development Notes

- UI отображает подтверждённое состояние, полученное от backend и Timer Service.
- Клиент может локально интерполировать running clocks только как отображение, не как источник истины.
- LED display не должен заменять счёт аварийным экраном при краткой потере связи.
- Операторские live-действия не должны быть разбросаны по глубокой навигации.
- Все команды, меняющие матч, должны иметь видимый результат или ошибку.
- Восстановление после сбоя всегда требует явного выбора оператора.
- Ошибки пользовательских настроек профиля табло должны откатываться к безопасному дефолту.

## 13. Open Items For Later Design

Эти вопросы не блокируют MVP-прототип:

- финальная брендовая палитра;
- финальные логотипы команд и площадки;
- точный production font;
- анимации представления составов;
- спонсорские блоки;
- OBS overlay;
- программный контур физического табло 24/14 после реверс-инжиниринга.
