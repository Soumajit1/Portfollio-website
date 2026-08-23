/* ==========================================================================
   SOUMAJIT CHAKRABORTY — PORTFOLIO SCRIPT
   Sections: Loader · Cursor · Three.js scene · Nav · Reveal/GSAP ·
             Typing effect · Counters · Tilt cards · Timeline progress ·
             Contact form · Misc UI (theme, accent, fab, music)
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========================================================================
     1. LOADING SCREEN
     ======================================================================== */
  const loader = document.getElementById('loader');
  const loaderBarFill = document.getElementById('loaderBarFill');
  const loaderPercent = document.getElementById('loaderPercent');

  function runLoader() {
    let progress = 0;
    const duration = prefersReducedMotion ? 200 : 1600;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      progress = Math.min(100, Math.round((elapsed / duration) * 100));
      loaderBarFill.style.width = progress + '%';
      loaderPercent.textContent = progress + '%';
      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loader.classList.add('loaded');
          document.body.classList.add('loaded');
          startEntranceAnimations();
        }, 200);
      }
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('load', runLoader);
  // Fallback in case 'load' already fired
  setTimeout(() => { if (loaderPercent.textContent === '0%') runLoader(); }, 500);

  /* ========================================================================
     2. CUSTOM CURSOR
     ======================================================================== */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const isTouch = window.matchMedia('(max-width: 900px)').matches;

  if (!isTouch) {
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const hoverTargets = 'a, button, .skill-card, .project-card, input, textarea, .swatch';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) cursorRing.classList.add('hovered');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) cursorRing.classList.remove('hovered');
    });

    /* mouse trail particles */
    const trailCanvas = document.createElement('canvas');
    trailCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;';
    document.body.appendChild(trailCanvas);
    const tctx = trailCanvas.getContext('2d');
    function resizeTrail() { trailCanvas.width = window.innerWidth; trailCanvas.height = window.innerHeight; }
    resizeTrail();
    window.addEventListener('resize', resizeTrail);

    let trailParticles = [];
    let lastTrailTime = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastTrailTime > 40) {
        lastTrailTime = now;
        trailParticles.push({ x: e.clientX, y: e.clientY, life: 1 });
        if (trailParticles.length > 18) trailParticles.shift();
      }
    });

    function drawTrail() {
      tctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      const accent = getComputedStyle(document.body).getPropertyValue('--accent-1-rgb').trim() || '0,229,255';
      trailParticles.forEach((p, i) => {
        p.life -= 0.045;
        if (p.life > 0) {
          tctx.beginPath();
          tctx.arc(p.x, p.y, 2.2 * p.life, 0, Math.PI * 2);
          tctx.fillStyle = `rgba(${accent}, ${p.life * 0.55})`;
          tctx.fill();
        }
      });
      trailParticles = trailParticles.filter(p => p.life > 0);
      requestAnimationFrame(drawTrail);
    }
    if (!prefersReducedMotion) drawTrail();
  }

  /* ========================================================================
     3. THREE.JS BACKGROUND SCENE
     ======================================================================== */
  let renderer, scene, camera, particles, floatingGroup, gridMesh;
  let mouseNormX = 0, mouseNormY = 0;
  let targetRotX = 0, targetRotY = 0;

  function initThree() {
    const canvas = document.getElementById('webgl-bg');
    if (!window.THREE) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    /* ---- lighting ---- */
    const ambient = new THREE.AmbientLight(0x8892ff, 0.5);
    scene.add(ambient);
    const point1 = new THREE.PointLight(0x00e5ff, 3, 40);
    point1.position.set(6, 4, 6);
    scene.add(point1);
    const point2 = new THREE.PointLight(0xb14eff, 3, 40);
    point2.position.set(-6, -3, 4);
    scene.add(point2);

    /* ---- particle field ---- */
    const particleCount = window.innerWidth < 700 ? 500 : 1400;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x66e8ff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ---- floating geometric objects ---- */
    floatingGroup = new THREE.Group();
    const geometries = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.TorusGeometry(0.7, 0.22, 8, 24),
      new THREE.TetrahedronGeometry(0.9, 0),
      new THREE.IcosahedronGeometry(0.6, 1)
    ];
    const colors = [0x00e5ff, 0xb14eff, 0xff2e88, 0x00e5ff, 0xb14eff];

    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.35,
        wireframe: true,
        roughness: 0.4,
        metalness: 0.6
      });
      const mesh = new THREE.Mesh(geometries[i], mat);
      const angle = (i / 5) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 5.5, Math.sin(angle) * 3, (Math.random() - 0.5) * 4 - 2);
      mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.4 + Math.random() * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.01
      };
      floatingGroup.add(mesh);
    }
    scene.add(floatingGroup);

    /* ---- glowing grid plane ---- */
    const gridGeo = new THREE.PlaneGeometry(60, 60, 40, 40);
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.06 });
    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -Math.PI / 2.4;
    gridMesh.position.y = -6;
    gridMesh.position.z = -6;
    scene.add(gridMesh);

    window.addEventListener('resize', onThreeResize);
    window.addEventListener('mousemove', onThreeMouseMove);

    animateThree();
  }

  function onThreeResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onThreeMouseMove(e) {
    mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNormY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  const clock = new THREE.Clock ? new THREE.Clock() : null;

  function animateThree() {
    requestAnimationFrame(animateThree);
    const t = clock ? clock.getElapsedTime() : performance.now() / 1000;

    /* camera parallax from mouse */
    targetRotX += (mouseNormY * 0.25 - targetRotX) * 0.03;
    targetRotY += (mouseNormX * 0.35 - targetRotY) * 0.03;
    camera.position.x += (mouseNormX * 1.4 - camera.position.x) * 0.02;
    camera.position.y += (-mouseNormY * 1.0 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    if (particles) particles.rotation.y = t * 0.02;

    if (floatingGroup) {
      floatingGroup.children.forEach((mesh, i) => {
        mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.speed + i) * 0.6;
        mesh.rotation.x += mesh.userData.rotSpeed;
        mesh.rotation.y += mesh.userData.rotSpeed * 1.4;
      });
    }

    if (gridMesh) gridMesh.rotation.z = t * 0.01;

    renderer.render(scene, camera);
  }

  if (window.THREE && !prefersReducedMotion) {
    initThree();
  } else if (window.THREE) {
    // still render a static-ish frame for reduced motion users
    initThree();
  }

  /* ---- hero rotating icosahedron (signature element, separate small scene) ---- */
  function initHeroStage() {
    const stage = document.getElementById('hero3DStage');
    if (!stage || !window.THREE) return;

    const w = stage.clientWidth || 500;
    const h = stage.clientHeight || 500;

    const hRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    hRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    hRenderer.setSize(w, h);
    stage.appendChild(hRenderer.domElement);

    const hScene = new THREE.Scene();
    const hCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    hCamera.position.z = 6;

    const light1 = new THREE.PointLight(0x00e5ff, 4, 20);
    light1.position.set(4, 3, 4);
    hScene.add(light1);
    const light2 = new THREE.PointLight(0xb14eff, 4, 20);
    light2.position.set(-4, -3, 3);
    hScene.add(light2);
    hScene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const geo = new THREE.IcosahedronGeometry(2.1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0d1120, emissive: 0x00e5ff, emissiveIntensity: 0.25,
      wireframe: true, roughness: 0.3, metalness: 0.8
    });
    const core = new THREE.Mesh(geo, mat);
    hScene.add(core);

    const geo2 = new THREE.IcosahedronGeometry(2.6, 0);
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xb14eff, wireframe: true, transparent: true, opacity: 0.25 });
    const shell = new THREE.Mesh(geo2, mat2);
    hScene.add(shell);

    let hoverScale = 1;
    stage.addEventListener('mouseenter', () => { hoverScale = 1.12; });
    stage.addEventListener('mouseleave', () => { hoverScale = 1; });

    let localMouseX = 0, localMouseY = 0;
    window.addEventListener('mousemove', (e) => {
      localMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      localMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    let currentScale = 1;
    function renderHero() {
      requestAnimationFrame(renderHero);
      core.rotation.y += 0.004;
      core.rotation.x += 0.0018;
      shell.rotation.y -= 0.002;
      shell.rotation.x += 0.0012;

      core.rotation.y += localMouseX * 0.002;
      core.rotation.x += localMouseY * 0.002;

      currentScale += (hoverScale - currentScale) * 0.08;
      core.scale.setScalar(currentScale);
      shell.scale.setScalar(currentScale);

      hRenderer.render(hScene, hCamera);
    }
    renderHero();

    window.addEventListener('resize', () => {
      const nw = stage.clientWidth || 500, nh = stage.clientHeight || 500;
      hCamera.aspect = nw / nh;
      hCamera.updateProjectionMatrix();
      hRenderer.setSize(nw, nh);
    });
  }
  if (window.THREE) initHeroStage();

  /* ========================================================================
     4. NAVIGATION — scroll state, active link, mobile menu, smooth scroll
     ======================================================================== */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const sections = document.querySelectorAll('main section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateScrollProgress();
    updateFab();
    updateActiveNav();
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileLinks.forEach(link => link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }));

  function updateActiveNav() {
    let currentId = 'home';
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) currentId = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === currentId);
    });
  }

  /* ========================================================================
     5. SCROLL PROGRESS BAR + FAB
     ======================================================================== */
  const scrollProgressFill = document.getElementById('scrollProgressFill');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  function updateScrollProgress() {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    scrollProgressFill.style.width = scrolled + '%';
  }
  function updateFab() {
    scrollTopBtn.classList.toggle('show', window.scrollY > 700);
  }
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ========================================================================
     6. TYPING EFFECT (Hero role)
     ======================================================================== */
  const typedTextEl = document.getElementById('typedText');
  const roles = ['Software Developer', 'AI & Web Developer', 'Computer Vision Engineer', 'Real-Time Systems Builder'];

  function typeLoop() {
    let roleIndex = 0, charIndex = 0, deleting = false;

    function step() {
      const current = roles[roleIndex];
      if (!deleting) {
        charIndex++;
        typedTextEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(step, 1600);
          return;
        }
      } else {
        charIndex--;
        typedTextEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(step, deleting ? 35 : 65);
    }
    step();
  }
  typeLoop();

  /* ========================================================================
     7. SCROLL REVEAL (GSAP ScrollTrigger, with fallback to IntersectionObserver)
     ======================================================================== */
  function startEntranceAnimations() {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
            delay: (i % 4) * 0.05
          }
        );
      });

      gsap.utils.toArray('.skill-card').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30, scale: 0.94 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out',
            delay: (i % 5) * 0.06,
            scrollTrigger: { trigger: el, start: 'top 92%' },
            onStart: () => el.classList.add('in-view')
          }
        );
      });

      // hero entrance
      gsap.timeline()
        .from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' })
        .from('.hero-line', { opacity: 0, y: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, '-=0.3')
        .from('.hero-role', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3')
        .from('.hero-desc', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3')
        .from('.hero-cta .btn', { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 }, '-=0.3')
        .from('.hero-social .social-dot', { opacity: 0, y: 20, duration: 0.4, stagger: 0.08 }, '-=0.3')
        .from('.hero-photo-card', { opacity: 0, scale: 0.85, duration: 0.8, ease: 'back.out(1.6)' }, '-=0.9');

    } else {
      // fallback
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal-up, .skill-card').forEach(el => io.observe(el));
    }

    initCounters();
    initTiltCards();
    initTimelineProgress();
    buildContribGraph();
  }

  // Skill card in-view fallback also needed for CSS var --lvl
  document.querySelectorAll('.skill-card').forEach(card => {
    card.style.setProperty('--lvl', card.dataset.level + '%');
  });
  // ensure skill cards get in-view even without gsap start delay issues
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.skill-card').forEach(el => skillObserver.observe(el));

  const langObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.lang-fill').forEach(el => langObserver.observe(el));

  /* ========================================================================
     8. ANIMATED STAT COUNTERS
     ======================================================================== */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ========================================================================
     9. 3D TILT ON PROJECT CARDS
     ======================================================================== */
  function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotY = ((x - cx) / cx) * 6;
        const rotX = -((y - cy) / cy) * 6;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.015)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0) scale(1)';
      });
    });
  }

  /* ========================================================================
     10. VERTICAL TIMELINE FILL PROGRESS (experience section)
     ======================================================================== */
  function initTimelineProgress() {
    const timeline = document.getElementById('vTimeline');
    const fill = document.getElementById('vTimelineFill');
    if (!timeline || !fill) return;

    function update() {
      const rect = timeline.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.75;
      const total = rect.height;
      const visible = Math.min(Math.max(viewportCenter - rect.top, 0), total);
      const pct = total > 0 ? (visible / total) * 100 : 0;
      fill.style.height = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ========================================================================
     11. GITHUB CONTRIBUTION GRAPH (placeholder, procedurally generated)
     ======================================================================== */
  function buildContribGraph() {
    const graph = document.getElementById('contribGraph');
    if (!graph) return;
    const cells = 52 * 7;
    let html = '';
    for (let i = 0; i < cells; i++) {
      const intensity = Math.random();
      let opacity = 0.08;
      if (intensity > 0.85) opacity = 1;
      else if (intensity > 0.65) opacity = 0.7;
      else if (intensity > 0.45) opacity = 0.4;
      else if (intensity > 0.25) opacity = 0.2;
      html += `<div class="contrib-cell" style="background:rgba(var(--accent-1-rgb),${opacity})"></div>`;
    }
    graph.innerHTML = html;
    graph.style.gridTemplateRows = 'repeat(7, 1fr)';
    graph.style.gridAutoFlow = 'column';
  }

  /* ========================================================================
     12. MAGNETIC BUTTONS + RIPPLE EFFECT
     ======================================================================== */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  /* ========================================================================
     13. RESUME DOWNLOAD (generates a simple placeholder text resume)
     ======================================================================== */
  const resumeBtn = document.getElementById('resumeBtn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const content = [
        'SOUMAJIT CHAKRABORTY',
        'Software Developer — AI & Web Development',
        '',
        'Email: soumajit@example.com',
        'GitHub: github.com/soumajit',
        'LinkedIn: linkedin.com/in/soumajit',
        '',
        'SUMMARY',
        'Software developer focused on real-time, AI-driven systems — computer vision pipelines',
        'and full-stack web applications. Built SafeDrive-AI, a real-time driver drowsiness',
        'detection system using MediaPipe, OpenCV and Flask/WebSockets.',
        '',
        'SKILLS',
        'Python, JavaScript, C/C++, Java, React, Node.js, Express, MySQL, MongoDB,',
        'Git, Linux, TensorFlow, OpenCV, Machine Learning',
        '',
        'PROJECTS',
        '- SafeDrive-AI: real-time drowsiness detection (Python, Flask, MediaPipe, OpenCV)',
        '- DevBoard: team task manager (React, Node.js, MongoDB)',
        '- LensSort: image classification API (TensorFlow, Flask, Docker)',
        '',
        'This is a placeholder resume file generated from the portfolio site.',
        'Replace this with your real PDF resume.'
      ].join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Soumajit_Chakraborty_Resume.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  /* ========================================================================
     14. CONTACT FORM — validation, loading state, success animation
     ======================================================================== */
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');

  function validateField(field) {
    const wrapper = field.closest('.form-field');
    let valid = field.checkValidity();
    if (field.type === 'email' && field.value.trim()) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    }
    wrapper.classList.toggle('invalid', !valid);
    return valid;
  }

  if (contactForm) {
    contactForm.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.form-field').classList.contains('invalid')) validateField(field);
      });
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = contactForm.querySelectorAll('input, textarea');
      let allValid = true;
      fields.forEach(f => { if (!validateField(f)) allValid = false; });

      if (!allValid) return;

      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        formSuccess.classList.add('show');
        contactForm.reset();
        setTimeout(() => formSuccess.classList.remove('show'), 5000);
      }, 1400);
    });
  }

  /* ========================================================================
     15. THEME TOGGLE (dark / light)
     ======================================================================== */
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const body = document.body;
    body.dataset.theme = body.dataset.theme === 'light' ? 'dark' : 'light';
  });

  /* ========================================================================
     16. ACCENT COLOR SWITCHER
     ======================================================================== */
  const colorSwitchToggle = document.getElementById('colorSwitchToggle');
  const colorSwatches = document.getElementById('colorSwatches');
  const swatches = document.querySelectorAll('.swatch');

  colorSwitchToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    colorSwatches.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-swatches') && !e.target.closest('#colorSwitchToggle')) {
      colorSwatches.classList.remove('open');
    }
  });
  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      document.body.dataset.accent = sw.dataset.accent;
      swatches.forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
    });
  });

  /* ========================================================================
     17. BACKGROUND AMBIENCE TOGGLE (optional, silent by default — no autoplay)
     ======================================================================== */
  const musicToggle = document.getElementById('musicToggle');
  let audioCtx = null;
  let ambienceNodes = null;
  let ambiencePlaying = false;

  function startAmbience() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 110;
    osc2.type = 'sine'; osc2.frequency.value = 165;
    gain.gain.value = 0.02;
    osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
    osc1.start(); osc2.start();
    ambienceNodes = { osc1, osc2, gain };
  }
  function stopAmbience() {
    if (ambienceNodes) {
      ambienceNodes.osc1.stop(); ambienceNodes.osc2.stop();
      ambienceNodes = null;
    }
  }
  musicToggle.classList.add('muted');
  musicToggle.addEventListener('click', () => {
    ambiencePlaying = !ambiencePlaying;
    musicToggle.classList.toggle('muted', !ambiencePlaying);
    if (ambiencePlaying) startAmbience(); else stopAmbience();
  });

  /* ========================================================================
     18. FOOTER YEAR
     ======================================================================== */
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  /* ========================================================================
     19. SMOOTH SCROLL FOR ANCHOR LINKS (with nav height offset)
     ======================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('navbar').offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* Kick off reveal fallback immediately if GSAP hasn't loaded by the time loader finishes */
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.gsap) {
      document.querySelectorAll('.skill-card').forEach(card => card.classList.add('in-view'));
    }
  });

})();