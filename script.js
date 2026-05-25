// ===== POLITICIAN PROFILE WEBSITE - PUBLIC SCRIPT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ===== PRELOADER — OUTSIDE ASYNC (always runs, even on error) =====
function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (pre) pre.classList.add('hide');
}
setTimeout(hidePreloader, 4000); // max wait 4s
if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 1500);
} else {
    window.addEventListener('load', () => setTimeout(hidePreloader, 1500));
}

(async () => {
    try {

    // ===== 1. LOAD CONFIG =====
    const config = await fetch('./config.json').then(r => r.json());

    // ===== 2. INIT FIREBASE =====
    const app = initializeApp(config.firebase);
    const db = getDatabase(app);

    // ===== 3. XSS ESCAPE HELPER =====
    const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');


    // ===== 5. CUSTOM CURSOR =====
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = mouseX + 'px';
            dot.style.top = mouseY + 'px';
        });

        function animateRing() {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            ring.style.left = ringX + 'px';
            ring.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        }
        animateRing();
    }

    // ===== 6. NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');
    const tickerBar = document.getElementById('tickerBar');
    const scrollTop = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            tickerBar.style.transform = 'translateY(-100%)';
        } else {
            navbar.classList.remove('scrolled');
            tickerBar.style.transform = 'translateY(0)';
        }
        // Scroll to top button
        if (window.scrollY > 400) {
            scrollTop.classList.add('show');
        } else {
            scrollTop.classList.remove('show');
        }
        // Active nav link
        updateActiveNavLink();
    });

    tickerBar.style.transition = 'transform 0.3s ease';

    scrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== 7. ACTIVE NAV LINK =====
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // ===== 8. MOBILE SIDEBAR =====
    const hamburger = document.getElementById('hamburger');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    function openSidebar() {
        mobileSidebar.classList.add('open');
        sidebarOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        mobileSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('.sidebar-links a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // ===== 9. THEME TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // ===== 10. HERO PARTICLES =====
    const canvas = document.getElementById('heroParticles');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * 0.3 + 0.1;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.opacity = Math.random() * 0.6 + 0.2;
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(201, 162, 39, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ===== 11. COUNTER ANIMATION =====
    function animateCounters() {
        document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            if (isNaN(target)) return;
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current) + '+';
            }, 16);
        });
    }

    // Trigger counters when hero is in view
    const heroObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            heroObserver.disconnect();
        }
    }, { threshold: 0.3 });
    heroObserver.observe(document.querySelector('.hero-stats'));

    // ===== 12. AOS (CUSTOM INTERSECTION OBSERVER) =====
    const aosElements = document.querySelectorAll('[data-aos]');
    const aosObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    aosElements.forEach(el => aosObserver.observe(el));

    // ===== 13. RIPPLE EFFECT =====
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = btn.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });

    // ===== 14. TOAST =====
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== 15. FIREBASE DATA LOADERS =====

    // --- SITE SETTINGS ---
    onValue(ref(db, 'siteSettings'), (snap) => {
        const data = snap.val();
        if (!data) return;
        document.title = esc(data.nameBn || 'দায়িত্বশীলের নাম') + ' — বাংলাদেশ ইসলামী ছাত্রশিবির';
        document.getElementById('heroName').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
        document.getElementById('heroDesignation').textContent = data.designation || 'সাংগঠনিক পদবী';
        document.getElementById('heroParty').textContent = data.party || 'বাংলাদেশ ইসলামী ছাত্রশিবির';
        document.getElementById('heroSlogan').textContent = '"' + (data.slogan || 'ইসলাম ও মানবতার সেবায় নিবেদিত') + '"';
        document.getElementById('navName').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
        document.getElementById('sidebarName').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
        document.getElementById('footerName').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
        document.getElementById('footerCopyName').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
        if (data.heroPhoto) {
            document.getElementById('heroPhoto').src = data.heroPhoto;
        }
        if (data.navIcon) {
            document.getElementById('navIcon').textContent = data.navIcon;
            document.getElementById('sidebarIcon').textContent = data.navIcon;
            document.getElementById('footerIcon').textContent = data.navIcon;
        }
        if (data.faviconUrl) {
            document.getElementById('favicon').href = data.faviconUrl;
        }
        if (data.metaDesc) {
            document.querySelector('meta[name="description"]').content = data.metaDesc;
        }
        // Update preloader name
        document.querySelector('.preloader-name').textContent = data.nameBn || 'দায়িত্বশীলের নাম';
    });

    // --- STATS ---
    onValue(ref(db, 'stats'), (snap) => {
        const data = snap.val();
        if (!data) return;
        const yearsEl = document.getElementById('statYears');
        const projEl = document.getElementById('statProjects');
        if (data.yearsActive) yearsEl.setAttribute('data-target', data.yearsActive);
        if (data.constituency) document.getElementById('statConstituency').textContent = data.constituency;
        if (data.projects) projEl.setAttribute('data-target', data.projects);
        if (data.followers) document.getElementById('statFollowers').textContent = data.followers;
        if (data.yearsActive) document.getElementById('statYearsLabel').textContent = 'বছরের সাংগঠনিক অভিজ্ঞতা';
    });

    // --- ABOUT ---
    onValue(ref(db, 'about'), (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('aboutBio').textContent = data.bio || '';
        if (data.photo) document.getElementById('aboutPhoto').src = data.photo;
        document.getElementById('aboutBirth').textContent = data.birthDate || '—';
        document.getElementById('aboutPlace').textContent = data.birthPlace || '—';
        document.getElementById('aboutEdu').textContent = data.education || '—';
        document.getElementById('aboutProfession').textContent = data.profession || '—';
        document.getElementById('aboutParty').textContent = data.party || '—';
        if (data.facebook) document.getElementById('aboutFb').href = data.facebook;
        if (data.youtube) document.getElementById('aboutYt').href = data.youtube;
        if (data.twitter) document.getElementById('aboutTw').href = data.twitter;
    });

    // --- TICKER ---
    onValue(ref(db, 'ticker'), (snap) => {
        const data = snap.val();
        const container = document.getElementById('tickerContent');
        if (!data) {
            container.innerHTML = '<span>📢 কোনো নোটিশ নেই</span>';
            return;
        }
        let html = '';
        Object.values(data).forEach(item => {
            if (item.active) {
                html += `<span>${esc(item.text)}</span>`;
            }
        });
        if (!html) html = '<span>📢 কোনো নোটিশ নেই</span>';
        // Duplicate for seamless scroll
        container.innerHTML = html + html;
    });

    // --- NEWS ---
    let allNews = [];
    onValue(ref(db, 'news'), (snap) => {
        const data = snap.val();
        const grid = document.getElementById('newsGrid');
        if (!data) {
            grid.innerHTML = '<div class="news-placeholder"><i class="fas fa-newspaper"></i><p>কোনো পোস্ট নেই</p></div>';
            return;
        }
        allNews = [];
        Object.entries(data).forEach(([id, item]) => {
            if (item.active) {
                allNews.push(item);
            }
        });
        renderNews('all');
    });

    function renderNews(filter) {
        const grid = document.getElementById('newsGrid');
        const filtered = filter === 'all' ? allNews : allNews.filter(n => n.category === filter);
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="news-placeholder"><i class="fas fa-newspaper"></i><p>এই ক্যাটাগরিতে কোনো পোস্ট নেই</p></div>';
            return;
        }
        grid.innerHTML = filtered.map(item => `
            <div class="news-card" data-aos="fade-up">
                <img src="${esc(item.imageUrl || 'https://via.placeholder.com/400x200?text=News')}" alt="${esc(item.title)}" class="news-card-img">
                <div class="news-card-body">
                    <div class="news-card-date"><i class="fas fa-calendar-alt"></i> ${esc(item.date || '')}</div>
                    <h3 class="news-card-title">${esc(item.title)}</h3>
                    <p class="news-card-text">${esc(item.body)}</p>
                    ${item.link ? `<a href="${esc(item.link)}" target="_blank" class="news-card-link">বিস্তারিত পড়ুন <i class="fas fa-arrow-right"></i></a>` : ''}
                </div>
            </div>
        `).join('');
        // Re-observe AOS on new elements
        grid.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
    }

    // News filter buttons
    document.getElementById('newsFilters').addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-btn')) return;
        document.querySelectorAll('#newsFilters .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderNews(e.target.getAttribute('data-filter'));
    });

    // --- GALLERY ---
    let allGallery = [];
    onValue(ref(db, 'gallery'), (snap) => {
        const data = snap.val();
        const grid = document.getElementById('galleryGrid');
        if (!data) {
            grid.innerHTML = '<div class="news-placeholder"><i class="fas fa-images"></i><p>কোনো ছবি নেই</p></div>';
            return;
        }
        allGallery = [];
        Object.entries(data).forEach(([id, item]) => {
            if (item.active) {
                allGallery.push(item);
            }
        });
        renderGallery('all');
    });

    function renderGallery(filter) {
        const grid = document.getElementById('galleryGrid');
        const filtered = filter === 'all' ? allGallery : allGallery.filter(g => g.category === filter);
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="news-placeholder"><i class="fas fa-images"></i><p>এই ক্যাটাগরিতে কোনো ছবি নেই</p></div>';
            return;
        }
        grid.innerHTML = filtered.map(item => `
            <div class="gallery-item" data-aos="zoom-in" onclick="openLightbox('${esc(item.url)}', '${esc(item.title || '')}')">
                <img src="${esc(item.url)}" alt="${esc(item.title || 'Gallery Photo')}">
                <div class="gallery-item-overlay">${esc(item.title || '')}</div>
            </div>
        `).join('');
        grid.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
    }

    // Gallery filter buttons
    document.getElementById('galleryFilters').addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-btn')) return;
        document.querySelectorAll('#galleryFilters .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderGallery(e.target.getAttribute('data-filter'));
    });

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');

    window.openLightbox = function (url, title) {
        lightboxImg.src = url;
        lightboxCaption.textContent = title;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    // --- CONTACT ---
    onValue(ref(db, 'contact'), (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('contactAddress').textContent = data.address || '—';
        document.getElementById('contactPhone').textContent = data.phone || '—';
        document.getElementById('contactEmail').textContent = data.email || '—';
        document.getElementById('contactHours').textContent = data.hours || '—';
        if (data.mapUrl) {
            document.getElementById('contactMap').src = data.mapUrl;
        }
        // Floating buttons
        if (data.whatsapp) {
            document.getElementById('floatWhatsApp').href = `https://wa.me/${data.whatsapp}`;
        }
        if (data.callNumber) {
            document.getElementById('floatCall').href = `tel:${data.callNumber}`;
        }
        // Footer
        document.getElementById('footerAddress').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${esc(data.addressShort || data.address || '')}`;
        document.getElementById('footerPhone').innerHTML = `<i class="fas fa-phone-alt"></i> ${esc(data.phoneShort || data.phone || '')}`;
        document.getElementById('footerEmail').innerHTML = `<i class="fas fa-envelope"></i> ${esc(data.email || '')}`;
    });

    // --- SITE INFO (Footer social) ---
    onValue(ref(db, 'siteInfo'), (snap) => {
        const data = snap.val();
        if (!data) return;
        if (data.facebook) document.getElementById('footerFb').href = data.facebook;
        if (data.youtube) document.getElementById('footerYt').href = data.youtube;
        if (data.twitter) document.getElementById('footerTw').href = data.twitter;
    });

    // --- CONTACT FORM SUBMIT ---
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('msgName').value.trim();
        const phone = document.getElementById('msgPhone').value.trim();
        const subject = document.getElementById('msgSubject').value.trim();
        const message = document.getElementById('msgBody').value.trim();

        if (!name || !phone || !subject || !message) {
            showToast('⚠️ সকল ঘর পূরণ করুন');
            return;
        }

        try {
            await push(ref(db, 'messages'), {
                name,
                phone,
                subject,
                message,
                createdAt: Date.now(),
                dateText: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
            });
            showToast('✅ আপনার বার্তা সফলভাবে পাঠানো হয়েছে!');
            document.getElementById('contactForm').reset();
        } catch (err) {
            showToast('❌ বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            console.error(err);
        }
    });

    // ===== 16. FOOTER YEAR =====
    document.getElementById('footerYear').textContent = new Date().getFullYear();

    // ===== 17. LANGUAGE TOGGLE (Simple) =====
    const langToggle = document.getElementById('langToggle');
    let currentLang = 'bn';
    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'bn' ? 'en' : 'bn';
        langToggle.textContent = currentLang === 'bn' ? 'EN' : 'বাং';
        document.documentElement.lang = currentLang;
        showToast(currentLang === 'bn' ? 'বাংলা ভাষা নির্বাচিত' : 'English language selected');
    });

    } catch(err) {
        console.error("Script error:", err);
        document.getElementById("preloader")?.classList.add("hide");
    }
})();
