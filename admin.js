(() => {
    const SESSION_KEY = 'cusome_demo_session';
    const MEMBER_KEY = 'cusome_demo_members';
    const params = new URLSearchParams(window.location.search);
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { session = null; }

    if ((!session || session.role !== 'admin') && params.get('preview') === '1') {
        session = { id: 'ADMIN-001', name: '한유창', email: 'admin@cusome.demo', role: 'admin' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    if (!session || session.role !== 'admin') {
        window.location.replace('login.html');
        return;
    }

    const navButtons = document.querySelectorAll('[data-view]');
    const views = document.querySelectorAll('.admin-view');
    const viewTitle = document.getElementById('currentViewTitle');
    const sidebar = document.getElementById('adminSidebar');
    const toast = document.getElementById('adminToast');

    const showView = (name) => {
        const target = document.getElementById(`view-${name}`);
        if (!target) return;
        views.forEach((view) => view.classList.toggle('active', view === target));
        navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === name));
        viewTitle.textContent = target.dataset.title || '관리자 콘솔';
        sidebar.classList.remove('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navButtons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
    document.querySelectorAll('[data-open-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.openView)));

    document.getElementById('adminMobileToggle')?.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.getElementById('logoutButton')?.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    });

    document.getElementById('adminDate').textContent = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    }).format(new Date());

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2200);
    };
    document.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));

    document.querySelectorAll('.switch').forEach((button) => {
        button.addEventListener('click', () => {
            const on = !button.classList.contains('on');
            button.classList.toggle('on', on);
            button.setAttribute('aria-pressed', String(on));
            showToast(on ? '해당 기능을 활성화했습니다.' : '해당 기능을 비활성화했습니다.');
        });
    });

    const mediaModal = document.getElementById('mediaModal');
    const mediaModalPlayer = document.getElementById('mediaModalPlayer');
    const videoDropzone = document.getElementById('videoDropzone');
    const videoFileInput = document.getElementById('videoFileInput');
    const uploadFileList = document.getElementById('uploadFileList');
    const processingList = document.getElementById('processingList');
    const videoLibrary = document.getElementById('videoLibrary');
    const processingCount = document.getElementById('processingCount');
    const objectUrls = new Set();

    const openMedia = (kind, source) => {
        if (!mediaModal || !mediaModalPlayer) return;
        if (kind === 'video' && source) {
            mediaModalPlayer.innerHTML = `<video src="${source}" controls autoplay playsinline></video>`;
        } else if (kind === 'youtube' && source) {
            mediaModalPlayer.innerHTML = `<iframe src="${source}" title="YouTube 영상 미리보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            mediaModalPlayer.innerHTML = '<div class="youtube-placeholder"><span>▶</span><b>미리보기 준비 중</b><small>실제 업로드 파일 또는 YouTube URL을 선택해 주세요.</small></div>';
        }
        mediaModal.classList.add('open');
        mediaModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeMedia = () => {
        if (!mediaModal || !mediaModalPlayer) return;
        mediaModal.classList.remove('open');
        mediaModal.setAttribute('aria-hidden', 'true');
        mediaModalPlayer.querySelector('video')?.pause();
        mediaModalPlayer.querySelector('iframe')?.setAttribute('src', 'about:blank');
        document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-close-media]').forEach((element) => element.addEventListener('click', closeMedia));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMedia(); });
    document.querySelectorAll('[data-library-preview], .preview-local').forEach((button) => button.addEventListener('click', () => openMedia('placeholder')));

    const formatBytes = (bytes) => {
        if (!bytes) return '0 MB';
        return `${(bytes / 1024 / 1024).toFixed(bytes > 104857600 ? 0 : 1)} MB`;
    };

    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);

    const addLibraryVideo = (file, source) => {
        const card = document.createElement('article');
        card.className = 'video-item';
        const safeName = escapeHtml(file.name);
        card.innerHTML = `<div class="video-thumb purple"><span>LOCAL</span><button type="button" aria-label="${safeName} 미리보기">▶</button></div><div class="video-meta"><span class="status-badge paused">로컬</span><h3>${escapeHtml(file.name.replace(/\.[^.]+$/, ''))}</h3><p>${formatBytes(file.size)} · 방금 추가</p></div>`;
        card.querySelector('button').addEventListener('click', () => openMedia('video', source));
        videoLibrary?.prepend(card);
    };

    const handleVideoFiles = (files) => {
        const videos = Array.from(files || []).filter((file) => file.type.startsWith('video/'));
        if (!videos.length) { showToast('MP4, WebM 또는 MOV 영상 파일을 선택해 주세요.'); return; }
        uploadFileList?.querySelector('.empty-upload')?.remove();
        videos.forEach((file) => {
            const source = URL.createObjectURL(file);
            objectUrls.add(source);
            const safeName = escapeHtml(file.name);
            const uploadRow = document.createElement('div');
            uploadRow.className = 'upload-file';
            uploadRow.innerHTML = `<span>MP4</span><div><b>${safeName}</b><small>${formatBytes(file.size)} · 브라우저 로컬 미리보기</small></div><em>준비됨</em>`;
            uploadFileList?.append(uploadRow);

            const queueRow = document.createElement('div');
            queueRow.className = 'processing-item';
            queueRow.dataset.state = 'processing';
            queueRow.innerHTML = `<span class="file-type">VID</span><div class="processing-info"><b>${safeName}</b><small>업로드 준비 · 0%</small><div class="processing-bar"><i style="width:0"></i></div></div><span class="status-badge waiting">처리 중</span><button type="button" aria-label="${safeName} 처리 메뉴">•••</button>`;
            processingList?.prepend(queueRow);
            let progress = 0;
            const timer = window.setInterval(() => {
                progress = Math.min(100, progress + 8 + Math.round(Math.random() * 13));
                queueRow.querySelector('.processing-bar i').style.width = `${progress}%`;
                queueRow.querySelector('.processing-info small').textContent = `브라우저 처리 · ${progress}%`;
                if (progress >= 100) {
                    window.clearInterval(timer);
                    queueRow.dataset.state = 'done';
                    queueRow.querySelector('.status-badge').className = 'status-badge';
                    queueRow.querySelector('.status-badge').textContent = '완료';
                    queueRow.querySelector('.processing-info small').textContent = `처리 완료 · ${formatBytes(file.size)}`;
                    const preview = queueRow.querySelector('button');
                    preview.textContent = '보기';
                    preview.setAttribute('aria-label', `${file.name} 미리보기`);
                    preview.addEventListener('click', () => openMedia('video', source));
                    addLibraryVideo(file, source);
                    showToast(`${file.name} 처리가 완료되었습니다.`);
                }
            }, 110);
        });
        processingCount.textContent = String(document.querySelectorAll('.processing-item[data-state="processing"], .processing-item[data-state="waiting"]').length);
    };

    videoDropzone?.addEventListener('click', () => videoFileInput.click());
    videoDropzone?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); videoFileInput.click(); } });
    videoFileInput?.addEventListener('change', () => handleVideoFiles(videoFileInput.files));
    ['dragenter', 'dragover'].forEach((name) => videoDropzone?.addEventListener(name, (event) => { event.preventDefault(); videoDropzone.classList.add('dragging'); }));
    ['dragleave', 'drop'].forEach((name) => videoDropzone?.addEventListener(name, (event) => { event.preventDefault(); videoDropzone.classList.remove('dragging'); }));
    videoDropzone?.addEventListener('drop', (event) => handleVideoFiles(event.dataTransfer.files));

    const getYoutubeId = (input) => {
        try {
            const url = new URL(input.trim());
            if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
            if (url.hostname.endsWith('youtube.com')) {
                if (url.pathname === '/watch') return url.searchParams.get('v') || '';
                const parts = url.pathname.split('/').filter(Boolean);
                if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || '';
            }
        } catch { return ''; }
        return '';
    };

    document.getElementById('loadYoutube')?.addEventListener('click', () => {
        const input = document.getElementById('youtubeUrl');
        const error = document.getElementById('youtubeError');
        const id = getYoutubeId(input.value);
        if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
            error.textContent = '올바른 YouTube 영상 주소를 입력해 주세요.';
            return;
        }
        error.textContent = '';
        const source = `https://www.youtube-nocookie.com/embed/${id}`;
        document.getElementById('youtubePreview').innerHTML = `<iframe src="${source}" title="YouTube 영상 미리보기" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        showToast('YouTube 영상을 불러왔습니다.');
    });

    document.getElementById('clearCompleted')?.addEventListener('click', () => {
        processingList?.querySelectorAll('[data-state="done"]').forEach((item) => item.remove());
        showToast('완료된 처리 항목을 정리했습니다.');
    });

    const courseEditor = document.getElementById('courseEditorModal');
    const lessonDrawer = document.getElementById('lessonEditorDrawer');
    const courseCards = Array.from(document.querySelectorAll('.course-admin-card'));
    const courseSearch = document.getElementById('courseSearch');
    let activeCourseFilter = 'all';
    let editingCourseCard = null;
    let activeLessonRow = null;
    let activeLessonList = null;

    const setPageLock = () => {
        document.body.style.overflow = courseEditor?.classList.contains('open') || lessonDrawer?.classList.contains('open') || mediaModal?.classList.contains('open') ? 'hidden' : '';
    };
    const openCourseEditor = (title = '', card = null) => {
        if (!courseEditor) return;
        editingCourseCard = card;
        const nameInput = document.getElementById('editorCourseName');
        if (nameInput) nameInput.value = title;
        courseEditor.classList.add('open');
        courseEditor.setAttribute('aria-hidden', 'false');
        setPageLock();
        window.setTimeout(() => nameInput?.focus(), 100);
    };
    const closeCourseEditor = () => {
        courseEditor?.classList.remove('open');
        courseEditor?.setAttribute('aria-hidden', 'true');
        lessonDrawer?.classList.remove('open');
        lessonDrawer?.setAttribute('aria-hidden', 'true');
        setPageLock();
    };
    const openLessonEditor = (title = '', row = null, list = null) => {
        if (!lessonDrawer) return;
        activeLessonRow = row;
        activeLessonList = list || row?.closest('.curriculum-lessons') || null;
        const titleInput = document.getElementById('newLessonTitle');
        if (titleInput) titleInput.value = title;
        lessonDrawer.classList.add('open');
        lessonDrawer.setAttribute('aria-hidden', 'false');
        setPageLock();
        window.setTimeout(() => titleInput?.focus(), 100);
    };
    const closeLessonEditor = () => {
        lessonDrawer?.classList.remove('open');
        lessonDrawer?.setAttribute('aria-hidden', 'true');
        setPageLock();
    };

    const bindCourseCard = (card) => {
        const editButton = card.querySelector('.course-edit');
        editButton?.addEventListener('click', () => {
            const title = card.querySelector('h2')?.textContent?.trim() || '';
            openCourseEditor(title, card);
        });
        const courseSwitch = card.querySelector('.switch');
        if (courseSwitch && !courseSwitch.dataset.bound) {
            courseSwitch.dataset.bound = 'true';
            courseSwitch.addEventListener('click', () => {
                const on = !courseSwitch.classList.contains('on');
                courseSwitch.classList.toggle('on', on);
                courseSwitch.setAttribute('aria-pressed', String(on));
                card.dataset.courseState = on ? 'published' : 'draft';
                showToast(on ? '강의를 수강생에게 공개했습니다.' : '강의를 비공개로 전환했습니다.');
            });
        }
    };
    document.getElementById('newCourseButton')?.addEventListener('click', () => openCourseEditor('', null));
    document.querySelectorAll('.course-edit').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.course-admin-card');
            const title = card?.querySelector('h2')?.textContent?.trim() || '';
            openCourseEditor(title, card);
        });
    });
    document.querySelectorAll('[data-close-course]').forEach((button) => button.addEventListener('click', closeCourseEditor));
    document.querySelectorAll('[data-close-lesson]').forEach((button) => button.addEventListener('click', closeLessonEditor));
    document.querySelectorAll('.add-lesson-button').forEach((button) => button.addEventListener('click', () => openLessonEditor('', null, button.closest('.curriculum-chapter')?.querySelector('.curriculum-lessons'))));
    document.querySelectorAll('.curriculum-lesson>button').forEach((button) => {
        button.addEventListener('click', () => {
            const row = button.closest('.curriculum-lesson');
            openLessonEditor(row?.querySelector('b')?.textContent || '', row);
        });
    });

    document.querySelectorAll('[data-lesson-source]').forEach((button) => {
        button.addEventListener('click', () => {
            const source = button.dataset.lessonSource;
            document.querySelectorAll('[data-lesson-source]').forEach((tab) => tab.classList.toggle('active', tab === button));
            document.querySelectorAll('[data-source-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.sourcePanel === source));
        });
    });
    document.getElementById('saveLessonButton')?.addEventListener('click', () => {
        const titleInput = document.getElementById('newLessonTitle');
        const title = titleInput?.value.trim();
        if (!title) {
            showToast('차시 제목을 입력해 주세요.');
            titleInput?.focus();
            return;
        }
        const lessonList = activeLessonList || document.querySelector('.curriculum-chapter .curriculum-lessons');
        if (activeLessonRow) {
            activeLessonRow.querySelector('b').textContent = title;
        } else if (lessonList) {
            const lesson = document.createElement('div');
            lesson.className = 'curriculum-lesson';
            lesson.innerHTML = `<span class="drag-handle">⋮⋮</span><i class="lesson-type video">▶</i><div><b>${escapeHtml(title)}</b><small>새 콘텐츠 · 방금 추가</small></div><span class="lesson-resource">-</span><button type="button" aria-label="${escapeHtml(title)} 차시 편집">편집</button>`;
            lesson.querySelector('button').addEventListener('click', () => openLessonEditor(title, lesson));
            lessonList.append(lesson);
            const lessonTotal = document.getElementById('lessonTotal');
            if (lessonTotal) lessonTotal.textContent = String(Number(lessonTotal.textContent || 0) + 1);
        }
        titleInput.value = '';
        closeLessonEditor();
        showToast('차시 콘텐츠를 커리큘럼에 추가했습니다.');
    });
    document.getElementById('saveCourseButton')?.addEventListener('click', () => {
        const nameInput = document.getElementById('editorCourseName');
        const name = nameInput?.value.trim();
        if (!name) {
            showToast('강의명을 입력해 주세요.');
            nameInput?.focus();
            return;
        }
        if (editingCourseCard) {
            editingCourseCard.dataset.courseName = name;
            editingCourseCard.querySelector('h2').textContent = name;
            const coverTitle = editingCourseCard.querySelector('.course-cover>b');
            if (coverTitle) coverTitle.textContent = name;
        } else {
            const card = document.createElement('article');
            card.className = 'course-admin-card';
            card.dataset.courseState = 'draft';
            card.dataset.courseName = name;
            card.innerHTML = `<div class="course-cover master"><span>NEW COURSE</span><b>${escapeHtml(name)}</b><em>0 LESSONS</em></div><div class="course-admin-info"><div class="course-state-row"><span class="status-badge waiting">공개 준비</span><span>신규 과정</span></div><h2>${escapeHtml(name)}</h2><p>새 강의 설명과 커리큘럼을 입력해 주세요.</p><div class="course-data-row"><span><b>0</b> 차시</span><span><b>0분</b> 영상</span><span><b>0명</b> 수강</span><span><b>0%</b> 평균 진도</span></div><div class="course-admin-actions"><a class="admin-button" href="lesson.html?course=longform&preview=1" target="_blank">미리보기</a><button class="admin-button course-edit" type="button">커리큘럼 편집</button><button class="switch" type="button" aria-label="${escapeHtml(name)} 공개 상태" aria-pressed="false"></button></div></div>`;
            document.getElementById('courseAdminList')?.append(card);
            courseCards.push(card);
            bindCourseCard(card);
            const total = document.querySelector('.course-summary-grid article:first-child strong');
            if (total) total.textContent = String(courseCards.length);
        }
        renderCourseCards();
        closeCourseEditor();
        showToast('강의와 커리큘럼을 저장했습니다.');
    });
    document.getElementById('addChapterButton')?.addEventListener('click', () => {
        const builder = document.getElementById('curriculumList');
        if (!builder) {
            showToast('새 챕터를 추가할 수 없습니다.');
            return;
        }
        const number = builder.querySelectorAll('.curriculum-chapter').length + 1;
        const chapter = document.createElement('article');
        chapter.className = 'curriculum-chapter';
        chapter.innerHTML = `<header><span class="drag-handle">⋮⋮</span><div><small>CHAPTER ${String(number).padStart(2, '0')}</small><b>새 챕터</b></div><em>0개 차시 · 0분</em><button type="button" aria-label="새 챕터 메뉴">•••</button></header><div class="curriculum-lessons"></div><button class="add-lesson-button" type="button">＋ 이 챕터에 차시 추가</button>`;
        chapter.querySelector('.add-lesson-button').addEventListener('click', () => openLessonEditor('', null, chapter.querySelector('.curriculum-lessons')));
        builder.append(chapter);
        showToast('새 챕터를 추가했습니다.');
    });

    const renderCourseCards = () => {
        const query = (courseSearch?.value || '').trim().toLowerCase();
        const status = activeCourseFilter;
        courseCards.forEach((card) => {
            const text = card.textContent.toLowerCase();
            const cardStatus = card.dataset.courseState || 'published';
            card.hidden = !(text.includes(query) && (status === 'all' || status === cardStatus));
        });
    };
    courseSearch?.addEventListener('input', renderCourseCards);
    document.querySelectorAll('[data-course-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            activeCourseFilter = button.dataset.courseFilter || 'all';
            document.querySelectorAll('[data-course-filter]').forEach((tab) => tab.classList.toggle('active', tab === button));
            renderCourseCards();
        });
    });

    const resourceDropzone = document.getElementById('resourceDropzone');
    const resourceFileInput = document.getElementById('resourceFileInput');
    const resourceTableBody = document.getElementById('resourceTableBody');
    const resourceCount = document.getElementById('resourceCount');
    const resourceSearch = document.getElementById('resourceSearch');
    const resourceFilter = document.getElementById('resourceFilter');
    const resourceTypeMap = {
        '사용 가이드': 'guide',
        '실전 템플릿': 'template',
        '설치 파일': 'install',
        '예제 프로젝트': 'example'
    };

    const renderResources = () => {
        const query = (resourceSearch?.value || '').trim().toLowerCase();
        const type = resourceFilter?.value || 'all';
        resourceTableBody?.querySelectorAll('tr').forEach((row) => {
            row.hidden = !((row.textContent || '').toLowerCase().includes(query) && (type === 'all' || row.dataset.resourceType === type));
        });
    };
    const addResources = (files) => {
        const accepted = Array.from(files || []);
        if (!accepted.length) return;
        accepted.forEach((file) => {
            const typeLabel = document.getElementById('resourceType')?.value || '사용 가이드';
            const type = resourceTypeMap[typeLabel] || 'guide';
            const course = document.getElementById('resourceCourse')?.value || '전체 수강생 공통';
            const extension = (file.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
            const row = document.createElement('tr');
            row.dataset.resourceType = type;
            row.innerHTML = `<td><div class="resource-file-cell"><span class="${extension === 'XLSX' ? 'xlsx' : extension === 'ZIP' ? 'zip' : ''}">${escapeHtml(extension)}</span><div><b>${escapeHtml(file.name)}</b><small>방금 등록</small></div></div></td><td>${escapeHtml(course)}</td><td>${escapeHtml(typeLabel)}</td><td>${formatBytes(file.size)}</td><td>0회</td><td><span class="status-badge">공개</span></td><td><button class="table-action" type="button" aria-label="${escapeHtml(file.name)} 자료 메뉴">•••</button></td>`;
            row.querySelector('button').addEventListener('click', () => showToast('자료 관리 메뉴를 열었습니다.'));
            resourceTableBody?.prepend(row);
        });
        if (resourceCount) resourceCount.textContent = String(resourceTableBody?.querySelectorAll('tr').length || accepted.length);
        renderResources();
        showToast(`${accepted.length}개 학습 자료를 등록했습니다.`);
    };
    resourceDropzone?.addEventListener('click', () => resourceFileInput?.click());
    resourceDropzone?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            resourceFileInput?.click();
        }
    });
    resourceFileInput?.addEventListener('change', () => addResources(resourceFileInput.files));
    document.getElementById('resourceUploadButton')?.addEventListener('click', () => resourceFileInput?.click());
    ['dragenter', 'dragover'].forEach((name) => resourceDropzone?.addEventListener(name, (event) => {
        event.preventDefault();
        resourceDropzone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((name) => resourceDropzone?.addEventListener(name, (event) => {
        event.preventDefault();
        resourceDropzone.classList.remove('dragging');
    }));
    resourceDropzone?.addEventListener('drop', (event) => addResources(event.dataTransfer.files));
    resourceSearch?.addEventListener('input', renderResources);
    resourceFilter?.addEventListener('change', renderResources);
    resourceTableBody?.querySelectorAll('.table-action').forEach((button) => button.addEventListener('click', () => showToast('자료 관리 메뉴를 열었습니다.')));

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (lessonDrawer?.classList.contains('open')) closeLessonEditor();
        else if (courseEditor?.classList.contains('open')) closeCourseEditor();
    });

    window.addEventListener('beforeunload', () => objectUrls.forEach((url) => URL.revokeObjectURL(url)));

    const baseMembers = [
        { id:'CUS-001284', name:'김크리에이터', email:'creator@example.com', joinedAt:'2026-07-17', plan:'콘텐츠 번들', status:'active', last:'12분 전' },
        { id:'CUS-001283', name:'이셀러', email:'seller@example.com', joinedAt:'2026-07-17', plan:'롱폼', status:'active', last:'34분 전' },
        { id:'CUS-001282', name:'박스튜디오', email:'studio@example.com', joinedAt:'2026-07-16', plan:'숏폼', status:'waiting', last:'1시간 전' },
        { id:'CUS-001281', name:'최콘텐츠', email:'content@example.com', joinedAt:'2026-07-15', plan:'콘텐츠 번들', status:'active', last:'오늘' },
        { id:'CUS-001280', name:'정미디어', email:'media@example.com', joinedAt:'2026-07-13', plan:'미구독', status:'paused', last:'4일 전' }
    ];
    let localMembers = [];
    try { localMembers = JSON.parse(localStorage.getItem(MEMBER_KEY)) || []; } catch { localMembers = []; }
    const members = [...localMembers.map((member) => ({ ...member, last:'방금 전' })), ...baseMembers];
    document.getElementById('memberCount').textContent = String(128 + localMembers.length);

    const statusLabel = { active:'활성', waiting:'대기', paused:'중지' };
    const formatDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR').format(date);
    };
    const renderMembers = () => {
        const query = (document.getElementById('memberSearch')?.value || '').trim().toLowerCase();
        const filter = document.getElementById('memberStatus')?.value || 'all';
        const filtered = members.filter((member) => {
            const matchesText = member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query);
            return matchesText && (filter === 'all' || member.status === filter);
        });
        const body = document.getElementById('memberTableBody');
        if (!filtered.length) {
            body.innerHTML = '<tr><td class="empty-row" colspan="6">조건에 맞는 회원이 없습니다.</td></tr>';
            return;
        }
        body.innerHTML = filtered.map((member) => `
            <tr>
                <td><div class="member-cell"><span class="admin-avatar">${member.name.slice(0,1)}</span><div><b>${member.name}</b><small>${member.email}</small></div></div></td>
                <td>${formatDate(member.joinedAt)}</td><td>${member.plan || '미구독'}</td>
                <td><span class="status-badge ${member.status === 'active' ? '' : member.status}">${statusLabel[member.status] || '활성'}</span></td>
                <td>${member.last || '-'}</td><td><button class="table-action" type="button" aria-label="${member.name} 회원 메뉴" data-member-action="${member.id}">•••</button></td>
            </tr>`).join('');
        body.querySelectorAll('[data-member-action]').forEach((button) => button.addEventListener('click', () => showToast('회원 상세 관리 기능은 서버 연결 후 활성화됩니다.')));
    };
    document.getElementById('memberSearch')?.addEventListener('input', renderMembers);
    document.getElementById('memberStatus')?.addEventListener('change', renderMembers);
    renderMembers();
})();
