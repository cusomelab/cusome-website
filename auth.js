(() => {
    const MEMBER_KEY = 'cusome_demo_members';
    const SESSION_KEY = 'cusome_demo_session';
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
})();
