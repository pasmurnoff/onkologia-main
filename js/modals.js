(() => {
  const OPEN_ATTR = 'data-modal-open';
  const CLOSE_ATTR = 'data-modal-close';
  const openers = document.querySelectorAll(`[${OPEN_ATTR}]`);
  const modals = new Map();      // id -> modal
  const lastFocus = new Map();   // id -> element

  // Собираем модалки по id из кнопок
  openers.forEach(btn => {
    const id = btn.getAttribute(OPEN_ATTR);
    const modal = document.getElementById(`modal-${id}`);
    if (modal) modals.set(id, modal);
  });

  // Фокусируемый контент
  const focusable = sel =>
    sel.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

  // Блокируем/возвращаем скролл (и компенсация ширины скроллбара)
  const lockScroll = (lock) => {
    if (lock) {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('--scrollbar', sw + 'px');
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('--scrollbar');
    }
  };

  // Открыть модалку
  function openModal(id, openerEl) {
    const modal = modals.get(id);
    if (!modal) return;
    // Закрываем другую, если открыта
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m => closeModal(m));

    lastFocus.set(id, openerEl || document.activeElement);
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);

    // Фокус-трап
    const focusables = Array.from(focusable(modal));
    (focusables[0] || modal).focus();

    modal.addEventListener('keydown', trap);
    function trap(e) {
      if (e.key === 'Escape') { closeModal(modal); return; }
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
    modal._trap = trap;
  }

  // Закрыть модалку
  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.removeEventListener('keydown', modal._trap);
    lockScroll(false);
    // вернуть фокус
    const id = modal.id.replace('modal-', '');
    const opener = lastFocus.get(id);
    if (opener && document.body.contains(opener)) opener.focus();
  }

  // Делегирование: открыть
  document.addEventListener('click', (e) => {
    const opener = e.target.closest(`[${OPEN_ATTR}]`);
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute(OPEN_ATTR), opener);
      return;
    }
    // делегирование закрытия
    if (e.target.closest(`[${CLOSE_ATTR}]`)) {
      const modal = e.target.closest('.modal');
      closeModal(modal);
    }
  });

  // Клик по фону закрывает
  document.querySelectorAll('.modal__backdrop').forEach(bg => {
    bg.addEventListener('click', () => closeModal(bg.closest('.modal')));
  });

  // Инициализация: все модалки скрыты для ассистивок
  document.querySelectorAll('.modal').forEach(m => m.setAttribute('aria-hidden', 'true'));
})();

// === Переключение между модалками (Контакты → Написать нам) ===

// Настройки текста для каждой опции
const optionConfig = {
  help: {
    title: 'Мне нужна помощь',
    placeholder: 'Какая помощь Вам нужна?'
  },
  donate: {
    title: 'Я хочу помочь',
    placeholder: 'Я хочу помочь'
  },
  other: {
    title: 'Другой вопрос',
    placeholder: 'Какой у Вас вопрос?'
  }
};

// Находим первую модалку
const contactModal = document.getElementById('modal-contact');
if (contactModal) {
  contactModal.addEventListener('click', e => {
    const item = e.target.closest('.contact-menu__element');
    if (!item) return;

    // Определяем, какая опция выбрана
    const titleText = (item.querySelector('.title span')?.textContent || '').trim();
    let key = 'other';
    if (titleText.includes('нужна помощь')) key = 'help';
    else if (titleText.includes('хочу помочь')) key = 'donate';

    const config = optionConfig[key];
    const writeModal = document.getElementById('modal-writeus');
    if (!writeModal) return;

    // Меняем заголовок и плейсхолдер
    const titleEl = writeModal.querySelector('#modal-title');
    const textarea = writeModal.querySelector('.form_textarea');
    if (titleEl) titleEl.textContent = config.title;
    if (textarea) textarea.placeholder = config.placeholder;

    // Закрываем первую модалку и открываем вторую
    contactModal.setAttribute('aria-hidden', 'true');
    writeModal.setAttribute('aria-hidden', 'false');

    // Фокус на первое поле формы
    const firstInput = writeModal.querySelector('.form_text');
    if (firstInput) firstInput.focus();
  });
}

// === Кнопка "Назад" во второй модалке ===
const writeModal = document.getElementById('modal-writeus');
if (writeModal) {
  const backBtn = writeModal.querySelector('.modal__back');
  backBtn?.addEventListener('click', e => {
    e.preventDefault();

    // закрываем вторую модалку
    writeModal.setAttribute('aria-hidden', 'true');

    // открываем первую
    const contactModal = document.getElementById('modal-contact');
    contactModal?.setAttribute('aria-hidden', 'false');

    // фокус возвращаем на первую кнопку списка
    const firstOption = contactModal.querySelector('.contact-menu__element');
    firstOption?.focus();
  });
}



// === Отправка формы из модалки "Написать нам" ===
const writeForm = document.getElementById('writeus-form');
if (writeForm) {
  writeForm.addEventListener('submit', async e => {
    e.preventDefault();

    const modal = document.getElementById('modal-writeus');
    const resultEl = modal.querySelector('.form-result');
    const titleEl = modal.querySelector('#modal-title');
    const formBody = modal.querySelector('.form');
    const textarea = writeForm.querySelector('.form_textarea');

    // Сохраняем тему (заголовок модалки)
    const subject = titleEl?.textContent?.trim() || 'Сообщение с сайта';

    // Собираем данные формы
    const formData = new FormData(writeForm);
    formData.append('subject', subject);

    // Показываем статус "Отправляем..."
    resultEl.hidden = false;
    resultEl.innerHTML = '<p>Отправляем сообщение...</p>';

    try {
      // === ЗАМЕНИ URL НИЖЕ НА СВОЙ ОБРАБОТЧИК ===
      const response = await fetch('./sends.php', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Успех
        writeForm.hidden = true; // скрыть
        writeForm.style.setProperty('display', 'none', 'important');
        modal.querySelector('#m-title').style.display = 'none';
        resultEl.innerHTML = `
          <div class="success" style="display: flex; flex-direction: column; justify-items: center;">
            <img src="./images/check.png" style="width: 60px; margin-bottom: 24px; align-self: center;">
            <h3 style="font-size: 20px; font-weight: 600; margin-top:0; color: var(--black); text-align: center; margin-bottom: 8px;">Ваша заявка отправлена!</h3>
            <span style="color: var(--silver-grey); font-size: 15px; font-weight: 500; margin-bottom: 36px; text-align: center;">Спасибо за заявку, мы с вами свяжемся!</span>
            <a class="btn_primary" style="display: flex; justify-content: center;" href=" ">Хорошо</a>
          </div>`;
      } else {
        throw new Error('Ошибка ответа сервера');
      }
    } catch (err) {
      // Ошибка
      writeForm.hidden = true; // скрыть
      modal.querySelector('#m-title').style.display = 'none';
      writeForm.style.setProperty('display', 'none', 'important');
      resultEl.innerHTML = `
            <div class="error">
          <h3>❌  Не удалось отправить</h3>
          <p>Попробуйте позже или свяжитесь с нами другим способом</p>
          <div class="error__contacts" style="display: flex;
    gap: 24px;
    justify-content: center;
    padding-top: 12px;">
          <a class="icon" href="https://vk.com/resheniezhitkzn">
          <svg width="24" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.8213 23.4674C8.13773 23.4674 0.903245 14.772 0.601807 0.302979H6.95518C7.16387 10.9229 11.8477 15.4212 15.5577 16.3488V0.302979H21.5403V9.46204C25.2039 9.06785 29.0526 4.89412 30.3511 0.302979H36.3337C35.3366 5.96075 31.1628 10.1345 28.1948 11.8504C31.1628 13.2416 35.9166 16.8821 37.7252 23.4674H31.1397C29.7253 19.0617 26.201 15.6531 21.5403 15.1894V23.4674H20.8213Z" style="fill: #111111;"></path>
                            </svg>
          </a>

          <a class="icon" href="https://vk.com/resheniezhitkzn">
          <svg width="24" height="24" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.52299 11.3315C11.5359 7.79737 17.5459 5.46748 20.553 4.34179C29.1389 1.12773 30.923 0.569414 32.0858 0.550978C32.3416 0.546923 32.9134 0.603968 33.2838 0.874482C33.5966 1.1029 33.6827 1.41146 33.7238 1.62802C33.765 1.84458 33.8163 2.33792 33.7755 2.7234C33.3103 7.12321 31.297 17.8004 30.2728 22.7282C29.8394 24.8134 28.9861 25.5125 28.1599 25.581C26.3645 25.7297 25.0012 24.5131 23.2623 23.4872C20.5412 21.8819 19.004 20.8825 16.3627 19.316C13.3102 17.5057 15.289 16.5107 17.0286 14.8845C17.4839 14.459 25.3944 7.98323 25.5475 7.39578C25.5667 7.32231 25.5844 7.04844 25.4037 6.90383C25.2229 6.75922 24.9561 6.80867 24.7635 6.848C24.4906 6.90375 20.1437 9.48961 11.7227 14.6056C10.4888 15.3681 9.37119 15.7397 8.36986 15.7202C7.26597 15.6987 5.14253 15.1585 3.56397 14.6966C1.62781 14.1302 0.0889805 13.8307 0.222978 12.8687C0.292772 12.3677 1.05944 11.8553 2.52299 11.3315Z" style="fill: #111111;"></path>
                            </svg>
          </a>
          
        </div>`;
      console.error(err);
    }
  });
}

(() => {
  const modal    = document.getElementById('modal-feedback');
  if (!modal) return;

  const form     = modal.querySelector('#feedback-form');
  const titleEl  = modal.querySelector('.js-modal-title, #modal-title');
  const resultEl = modal.querySelector('.form-feedback-result');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // показать лоадер
    if (resultEl) {
      resultEl.hidden = false;
      resultEl.innerHTML = '<p>Отправляем сообщение...</p>';
    }

    const data = new FormData(form);
    const subject = (titleEl?.textContent || 'Отзыв').trim();
    data.append('subject', subject);

    try {
      // ВАЖНО: не парсим JSON — просто проверяем статус
      const res = await fetch('/send-feedback.php', { method: 'POST', body: data });

      if (res.ok) {
        // успех
        if (form?.style) form.style.display = 'none';
        if (titleEl?.style) titleEl.style.display = 'none';
        if (resultEl) {
          resultEl.innerHTML = `
        <div class="success" style="display: flex; flex-direction: column; justify-items: center;">
            <img src="./images/check.png" style="width: 60px; margin-bottom: 24px; align-self: center;">
            <h3 style="font-size: 20px; font-weight: 600; margin-top:0; color: var(--black); text-align: center; margin-bottom: 8px;">Ваш отзыв отправлен</h3>
            <span style="color: var(--silver-grey); font-size: 15px; font-weight: 500; margin-bottom: 36px; text-align: center;">Мы опубликуем его после модерации!</span>
            <a class="btn_primary" style="display: flex; justify-content: center;" href=" ">Хорошо</a>
          </div>`;
        }
      } else {
        throw new Error('Server responded ' + res.status);
      }
    } catch (err) {
      // ошибка
      if (form?.style) form.style.display = 'none';
      if (titleEl?.style) titleEl.style.display = 'none';
      if (resultEl) {
        resultEl.innerHTML = `
       <div class="error">
          <h3>❌  Не удалось отправить</h3>
          <p>Попробуйте позже или свяжитесь с нами другим способом</p>
          <div class="error__contacts" style="display: flex;
    gap: 24px;
    justify-content: center;
    padding-top: 12px;">
          <a class="icon" href="https://vk.com/resheniezhitkzn">
          <svg width="24" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.8213 23.4674C8.13773 23.4674 0.903245 14.772 0.601807 0.302979H6.95518C7.16387 10.9229 11.8477 15.4212 15.5577 16.3488V0.302979H21.5403V9.46204C25.2039 9.06785 29.0526 4.89412 30.3511 0.302979H36.3337C35.3366 5.96075 31.1628 10.1345 28.1948 11.8504C31.1628 13.2416 35.9166 16.8821 37.7252 23.4674H31.1397C29.7253 19.0617 26.201 15.6531 21.5403 15.1894V23.4674H20.8213Z" style="fill: #111111;"></path>
                            </svg>
          </a>

          <a class="icon" href="https://vk.com/resheniezhitkzn">
          <svg width="24" height="24" viewBox="0 0 34 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.52299 11.3315C11.5359 7.79737 17.5459 5.46748 20.553 4.34179C29.1389 1.12773 30.923 0.569414 32.0858 0.550978C32.3416 0.546923 32.9134 0.603968 33.2838 0.874482C33.5966 1.1029 33.6827 1.41146 33.7238 1.62802C33.765 1.84458 33.8163 2.33792 33.7755 2.7234C33.3103 7.12321 31.297 17.8004 30.2728 22.7282C29.8394 24.8134 28.9861 25.5125 28.1599 25.581C26.3645 25.7297 25.0012 24.5131 23.2623 23.4872C20.5412 21.8819 19.004 20.8825 16.3627 19.316C13.3102 17.5057 15.289 16.5107 17.0286 14.8845C17.4839 14.459 25.3944 7.98323 25.5475 7.39578C25.5667 7.32231 25.5844 7.04844 25.4037 6.90383C25.2229 6.75922 24.9561 6.80867 24.7635 6.848C24.4906 6.90375 20.1437 9.48961 11.7227 14.6056C10.4888 15.3681 9.37119 15.7397 8.36986 15.7202C7.26597 15.6987 5.14253 15.1585 3.56397 14.6966C1.62781 14.1302 0.0889805 13.8307 0.222978 12.8687C0.292772 12.3677 1.05944 11.8553 2.52299 11.3315Z" style="fill: #111111;"></path>
                            </svg>
          </a>
          
        </div>`;
      }
      console.error(err);
    }
  });
})();
