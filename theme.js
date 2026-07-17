(() => {
    const STORAGE_KEY = 'cusome_theme';
    const saved = localStorage.getItem(STORAGE_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initial = saved || preferred;
    document.documentElement.dataset.theme = initial;

    const syncButtons = () => {
        const light = document.documentElement.dataset.theme === 'light';
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.setAttribute('aria-label', light ? '다크 모드로 전환' : '밝은 모드로 전환');
            button.setAttribute('title', light ? '다크 모드' : '밝은 모드');
            const icon = button.querySelector('[data-theme-icon]');
            if (icon) icon.textContent = light ? '☾' : '☼';
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        syncButtons();
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
                document.documentElement.dataset.theme = next;
                localStorage.setItem(STORAGE_KEY, next);
                syncButtons();
            });
        });
    });
})();
