const waitlistDialog = document.querySelector('#waitlistDialog');
const waitlistForm = document.querySelector('#waitlistForm');
const formNote = document.querySelector('#formNote');
const openButtons = document.querySelectorAll('[data-open-waitlist]');
const closeButton = document.querySelector('[data-close-waitlist]');
const revealItems = document.querySelectorAll('.reveal');

const openDialog = () => {
  if (!waitlistDialog) return;

  if (typeof waitlistDialog.showModal === 'function') {
    waitlistDialog.showModal();
    document.body.classList.add('dialog-open');
    return;
  }

  waitlistDialog.setAttribute('open', '');
  document.body.classList.add('dialog-open');
};

const closeDialog = () => {
  if (!waitlistDialog) return;

  waitlistDialog.close();
  document.body.classList.remove('dialog-open');
};

openButtons.forEach((button) => {
  button.addEventListener('click', openDialog);
});

closeButton?.addEventListener('click', closeDialog);

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

  formNote.textContent = 'Înscriere primită. Vei primi detaliile de preînscriere pe email.';
  formNote.classList.add('success');
  waitlistForm.reset();
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
