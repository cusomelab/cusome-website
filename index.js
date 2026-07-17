(() => {
    document.body.classList.add('motion-ready');
    const header = document.getElementById('siteHeader');
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const backTop = document.getElementById('backTop');
    const workflow = document.getElementById('workflow');
    const workflowProgress = document.getElementById('workflowProgress');
    const accountLink = document.getElementById('accountLink');

    try {
        const session = JSON.parse(localStorage.getItem('cusome_demo_session'));
        if (session && accountLink) {
            accountLink.textContent = session.role === 'admin' ? '관리자' : '마이페이지';
            accountLink.href = session.role === 'admin' ? 'admin.html' : 'mypage.html';
        }
    } catch { /* 신규 방문자는 로그인 링크를 유지합니다. */ }

    const updateScrollUI = () => {
        const scrollY = window.scrollY;
        header?.classList.toggle('scrolled', scrollY > 18);
        backTop?.classList.toggle('visible', scrollY > 650);

        if (workflow && workflowProgress) {
            const rect = workflow.getBoundingClientRect();
            const travel = rect.height + window.innerHeight * 0.25;
            const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.72 - rect.top) / travel));
            workflowProgress.style.height = `${progress * 100}%`;
        }
    };

    menuToggle?.addEventListener('click', () => {
        const open = !mobileNav.classList.contains('open');
        mobileNav.classList.toggle('open', open);
        menuToggle.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });

    mobileNav?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', '메뉴 열기');
        });
    });

    backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px' });

    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    // Direct hash links, background tabs and older browsers must never leave content hidden.
    window.setTimeout(() => {
        document.querySelectorAll('.reveal:not(.visible)').forEach((element) => element.classList.add('visible'));
    }, 900);

    document.querySelectorAll('.faq-item').forEach((item) => {
        item.addEventListener('toggle', () => {
            if (!item.open) return;
            document.querySelectorAll('.faq-item[open]').forEach((other) => {
                if (other !== item) other.removeAttribute('open');
            });
        });
    });

    window.addEventListener('scroll', updateScrollUI, { passive: true });
    updateScrollUI();
})();
