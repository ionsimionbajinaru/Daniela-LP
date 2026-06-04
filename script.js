const waitlistDialog = document.querySelector('#waitlistDialog');
const waitlistForm = document.querySelector('#waitlistForm');
const formNote = document.querySelector('#formNote');
const openButtons = document.querySelectorAll('[data-open-waitlist]');
const closeButton = document.querySelector('[data-close-waitlist]');
const revealItems = document.querySelectorAll('.reveal');
const progressBar = document.querySelector('.scroll-progress');
const hero = document.querySelector('.hero');
const heroTitle = document.querySelector('[data-animate-title]');
const stickyMobileCta = document.querySelector('.sticky-mobile-cta');
const parallaxItems = document.querySelectorAll('[data-parallax]');
const tiltCards = document.querySelectorAll('.lux-card, .program-panel, .final-cta');
const telegramRedirectUrl = waitlistDialog?.dataset.telegramUrl || 'https://t.me/daniela';
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const hasParallaxItems = parallaxItems.length > 0;
let scrollFrameId = null;

const prefersReducedMotion = () => reducedMotionQuery?.matches || false;

const splitHeroTitle = () => {
  if (!heroTitle) return;

  const words = heroTitle.textContent.trim().split(/\s+/);
  heroTitle.innerHTML = words
    .map((word, index) => `<span class="title-word" style="--word-index:${index}">${word}</span>`)
    .join(' ');
};

const openDialog = () => {
  if (!waitlistDialog) return;

  if (typeof waitlistDialog.showModal === 'function') {
    waitlistDialog.showModal();
  } else {
    waitlistDialog.setAttribute('open', '');
  }

  document.body.classList.add('dialog-open');
};

const closeDialog = () => {
  if (!waitlistDialog) return;

  if (typeof waitlistDialog.close === 'function') {
    waitlistDialog.close();
  } else {
    waitlistDialog.removeAttribute('open');
  }

  document.body.classList.remove('dialog-open');
};

const updateScrollProgress = () => {
  if (!progressBar) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;

  if (stickyMobileCta) {
    stickyMobileCta.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.45);
  }
};

const updateParallax = () => {
  if (!hasParallaxItems || prefersReducedMotion()) return;

  parallaxItems.forEach((item) => {
    const speed = Number(item.dataset.parallax) || 0.05;
    const rect = item.getBoundingClientRect();
    const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * speed;
    item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
  });
};

const runScheduledScrollUpdates = () => {
  scrollFrameId = null;
  updateScrollProgress();

  if (!prefersReducedMotion()) {
    updateParallax();
  }
};

const scheduleScrollUpdates = () => {
  if (scrollFrameId !== null) return;

  scrollFrameId = window.requestAnimationFrame(runScheduledScrollUpdates);
};

const updateHeroSpotlight = (event) => {
  if (!hero || window.innerWidth < 860) return;

  const rect = hero.getBoundingClientRect();
  const x = `${event.clientX - rect.left}px`;
  const y = `${event.clientY - rect.top}px`;
  hero.style.setProperty('--spotlight-x', x);
  hero.style.setProperty('--spotlight-y', y);
};

const resetMagneticButton = (button) => {
  button.style.setProperty('--magnet-x', '0px');
  button.style.setProperty('--magnet-y', '0px');
  button.style.setProperty('--button-rotate-x', '0deg');
  button.style.setProperty('--button-rotate-y', '0deg');
};

const addMagneticButton = (button) => {
  button.addEventListener('mousemove', (event) => {
    if (prefersReducedMotion() || window.innerWidth < 860) return;

    const rect = button.getBoundingClientRect();
    const relX = event.clientX - rect.left - rect.width / 2;
    const relY = event.clientY - rect.top - rect.height / 2;
    button.style.setProperty('--magnet-x', `${relX * 0.12}px`);
    button.style.setProperty('--magnet-y', `${relY * 0.18}px`);
    button.style.setProperty('--button-rotate-x', `${(-relY / rect.height) * 8}deg`);
    button.style.setProperty('--button-rotate-y', `${(relX / rect.width) * 10}deg`);
  });

  button.addEventListener('mouseleave', () => resetMagneticButton(button));
};

const addTiltCard = (card) => {
  card.addEventListener('mousemove', (event) => {
    if (prefersReducedMotion() || window.innerWidth < 860) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 5;
    const rotateX = ((y / rect.height) - 0.5) * -5;

    card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
};

splitHeroTitle();

window.addEventListener('load', () => {
  document.body.classList.add('is-loaded');
});

openButtons.forEach((button) => {
  button.addEventListener('click', openDialog);

  if (!prefersReducedMotion()) {
    addMagneticButton(button);
  }
});

if (!prefersReducedMotion()) {
  tiltCards.forEach(addTiltCard);
}

closeButton?.addEventListener('click', closeDialog);

hero?.addEventListener('mousemove', updateHeroSpotlight);

waitlistDialog?.addEventListener('click', (event) => {
  const dialogBox = waitlistDialog.getBoundingClientRect();
  const clickedBackdrop =
    event.clientX < dialogBox.left ||
    event.clientX > dialogBox.right ||
    event.clientY < dialogBox.top ||
    event.clientY > dialogBox.bottom;

  if (clickedBackdrop) closeDialog();
});

waitlistDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
});

waitlistForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(waitlistForm);
  const entry = Object.fromEntries(formData.entries());
  localStorage.setItem('premiumWaitlistEntry', JSON.stringify(entry));

  formNote.textContent = 'Înscriere primită. Te redirecționăm către Telegram pentru următorul pas.';
  formNote.classList.add('success');
  waitlistForm.reset();

  window.setTimeout(() => {
    window.location.href = telegramRedirectUrl;
  }, 1200);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

scheduleScrollUpdates();

window.addEventListener('scroll', scheduleScrollUpdates, { passive: true });
window.addEventListener('resize', scheduleScrollUpdates);
