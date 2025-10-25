document.addEventListener('DOMContentLoaded', () => {

    /* -------------------------------
     * 1. Smooth Scrolling
     * ------------------------------- */
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Calculate offset (if header is sticky)
                const header = document.querySelector('.header-bar');
                const offset = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    /* -------------------------------
     * 2. Animated Sticky Header
     * ------------------------------- */
    const header = document.querySelector('.header-bar');
    if (header) {
        let lastScrollY = 0;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            // Add background / shrink effect when scrolling down
            if (currentScrollY > 80) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Slide-up animation when scrolling down, slide-down when scrolling up
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                header.classList.add('hide-header');
            } else {
                header.classList.remove('hide-header');
            }

            lastScrollY = currentScrollY;
        });
    }


    /* -------------------------------
     * 3. Mentor Image Sequential Animation
     * ------------------------------- */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 0.15}s`;
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.mentor-images img').forEach(img => {
        observer.observe(img);
    });


    /* -------------------------------
     * 4. Optional: Mobile Menu Toggle
     * ------------------------------- */
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-links');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const heroHeading = document.querySelector('.hero-content h1');
  if (heroHeading) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroHeading.classList.add('animate-pop');
          observer.unobserve(heroHeading);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(heroHeading);
  }
});
