/* ============================================================
   CROWN THE BARB — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── NAV SCROLL EFFECT ──────────────────────────────────────
  const navbar = document.getElementById('navbar');

  const handleNavScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();


  // ── MOBILE MENU ────────────────────────────────────────────
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });


  // ── SCROLL REVEAL ──────────────────────────────────────────
  const revealEls = document.querySelectorAll(
    '.service-card, .team-card, .testi-card, .gallery__item, .about__grid, .pillar, .b-detail, .stat'
  );

  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));


  // ── ACTIVE NAV LINK ────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');

  const activeLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${entry.target.id}`
            ? 'var(--gold)'
            : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => activeLinkObserver.observe(section));


  // ── SMOOTH NAV LINKS ───────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ── GALLERY LIGHTBOX (simple) ──────────────────────────────
  const galleryItems = document.querySelectorAll('.gallery__item');

  galleryItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const label = item.querySelector('.gallery__overlay span')?.textContent || '';

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(13,13,13,0.94);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        cursor: zoom-out; animation: fadeIn 0.3s ease;
      `;

      const lightboxImg = document.createElement('img');
      lightboxImg.src = img.src;
      lightboxImg.style.cssText = `
        max-width: 90vw; max-height: 80vh;
        object-fit: contain; border-radius: 4px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.6);
      `;

      const caption = document.createElement('p');
      caption.textContent = label;
      caption.style.cssText = `
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.1rem; font-style: italic;
        color: #C9A84C; margin-top: 1rem;
      `;

      const close = document.createElement('button');
      close.textContent = '✕';
      close.style.cssText = `
        position: absolute; top: 1.5rem; right: 2rem;
        background: none; border: none;
        color: #8A8478; font-size: 1.5rem;
        cursor: pointer;
      `;

      overlay.appendChild(close);
      overlay.appendChild(lightboxImg);
      overlay.appendChild(caption);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const closeOverlay = () => {
        overlay.remove();
        document.body.style.overflow = '';
      };
      overlay.addEventListener('click', closeOverlay);
      close.addEventListener('click', e => { e.stopPropagation(); closeOverlay(); });

      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', onKey); }
      });
    });
  });


  // ── COUNTER ANIMATION ─────────────────────────────────────
  const statNums = document.querySelectorAll('.stat__num');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const textContent = el.textContent;
        const match = textContent.match(/\d+/);
        if (!match) return;
        const target = parseInt(match[0]);
        const suffix = textContent.replace(/\d+/, '').trim();
        let count = 0;
        const step = Math.ceil(target / 40);
        const interval = setInterval(() => {
          count = Math.min(count + step, target);
          el.innerHTML = count + (suffix ? `<sup>${suffix}</sup>` : '');
          if (count >= target) clearInterval(interval);
        }, 35);
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => countObserver.observe(el));


  // ── CURSOR GLOW (desktop only) ────────────────────────────
  if (window.innerWidth > 768) {
    const cursor = document.createElement('div');
    cursor.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9998;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%);
      border-radius: 50%; transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
  }

});


// ── GLOBAL FUNCTIONS ──────────────────────────────────────────
function closeMobile() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.remove('open');
  document.body.style.overflow = '';
}

function handleBooking(e) {
  e.preventDefault();
  const success = document.getElementById('formSuccess');
  success.classList.add('show');

  // Scroll to success message
  success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Reset form after delay
  setTimeout(() => {
    e.target.reset();
    setTimeout(() => success.classList.remove('show'), 6000);
  }, 2000);
}
