
async function fetchItems(filterUserOnly = false) {
    try {
        let url = '/api/laporan';
        if (filterUserOnly) {
            url += '?mine=true';
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil data");
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

if (document.getElementById('itemsContainer')) {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');

    fetchItems().then(data => {
        window.itemsData = data;
        renderItems(data);
    });

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            renderItems(window.itemsData); 
        });
    }
    if (filterType) {
        filterType.addEventListener('change', () => {
            renderItems(window.itemsData);
        });
    }
}

if (document.getElementById('userTable')) {
    fetchItems(true).then(data => {
        renderDashboard(data);
    });
}

if (document.getElementById('adminTable')) {
    fetchItems(false).then(data => { 
        renderAdmin(data);
    });
}

const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        
        formData.append('type', document.getElementById('reportType').value);
        formData.append('name', document.getElementById('itemName').value);
        formData.append('loc', document.getElementById('itemLocation').value);
        formData.append('desc', document.getElementById('itemDesc').value);
        
        const fileInput = document.getElementById('fotoBarang');
        if (fileInput.files[0]) {
            formData.append('foto', fileInput.files[0]); 
        }

        try {

            const res = await fetch('/api/laporan', {
                method: 'POST',
                body: formData 
            });

            const result = await res.json();

            if (res.ok && result.success) {
                alert('Laporan berhasil dibuat!');
                window.parent.location.href = '/beranda';
            } else {
                alert('Gagal membuat laporan: ' + (result.message || 'Error'));
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan server.');
        }
    });
}


function renderItems(data) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    const searchInput = document.getElementById('searchInput');
    const filterInput = document.getElementById('filterType');

    const search = searchInput ? searchInput.value.toLowerCase() : "";
    const filter = filterInput ? filterInput.value : "all";

    container.innerHTML = '';

    const filteredItems = data.filter(item => {
        const matchSearch = item.nama_barang.toLowerCase().includes(search) || item.lokasi.toLowerCase().includes(search);
        
        let dbType = item.tipe_laporan === 'kehilangan' ? 'lost' : 'found';
        const matchType = filter === 'all' || dbType === filter;
        
        const notSolved = item.status !== 'Selesai';
        return matchSearch && matchType && notSolved;
    });

    if(filteredItems.length === 0) {
        container.innerHTML = '<p class="no-data-msg">Tidak ada data ditemukan.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const isLost = item.tipe_laporan === 'kehilangan';
        const badgeClass = isLost ? 'status-lost' : 'status-found';
        const badgeText = isLost ? 'Kehilangan' : 'Ditemukan';
        
        const dateStr = new Date(item.tanggal_kejadian).toLocaleDateString();

        const cardHTML = `
            <div class="card">
                <div class="card-header"><img src="${item.foto_barang || '/gambar/cat4.jpg'}" alt="Foto"></div> 
                <div class="card-body">
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                    <h3 class="card-title">${item.nama_barang}</h3>
                    <p class="card-info">${item.lokasi}</p>
                    <p class="card-info">${dateStr}</p>
                    <p class="card-desc-text">"${item.deskripsi}"</p>
                    <small>Oleh: ${item.pelapor_name || 'Anonim'}</small>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

function renderDashboard(data) {
    const tbody = document.querySelector('#userTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = `
            <tr>
                <td>Anda</td>
                <td>${item.nama_barang}</td>
                <td><img class="kucingBaru" src="${item.foto_barang || '/gambar/cat4.jpg'}" width="50"></td>
                <td>${item.deskripsi}</td>
                <td>${item.lokasi}</td>
                <td>${item.status}</td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteItem(${item.id_laporan})">Hapus</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderAdmin(data) {
    const tbody = document.querySelector('#adminTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    data.forEach(item => {
        let actionButton = '';
        if(item.status !== 'Selesai') {
            actionButton = `<button class="action-btn btn-resolve" onclick="markSolved(${item.id_laporan})">Selesai</button>`;
        } else {
            actionButton = `<span class="status-done-text">✔ Done</span>`;
        }

        const row = `
            <tr>
                <td>${item.pelapor_name}</td>
                <td>${item.nama_barang}</td>
                <td><img class="kucingBaru" src="${item.foto_barang || '/gambar/cat4.jpg'}" width="50"></td>
                <td>${item.deskripsi}</td>
                <td>${item.lokasi}</td>
                <td>${item.status}</td>
                <td>${actionButton}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}


window.deleteItem = async function(id) {
    if(confirm('Yakin ingin menghapus laporan ini?')) {
        try {
            await fetch(`/api/laporan/${id}`, { method: 'DELETE' });
            location.reload(); 
        } catch (e) {
            alert("Gagal menghapus");
        }
    }
};

window.markSolved = async function(id) {
    try {
        await fetch(`/api/laporan/${id}`, { method: 'PUT' });
        location.reload();
    } catch (e) {
        alert("Gagal update status");
    }
};


const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const usernameVal = document.getElementById('loginUsername').value;
        const passwordVal = document.getElementById('loginPassword').value;

        const res = await fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: usernameVal, password: passwordVal })
        });
        
        const data = await res.json();
        if (data.success) {
            window.location.href = data.redirectUrl;
        } else {
            alert(data.message);
        }
    });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameVal = document.getElementById('regUsername').value;
        const passwordVal = document.getElementById('regPassword').value;
        const confirmVal = document.getElementById('regConfirmPassword').value;

        if(passwordVal !== confirmVal) {
            alert("Password tidak cocok");
            return;
        }

        const res = await fetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username: usernameVal, password: passwordVal })
        });

        const data = await res.json();
        if (data.success) {
            alert("Register berhasil! Silakan login.");
            window.location.href = '/login';
        } else {
            alert(data.message || "Gagal register");
        }
    });
}

const inputFoto = document.getElementById('fotoBarang');
const previewFoto = document.getElementById('preview');
if (inputFoto && previewFoto) {
    inputFoto.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            previewFoto.src = URL.createObjectURL(file);
            previewFoto.hidden = false;
        }
    });
}