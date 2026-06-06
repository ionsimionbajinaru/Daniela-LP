const waitlistDialog = document.querySelector('#waitlistDialog');
const waitlistForm = document.querySelector('#waitlistForm');
const formNote = document.querySelector('#formNote');
let fallbackFormNote = null;
const openButtons = document.querySelectorAll('[data-open-waitlist]');
const closeButton = document.querySelector('[data-close-waitlist]');
const revealItems = document.querySelectorAll('.reveal');
const progressBar = document.querySelector('.scroll-progress');
const hero = document.querySelector('.hero');
const heroTitle = document.querySelector('[data-animate-title]');
const stickyMobileCta = document.querySelector('.sticky-mobile-cta');
const parallaxItems = document.querySelectorAll('[data-parallax]');
const tiltCards = document.querySelectorAll('.lux-card, .program-panel, .final-cta, .transform-card, .bonus-card, .student-result-card, .review-frame');
const visualPlaceholderImages = document.querySelectorAll('[data-visual-placeholder]');
const telegramRedirectUrl = waitlistDialog?.dataset.telegramUrl || 'https://t.me/daniela';
// Pune aici URL-ul de Google Apps Script / webhook dacă nu vrei să îl setezi în HTML.
// Exemplu Google Apps Script Web App: https://script.google.com/macros/s/AKfycb.../exec
const GOOGLE_SHEETS_ENDPOINT_URL = '';
const waitlistEndpointUrl =
  waitlistForm?.dataset.endpointUrl?.trim() || GOOGLE_SHEETS_ENDPOINT_URL.trim();
const waitlistEndpointMode = waitlistForm?.dataset.endpointMode || 'no-cors';
const submitButton = waitlistForm?.querySelector('button[type="submit"]');
const defaultSubmitButtonText = submitButton?.textContent || 'Trimite înscrierea';
const telegramRedirectDelay = 1200;

const normalizeWaitlistEntry = (formData) => ({
  nume: formData.get('nume')?.toString().trim() || '',
  email: formData.get('email')?.toString().trim() || '',
  telefon: formData.get('telefon')?.toString().trim() || '',
  instagram: formData.get('instagram')?.toString().trim() || '',
  rezultatIdealQuantum: formData.get('rezultatIdealQuantum')?.toString().trim() || '',
  nivelPregatire: formData.get('nivelPregatire')?.toString().trim() || '',
  sursa: 'Landing Page QUANTUM',
  trimisLa: new Date().toISOString(),
});

const saveLocalBackup = (entry) => {
  try {
    localStorage.setItem('quantumWaitlistEntry', JSON.stringify(entry));
  } catch (error) {
    // Backup-ul local este opțional; trimiterea către endpoint rămâne fluxul principal.
  }
};

const setFormSubmitting = (isSubmitting) => {
  if (!submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Se trimite...' : defaultSubmitButtonText;
};

const sendWaitlistEntry = async (entry) => {
  if (!waitlistEndpointUrl) {
    throw new Error(
      'Endpoint lipsă: setează URL-ul de Google Apps Script / webhook în data-endpoint-url sau în GOOGLE_SHEETS_ENDPOINT_URL.'
    );
  }

  const response = await fetch(waitlistEndpointUrl, {
    method: 'POST',
    mode: waitlistEndpointMode,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(entry),
    keepalive: true,
  });

  if (waitlistEndpointMode !== 'no-cors' && !response.ok) {
    throw new Error(`Endpoint-ul a răspuns cu status ${response.status}.`);
  }
};

const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const hasParallaxItems = parallaxItems.length > 0;
let scrollFrameId = null;

const prefersReducedMotion = () => reducedMotionQuery?.matches || false;

visualPlaceholderImages.forEach((image) => {
  const markImageAsMissing = () => {
    image.classList.add('is-missing');
    image.removeAttribute('src');
  };

  image.addEventListener('error', markImageAsMissing);

  if (image.complete && image.naturalWidth === 0) {
    markImageAsMissing();
  }
});

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

const showFormFeedback = (message, status = 'info') => {
  const note = formNote || fallbackFormNote || document.createElement('p');

  if (!formNote && !fallbackFormNote) {
    fallbackFormNote = note;
    note.className = 'form-note';
    waitlistForm?.appendChild(note);
  }

  note.setAttribute('aria-live', status === 'error' ? 'assertive' : 'polite');
  note.setAttribute('role', status === 'error' ? 'alert' : 'status');
  note.textContent = message;
  note.classList.toggle('success', status === 'success');
  note.classList.toggle('error', status === 'error');
};

waitlistForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!waitlistForm.checkValidity()) {
    waitlistForm.reportValidity();
    return;
  }

  const formData = new FormData(waitlistForm);
  const entry = normalizeWaitlistEntry(formData);

  setFormSubmitting(true);
  showFormFeedback('Trimitem înscrierea către lista QUANTUM...', 'info');
  let shouldUnlockForm = true;

  try {
    await sendWaitlistEntry(entry);
    saveLocalBackup(entry);
    shouldUnlockForm = false;

    showFormFeedback(
      'Înscriere primită cu succes. Te redirecționăm către Telegram pentru următorul pas.',
      'success'
    );
    waitlistForm.reset();

    window.setTimeout(() => {
      window.location.href = telegramRedirectUrl;
    }, telegramRedirectDelay);
  } catch (error) {
    showFormFeedback(
      `${error.message} Datele au rămas în formular. Te rugăm să încerci din nou sau să ne scrii direct pe Telegram.`,
      'error'
    );
  } finally {
    if (shouldUnlockForm) {
      setFormSubmitting(false);
    }
  }
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
