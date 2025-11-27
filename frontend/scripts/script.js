// --- DATA HANDLING (LocalStorage) ---
const currentUser = "Budi";
const STORAGE_KEY = 'lostFoundData';

// Data bawaan jika localStorage masih kosong
const defaultData = [
    { id: 1, user: "Budi", type: "lost", name: "Helm Bogo Hitam", loc: "Parkiran A", date: "2023-10-01", status: "Hilang", desc: "Ada stiker Apple di belakang" },
    { id: 2, user: "Admin", type: "found", name: "KTM An. Siti", loc: "Kantin", date: "2023-10-02", status: "Ditemukan", desc: "Ditemukan di meja nomor 5" },
    { id: 3, user: "Budi", type: "lost", name: "Tumbler Corkcicle", loc: "Perpus", date: "2023-10-03", status: "Selesai", desc: "Warna putih" },
];

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let itemsData = loadData();

// --- PAGE LOGIC ---

// 1. Logic untuk Halaman Utama (index.html)
if (document.getElementById('itemsContainer')) {
    renderItems();
}

// 2. Logic untuk Dashboard User (dashboard.html)
if (document.getElementById('userTable')) {
    renderDashboard();
}

// 3. Logic untuk Admin Panel (admin.html)
if (document.getElementById('adminTable')) {
    renderAdmin();
}

// 4. Logic untuk Form Laporan (report.html)
const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const type = document.getElementById('reportType').value;
        const name = document.getElementById('itemName').value;
        const loc = document.getElementById('itemLocation').value;
        const desc = document.getElementById('itemDesc').value;
        
        const newItem = {
            id: Date.now(), // Gunakan timestamp agar ID unik
            user: currentUser,
            type: type,
            name: name,
            loc: loc,
            date: new Date().toISOString().split('T')[0],
            status: type === 'lost' ? 'Hilang' : 'Ditemukan',
            desc: desc
        };

        itemsData.push(newItem);
        saveData(itemsData); // Simpan ke storage

        alert('Laporan berhasil dibuat!');
        window.location.href = '../index.html'; // Redirect ke home
    });
}

// --- FUNCTIONS ---

function renderItems() {
    const container = document.getElementById('itemsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterInput = document.getElementById('filterType');

    // Jika elemen tidak ada (misal di halaman lain), stop.
    if (!container) return;

    const search = searchInput ? searchInput.value.toLowerCase() : "";
    const filter = filterInput ? filterInput.value : "all";
    
    container.innerHTML = '';

    const filteredItems = itemsData.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search) || item.loc.toLowerCase().includes(search);
        const matchType = filter === 'all' || item.type === filter;
        const notSolved = item.status !== 'Selesai';
        return matchSearch && matchType && notSolved;
    });

    if(filteredItems.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #777;">Tidak ada data ditemukan.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const badgeClass = item.type === 'lost' ? 'status-lost' : 'status-found';
        const badgeText = item.type === 'lost' ? 'Kehilangan' : 'Ditemukan';
        
        const cardHTML = `
            <div class="card">
                <div class="card-header"><img src="./gambar/cat4.jpg" alt=""></div> 
                <div class="card-body">
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-info">📍 ${item.loc}</p>
                    <p class="card-info">📅 ${item.date}</p>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #444;">"${item.desc}"</p>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function renderDashboard() {
    const tbody = document.querySelector('#userTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const myItems = itemsData.filter(item => item.user === currentUser);

    myItems.forEach(item => {
        const row = `
            <tr>
                <td><strong>${item.name}</strong><br><small>${item.desc}</small></td>
                <td>${item.date}</td>
                <td>${item.status}</td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteItem(${item.id})">Hapus</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderAdmin() {
    const tbody = document.querySelector('#adminTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    itemsData.forEach(item => {
        let actionButton = '';
        if(item.status !== 'Selesai') {
            actionButton = `<button class="action-btn btn-resolve" onclick="markSolved(${item.id})">Selesai</button>`;
        } else {
            actionButton = `<span style="color:green;">✔ Done</span>`;
        }

        const row = `
            <tr>
                <td>${item.user}</td>
                <td>${item.name}</td>
                <td>${item.loc}</td>
                <td>${item.status}</td>
                <td>${actionButton}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function deleteItem(id) {
    if(confirm('Yakin ingin menghapus laporan ini?')) {
        itemsData = itemsData.filter(item => item.id !== id);
        saveData(itemsData); // Update storage
        renderDashboard();
    }
}

function markSolved(id) {
    const item = itemsData.find(i => i.id === id);
    if(item) {
        item.status = 'Selesai';
        saveData(itemsData); // Update storage
        renderAdmin();
    }
}

function toggleLogin() {
    window.location.href = './pages/login.html';
}

const authForm = document.getElementById('authForm');
let isLoginMode = true;

if (authForm) {
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const usernameVal = document.getElementById('username').value;
        const passwordVal = document.getElementById('password').value;
        const btn = document.getElementById('btnSubmit');

        // Visual feedback loading
        const originalText = btn.innerText;
        btn.innerText = 'Memproses...';
        btn.disabled = true;

        try {
            console.log(`Mengirim data ke Backend: Mode=${isLoginMode ? 'Login' : 'Register'}, User=${usernameVal}`);
            
            await new Promise(r => setTimeout(r, 1000));

            if (isLoginMode) {
                if(usernameVal === "admin" && passwordVal === "admin123") {
                    alert("Login Berhasil sebagai Admin!");
                    localStorage.setItem('userRole', 'admin');
                    localStorage.setItem('username', usernameVal);
                    window.location.href = 'admin.html';
                } else {
                    //sementara siapapun bisa login, data belum nyambung db
                    alert(`Selamat datang kembali, ${usernameVal}!`);
                    localStorage.setItem('userRole', 'user');
                    localStorage.setItem('username', usernameVal);
                    window.location.href = 'dashboard.html'; 
                }
            } else {
                alert("Registrasi Berhasil! Silakan Login.");
                toggleAuthMode(); //pindah ke mode login
            }

        } catch (error) {
            alert("Terjadi kesalahan: " + error.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('formTitle');
    const btn = document.getElementById('btnSubmit');
    const toggleText = document.getElementById('toggleText');

    if (isLoginMode) {
        title.innerText = "Login";
        btn.innerText = "Masuk";
        toggleText.innerHTML = 'Belum punya akun? <a href="#" onclick="toggleAuthMode()">Daftar di sini</a>';
    } else {
        title.innerText = "Daftar Akun";
        btn.innerText = "Daftar";
        toggleText.innerHTML = 'Sudah punya akun? <a href="#" onclick="toggleAuthMode()">Login di sini</a>';
    }
}