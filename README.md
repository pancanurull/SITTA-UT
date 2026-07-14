# SITTA-UT

## 📌 Deskripsi
Proyek ini dibuat untuk memenuhi tugas mata kuliah **Pemrograman Berbasis Web**.  
Aplikasi dikembangkan menggunakan teknologi web untuk mengimplementasikan fitur-fitur yang telah ditentukan pada tugas.  Dibangun dengan HTML, CSS, JavaScript, dan Vue.js CDN.


## 🌐 Demo
Aplikasi dapat diakses secara online melalui:  
👉 [sitta-web.netlify.app](https://sitta-web.netlify.app)

## 🚀 Cara Menjalankan

1. Clone repository:
   ```bash
   git clone https://github.com/pancanurull/SITTA-UT.git
   cd SITTA-UT

## Cara Menggunakan

1. Buka `login.html` di browser (bisa langsung double-click, tidak perlu server)
2. Login dengan akun demo:
   - **Email:** `admin@ut.ac.id`
   - **Password:** `admin123`
3. Navigasi ke halaman yang diinginkan

## Akun Demo Lainnya

| Email | Password | Role |
|-------|----------|------|
| admin@ut.ac.id | admin123 | Administrator |
| rina@ut.ac.id | rina123 | UPBJJ-UT |
| agus@ut.ac.id | agus123 | UPBJJ-UT |
| siti@ut.ac.id | siti123 | Puslaba |
| doni@ut.ac.id | doni123 | Fakultas |

## Fitur

### Dashboard
- Statistik ringkasan (total bahan ajar, DO aktif, terkirim, UT-Daerah)
- Akses cepat ke semua fitur
- Transaksi terbaru
- **Monitoring Progress DO** — tabel progress semua delivery order
- **Rekap Bahan Ajar** — rekap stok dari data master
- **Histori Transaksi** — riwayat lengkap semua DO dengan filter & search

### Stok Bahan Ajar
- Card statistik **clickable** sebagai filter (Total / Aman / Menipis / Kosong)
- Search: kode MK, nama, jenis, lokasi
- Filter: kode lokasi, jenis barang, sort
- Cover buku sesuai mata kuliah
- Tambah, edit, hapus bahan ajar (Vue reactive)
- Icon edit & hapus vertikal center

### Tracking Pengiriman
- **Buat Delivery Order baru** — form lengkap, nomor DO otomatis format `DO+Tahun+Sequence`
- **Cari Status Pengiriman** — pencarian fleksibel (exact, partial, digit-only)
- **Riwayat DO Terbaru** — tabel 10 DO terbaru
- Modal sukses setelah buat DO (salin nomor DO, lihat tracking)
- DO baru langsung bisa dicari di tracking & muncul di histori dashboard
- Sidebar selalu tampil stabil (tidak ada menu yang hilang/collapse)

## Nomor DO Format

Semua nomor DO menggunakan format konsisten:
```
DO + Tahun + - + Nomor Urut (3 digit)
Contoh: DO2025-001, DO2025-002, DO2025-003
```

