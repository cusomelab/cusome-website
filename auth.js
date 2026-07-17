(() => {
    const MEMBER_KEY = 'cusome_demo_members';
    const SESSION_KEY = 'cusome_demo_session';
    const SB_URL = 'https://mnsrdblidhporvmlmyzl.supabase.co';
    const SB_KEY = 'sb_publishable_BwchydZ_ZycoV7sgfkfDQA_hBJ_e6_W'; // publishable(공개) 키
    const requestedNext = new URLSearchParams(window.location.search).get('next') || '';
    const safeNext = /^(?:mypage|classroom|lesson)\.html(?:[?#].*)?$/.test(requestedNext) ? requestedNext : '';

    const readMembers = () => {
        try { return JSON.parse(localStorage.getItem(MEMBER_KEY)) || []; }
        catch { return []; }
    };

    const saveMembers = (members) => localStorage.setItem(MEMBER_KEY, JSON.stringify(members));
    const saveSession = (member) => localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role || 'member',
        signedInAt: new Date().toISOString()
    }));

    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.passwordToggle);
            if (!input) return;
            const visible = input.type === 'text';
            input.type = visible ? 'password' : 'text';
            button.setAttribute('aria-label', visible ? '비밀번호 보기' : '비밀번호 숨기기');
            button.textContent = visible ? '◉' : '○';
        });
    });

    const passwordInput = document.getElementById('signupPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    passwordInput?.addEventListener('input', () => {
        const value = passwordInput.value;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Za-z]/.test(value) && /\d/.test(value)) score++;
        if (value.length >= 12) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        passwordStrength.dataset.score = String(score);
    });

    const agreeAll = document.getElementById('agreeAll');
    agreeAll?.addEventListener('change', () => {
        document.querySelectorAll('.terms-box input[type="checkbox"]').forEach((checkbox) => {
            if (checkbox !== agreeAll) checkbox.checked = agreeAll.checked;
        });
    });

    document.getElementById('signupForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const error = document.getElementById('signupError');
        const data = Object.fromEntries(new FormData(form).entries());
        error.textContent = '';

        if (!data.name?.trim() || !data.phone?.trim() || !data.email?.trim()) {
            error.textContent = '이름, 휴대폰 번호와 이메일을 모두 입력해 주세요.';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            error.textContent = '올바른 이메일 형식으로 입력해 주세요.';
            return;
        }
        if (!/^[0-9-]{10,13}$/.test(data.phone)) {
            error.textContent = '휴대폰 번호를 숫자와 하이픈으로 정확히 입력해 주세요.';
            return;
        }
        if ((data.password || '').length < 8 || !/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) {
            error.textContent = '비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.';
            return;
        }
        if (data.password !== data.passwordConfirm) {
            error.textContent = '입력한 비밀번호가 서로 다릅니다.';
            return;
        }
        if (!document.querySelector('.required-term')?.checked) {
            error.textContent = '필수 약관에 동의해 주세요.';
            return;
        }

        const members = readMembers();
        if (members.some((member) => member.email.toLowerCase() === data.email.toLowerCase())) {
            error.textContent = '이미 가입된 이메일입니다.';
            return;
        }

        const member = {
            id: `CUS-${Date.now().toString().slice(-6)}`,
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
            marketing: Boolean(data.marketing),
            role: 'member',
            plan: '미구독',
            status: 'active',
            joinedAt: new Date().toISOString()
        };
        members.push(member);
        saveMembers(members);
        saveSession(member);
        error.className = 'form-success';
        error.textContent = '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.';
        window.setTimeout(() => { window.location.href = 'login.html?joined=1'; }, 700);
    });

    document.getElementById('loginForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const error = document.getElementById('loginError');
        error.className = 'form-error';
        error.textContent = '';
        if (!data.email || !data.password) {
            error.textContent = '이메일과 비밀번호를 입력해 주세요.';
            return;
        }
        const member = readMembers().find((item) => item.email.toLowerCase() === data.email.toLowerCase() && item.password === data.password);
        if (!member) {
            error.textContent = '일치하는 계정을 찾을 수 없습니다. 데모에서는 먼저 회원가입해 주세요.';
            return;
        }
        saveSession(member);
        error.className = 'form-success';
        error.textContent = `${member.name}님, 로그인되었습니다.`;
        window.setTimeout(() => {
            window.location.href = member.role === 'admin' ? 'admin.html' : (safeNext || 'mypage.html');
        }, 500);
    });

    document.getElementById('demoAdmin')?.addEventListener('click', () => {
        saveSession({ id: 'ADMIN-001', name: '한유창', email: 'admin@cusome.demo', role: 'admin' });
        window.location.href = 'admin.html';
    });

    if (new URLSearchParams(window.location.search).get('joined') === '1') {
        const error = document.getElementById('loginError');
        if (error) {
            error.className = 'form-success';
            error.textContent = '회원가입이 완료되었습니다. 가입한 계정으로 로그인해 주세요.';
        }
    }

    // ── Google 로그인 (Supabase Auth) ──────────────────────────────
    const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
    const statusEl = document.getElementById('loginError') || document.getElementById('signupError');
    const showAuthMessage = (message, ok) => {
        if (!statusEl) return;
        statusEl.className = ok ? 'form-success' : 'form-error';
        statusEl.textContent = message;
    };

    // 관리자 이메일 — 구글 로그인 시 이 목록이면 관리자 화면으로 (실제 등록 권한은 서버(Supabase RLS)가 별도로 검사)
    const ADMIN_EMAILS = ['upang1109@gmail.com', 'phoneeasy@naver.com'];

    const finishGoogleLogin = (user) => {
        const email = (user.email || '').toLowerCase();
        const meta = user.user_metadata || {};
        const name = (meta.full_name || meta.name || email.split('@')[0] || '회원').trim();
        const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'member';
        const members = readMembers();
        let member = members.find((item) => item.email.toLowerCase() === email);
        if (!member) {
            member = {
                id: `CUS-${Date.now().toString().slice(-6)}`,
                name, phone: '', email, password: '',
                marketing: false, role, plan: '미구독', status: 'active',
                joinedAt: new Date().toISOString(), provider: 'google'
            };
            members.push(member);
            saveMembers(members);
        } else {
            let changed = false;
            if (!member.name && name) { member.name = name; changed = true; }
            if (member.role !== role && role === 'admin') { member.role = 'admin'; changed = true; }
            if (changed) saveMembers(members);
        }
        saveSession(member);
        showAuthMessage(`${member.name}님, Google 계정으로 로그인되었습니다.`, true);
        window.setTimeout(() => {
            window.location.href = member.role === 'admin' ? 'admin.html' : (safeNext || 'mypage.html');
        }, 400);
    };

    // OAuth 콜백 오류 표시 (사용자가 동의 취소한 경우 등)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hashParams.get('error_description')) {
        showAuthMessage(decodeURIComponent(hashParams.get('error_description')), false);
    }

    // 구글 리다이렉트 복귀 시 세션 자동 처리
    if (sb) {
        sb.auth.getSession().then(({ data }) => {
            if (data && data.session && data.session.user) finishGoogleLogin(data.session.user);
        }).catch(() => {});
    }

    document.querySelectorAll('[data-google-login]').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!sb) { showAuthMessage('Google 로그인 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.', false); return; }
            button.disabled = true;
            const redirectTo = `${window.location.origin}/login.html${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}`;
            const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
            if (error) {
                showAuthMessage(`Google 로그인에 실패했습니다: ${error.message}`, false);
                button.disabled = false;
            }
        });
    });
})();
