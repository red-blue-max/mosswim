/* ============================================================
   MOSSWIM — общий скрипт сайта
   ------------------------------------------------------------
   ВАЖНО: перед публикацией вставьте ключ Web3Forms ниже.
   Получить: https://web3forms.com → Create Access Key
   Туда же подключается Telegram-уведомление (в кабинете Web3Forms).
   ============================================================ */

const MOSSWIM = {
  // TODO: заменить на реальный ключ Web3Forms
  accessKey: 'YOUR-WEB3FORMS-ACCESS-KEY',
  endpoint: 'https://api.web3forms.com/submit'
};

(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Мобильное меню ---------- */
  const burger = $('.burger');
  const nav    = $('#nav');
  const scrim  = $('.scrim');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-on');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      if (scrim) scrim.classList.toggle('is-on', open);
      document.body.classList.toggle('is-locked', open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', closeNav));
  }
  if (scrim) scrim.addEventListener('click', closeNav);

  /* ---------- Тень у прилипшей шапки ---------- */
  const header = $('.header');
  if (header) {
    const hero = $('.hero');
    if (hero) document.body.classList.add('has-hero');

    const onScroll = () => {
      header.classList.toggle('is-stuck', window.scrollY > 12);
      if (hero) {
        // Прозрачной шапка остаётся, пока под ней ещё есть главный экран
        const solidFrom = hero.offsetHeight - header.offsetHeight;
        document.body.classList.toggle('is-over-hero', window.scrollY < solidFrom);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ---------- Появление блоков при скролле ---------- */
  const reveals = $$('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Счётчики ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        cio.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const dur = 1400;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------- Слайдер отзывов (мобильный) ---------- */
  $$('.slider').forEach(sl => {
    const track = $('.slider__track', sl);
    if (!track) return;
    const shift = () => (track.firstElementChild ? track.firstElementChild.offsetWidth + 24 : 320);
    const prev = $('[data-slide="prev"]', sl);
    const next = $('[data-slide="next"]', sl);
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -shift(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left:  shift(), behavior: 'smooth' }));
  });

  /* ---------- Модальное окно записи ---------- */
  const modal = $('#booking');
  let lastFocus = null;

  function openModal(preset) {
    if (!modal) return;
    lastFocus = document.activeElement;
    if (preset) {
      const slot = $('#f-slot', modal);
      const title = $('#booking-sub', modal);
      if (slot) slot.value = preset;
      if (title) title.textContent = preset;
    }
    modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    const first = $('input[name="name"]', modal);
    if (first) setTimeout(() => first.focus(), 120);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  }
  window.mosswimOpenBooking = openModal;

  $$('[data-book]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.book || '');
    });
  });
  if (modal) {
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  /* ---------- Отправка форм через Web3Forms ---------- */
  $$('form[data-w3f]').forEach(form => {
    const msg = $('.form__msg', form);
    const btn = $('button[type="submit"]', form);
    const btnText = btn ? btn.textContent : '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (msg) { msg.className = 'form__msg'; msg.textContent = ''; }

      // Honeypot: боты отмечают скрытый чекбокс, живой человек его не видит
      if (form.botcheck && form.botcheck.checked) return;

      if (!MOSSWIM.accessKey || MOSSWIM.accessKey.indexOf('YOUR-') === 0) {
        if (msg) {
          msg.className = 'form__msg is-err';
          msg.textContent = 'Форма ещё не подключена: вставьте ключ Web3Forms в js/main.js (строка 15).';
        }
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      data.access_key = MOSSWIM.accessKey;
      data.subject = data.subject || ('Заявка с сайта mosswim.ru — ' + (data.form_name || 'форма'));
      data.from_name = 'Сайт MOSSWIM';
      data.page = location.pathname;

      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
      try {
        const res = await fetch(MOSSWIM.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
          form.reset();
          if (msg) {
            msg.className = 'form__msg is-ok';
            msg.textContent = 'Заявка отправлена. Администратор свяжется с вами в течение рабочего дня.';
          }
        } else {
          throw new Error(json.message || 'error');
        }
      } catch (err) {
        if (msg) {
          msg.className = 'form__msg is-err';
          msg.textContent = 'Не удалось отправить. Позвоните нам или напишите в Telegram.';
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
      }
    });
  });

  /* ---------- Аккордеоны ---------- */
  $$('.acc__btn').forEach(btn => {
    const panel = btn.nextElementSibling;
    if (!panel || !panel.classList.contains('acc__panel')) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));

      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        // после раскрытия отпускаем высоту, чтобы содержимое могло меняться
        panel.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'height') return;
          panel.removeEventListener('transitionend', done);
          if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
        });
      } else {
        // из auto в 0 браузер не анимирует — фиксируем текущую высоту,
        // принудительно пересчитываем макет и только потом схлопываем
        panel.style.height = panel.scrollHeight + 'px';
        void panel.offsetHeight;
        panel.style.height = '0px';
      }
    });
  });

  /* ---------- Индикатор прокрутки ---------- */
  if (!document.querySelector('.progress')) {
    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- Видео в главном экране ----------
     Подключаем ролик только там, где он действительно виден: на широких
     экранах и если человек не просил систему убавить анимацию. На телефоне
     вместо него работает фото, а трафик остаётся целым. */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo && heroVideo.dataset.src) {
    const wide = window.matchMedia('(min-width: 861px)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (wide && !calm) {
      const source = document.createElement('source');
      source.src = heroVideo.dataset.src;
      source.type = 'video/mp4';
      heroVideo.appendChild(source);
      heroVideo.load();
      // play() возвращает промис и может быть отклонён политикой автовоспроизведения
      const started = heroVideo.play();
      if (started) started.catch(() => {});
    }
  }

  /* ---------- Год в подвале ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Показ фото, если файл реально есть ----------
     Пока снимков нет, на их месте остаётся синяя заглушка, а сломанный
     <img> убираем — иначе браузер рисует поверх неё иконку «битая
     картинка». Уже загруженные проверяем отдельно: событие error могло
     сработать раньше, чем до них дошёл этот скрипт. */
  $$('.person__ph img, .pool__ph img, .prog__media img').forEach(img => {
    const drop = () => img.remove();
    // Фото может быть обёрнуто в <picture>, поэтому ищем именно рамку,
    // а не прямого родителя — иначе класс уйдёт не туда
    const frame = img.closest('.person__ph, .pool__ph, .prog__media');
    const mark = () => { if (frame) frame.classList.add('has-photo'); };
    if (img.complete) { if (img.naturalWidth === 0) drop(); else mark(); }
    img.addEventListener('error', drop);
    img.addEventListener('load', mark);
  });
})();
