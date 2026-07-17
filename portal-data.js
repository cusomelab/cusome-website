/* portal-data.js — 포털 실데이터 연결 (Supabase)
   - 관리자: 유튜브 강의 등록/삭제, 자료(파일) 실제 업로드
   - 수강생: 강의실 자료 실제 다운로드, 강의 페이지 유튜브 재생
   demo 스텁(admin.js/classroom.js/lesson.js)은 그대로 두고, 이 파일이 뒤에 로드되며 실데이터로 덮어씁니다. */
(() => {
    const SB_URL = 'https://mnsrdblidhporvmlmyzl.supabase.co';
    const SB_KEY = 'sb_publishable_BwchydZ_ZycoV7sgfkfDQA_hBJ_e6_W'; // publishable(공개) 키
    const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
    if (!sb) return;

    const COURSES = { longform: '롱폼 에이전트', shortform: '숏폼 에이전트', master: '운영 마스터', all: '전체 공통' };
    const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]);
    const fmtBytes = (b) => !b ? '' : (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
    const extOf = (name) => (String(name).split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
    const toast = (msg) => {
        const t = document.getElementById('adminToast') || document.getElementById('classroomToast') || document.getElementById('lessonToast');
        if (!t) { console.log(msg); return; }
        t.textContent = msg; t.classList.add('show');
        clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
    };
    const stripListeners = (el) => { const c = el.cloneNode(true); el.replaceWith(c); return c; };
    const ytIdOf = (input) => {
        try {
            const url = new URL(String(input || '').trim());
            if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
            if (url.hostname.endsWith('youtube.com')) {
                if (url.pathname === '/watch') return url.searchParams.get('v') || '';
                const parts = url.pathname.split('/').filter(Boolean);
                if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || '';
            }
        } catch { /* not a url — 11자 ID 직접 입력 허용 */ }
        return /^[A-Za-z0-9_-]{11}$/.test(String(input || '').trim()) ? String(input).trim() : '';
    };

    /* ───────── 관리자 페이지 ───────── */
    async function initAdmin() {
        // 1) 유튜브 강의 등록 폼 — YouTube 미리보기 패널 아래에 붙임
        const preview = document.getElementById('youtubePreview');
        if (preview) {
            const box = document.createElement('div');
            box.className = 'yt-register-box';
            box.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:8px;';
            box.innerHTML = `
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <select id="pdCourse" style="flex:1;min-width:120px;padding:8px;font-size:13px;">
                        <option value="longform">롱폼 에이전트</option><option value="shortform">숏폼 에이전트</option><option value="master">운영 마스터</option>
                    </select>
                    <input id="pdSort" type="number" min="1" placeholder="차시 번호" style="width:90px;padding:8px;font-size:13px;" />
                </div>
                <input id="pdChapter" type="text" placeholder="챕터 (예: CHAPTER 01 · 시작 전 준비)" style="padding:8px;font-size:13px;" />
                <input id="pdTitle" type="text" placeholder="강의(차시) 제목" style="padding:8px;font-size:13px;" />
                <button id="pdAddLesson" class="admin-button" type="button" style="font-size:13px;">📚 이 유튜브 영상을 강의로 등록</button>
                <div id="pdLessonList" style="display:flex;flex-direction:column;gap:4px;font-size:13px;"></div>`;
            preview.parentElement.appendChild(box);

            const refreshLessons = async () => {
                const { data, error } = await sb.from('portal_lessons').select('*').order('course').order('sort');
                const list = document.getElementById('pdLessonList');
                if (error || !data) { list.textContent = ''; return; }
                list.innerHTML = data.length ? '<b style="margin-top:6px;">등록된 강의</b>' : '';
                data.forEach((row) => {
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex;align-items:center;gap:6px;';
                    item.innerHTML = `<span style="opacity:.7;">[${esc(COURSES[row.course] || row.course)} ${row.sort}강]</span><b style="flex:1;">${esc(row.title)}</b><a href="https://youtu.be/${esc(row.youtube_id)}" target="_blank" rel="noopener">보기</a><button type="button" data-del="${row.id}" style="cursor:pointer;border:none;background:none;color:#e11d48;">삭제</button>`;
                    item.querySelector('[data-del]').addEventListener('click', async () => {
                        if (!window.confirm(`'${row.title}' 강의를 삭제할까요?`)) return;
                        const { error: de } = await sb.from('portal_lessons').delete().eq('id', row.id);
                        toast(de ? '삭제 실패: ' + de.message : '강의를 삭제했습니다.');
                        refreshLessons();
                    });
                    list.appendChild(item);
                });
            };
            refreshLessons();

            document.getElementById('pdAddLesson').addEventListener('click', async () => {
                const id = ytIdOf(document.getElementById('youtubeUrl')?.value);
                if (!id) { toast('먼저 위에 유튜브 주소를 넣고 [불러오기]로 확인하세요.'); return; }
                const title = (document.getElementById('pdTitle').value || '').trim();
                if (!title) { toast('강의 제목을 입력하세요.'); return; }
                const { data: s } = await sb.auth.getSession();
                if (!s || !s.session) { toast('구글 로그인(관리자 계정)이 필요해요 — 로그인 페이지에서 Google로 로그인하세요.'); return; }
                const row = {
                    course: document.getElementById('pdCourse').value,
                    chapter: (document.getElementById('pdChapter').value || '').trim(),
                    title, youtube_id: id,
                    sort: parseInt(document.getElementById('pdSort').value || '0', 10) || 0,
                };
                const { error } = await sb.from('portal_lessons').insert(row);
                if (error) { toast('등록 실패: ' + error.message); return; }
                toast(`[${COURSES[row.course]}] ${row.sort}강 '${title}' 등록 완료 — 수강생 강의실에 바로 반영됩니다.`);
                document.getElementById('pdTitle').value = '';
                refreshLessons();
            });
        }

        // 2) 자료(파일) 등록 — 데모 리스너 제거 후 실제 업로드로 교체 (파일당 50MB 한도)
        let dz = document.getElementById('resourceDropzone');
        let fi = document.getElementById('resourceFileInput');
        const ub = document.getElementById('resourceUploadButton');
        const tbody = document.getElementById('resourceTableBody');
        if (dz && fi && tbody) {
            dz = stripListeners(dz); fi = stripListeners(fi);
            if (ub) stripListeners(ub).addEventListener('click', () => fi.click());
            dz.addEventListener('click', () => fi.click());
            ['dragenter', 'dragover'].forEach((n) => dz.addEventListener(n, (e) => { e.preventDefault(); dz.classList.add('dragging'); }));
            ['dragleave', 'drop'].forEach((n) => dz.addEventListener(n, (e) => { e.preventDefault(); dz.classList.remove('dragging'); }));

            const courseKeyOf = (label) => label.includes('롱폼') ? 'longform' : label.includes('숏폼') ? 'shortform' : label.includes('마스터') ? 'master' : 'all';
            const addRow = (r, justNow) => {
                const ext = extOf(r.name);
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><div class="resource-file-cell"><span>${esc(ext)}</span><div><b>${esc(r.name)}</b><small>${justNow ? '방금 등록' : new Date(r.created_at).toLocaleDateString('ko-KR')}</small></div></div></td><td>${esc(COURSES[r.course] || r.course)}</td><td>${esc(r.rtype)}</td><td>${fmtBytes(r.size)}</td><td>-</td><td><span class="status-badge">공개</span></td><td><a class="table-action" href="${esc(r.url)}" target="_blank" rel="noopener" style="text-decoration:none;">↓</a> <button class="table-action" type="button" data-rdel="${r.id}">✕</button></td>`;
                tr.querySelector('[data-rdel]').addEventListener('click', async () => {
                    if (!window.confirm(`'${r.name}' 자료를 삭제할까요?`)) return;
                    const { error: de } = await sb.from('portal_resources').delete().eq('id', r.id);
                    toast(de ? '삭제 실패: ' + de.message : '자료를 삭제했습니다.');
                    if (!de) tr.remove();
                });
                tbody.prepend(tr);
            };
            // 실데이터 우선 표시: 데모 행 지우고 DB 행 렌더
            sb.from('portal_resources').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
                if (error || !data) return;
                if (data.length) tbody.innerHTML = '';
                data.forEach((r) => addRow(r, false));
                const rc = document.getElementById('resourceCount');
                if (rc && data.length) rc.textContent = String(data.length);
            });

            const uploadFiles = async (files) => {
                const list = Array.from(files || []);
                if (!list.length) return;
                const { data: s } = await sb.auth.getSession();
                if (!s || !s.session) { toast('구글 로그인(관리자 계정)이 필요해요.'); return; }
                for (const file of list) {
                    if (file.size > 50 * 1024 * 1024) { toast(`${file.name}: 50MB 초과 — 큰 파일은 드라이브 링크로 공유하세요.`); continue; }
                    toast(`${file.name} 업로드 중…`);
                    const safe = file.name.replace(/[^\w.\-가-힣 ]+/g, '_');
                    const path = `res/${Date.now()}_${safe}`;
                    const { error: ue } = await sb.storage.from('portal-files').upload(path, file);
                    if (ue) { toast(`${file.name} 업로드 실패: ${ue.message}`); continue; }
                    const { data: pub } = sb.storage.from('portal-files').getPublicUrl(path);
                    const typeLabel = document.getElementById('resourceType')?.value || '사용 가이드';
                    const courseLabel = document.getElementById('resourceCourse')?.value || '전체 수강생 공통';
                    const row = { course: courseKeyOf(courseLabel), name: file.name, rtype: typeLabel, url: pub.publicUrl, size: file.size };
                    const { data: ins, error: ie } = await sb.from('portal_resources').insert(row).select().single();
                    if (ie) { toast(`${file.name} 등록 실패: ${ie.message}`); continue; }
                    addRow(ins, true);
                    toast(`${file.name} 등록 완료 — 수강생 자료실에 바로 반영됩니다.`);
                }
            };
            fi.addEventListener('change', () => uploadFiles(fi.files));
            dz.addEventListener('drop', (e) => uploadFiles(e.dataTransfer.files));
        }
    }

    /* ───────── 수강생 강의실(classroom) — 자료 실제 다운로드 ───────── */
    async function initClassroom() {
        const grid = document.querySelector('.classroom-resource-grid');
        if (!grid) return;
        const { data, error } = await sb.from('portal_resources').select('*').order('created_at', { ascending: false });
        if (error || !data || !data.length) return;   // 등록 자료 없으면 데모 그대로
        // 데모 스텁(가짜 다운로드)만 제거하고 실제 자료로 채움 (진짜 링크는 유지)
        grid.querySelectorAll('[data-demo-download]').forEach((a) => a.remove());
        data.forEach((r) => {
            const a = document.createElement('a');
            a.className = 'classroom-resource';
            a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
            a.innerHTML = `<span>${esc(extOf(r.name))}</span><div><b>${esc(r.name)}</b><small>${esc(r.rtype)} · ${fmtBytes(r.size)}</small></div><em>↓</em>`;
            grid.appendChild(a);
        });
    }

    /* ───────── 강의(lesson) 페이지 — 유튜브 재생 + 첨부 실제 다운로드 ───────── */
    async function initLesson() {
        const player = document.getElementById('lessonPlayer');
        if (!player) return;
        const course = new URLSearchParams(location.search).get('course') || 'longform';
        const { data: lessons } = await sb.from('portal_lessons').select('*').eq('course', course).order('sort');
        const links = Array.from(document.querySelectorAll('.lesson-link'));

        const showVideo = () => {
            const idx = Math.max(0, links.findIndex((l) => l.classList.contains('active')));
            const row = (lessons || []).find((r) => r.sort === idx + 1) || null;
            if (row) {
                player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(row.youtube_id)}" title="${esc(row.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border:0;"></iframe>`;
            } else if (lessons && lessons.length) {
                player.innerHTML = '<div class="lesson-placeholder"><span>▶</span><b>이 차시 영상은 준비 중이에요</b><small>관리자 페이지에서 차시 번호에 맞춰 유튜브 영상을 등록하면 바로 나옵니다.</small></div>';
            }
        };
        if (lessons && lessons.length) {
            showVideo();
            links.forEach((l) => l.addEventListener('click', () => setTimeout(showVideo, 0)));
            ['previousLesson', 'nextLesson'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => setTimeout(showVideo, 0)));
        }

        // 첨부 자료: 데모 스텁 → 실제 자료 (이 강의 과정 + 전체 공통)
        const { data: res } = await sb.from('portal_resources').select('*').in('course', [course, 'all']).order('created_at', { ascending: false });
        if (res && res.length) {
            const stubs = Array.from(document.querySelectorAll('a[data-demo-download]'));
            const holder = stubs.length ? stubs[0].parentElement : null;
            const cls = stubs.length ? stubs[0].className : 'lesson-download';
            stubs.forEach((s) => s.remove());
            if (holder) res.forEach((r) => {
                const a = document.createElement('a');
                a.className = cls; a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
                a.innerHTML = `<span>${esc(extOf(r.name))}</span><div><b>${esc(r.name)}</b><small>${esc(r.rtype)} · ${fmtBytes(r.size)}</small></div><em>↓</em>`;
                holder.appendChild(a);
            });
        }
    }

    const boot = () => {
        if (document.getElementById('resourceTableBody') || document.getElementById('youtubePreview')) initAdmin();
        if (document.querySelector('.classroom-resource-grid')) initClassroom();
        if (document.getElementById('lessonPlayer')) initLesson();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
