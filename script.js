// ===== Loading Screen =====
window.addEventListener('load', () => {
    const loader = document.getElementById('loadingScreen');
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 800);
    setTimeout(animateCounters, 1200);
});

// ===== Dark Mode =====
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

// ===== Navbar =====
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 50);
    backToTop.classList.toggle('visible', scrollY > 400);
});

// Mobile Menu
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const spans = mobileToggle.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    });
});

// ===== Counter Animation =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        if (!target) return;
        const duration = 2000;
        const start = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ===== Scroll Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.vod-card, .dl-item, .pricing-card, .review-card, .info-card, ' +
        '.instructor-grid, .cta-box, .faq-item, .section-header'
    );
    elements.forEach((el, i) => {
        el.classList.add('fade-up');
        const siblings = el.parentElement.children;
        const index = Array.from(siblings).indexOf(el);
        if (index < 6) el.classList.add('stagger-' + (index + 1));
        observer.observe(el);
    });
}

initScrollAnimations();

// ===== VOD Category Filter =====
const filterBtns = document.querySelectorAll('.filter-btn');
const vodCards = document.querySelectorAll('.vod-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;

        vodCards.forEach(card => {
            const categories = card.dataset.category || '';
            if (filter === 'all' || categories.includes(filter)) {
                card.style.display = '';
                card.style.animation = 'fadeIn 0.4s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ===== Download Tab Filter =====
const dlTabs = document.querySelectorAll('.dl-tab');
const dlItems = document.querySelectorAll('.dl-item');

dlTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        dlTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.tab;

        dlItems.forEach(item => {
            const itemType = item.dataset.type || '';
            if (type === 'all' || itemType === type) {
                item.style.display = '';
                item.style.animation = 'fadeIn 0.4s ease forwards';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Add fadeIn keyframes
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

// ===== Download Handler =====
function handleDownload(btn, filename) {
    const originalContent = btn.innerHTML;

    btn.classList.add('downloading');
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        다운로드 중...
    `;

    showToast('다운로드 시작', `${filename} 파일을 다운로드합니다.`);

    setTimeout(() => {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            완료!
        `;

        setTimeout(() => {
            btn.classList.remove('downloading');
            btn.innerHTML = originalContent;
        }, 2000);
    }, 1500);
}

// ===== Toast Notification =====
function showToast(title, message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Pricing Toggle =====
const pricingToggle = document.getElementById('pricingToggle');
const toggleLabels = document.querySelectorAll('.toggle-label');

pricingToggle.addEventListener('change', () => {
    const isYearly = pricingToggle.checked;

    toggleLabels.forEach(label => {
        label.classList.toggle('active',
            (isYearly && label.dataset.period === 'yearly') ||
            (!isYearly && label.dataset.period === 'monthly')
        );
    });

    document.querySelectorAll('.price-amount').forEach(el => {
        const monthly = el.dataset.monthly;
        const yearly = el.dataset.yearly;
        if (monthly === '0') return;

        const value = isYearly ? yearly : monthly;
        el.innerHTML = `<span class="price-currency">&#8361;</span>${value}<span class="price-period">/${isYearly ? '월 (연간)' : '월'}</span>`;
    });
});

// ===== Reviews Slider =====
const reviewsTrack = document.getElementById('reviewsTrack');
const reviewPrev = document.getElementById('reviewPrev');
const reviewNext = document.getElementById('reviewNext');
const dotsContainer = document.getElementById('reviewsDots');
let currentReview = 0;

function getReviewsPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
}

function getMaxSlide() {
    const cards = reviewsTrack.querySelectorAll('.review-card');
    return Math.max(0, cards.length - getReviewsPerView());
}

function updateReviewSlider() {
    const cardWidth = reviewsTrack.querySelector('.review-card').offsetWidth + 24;
    reviewsTrack.style.transform = `translateX(-${currentReview * cardWidth}px)`;
    updateDots();
}

function createDots() {
    const maxSlide = getMaxSlide();
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxSlide; i++) {
        const dot = document.createElement('span');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentReview = i;
            updateReviewSlider();
        });
        dotsContainer.appendChild(dot);
    }
}

function updateDots() {
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentReview);
    });
}

createDots();

reviewNext.addEventListener('click', () => {
    currentReview = Math.min(currentReview + 1, getMaxSlide());
    updateReviewSlider();
});

reviewPrev.addEventListener('click', () => {
    currentReview = Math.max(currentReview - 1, 0);
    updateReviewSlider();
});

window.addEventListener('resize', () => {
    currentReview = Math.min(currentReview, getMaxSlide());
    createDots();
    updateReviewSlider();
});

// ===== FAQ Accordion =====
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
        });

        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ===== Video Modal =====
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');

document.querySelectorAll('.vod-play-overlay, .player-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

function closeModal() {
    videoModal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
videoModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal.classList.contains('active')) {
        closeModal();
    }
});

// ===== Smooth Scroll =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ===== Back to Top =====
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Contact Form =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        if (!data.name || !data.phone) {
            showToast('입력 오류', '이름과 연락처는 필수 입력 항목입니다.');
            return;
        }

        showToast('문의 접수 완료', '빠른 시일 내에 연락드리겠습니다.');
        this.reset();
    });
}

// ===== VOD Card Click (Modal) =====
vodCards.forEach(card => {
    card.addEventListener('click', () => {
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// ===== Active Nav Link on Scroll =====
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute('id');
        }
    });

    navLinkEls.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ===== Parallax Hero Glow =====
document.addEventListener('mousemove', (e) => {
    const glows = document.querySelectorAll('.hero-glow');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    glows.forEach((glow, i) => {
        const speed = (i + 1) * 15;
        glow.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});
