/* مكونات مشتركة لصفحات دليل التحول الرقمي التفاعلي */
/* اللغة تُكتشف من وسم <html lang> كي تعمل قبل ضبط App.LANG */
const isEN = () => (typeof App !== 'undefined' && App.LANG === 'en') || document.documentElement.lang === 'en';
const App = {

  /* تفعيل شريطي التنقل (العلوي والسفلي) وتتبع القسم النشط */
  initNav(tabMap) {
    const navLinks = document.querySelectorAll('nav.tabs a[href^="#"]');
    const tabLinks = document.querySelectorAll('.tabbar a');
    const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
          const t = tabMap && tabMap[e.target.id];
          if (t) tabLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === t));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => obs.observe(s));
  },

  /* أكورديون التهديدات/الشروحات */
  initAccordions() {
    document.querySelectorAll('.acc-head').forEach(h => {
      h.addEventListener('click', () => {
        const open = h.closest('.acc').classList.toggle('open');
        h.setAttribute('aria-expanded', open);
      });
    });
  },

  /* مصيدة الكلمات المطلقة: [{q,ar,ok,a}] */
  renderTraps(elId, traps) {
    const el = document.getElementById(elId);
    traps.forEach((t, i) => {
      const d = document.createElement('div');
      d.className = 'trap';
      d.innerHTML = `<button class="trap-q" aria-expanded="false">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <span class="txt"><span class="en">${t.q}</span><br><span class="ar-line">${t.ar}</span></span>
          <span class="verdict" style="color:${t.ok ? 'var(--good)' : 'var(--bad)'}">${t.ok ? '✓' : '✕'}</span>
        </button>
        <div class="trap-a"><div class="trap-a-in">${t.a}</div></div>`;
      const btn = d.querySelector('.trap-q');
      btn.addEventListener('click', () => { const o = d.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      el.appendChild(d);
    });
  },

  /* قائمة تحقق بمؤشر تقدم يُحفظ في المتصفح */
  initChecklist(cfg) {
    const items = document.querySelectorAll(cfg.listSel + ' .check-item');
    const fill = document.getElementById(cfg.fillId);
    const label = document.getElementById(cfg.labelId);
    const msgs = cfg.msgs || [];
    const load = () => { try { return JSON.parse(localStorage.getItem(cfg.key)) || []; } catch (e) { return []; } };
    const save = () => {
      const done = [...items].map((it, i) => it.classList.contains('done') ? i : -1).filter(i => i >= 0);
      try { localStorage.setItem(cfg.key, JSON.stringify(done)); } catch (e) {}
    };
    const update = () => {
      const done = document.querySelectorAll(cfg.listSel + ' .check-item.done').length;
      fill.style.width = (done / items.length * 100) + '%';
      label.textContent = `${cfg.labelPrefix || (isEN() ? 'Your progress' : 'تقدمك')}: ${done} ${isEN() ? 'of' : 'من'} ${items.length}` + (msgs[done] ? ` — ${msgs[done]}` : '');
    };
    load().forEach(i => { if (items[i]) { items[i].classList.add('done'); items[i].setAttribute('aria-pressed', 'true'); } });
    items.forEach(it => it.addEventListener('click', () => {
      const on = it.classList.toggle('done');
      it.setAttribute('aria-pressed', on);
      save(); update();
    }));
    update();
  },

  /* اختبار تفاعلي: data = [{en,ar,opts,a,exp}] */
  initQuiz(boxId, DATA) {
    let qi = 0, score = 0, answered = false;
    const en = isEN();
    const T = en
      ? { q: (i, n) => `Question ${i} of ${n}`, score: 'Score', result: 'Show result 🏁', next: 'Next question →' }
      : { q: (i, n) => `السؤال ${i} من ${n}`, score: 'نتيجتك', result: 'عرض النتيجة 🏁', next: 'السؤال التالي ←' };
    const quizBox = document.getElementById(boxId);
    function renderQ() {
      if (qi >= DATA.length) { showResult(); return; }
      const item = DATA[qi]; answered = false;
      quizBox.innerHTML = `
        <div class="quiz-progress">
          <span>${T.q(qi + 1, DATA.length)}</span>
          <span style="color:var(--accent)">${T.score}: ${score}</span>
        </div>
        <div class="quiz-bar"><i style="width:${qi / DATA.length * 100}%"></i></div>
        <div class="quiz-q"><span class="en">${item.en}</span></div>
        <div class="quiz-q-ar">${item.ar}</div>
        <div class="quiz-opts"></div>
        <div class="quiz-feedback" aria-live="polite"></div>
        <button class="quiz-next" disabled>${qi === DATA.length - 1 ? T.result : T.next}</button>`;
      const optsEl = quizBox.querySelector('.quiz-opts');
      item.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'quiz-opt'; b.textContent = o;
        b.addEventListener('click', () => answer(i, b, item, optsEl));
        optsEl.appendChild(b);
      });
      quizBox.querySelector('.quiz-next').addEventListener('click', () => { qi++; renderQ(); });
    }
    function answer(i, btn, item, optsEl) {
      if (answered) return; answered = true;
      const fbEl = quizBox.querySelector('.quiz-feedback');
      [...optsEl.children].forEach((b, j) => {
        b.disabled = true;
        if (j === item.a) b.classList.add('correct');
      });
      if (i === item.a) { score++; fbEl.className = 'quiz-feedback show ok'; fbEl.innerHTML = (en ? '✅ <b>Correct!</b> ' : '✅ <b>إجابة صحيحة!</b> ') + item.exp; }
      else { btn.classList.add('wrong'); fbEl.className = 'quiz-feedback show no'; fbEl.innerHTML = (en ? '❌ <b>Not quite.</b> ' : '❌ <b>ليست الإجابة الصحيحة.</b> ') + item.exp; }
      quizBox.querySelector('.quiz-progress span:last-child').textContent = T.score + ': ' + score;
      quizBox.querySelector('.quiz-next').disabled = false;
    }
    function showResult() {
      const pct = Math.round(score / DATA.length * 100);
      let msg, icon;
      if (pct === 100) { icon = '🏆'; msg = en ? 'Excellent! You are fully ready — a perfect score!' : 'ممتاز! أنت جاهز تماماً — درجة كاملة!'; }
      else if (pct >= 70) { icon = '🎉'; msg = en ? 'Great result! You have a strong grasp.' : 'نتيجة رائعة! لديك فهم قوي.'; }
      else if (pct >= 40) { icon = '📖'; msg = en ? 'A good start — review the sections above and try again.' : 'بداية جيدة — راجع الأقسام بالأعلى وأعد المحاولة.'; }
      else { icon = '💪'; msg = en ? 'No worries! Re-read the explanations and your score will improve a lot.' : 'لا بأس! اقرأ الشروحات مرة أخرى وستتحسن نتيجتك كثيراً.'; }
      quizBox.innerHTML = `
        <div class="quiz-result">
          <div style="font-size:56px">${icon}</div>
          <div class="score">${score} / ${DATA.length}</div>
          <p>${msg}</p>
          <button class="quiz-next">${en ? 'Retake quiz 🔄' : 'إعادة الاختبار 🔄'}</button>
        </div>`;
      quizBox.querySelector('.quiz-next').addEventListener('click', () => { qi = 0; score = 0; renderQ(); });
    }
    renderQ();
  },

  /* قاموس بطاقات قابلة للقلب مع فلاتر ووسم مصدر */
  renderGlossary(cfg) {
    const grid = document.getElementById(cfg.gridId);
    const filtersEl = document.getElementById(cfg.filtersId);
    const officialSet = cfg.officialSet || new Set();
    const en = isEN();
    const T = en
      ? { card: 'Card: ', off: 'Official', memo: 'Memo', hint: 'Tap to reveal 👆' }
      : { card: 'بطاقة ', off: 'من المنهج', memo: 'من المذكرة', hint: 'اضغط لرؤية المعنى 👆' };
    function render(k) {
      grid.innerHTML = '';
      cfg.terms.filter(t => k === 'all' || t.c === k).forEach(t => {
        const d = document.createElement('button');
        d.className = 'flip'; d.setAttribute('aria-label', T.card + t.ar);
        const isOff = officialSet.has(t.en);
        d.innerHTML = `<div class="flip-inner">
          <div class="flip-face flip-front"><span class="src ${isOff ? 'o' : 'm'}">${isOff ? T.off : T.memo}</span><div class="cat">${cfg.cats[t.c]}</div><div class="term">${t.ar}</div><div class="en">${t.en}</div><div class="hint">${T.hint}</div></div>
          <div class="flip-face flip-back"><div>${t.d}<div class="def-en">${t.e}</div></div></div>
        </div>`;
        d.addEventListener('click', () => d.classList.toggle('flipped'));
        grid.appendChild(d);
      });
    }
    Object.entries(cfg.cats).forEach(([k, v], i) => {
      const b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' on' : ''); b.textContent = v;
      b.addEventListener('click', () => {
        filtersEl.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        b.classList.add('on'); render(k);
      });
      filtersEl.appendChild(b);
    });
    render('all');
  }
};

/* ===== فصول الدورة ===== */
App.CHAPTERS = [
  { href: './', icon: '🏠', name: 'الصفحة الرئيسية', ready: true },
  { href: 'cyber.html', icon: '🛡️', name: 'الأمن السيبراني', ready: true },
  { href: 'it-os.html', icon: '💻', name: 'تكنولوجيا المعلومات ونظم التشغيل', ready: true },
  { href: 'word.html', icon: '📝', name: 'معالج النصوص (وورد)', ready: true },
  { href: 'ppt.html', icon: '📽️', name: 'العروض التقديمية (بوربوينت)', ready: true },
  { href: 'excel.html', icon: '📊', name: 'جداول البيانات (إكسل)', ready: true },
  { href: 'db.html', icon: '🗄️', name: 'قواعد البيانات (أكسيس)', ready: true },
  { href: 'mobile.html', icon: '📱', name: 'تطبيقات الهاتف المحمول', ready: true },
  { href: 'web.html', icon: '🔎', name: 'البحث على الإنترنت', ready: true },
  { href: 'networks.html', icon: '🌐', name: 'الشبكات', ready: true },
  { href: 'elearn.html', icon: '🧑‍🏫', name: 'التعليم عن بعد', ready: true },
  { href: 'cloud.html', icon: '☁️', name: 'الحوسبة السحابية', ready: true }
];

/* الأسماء الإنجليزية للفصول (النسخة الإنجليزية en/) */
App.CHAPTERS_EN = [
  'Home', 'Cybersecurity', 'IT & Operating Systems', 'Word Processing (Word)',
  'Presentations (PowerPoint)', 'Spreadsheets (Excel)', 'Databases (Access)',
  'Mobile Applications', 'Web Search', 'Networks', 'Distance Learning', 'Cloud Computing'
];

/* قشرة التطبيق المشتركة: درج الفصول + تذييل الحقوق + تمركز التبويب النشط
   App.LANG = 'en' قبل الاستدعاء يجعل القشرة إنجليزية (صفحات en/) */
App.initShell = function (current) {
  const en = isEN();
  const S = en
    ? { chapters: 'Course Chapters', close: 'Close', soon: 'Soon', tab: 'Chapters',
        footer: 'A training app on the FDTC digital transformation course content<br>App copyright © Eng. Mohamed Salah',
        langLabel: 'ع', langTitle: 'النسخة العربية', langHref: (c) => '../' + (c === './' ? '' : c) }
    : { chapters: 'فصول الدورة', close: 'إغلاق', soon: 'قريباً', tab: 'الفصول',
        footer: 'تطبيق تدريبي على محتوى دورة التحول الرقمي (FDTC)<br>حقوق التطبيق © م. محمد صلاح',
        langLabel: 'EN', langTitle: 'English version', langHref: (c) => 'en/' + (c === './' ? '' : c) };
  // 1) درج الفصول
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('aria-label', S.chapters);
  let rows = `<div class="d-head"><h3>📚 ${S.chapters}</h3><button class="d-close" aria-label="${S.close}">✕</button></div>`;
  App.CHAPTERS.forEach((ch, i) => {
    const name = en ? (App.CHAPTERS_EN[i] || ch.name) : ch.name;
    if (ch.ready) {
      const cur = ch.href === current ? ' current' : '';
      rows += `<a href="${ch.href}" class="${cur.trim()}"><span class="d-ico">${ch.icon}</span>${name}<span class="chev">${ch.href === current ? '●' : '‹'}</span></a>`;
    } else {
      rows += `<div class="soon-row"><span class="d-ico">${ch.icon}</span>${name}<span class="soon-tag">${S.soon}</span></div>`;
    }
  });
  drawer.innerHTML = rows;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  const toggle = (open) => {
    drawer.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
  };
  overlay.addEventListener('click', () => toggle(false));
  drawer.querySelector('.d-close').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

  // زر ☰ وزر اللغة 🌐 في الشريط العلوي
  const navInner = document.querySelector('nav.tabs .inner');
  if (navInner) {
    const btn = document.createElement('button');
    btn.className = 'drawer-btn';
    btn.setAttribute('aria-label', S.chapters);
    btn.textContent = '☰';
    btn.addEventListener('click', () => toggle(true));
    navInner.insertBefore(btn, navInner.firstChild);
    const lb = document.createElement('a');
    lb.className = 'lang-btn';
    lb.href = S.langHref(current);
    lb.title = S.langTitle;
    lb.textContent = S.langLabel;
    lb.addEventListener('click', () => { try { localStorage.setItem('lang', en ? 'ar' : 'en'); } catch (e) {} });
    navInner.insertBefore(lb, btn.nextSibling);
  }

  // تبويب «الفصول» في الشريط السفلي
  const tabbar = document.querySelector('.tabbar');
  if (tabbar) {
    const t = document.createElement('a');
    t.href = '#';
    t.innerHTML = '<span class="ico">☰</span>' + S.tab;
    t.addEventListener('click', e => { e.preventDefault(); toggle(true); });
    tabbar.appendChild(t);
  }

  // 2) شريط التنقل بين الفصول (السابق/التالي) + تذييل الحقوق
  const ready = App.CHAPTERS
    .map((ch, i) => ({ href: ch.href, icon: ch.icon, ready: ch.ready, name: en ? (App.CHAPTERS_EN[i] || ch.name) : ch.name }))
    .filter(c => c.ready && c.href !== './');
  const idx = ready.findIndex(c => c.href === current);
  const f = document.createElement('footer');
  f.className = 'app-footer';
  f.innerHTML = S.footer;
  if (idx > -1) {
    const prev = ready[idx - 1], next = ready[idx + 1];
    const lbl = en ? { p: '← Previous chapter', n: 'Next chapter →' } : { p: '→ الفصل السابق', n: 'الفصل التالي ←' };
    const pager = document.createElement('nav');
    pager.className = 'pager';
    pager.setAttribute('aria-label', en ? 'Chapter navigation' : 'التنقل بين الفصول');
    pager.innerHTML = `<div class="container pager-in">
      ${prev ? `<a class="pg prev" href="${prev.href}"><span class="pg-l">${lbl.p}</span><span class="pg-t">${prev.icon} ${prev.name}</span></a>` : '<span class="pg ghost" aria-hidden="true"></span>'}
      ${next ? `<a class="pg next" href="${next.href}"><span class="pg-l">${lbl.n}</span><span class="pg-t">${next.icon} ${next.name}</span></a>` : '<span class="pg ghost" aria-hidden="true"></span>'}
    </div>`;
    document.body.appendChild(pager);
  }
  document.body.appendChild(f);

  // 3) جلب مسبق للصفحات المجاورة والنسخة اللغوية الأخرى وروابط الدرج عند التحويم
  const prefetch = (href) => {
    if (!href || href === '#' || href.startsWith('#') || document.querySelector(`link[data-pf="${CSS.escape(href)}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href; l.dataset.pf = href;
    document.head.appendChild(l);
  };
  if (idx > -1) { if (ready[idx - 1]) prefetch(ready[idx - 1].href); if (ready[idx + 1]) prefetch(ready[idx + 1].href); }
  prefetch(S.langHref(current));
  drawer.querySelectorAll('a[href]').forEach(a => a.addEventListener('pointerenter', () => prefetch(a.getAttribute('href')), { once: true }));

  // 4) إبقاء التبويب النشط ظاهراً في منتصف الشريط العلوي
  if (navInner) {
    const center = () => {
      const act = navInner.querySelector('a.active');
      if (act) act.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    };
    new MutationObserver(center).observe(navInner, { subtree: true, attributes: true, attributeFilter: ['class'] });
    setTimeout(center, 300);
  }
};
