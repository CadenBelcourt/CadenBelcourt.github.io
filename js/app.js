/* ==========================================================================
   Caden Belcourt - Main Application JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navigation & Active Link Highlight
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active Section Tracking
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // 3. Dark / Light Theme Switcher
  const themeToggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('caden-portfolio-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('caden-portfolio-theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`Switched to ${newTheme === 'light' ? 'Executive Light' : 'Sleek Dark'} theme`);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      if (theme === 'light') {
        icon.className = 'fa-solid fa-moon';
      } else {
        icon.className = 'fa-solid fa-sun';
      }
    }
  }

  // 4. Animated Skill Bars Observer
  const skillCards = document.querySelectorAll('.skill-card');
  const skillObserverOptions = {
    threshold: 0.3
  };

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.skill-progress-fill');
        if (fill) {
          const targetWidth = fill.getAttribute('data-level') || '85%';
          fill.style.width = targetWidth;
        }
        skillObserver.unobserve(entry.target);
      }
    });
  }, skillObserverOptions);

  skillCards.forEach(card => skillObserver.observe(card));

  // 5. One-Click Copy Buttons (Email & Phone)
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetText = btn.getAttribute('data-copy');
      if (targetText) {
        navigator.clipboard.writeText(targetText).then(() => {
          showToast(`Copied "${targetText}" to clipboard!`);
        }).catch(err => {
          console.error('Copy failed', err);
        });
      }
    });
  });

  // 6. Interactive Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      // Simulate successful form dispatch
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
        submitBtn.style.background = '#10b981';
        showToast('Thank you! Your message has been sent to Caden.');

        contactForm.reset();

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 3000);
      }, 1200);
    });
  }

  // 7. Toast Notification Utility
  function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    toast.innerHTML = `<i class="${iconClass}" style="color: ${type === 'success' ? '#10b981' : '#ef4444'}; font-size: 1.2rem;"></i> <span>${message}</span>`;
    
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  window.showToast = showToast;
});
