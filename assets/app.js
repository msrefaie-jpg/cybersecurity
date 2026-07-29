/* مكونات مشتركة لصفحات دليل التحول الرقمي التفاعلي */
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
      label.textContent = `${cfg.labelPrefix || 'تقدمك'}: ${done} من ${items.length}` + (msgs[done] ? ` — ${msgs[done]}` : '');
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
    const quizBox = document.getElementById(boxId);
    function renderQ() {
      if (qi >= DATA.length) { showResult(); return; }
      const item = DATA[qi]; answered = false;
      quizBox.innerHTML = `
        <div class="quiz-progress">
          <span>السؤال ${qi + 1} من ${DATA.length}</span>
          <span style="color:var(--accent)">نتيجتك: ${score}</span>
        </div>
        <div class="quiz-bar"><i style="width:${qi / DATA.length * 100}%"></i></div>
        <div class="quiz-q"><span class="en">${item.en}</span></div>
        <div class="quiz-q-ar">${item.ar}</div>
        <div class="quiz-opts"></div>
        <div class="quiz-feedback" aria-live="polite"></div>
        <button class="quiz-next" disabled>${qi === DATA.length - 1 ? 'عرض النتيجة 🏁' : 'السؤال التالي ←'}</button>`;
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
      if (i === item.a) { score++; fbEl.className = 'quiz-feedback show ok'; fbEl.innerHTML = '✅ <b>إجابة صحيحة!</b> ' + item.exp; }
      else { btn.classList.add('wrong'); fbEl.className = 'quiz-feedback show no'; fbEl.innerHTML = '❌ <b>ليست الإجابة الصحيحة.</b> ' + item.exp; }
      quizBox.querySelector('.quiz-progress span:last-child').textContent = 'نتيجتك: ' + score;
      quizBox.querySelector('.quiz-next').disabled = false;
    }
    function showResult() {
      const pct = Math.round(score / DATA.length * 100);
      let msg, icon;
      if (pct === 100) { icon = '🏆'; msg = 'ممتاز! أنت جاهز تماماً — درجة كاملة!'; }
      else if (pct >= 70) { icon = '🎉'; msg = 'نتيجة رائعة! لديك فهم قوي.'; }
      else if (pct >= 40) { icon = '📖'; msg = 'بداية جيدة — راجع الأقسام بالأعلى وأعد المحاولة.'; }
      else { icon = '💪'; msg = 'لا بأس! اقرأ الشروحات مرة أخرى وستتحسن نتيجتك كثيراً.'; }
      quizBox.innerHTML = `
        <div class="quiz-result">
          <div style="font-size:56px">${icon}</div>
          <div class="score">${score} / ${DATA.length}</div>
          <p>${msg}</p>
          <button class="quiz-next">إعادة الاختبار 🔄</button>
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
    function render(k) {
      grid.innerHTML = '';
      cfg.terms.filter(t => k === 'all' || t.c === k).forEach(t => {
        const d = document.createElement('button');
        d.className = 'flip'; d.setAttribute('aria-label', 'بطاقة ' + t.ar);
        const isOff = officialSet.has(t.en);
        d.innerHTML = `<div class="flip-inner">
          <div class="flip-face flip-front"><span class="src ${isOff ? 'o' : 'm'}">${isOff ? 'من المنهج' : 'من المذكرة'}</span><div class="cat">${cfg.cats[t.c]}</div><div class="term">${t.ar}</div><div class="en">${t.en}</div><div class="hint">اضغط لرؤية المعنى 👆</div></div>
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
