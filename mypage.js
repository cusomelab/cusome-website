(() => {
    const SESSION_KEY = 'cusome_demo_session';
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { session = null; }
    if (!session) { window.location.replace('login.html'); return; }
    if (session.role === 'admin') { window.location.replace('admin.html'); return; }

    document.getElementById('memberName').textContent = session.name;
    document.getElementById('welcomeName').textContent = session.name;
    document.getElementById('memberEmail').textContent = session.email;
    document.getElementById('memberAvatar').textContent = session.name.slice(0, 1);

    const sidebar = document.getElementById('memberSidebar');
    const title = document.getElementById('memberViewTitle');
    const buttons = document.querySelectorAll('[data-member-view]');
    const views = document.querySelectorAll('.admin-view');
    const showView = (name) => {
        const target = document.getElementById(`member-view-${name}`);
        if (!target) return;
        views.forEach((view) => view.classList.toggle('active', view === target));
        buttons.forEach((button) => button.classList.toggle('active', button.dataset.memberView === name));
        title.textContent = target.dataset.title;
        sidebar.classList.remove('open');
    };
    buttons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.memberView)));
    document.getElementById('memberMobileToggle').addEventListener('click', () => sidebar.classList.toggle('open'));
    document.getElementById('memberLogout').addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        // Supabase(구글 로그인) 세션 토큰도 함께 제거 — 없으면 login.html에서 자동 재로그인됨
        Object.keys(localStorage).filter((key) => key.startsWith('sb-')).forEach((key) => localStorage.removeItem(key));
        window.location.href = 'login.html';
    });
})();
