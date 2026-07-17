(() => {
    const SESSION_KEY = 'cusome_demo_session';
    const params = new URLSearchParams(location.search);
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { session = null; }
    if (!session && params.get('preview') === '1') {
        session = { id: 'STUDENT-001', name: '김크리에이터', email: 'creator@example.com', role: 'member' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    if (!session) {
        location.replace('login.html?next=classroom.html');
        return;
    }
    const name = session.role === 'admin' ? '관리자 미리보기' : (session.name || '회원');
    document.getElementById('studentName').textContent = name;
    document.getElementById('heroName').textContent = name;
    document.getElementById('studentAvatar').textContent = name.slice(0, 1);

    const toast = document.getElementById('classroomToast');
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
    document.querySelectorAll('[data-demo-download]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            showToast('데모 화면입니다. 운영 서버 연결 후 파일 다운로드가 시작됩니다.');
        });
    });
})();
