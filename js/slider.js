  (function () {
    const container = document.querySelector('.main-banner__text');
    if (!container) return;

    const slider = container.querySelector('.text-slider');
    const nav = container.querySelector('.text-slider__nav');
    const slides = Array.from(slider.querySelectorAll('.slide'));
    if (slides.length <= 1) return;

    const interval = Number(slider.dataset.interval) || 10000;
    let index = 0;
    let timer;

    // создать индикаторы по количеству слайдов
    const navItems = slides.map((_, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'nav-item';
      item.setAttribute('aria-label', `Слайд ${i + 1}`);
      item.addEventListener('click', () => {
        stop();
        goTo(i);
        start();
      });
      nav.appendChild(item);
      return item;
    });

    // утилиты
    function setContainerHeight(el) {
      slider.style.height = el.offsetHeight + 'px';
    }

    function resetProgressAnim(el) {
      // перезапуск CSS-анимации через reflow
      el.style.setProperty('--dur', (interval / 1000) + 's');
      el.classList.remove('is-active');
      // force reflow
      void el.offsetWidth;
      el.classList.add('is-active');
    }

    function updateNav() {
      navItems.forEach((item, i) => {
        item.classList.toggle('is-active', i === index);
        item.classList.toggle('is-complete', i < index);
        if (i === index) resetProgressAnim(item);
      });
    }

    function show(i) {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
      requestAnimationFrame(() => setContainerHeight(slides[i]));
      updateNav();
    }

    function goTo(i) {
      index = i % slides.length;
      if (index < 0) index = slides.length - 1;
      show(index);
    }

    function start() {
      timer = setInterval(() => goTo(index + 1), interval);
    }
    function stop() { clearInterval(timer); }

    // автопрогон
    window.addEventListener('load', () => {
      show(index);
      start();
    });

    // пауза при скрытии вкладки — чтобы индикатор не «убежал» в фоне
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else { // при возврате начинаем текущий слайд заново
        updateNav();
        start();
      }
    });

    // по желанию — пауза на ховер (перезапускает текущий прогресс при уходе курсора)
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', () => { updateNav(); start(); });

    // пересчёт высоты на ресайз
    window.addEventListener('resize', () => setContainerHeight(slides[index]));
  })();
