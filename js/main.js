// Ник Стаси в Telegram (без @). Форма записи открывает чат с этим ником
const TELEGRAM_USERNAME = 'Tttttttamua18';

// Часы для записи: с 9:00 до 18:00, в воскресенье до 17:00 (последняя запись за час до закрытия)
const FIRST_HOUR = 9;
const LAST_HOUR = 18;
const LAST_HOUR_SUNDAY = 17;

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Шапка: рамка после начала скролла ---------- */
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Плавное появление блоков ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

/* ---------- Звёзды в отзывах по data-rating ---------- */
document.querySelectorAll('.review').forEach((card) => {
  const rating = Math.max(0, Math.min(5, Number(card.dataset.rating) || 0));
  const box = card.querySelector('.review__stars');
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<svg class="${i > rating ? 'is-off' : ''}"><use href="#i-star"/></svg>`;
  }
  box.innerHTML = html;
  box.setAttribute('aria-label', `Оцінка ${rating} з 5`);
  box.removeAttribute('aria-hidden');
  box.setAttribute('role', 'img');
});

/* ---------- Галерея: лайтбокс со стрелками, Esc и свайпами ---------- */
const shots = [...document.querySelectorAll('.shot')];
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCount = document.getElementById('lightboxCount');
let current = 0;

function showShot(index) {
  // Зацикливаем: после последнего фото снова первое
  current = (index + shots.length) % shots.length;
  const img = shots[current].querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCount.textContent = `${current + 1} / ${shots.length}`;
}

shots.forEach((shot, i) => {
  shot.addEventListener('click', () => {
    showShot(i);
    lightbox.showModal();
  });
});

document.getElementById('lightboxClose').addEventListener('click', () => lightbox.close());
document.getElementById('lightboxPrev').addEventListener('click', () => showShot(current - 1));
document.getElementById('lightboxNext').addEventListener('click', () => showShot(current + 1));
// Клик по фону (не по фото и не по кнопкам) закрывает. Esc закрывает сам <dialog>
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
lightbox.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showShot(current - 1);
  if (e.key === 'ArrowRight') showShot(current + 1);
});

// Свайп: влево/вправо листает, вверх/вниз закрывает
let touchX = 0;
let touchY = 0;
lightbox.addEventListener('touchstart', (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) < 50 && Math.abs(dy) < 50) return; // это был тап, а не свайп
  if (Math.abs(dx) > Math.abs(dy)) {
    showShot(dx < 0 ? current + 1 : current - 1);
  } else {
    lightbox.close();
  }
});

/* ---------- Форма записи ---------- */
const form = document.getElementById('bookingForm');
const fields = {
  name: document.getElementById('f-name'),
  phone: document.getElementById('f-phone'),
  service: document.getElementById('f-service'),
  date: document.getElementById('f-date'),
  time: document.getElementById('f-time'),
  comment: document.getElementById('f-comment'),
};
const status = document.getElementById('formStatus');

// Дата в формате YYYY-MM-DD по местному времени (toISOString дал бы UTC и мог сдвинуть день)
function toInputDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Прошедшие даты выбрать нельзя
fields.date.min = toInputDate(new Date());

// Варианты времени зависят от дня недели: в воскресенье до 17:00
function fillTimes() {
  const selected = fields.time.value;
  let last = LAST_HOUR;
  if (fields.date.value) {
    const [y, m, d] = fields.date.value.split('-').map(Number);
    if (new Date(y, m - 1, d).getDay() === 0) last = LAST_HOUR_SUNDAY;
  }
  fields.time.innerHTML = '<option value="">Будь-який</option>';
  for (let h = FIRST_HOUR; h <= last; h++) {
    const value = `${h}:00`;
    fields.time.add(new Option(value, value, false, value === selected));
  }
}
fillTimes();
fields.date.addEventListener('change', fillTimes);

// Кнопка «Записатися» у услуги: выбираем её в форме и скроллим к форме
document.querySelectorAll('.price__book').forEach((btn) => {
  btn.addEventListener('click', () => {
    fields.service.value = btn.dataset.service;
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    // Фокус на имя без повторного скролла, чтобы сразу начать вводить
    setTimeout(() => fields.name.focus({ preventScroll: true }), 500);
  });
});

function setError(input, message) {
  input.closest('.field').classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  const error = document.getElementById(`${input.id}-error`);
  error.textContent = message;
  if (message) input.setAttribute('aria-describedby', error.id);
}

function validate() {
  let firstInvalid = null;
  const check = (input, message) => {
    setError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  };

  check(fields.name, fields.name.value.trim() ? '' : 'Вкажіть, як до вас звертатися');

  // В номере должно быть хотя бы 10 цифр: 0XX XXX XX XX или +380 XX XXX XX XX
  const digits = fields.phone.value.replace(/\D/g, '');
  check(fields.phone, digits.length >= 10 ? '' : 'Вкажіть номер телефону, наприклад +380 67 123 45 67');

  check(fields.date, fields.date.value && fields.date.value < fields.date.min ? 'Цей день уже минув, оберіть інший' : '');

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

// «пт, 30.10.2026» — понятнее, чем 2026-10-30
function formatDate(value) {
  if (!value) return 'будь-який';
  const [y, m, d] = value.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString('uk-UA', { weekday: 'short' });
  return `${weekday}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

function buildMessage() {
  return [
    'Привіт! Хочу записатися 🙂',
    `Ім'я: ${fields.name.value.trim()}`,
    `Телефон: ${fields.phone.value.trim()}`,
    `Послуга: ${fields.service.value}`,
    `День: ${formatDate(fields.date.value)}`,
    `Час: ${fields.time.value || 'будь-який'}`,
    `Коментар: ${fields.comment.value.trim() || '—'}`,
  ].join('\n');
}

// Копируем синхронно через скрытый textarea: это успевает до того, как новая вкладка
// заберёт фокус. navigator.clipboard асинхронный и без фокуса на странице может не сработать
function copyText(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  return ok;
}

function showStatus(copied, text) {
  status.innerHTML = '';
  const note = document.createElement('p');
  if (copied) {
    note.textContent = 'Текст заявки скопійовано — вставте його в чат, якщо він не з\'явився.';
    status.append(note);
  } else {
    // Буфер недоступен: показываем текст, чтобы его можно было скопировать вручную
    note.textContent = 'Якщо текст не з\'явився в чаті, скопіюйте його звідси:';
    const pre = document.createElement('pre');
    pre.textContent = text;
    status.append(note, pre);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;

  const text = buildMessage();
  const url = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;

  const copied = copyText(text);
  showStatus(copied, text);

  // window.open вызываем прямо в обработчике отправки, иначе браузер может принять вкладку за всплывающее окно.
  // Без 'noopener' в параметрах: с ним window.open всегда возвращает null и мы не узнаем, открылась ли вкладка
  const tab = window.open(url, '_blank');
  if (tab) {
    tab.opener = null;
  } else {
    window.location.href = url; // вкладку заблокировали: открываем в этой же
  }
});

// Ошибку у поля убираем, как только человек начал исправлять
[fields.name, fields.phone, fields.date].forEach((input) => {
  input.addEventListener('input', () => setError(input, ''));
});
