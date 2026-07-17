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
        location.replace('login.html?next=lesson.html');
        return;
    }

    const course = params.get('course') || 'longform';
    const courseData = {
        longform: { title: '롱폼 에이전트 시작 가이드', total: 12 },
        shortform: { title: '숏폼 에이전트 시작 가이드', total: 10 },
        master: { title: '콘텐츠 자동화 운영 마스터', total: 24 }
    };
    const selectedCourse = courseData[course] || courseData.longform;
    document.getElementById('courseTitle').textContent = selectedCourse.title;
    document.getElementById('sidebarCourseTitle').textContent = selectedCourse.title;

    const lessonLinks = Array.from(document.querySelectorAll('.lesson-link'));
    const titles = lessonLinks.map((link) => link.querySelector('b').textContent);
    let currentIndex = Math.max(0, Math.min(lessonLinks.length - 1, Number(params.get('lesson') ?? 5)));
    const completedKey = `cusome_completed_${course}`;
    const notesKey = `cusome_notes_${course}`;
    let completed = [];
    try { completed = JSON.parse(localStorage.getItem(completedKey)) || [0, 1, 2, 3, 4]; } catch { completed = [0, 1, 2, 3, 4]; }

    const toast = document.getElementById('lessonToast');
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    };

    const render = () => {
        lessonLinks.forEach((link, index) => {
            link.classList.toggle('active', index === currentIndex);
            link.classList.toggle('completed', completed.includes(index));
            const marker = link.querySelector(':scope>span:first-child');
            const state = link.querySelector(':scope>em');
            if (completed.includes(index)) {
                marker.textContent = '✓';
                state.textContent = '완료';
            } else {
                marker.textContent = index === currentIndex ? '▶' : String(index + 1);
                state.textContent = index === currentIndex ? '학습 중' : '';
            }
        });
        const chapter = currentIndex < 3 ? 'CHAPTER 01 · 시작 전 준비' : currentIndex < 8 ? 'CHAPTER 02 · 첫 롱폼 자동 제작' : 'CHAPTER 03 · 반복 운영과 업로드';
        document.getElementById('lessonChapter').textContent = chapter;
        document.getElementById('lessonTitle').textContent = titles[currentIndex];
        document.getElementById('lessonPosition').textContent = `${currentIndex + 1} / ${selectedCourse.total} 차시`;
        document.getElementById('previousLesson').disabled = currentIndex === 0;
        document.getElementById('nextLesson').disabled = currentIndex === lessonLinks.length - 1;
        const completeButton = document.getElementById('completeLesson');
        const isDone = completed.includes(currentIndex);
        completeButton.classList.toggle('done', isDone);
        completeButton.textContent = isDone ? '✓ 학습 완료됨' : '✓ 학습 완료';
        const count = completed.length;
        const percent = Math.round((count / selectedCourse.total) * 100);
        document.getElementById('courseProgressBar').style.setProperty('--progress', `${percent}%`);
        document.getElementById('courseProgressText').textContent = `${count} / ${selectedCourse.total} 차시 완료 · ${percent}%`;
        document.getElementById('lessonContent').scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('lessonSidebar').classList.remove('open');
    };
    const goToLesson = (index) => {
        currentIndex = Math.max(0, Math.min(lessonLinks.length - 1, index));
        render();
    };
    lessonLinks.forEach((link, index) => link.addEventListener('click', () => goToLesson(index)));
    document.getElementById('previousLesson').addEventListener('click', () => goToLesson(currentIndex - 1));
    document.getElementById('nextLesson').addEventListener('click', () => goToLesson(currentIndex + 1));
    document.getElementById('completeLesson').addEventListener('click', () => {
        if (completed.includes(currentIndex)) completed = completed.filter((index) => index !== currentIndex);
        else completed.push(currentIndex);
        completed.sort((a, b) => a - b);
        localStorage.setItem(completedKey, JSON.stringify(completed));
        render();
        showToast(completed.includes(currentIndex) ? '학습 완료로 기록했습니다.' : '학습 완료 표시를 취소했습니다.');
    });
    document.getElementById('lessonMenuButton').addEventListener('click', () => document.getElementById('lessonSidebar').classList.toggle('open'));

    const notes = document.getElementById('lessonNotes');
    let storedNotes = {};
    try { storedNotes = JSON.parse(localStorage.getItem(notesKey)) || {}; } catch { storedNotes = {}; }
    notes.value = storedNotes[currentIndex] || '';
    notes.addEventListener('input', () => {
        storedNotes[currentIndex] = notes.value;
        localStorage.setItem(notesKey, JSON.stringify(storedNotes));
    });
    lessonLinks.forEach((link, index) => link.addEventListener('click', () => { notes.value = storedNotes[index] || ''; }));
    document.querySelectorAll('[data-demo-download]').forEach((link) => link.addEventListener('click', (event) => {
        event.preventDefault();
        showToast('운영 서버 연결 후 첨부 자료 다운로드가 시작됩니다.');
    }));
    render();
})();
