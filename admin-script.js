// ===== POLITICIAN WEBSITE - ADMIN PANEL SCRIPT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(async () => {
    // ===== 1. LOAD CONFIG =====
    const config = await fetch('./config.json').then(r => r.json());

    // ===== 2. INIT FIREBASE =====
    const app = initializeApp(config.firebase);
    const auth = getAuth(app);
    const db = getDatabase(app);

    // ===== 3. DOM REFERENCES =====
    const loginPage = document.getElementById('loginPage');
    const adminLayout = document.getElementById('adminLayout');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminHamburger = document.getElementById('adminHamburger');
    const topbarTitle = document.getElementById('topbarTitle');

    // ===== 4. TOAST =====
    function showToast(msg) {
        const toast = document.getElementById('adminToast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ===== 5. CONFIRM MODAL =====
    let confirmCallback = null;
    const confirmModal = document.getElementById('confirmModal');
    const confirmText = document.getElementById('confirmText');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    function showConfirm(text, callback) {
        confirmText.textContent = text;
        confirmCallback = callback;
        confirmModal.classList.add('show');
    }

    confirmYes.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });

    confirmNo.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        confirmCallback = null;
    });

    // ===== 6. AUTH STATE =====
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginPage.style.display = 'none';
            adminLayout.classList.add('active');
            loadAllData();
        } else {
            loginPage.style.display = 'flex';
            adminLayout.classList.remove('active');
        }
    });

    // ===== 7. LOGIN =====
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        loginError.classList.remove('show');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('✅ সফলভাবে লগইন হয়েছে!');
        } catch (err) {
            loginError.classList.add('show');
            console.error(err);
        }
    });

    // ===== 8. LOGOUT =====
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            showToast('লগআউট সফল');
        });
    });

    // ===== 9. SIDEBAR NAVIGATION =====
    const navItems = document.querySelectorAll('.admin-nav-item[data-panel]');
    const panels = document.querySelectorAll('.admin-panel');
    const panelTitles = {
        dashboard: 'ড্যাশবোর্ড',
        profile: 'প্রোফাইল সেটিংস',
        stats: 'পরিসংখ্যান',
        about: 'পরিচয় / বায়ো',
        news: 'পোস্ট ব্যবস্থাপনা',
        gallery: 'গ্যালারি',
        ticker: 'টিকার নোটিশ',
        messages: 'বার্তাসমূহ',
        contact: 'যোগাযোগ তথ্য'
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const panel = item.getAttribute('data-panel');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById('panel-' + panel).classList.add('active');
            topbarTitle.textContent = panelTitles[panel] || '';
            // Close sidebar on mobile
            adminSidebar.classList.remove('open');
            adminOverlay.classList.remove('show');
        });
    });

    // ===== 10. MOBILE SIDEBAR =====
    adminHamburger.addEventListener('click', () => {
        adminSidebar.classList.add('open');
        adminOverlay.classList.add('show');
    });

    adminOverlay.addEventListener('click', () => {
        adminSidebar.classList.remove('open');
        adminOverlay.classList.remove('show');
    });

    // ===== 11. CLOUDINARY UPLOAD =====
    async function uploadToCloudinary(file, onProgress) {
        const { cloudName, uploadPreset } = config.cloudinary;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                const res = JSON.parse(xhr.responseText);
                if (res.secure_url) resolve(res.secure_url);
                else reject(res);
            };
            xhr.onerror = reject;
            xhr.send(formData);
        });
    }

    function setupUpload(fileInputId, urlInputId, previewId, progressId, progressBarId) {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput) return;
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const progress = document.getElementById(progressId);
            const progressBar = document.getElementById(progressBarId);
            const preview = document.getElementById(previewId);
            const urlInput = document.getElementById(urlInputId);

            progress.classList.add('show');
            progressBar.style.width = '0%';

            try {
                const url = await uploadToCloudinary(file, (pct) => {
                    progressBar.style.width = pct + '%';
                });
                urlInput.value = url;
                if (preview) {
                    preview.src = url;
                    preview.classList.add('show');
                }
                progress.classList.remove('show');
                showToast('✅ ছবি আপলোড সফল!');
            } catch (err) {
                progress.classList.remove('show');
                showToast('❌ আপলোড ব্যর্থ!');
                console.error(err);
            }
        });
    }

    // Setup all upload buttons
    setupUpload('profHeroPhotoFile', 'profHeroPhoto', 'profHeroPhotoPreview', 'profHeroPhotoProgress', 'profHeroPhotoProgressBar');
    setupUpload('profFaviconFile', 'profFavicon', 'profFaviconPreview', 'profFaviconProgress', 'profFaviconProgressBar');
    setupUpload('aboutPhotoFile', 'aboutPhotoAdmin', 'aboutPhotoPreview', 'aboutPhotoProgress', 'aboutPhotoProgressBar');
    setupUpload('newsImageFile', 'newsImage', 'newsImagePreview', 'newsImageProgress', 'newsImageProgressBar');

    // Gallery upload (multiple)
    document.getElementById('galleryImageFile').addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const progress = document.getElementById('galleryImageProgress');
        const progressBar = document.getElementById('galleryImageProgressBar');
        progress.classList.add('show');

        const urls = [];
        for (let i = 0; i < files.length; i++) {
            progressBar.style.width = '0%';
            try {
                const url = await uploadToCloudinary(files[i], (pct) => {
                    progressBar.style.width = pct + '%';
                });
                urls.push(url);
            } catch (err) {
                console.error(err);
            }
        }
        progress.classList.remove('show');

        if (urls.length > 0) {
            // Store URLs temporarily for saving
            document.getElementById('galleryImageFile').dataset.urls = JSON.stringify(urls);
            showToast(`✅ ${urls.length}টি ছবি আপলোড সফল!`);
        }
    });

    // ===== 12. LOAD ALL DATA =====
    function loadAllData() {
        loadProfile();
        loadStats();
        loadAbout();
        loadNews();
        loadGallery();
        loadTicker();
        loadMessages();
        loadContact();
        loadDashboard();
    }

    // ===== 13. PROFILE SETTINGS =====
    function loadProfile() {
        onValue(ref(db, 'siteSettings'), (snap) => {
            const data = snap.val();
            if (!data) return;
            document.getElementById('profNameBn').value = data.nameBn || '';
            document.getElementById('profNameEn').value = data.nameEn || '';
            document.getElementById('profDesignation').value = data.designation || '';
            document.getElementById('profParty').value = data.party || '';
            document.getElementById('profSlogan').value = data.slogan || '';
            document.getElementById('profHeroPhoto').value = data.heroPhoto || '';
            document.getElementById('profNavIcon').value = data.navIcon || '';
            document.getElementById('profFavicon').value = data.faviconUrl || '';
            document.getElementById('profMeta').value = data.metaDesc || '';
            if (data.heroPhoto) {
                document.getElementById('profHeroPhotoPreview').src = data.heroPhoto;
                document.getElementById('profHeroPhotoPreview').classList.add('show');
            }
            if (data.faviconUrl) {
                document.getElementById('profFaviconPreview').src = data.faviconUrl;
                document.getElementById('profFaviconPreview').classList.add('show');
            }
        });
    }

    document.getElementById('saveProfile').addEventListener('click', async () => {
        const data = {
            nameBn: document.getElementById('profNameBn').value.trim(),
            nameEn: document.getElementById('profNameEn').value.trim(),
            designation: document.getElementById('profDesignation').value.trim(),
            party: document.getElementById('profParty').value.trim(),
            slogan: document.getElementById('profSlogan').value.trim(),
            heroPhoto: document.getElementById('profHeroPhoto').value.trim(),
            navIcon: document.getElementById('profNavIcon').value.trim(),
            faviconUrl: document.getElementById('profFavicon').value.trim(),
            metaDesc: document.getElementById('profMeta').value.trim()
        };
        try {
            await set(ref(db, 'siteSettings'), data);
            showToast('✅ প্রোফাইল সংরক্ষিত হয়েছে!');
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 14. STATS =====
    function loadStats() {
        onValue(ref(db, 'stats'), (snap) => {
            const data = snap.val();
            if (!data) return;
            document.getElementById('statsYears').value = data.yearsActive || '';
            document.getElementById('statsConstituency').value = data.constituency || '';
            document.getElementById('statsProjects').value = data.projects || '';
            document.getElementById('statsFollowers').value = data.followers || '';
        });
    }

    document.getElementById('saveStats').addEventListener('click', async () => {
        const data = {
            yearsActive: parseInt(document.getElementById('statsYears').value) || 0,
            constituency: document.getElementById('statsConstituency').value.trim(),
            projects: parseInt(document.getElementById('statsProjects').value) || 0,
            followers: document.getElementById('statsFollowers').value.trim()
        };
        try {
            await set(ref(db, 'stats'), data);
            showToast('✅ পরিসংখ্যান সংরক্ষিত হয়েছে!');
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 15. ABOUT =====
    function loadAbout() {
        onValue(ref(db, 'about'), (snap) => {
            const data = snap.val();
            if (!data) return;
            document.getElementById('aboutBioAdmin').value = data.bio || '';
            document.getElementById('aboutPhotoAdmin').value = data.photo || '';
            document.getElementById('aboutBirthAdmin').value = data.birthDate || '';
            document.getElementById('aboutPlaceAdmin').value = data.birthPlace || '';
            document.getElementById('aboutEduAdmin').value = data.education || '';
            document.getElementById('aboutProfAdmin').value = data.profession || '';
            document.getElementById('aboutPartyAdmin').value = data.party || '';
            document.getElementById('aboutFbAdmin').value = data.facebook || '';
            document.getElementById('aboutYtAdmin').value = data.youtube || '';
            document.getElementById('aboutTwAdmin').value = data.twitter || '';
            if (data.photo) {
                document.getElementById('aboutPhotoPreview').src = data.photo;
                document.getElementById('aboutPhotoPreview').classList.add('show');
            }
        });
    }

    document.getElementById('saveAbout').addEventListener('click', async () => {
        const data = {
            bio: document.getElementById('aboutBioAdmin').value.trim(),
            photo: document.getElementById('aboutPhotoAdmin').value.trim(),
            birthDate: document.getElementById('aboutBirthAdmin').value.trim(),
            birthPlace: document.getElementById('aboutPlaceAdmin').value.trim(),
            education: document.getElementById('aboutEduAdmin').value.trim(),
            profession: document.getElementById('aboutProfAdmin').value.trim(),
            party: document.getElementById('aboutPartyAdmin').value.trim(),
            facebook: document.getElementById('aboutFbAdmin').value.trim(),
            youtube: document.getElementById('aboutYtAdmin').value.trim(),
            twitter: document.getElementById('aboutTwAdmin').value.trim()
        };
        try {
            await set(ref(db, 'about'), data);
            showToast('✅ পরিচয় সংরক্ষিত হয়েছে!');
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 16. NEWS =====
    let newsData = {};

    function loadNews() {
        onValue(ref(db, 'news'), (snap) => {
            newsData = snap.val() || {};
            renderNewsList();
            document.getElementById('dashNews').textContent = Object.keys(newsData).length;
        });
    }

    function renderNewsList() {
        const container = document.getElementById('newsList');
        const entries = Object.entries(newsData);
        if (entries.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">কোনো পোস্ট নেই</p>';
            return;
        }
        container.innerHTML = entries.map(([id, item]) => `
            <div class="list-item">
                <img src="${item.imageUrl || 'https://via.placeholder.com/70'}" class="list-item-img" alt="">
                <div class="list-item-info">
                    <h5>${item.title || 'শিরোনাম নেই'}</h5>
                    <p>${item.date || ''} • ${item.category || ''} • ${item.active ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="editNews('${id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteNews('${id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    // Add/Edit News
    document.getElementById('addNewsBtn').addEventListener('click', () => {
        document.getElementById('newsFormWrap').style.display = 'block';
        document.getElementById('newsFormTitle').innerHTML = '<i class="fas fa-newspaper"></i> নতুন পোস্ট';
        document.getElementById('newsEditId').value = '';
        document.getElementById('newsTitle').value = '';
        document.getElementById('newsBody').value = '';
        document.getElementById('newsDate').value = '';
        document.getElementById('newsImage').value = '';
        document.getElementById('newsLink').value = '';
        document.getElementById('newsCategory').value = 'national';
        document.getElementById('newsActive').checked = true;
        document.getElementById('newsImagePreview').classList.remove('show');
    });

    document.getElementById('cancelNews').addEventListener('click', () => {
        document.getElementById('newsFormWrap').style.display = 'none';
    });

    window.editNews = function (id) {
        const item = newsData[id];
        if (!item) return;
        document.getElementById('newsFormWrap').style.display = 'block';
        document.getElementById('newsFormTitle').innerHTML = '<i class="fas fa-edit"></i> পোস্ট সম্পাদনা';
        document.getElementById('newsEditId').value = id;
        document.getElementById('newsTitle').value = item.title || '';
        document.getElementById('newsBody').value = item.body || '';
        document.getElementById('newsDate').value = item.date || '';
        document.getElementById('newsImage').value = item.imageUrl || '';
        document.getElementById('newsLink').value = item.link || '';
        document.getElementById('newsCategory').value = item.category || 'national';
        document.getElementById('newsActive').checked = item.active !== false;
        if (item.imageUrl) {
            document.getElementById('newsImagePreview').src = item.imageUrl;
            document.getElementById('newsImagePreview').classList.add('show');
        } else {
            document.getElementById('newsImagePreview').classList.remove('show');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteNews = function (id) {
        showConfirm('এই পোস্টটি মুছে ফেলতে চান?', async () => {
            try {
                await remove(ref(db, 'news/' + id));
                showToast('✅ পোস্ট মুছে ফেলা হয়েছে!');
            } catch (err) {
                showToast('❌ মুছতে ব্যর্থ!');
                console.error(err);
            }
        });
    };

    document.getElementById('saveNews').addEventListener('click', async () => {
        const editId = document.getElementById('newsEditId').value;
        const data = {
            title: document.getElementById('newsTitle').value.trim(),
            body: document.getElementById('newsBody').value.trim(),
            date: document.getElementById('newsDate').value.trim(),
            imageUrl: document.getElementById('newsImage').value.trim(),
            link: document.getElementById('newsLink').value.trim(),
            category: document.getElementById('newsCategory').value,
            active: document.getElementById('newsActive').checked
        };

        if (!data.title) {
            showToast('⚠️ শিরোনাম আবশ্যক!');
            return;
        }

        try {
            if (editId) {
                await set(ref(db, 'news/' + editId), data);
            } else {
                await push(ref(db, 'news'), data);
            }
            showToast('✅ পোস্ট সংরক্ষিত হয়েছে!');
            document.getElementById('newsFormWrap').style.display = 'none';
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 17. GALLERY =====
    let galleryData = {};

    function loadGallery() {
        onValue(ref(db, 'gallery'), (snap) => {
            galleryData = snap.val() || {};
            renderGalleryAdmin();
            document.getElementById('dashGallery').textContent = Object.keys(galleryData).length;
        });
    }

    function renderGalleryAdmin() {
        const container = document.getElementById('adminGalleryGrid');
        const entries = Object.entries(galleryData);
        if (entries.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">কোনো ছবি নেই</p>';
            return;
        }
        container.innerHTML = entries.map(([id, item]) => `
            <div class="admin-gallery-item">
                <img src="${item.url}" alt="${item.title || ''}">
                <div class="delete-overlay" onclick="deleteGallery('${id}')"><i class="fas fa-trash"></i></div>
            </div>
        `).join('');
    }

    window.deleteGallery = function (id) {
        showConfirm('এই ছবিটি মুছে ফেলতে চান?', async () => {
            try {
                await remove(ref(db, 'gallery/' + id));
                showToast('✅ ছবি মুছে ফেলা হয়েছে!');
            } catch (err) {
                showToast('❌ মুছতে ব্যর্থ!');
                console.error(err);
            }
        });
    };

    document.getElementById('saveGallery').addEventListener('click', async () => {
        const title = document.getElementById('galleryTitle').value.trim();
        const category = document.getElementById('galleryCategory').value;
        const active = document.getElementById('galleryActive').checked;
        const urlsStr = document.getElementById('galleryImageFile').dataset.urls;

        if (!urlsStr) {
            showToast('⚠️ অন্তত একটি ছবি আপলোড করুন!');
            return;
        }

        const urls = JSON.parse(urlsStr);
        try {
            for (const url of urls) {
                await push(ref(db, 'gallery'), {
                    url,
                    title,
                    category,
                    active
                });
            }
            showToast(`✅ ${urls.length}টি ছবি সংরক্ষিত হয়েছে!`);
            document.getElementById('galleryTitle').value = '';
            document.getElementById('galleryImageFile').value = '';
            delete document.getElementById('galleryImageFile').dataset.urls;
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 18. TICKER =====
    let tickerData = {};

    function loadTicker() {
        onValue(ref(db, 'ticker'), (snap) => {
            tickerData = snap.val() || {};
            renderTickerList();
            const activeCount = Object.values(tickerData).filter(t => t.active).length;
            document.getElementById('dashTicker').textContent = activeCount;
        });
    }

    function renderTickerList() {
        const container = document.getElementById('tickerList');
        const entries = Object.entries(tickerData);
        if (entries.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">কোনো টিকার নেই</p>';
            return;
        }
        container.innerHTML = entries.map(([id, item]) => `
            <div class="list-item">
                <div class="list-item-info">
                    <h5>${item.text || ''}</h5>
                    <p>${item.active ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-delete" onclick="deleteTicker('${id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    window.deleteTicker = function (id) {
        showConfirm('এই টিকারটি মুছে ফেলতে চান?', async () => {
            try {
                await remove(ref(db, 'ticker/' + id));
                showToast('✅ টিকার মুছে ফেলা হয়েছে!');
            } catch (err) {
                showToast('❌ মুছতে ব্যর্থ!');
                console.error(err);
            }
        });
    };

    document.getElementById('saveTicker').addEventListener('click', async () => {
        const text = document.getElementById('tickerText').value.trim();
        const active = document.getElementById('tickerActive').checked;

        if (!text) {
            showToast('⚠️ টেক্সট আবশ্যক!');
            return;
        }

        try {
            await push(ref(db, 'ticker'), { text, active });
            showToast('✅ টিকার যোগ করা হয়েছে!');
            document.getElementById('tickerText').value = '';
        } catch (err) {
            showToast('❌ যোগ করতে ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 19. MESSAGES =====
    function loadMessages() {
        onValue(ref(db, 'messages'), (snap) => {
            const data = snap.val() || {};
            const entries = Object.entries(data).reverse();
            document.getElementById('dashMessages').textContent = entries.length;

            // Badge
            const badge = document.getElementById('msgBadge');
            if (entries.length > 0) {
                badge.style.display = 'flex';
                badge.textContent = entries.length > 99 ? '99+' : entries.length;
            } else {
                badge.style.display = 'none';
            }

            // Messages list
            const container = document.getElementById('messagesList');
            if (entries.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted);">কোনো বার্তা নেই</p>';
                return;
            }
            container.innerHTML = entries.map(([id, msg]) => `
                <div class="msg-card">
                    <div class="msg-card-header">
                        <h5>${msg.name || 'অজানা'}</h5>
                        <span>${msg.dateText || ''}</span>
                    </div>
                    <p><strong>বিষয়:</strong> ${msg.subject || ''}</p>
                    <p>${msg.message || ''}</p>
                    <p class="msg-phone"><i class="fas fa-phone"></i> ${msg.phone || ''}</p>
                </div>
            `).join('');

            // Dashboard recent messages (last 5)
            const dashContainer = document.getElementById('dashRecentMsgs');
            const recent = entries.slice(0, 5);
            if (recent.length === 0) {
                dashContainer.innerHTML = '<p style="color: var(--text-muted);">কোনো বার্তা নেই</p>';
            } else {
                dashContainer.innerHTML = recent.map(([id, msg]) => `
                    <div class="msg-card" style="margin-bottom:8px;">
                        <div class="msg-card-header">
                            <h5>${msg.name || 'অজানা'}</h5>
                            <span>${msg.dateText || ''}</span>
                        </div>
                        <p>${msg.subject || ''}</p>
                    </div>
                `).join('');
            }
        });
    }

    // ===== 20. CONTACT =====
    function loadContact() {
        onValue(ref(db, 'contact'), (snap) => {
            const data = snap.val();
            if (!data) return;
            document.getElementById('contactAddrFull').value = data.address || '';
            document.getElementById('contactAddrShort').value = data.addressShort || '';
            document.getElementById('contactPhoneFull').value = data.phone || '';
            document.getElementById('contactPhoneShort').value = data.phoneShort || '';
            document.getElementById('contactEmailAdmin').value = data.email || '';
            document.getElementById('contactHoursAdmin').value = data.hours || '';
            document.getElementById('contactMapAdmin').value = data.mapUrl || '';
            document.getElementById('contactWaAdmin').value = data.whatsapp || '';
            document.getElementById('contactCallAdmin').value = data.callNumber || '';
        });
    }

    document.getElementById('saveContact').addEventListener('click', async () => {
        const data = {
            address: document.getElementById('contactAddrFull').value.trim(),
            addressShort: document.getElementById('contactAddrShort').value.trim(),
            phone: document.getElementById('contactPhoneFull').value.trim(),
            phoneShort: document.getElementById('contactPhoneShort').value.trim(),
            email: document.getElementById('contactEmailAdmin').value.trim(),
            hours: document.getElementById('contactHoursAdmin').value.trim(),
            mapUrl: document.getElementById('contactMapAdmin').value.trim(),
            whatsapp: document.getElementById('contactWaAdmin').value.trim(),
            callNumber: document.getElementById('contactCallAdmin').value.trim()
        };
        try {
            await set(ref(db, 'contact'), data);
            showToast('✅ যোগাযোগ তথ্য সংরক্ষিত হয়েছে!');
        } catch (err) {
            showToast('❌ সংরক্ষণ ব্যর্থ!');
            console.error(err);
        }
    });

    // ===== 21. DASHBOARD STATS =====
    function loadDashboard() {
        // Stats are updated via their individual onValue listeners
    }

})();
