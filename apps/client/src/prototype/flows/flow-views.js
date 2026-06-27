import { escapeHtml } from '../html.js';

const flowDetails = {
  'prepare-match': ['Подготовка матча', 'Match Select', 'Выбрать матч и проверить команды, составы, часы и профиль LED.', 'Матч получает статус ready; ошибки readiness видны до эфира.'],
  'start-match': ['Старт матча', 'Match Detail', 'Нажать «Подготовить матч», проверить snapshot и пройти confirm.', 'Создан active match; dashboard и LED показывают один snapshot.'],
  'score-points': ['Начисление очков', 'Score Remote', 'Выбрать Team A/B, игрока и +1/+2/+3.', 'Счет и статистика игрока обновлены; событие добавлено в журнал.'],
  'foul-penalty': ['Фол и penalty', 'Score Remote', 'Выбрать игрока, добавить фол и при лимите включить командный penalty.', 'Фолы обновлены; LED показывает penalty, ошибка выбора не меняет snapshot.'],
  'start-stop-clock': ['Старт/стоп времени', 'Timer Remote', 'Нажать доминирующую кнопку START / STOP.', 'Game clock меняет состояние, действие записано в журнал.'],
  'reset-shot-clock-24': ['Reset shot clock 24', 'Timer Remote', 'Нажать 24 после смены владения.', 'Shot clock = 24; физический контур сверяется оператором.'],
  'reset-shot-clock-14': ['Reset shot clock 14', 'Timer Remote', 'Нажать 14 после атакующего подбора или фола.', 'Shot clock = 14; новый snapshot отправлен на LED.'],
  'period-break': ['Перерыв', 'Match Dashboard', 'Завершить период через critical confirm.', 'LED переходит в Break; работает таймер перерыва и доступен следующий период.'],
  'failure-recovery': ['Восстановление после сбоя', 'Recovery', 'Сравнить последнее событие и выбрать «Восстановить snapshot».', 'Состояние восстановлено либо отмечено как error для ручной сверки.'],
  'display-mode-switch': ['Переключение LED display mode', 'Match Dashboard', 'Выбрать Game, Break, Warmup, Roster или Test.', 'LED-клиент показывает выбранный режим без изменения счета.'],
  'apply-live-layout-profile': ['Профиль live-матча', 'Layout Settings', 'Проверить preview и применить профиль через confirm.', 'Live layout обновлен; при error остается предыдущий профиль.'],
};

export function renderFlowsOverview(flows) {
  const cards = flows.map((flow, index) => {
    const details = flowDetails[flow] || [flow, 'Unknown route', 'Проверить идентификатор сценария.', 'Показать error без изменения snapshot.'];
    return `
      <article class="flow-card">
        <header><span class="flow-index">${String(index + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(details[0])}</h2><code>${escapeHtml(flow)}</code></div></header>
        <div class="flow-step flow-start"><span>Старт</span><strong>${escapeHtml(details[1])}</strong></div>
        <div class="flow-step flow-action"><span>Действие</span><p>${escapeHtml(details[2])}</p></div>
        <div class="flow-step flow-result"><span>Результат</span><p>${escapeHtml(details[3])}</p></div>
      </article>
    `;
  }).join('');

  return `<section class="flows-screen"><header class="screen-header"><div><span class="eyebrow">Clickable map</span><h1>Prototype Flows</h1></div><span class="prototype-badge">${escapeHtml(flows.length)} MVP FLOWS</span></header><div class="flow-grid">${cards}</div></section>`;
}
