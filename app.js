import { getLevel, MAX_LENGTH } from './translator.js';

const sourceInput = document.querySelector('#source-text');
const sourceTitle = document.querySelector('#source-title');
const resultTitle = document.querySelector('#result-title');
const levelInput = document.querySelector('#corporate-level');
const levelTitle = document.querySelector('#level-title');
const levelValue = document.querySelector('#level-value');
const levelName = document.querySelector('#level-name');
const levelDescription = document.querySelector('#level-description');
const rangeLabels = document.querySelectorAll('.range-labels span');
const characterCount = document.querySelector('#character-count');
const translateButton = document.querySelector('#translate-button');
const translateButtonLabel = translateButton.querySelector('span');
const result = document.querySelector('#result');
const resultText = document.querySelector('#result-text');
const emptyResult = document.querySelector('#empty-result');
const copyButton = document.querySelector('#copy-button');
const copyLabel = document.querySelector('#copy-label');
const copyStatus = document.querySelector('#copy-status');
const formMessage = document.querySelector('#form-message');
const exampleButtons = document.querySelectorAll('.example-button');
const directionButtons = document.querySelectorAll('.direction-button');

const examples = {
  forward: [
    ['Усталость', 'Я заебался, всё достало!!! Сил больше нет.'],
    ['Несогласие', 'Это хуйня какая-то, я с этим не согласен!'],
    ['Ошибка', 'Ничего не работает, всё сломалось к хуям!'],
    ['Отказ', 'Не буду это делать, отстаньте от меня.'],
  ],
  reverse: [
    ['Отказ', 'В текущей конфигурации задача требует дополнительной оценки моей вовлечённости.'],
    ['Усталость', 'Наблюдаю временное снижение личного ресурса на фоне интенсивной рабочей динамики.'],
    ['Ошибка', 'Выявился потенциал для повышения стабильности текущего решения.'],
    ['Сроки', 'Предлагаю провести переоценку приоритетов и сформировать взаимовыгодный временной контур.'],
  ],
};

let direction = 'forward';
let translationSource = '';
let activeController = null;
let generation = 0;
let levelTimer;
let copyTimer;

function updateLevel() {
  const level = getLevel(levelInput.value, direction);
  levelValue.value = `${level.value}%`;
  levelName.textContent = level.name;
  levelDescription.textContent = level.description;
  levelInput.style.setProperty('--range-progress', `${level.value}%`);
  levelInput.setAttribute('aria-valuetext', `${level.value} процентов, ${level.name}`);
}

function updateExamples() {
  exampleButtons.forEach((button, index) => {
    const [label, text] = examples[direction][index];
    button.textContent = label;
    button.dataset.example = text;
  });
}

function updateDirection() {
  const forward = direction === 'forward';
  levelTitle.textContent = forward ? 'Уровень корпоративного лицемерия' : 'Уровень эмоциональности';
  sourceTitle.textContent = forward ? 'Что вы действительно думаете' : 'Что написали по-корпоративному';
  resultTitle.textContent = forward ? 'Что можно отправить' : 'Что это значит по-человечески';
  sourceInput.placeholder = forward
    ? 'Например: «Я заебался, всё достало, сил больше нет!»'
    : 'Например: «Предлагаю синхронизировать ожидания и оптимизировать вектор взаимодействия»';
  translateButtonLabel.textContent = forward ? 'Перевести на корпоративный' : 'Перевести на человеческий';
  const labels = forward ? ['Честно', 'Дипломатично', 'Непробиваемо'] : ['Сдержанно', 'Эмоционально', 'Без цензуры'];
  rangeLabels.forEach((label, index) => {
    label.textContent = labels[index];
  });
  directionButtons.forEach((button) => {
    const active = button.dataset.direction === direction;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateExamples();
}

function setLoading(loading) {
  translateButton.disabled = loading;
  translateButtonLabel.textContent = loading
    ? 'Qwen3 генерирует…'
    : direction === 'forward' ? 'Перевести на корпоративный' : 'Перевести на человеческий';
  result.setAttribute('aria-busy', String(loading));
}

function cancelPending() {
  clearTimeout(levelTimer);
  activeController?.abort();
  activeController = null;
  generation += 1;
  setLoading(false);
}

function clearResult() {
  translationSource = '';
  resultText.hidden = true;
  resultText.textContent = '';
  resultText.classList.remove('is-loading');
  emptyResult.hidden = false;
  copyButton.disabled = true;
  copyStatus.textContent = '';
}

function updateCharacterCount() {
  characterCount.textContent = `${sourceInput.value.length} / ${MAX_LENGTH}`;
}

async function performTranslation(source = sourceInput.value) {
  const text = source.trim();
  cancelPending();
  if (!text) {
    clearResult();
    formMessage.textContent = 'Введите текст для перевода.';
    sourceInput.focus();
    return false;
  }
  if (text.length > MAX_LENGTH) {
    clearResult();
    formMessage.textContent = `Текст не должен превышать ${MAX_LENGTH} символов.`;
    return false;
  }

  translationSource = source;
  const requestId = generation;
  const controller = new AbortController();
  activeController = controller;
  setLoading(true);
  formMessage.textContent = '';
  copyStatus.textContent = '';
  copyButton.disabled = true;
  emptyResult.hidden = true;
  resultText.hidden = false;
  resultText.textContent = 'Локальная модель переписывает сообщение…';
  resultText.classList.add('is-loading');

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, level: Number(levelInput.value), direction }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Не удалось выполнить перевод.');
    if (requestId !== generation) return false;

    resultText.textContent = data.text;
    resultText.classList.remove('is-loading');
    copyButton.disabled = false;
    return true;
  } catch (error) {
    if (error.name === 'AbortError' || requestId !== generation) return false;
    clearResult();
    formMessage.textContent = error.message;
    return false;
  } finally {
    if (requestId === generation) {
      activeController = null;
      setLoading(false);
    }
  }
}

async function copyResult() {
  if (copyButton.disabled) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(resultText.textContent);
    } else {
      const helper = document.createElement('textarea');
      helper.value = resultText.textContent;
      helper.className = 'sr-only';
      document.body.append(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      if (!copied) throw new Error('Копирование не поддержалось браузером.');
    }
    copyLabel.textContent = 'Скопировано';
    copyStatus.textContent = 'Готово к отправке.';
  } catch {
    copyStatus.textContent = 'Не удалось скопировать. Выделите текст вручную.';
  }
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyLabel.textContent = 'Копировать';
  }, 2000);
}

sourceInput.addEventListener('input', () => {
  updateCharacterCount();
  formMessage.textContent = '';
  if (sourceInput.value !== translationSource) {
    cancelPending();
    clearResult();
  }
});

sourceInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    performTranslation();
  }
});

levelInput.addEventListener('input', () => {
  updateLevel();
  if (translationSource) {
    const source = translationSource;
    cancelPending();
    levelTimer = setTimeout(() => performTranslation(source), 500);
  }
});

directionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.direction === direction) return;
    const previousResult = copyButton.disabled ? '' : resultText.textContent;
    direction = button.dataset.direction;
    cancelPending();
    clearResult();
    if (previousResult) sourceInput.value = previousResult;
    formMessage.textContent = '';
    updateDirection();
    updateLevel();
    updateCharacterCount();
  });
});

translateButton.addEventListener('click', () => performTranslation());
copyButton.addEventListener('click', copyResult);

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sourceInput.value = button.dataset.example;
    updateCharacterCount();
    performTranslation();
  });
});

updateDirection();
updateLevel();
updateCharacterCount();
