// ===== VUE FILTERS — (formatting data teks) =====
Vue.filter('rupiah', function(val) {
  return 'Rp ' + (Number(val)||0).toLocaleString('id-ID');
});
Vue.filter('buah', function(val) {
  return (Number(val)||0) + ' buah';
});
Vue.filter('tglIndo', function(val) {
  if (!val) return '-';
  var d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
});

// ===== AUTH CHECK =====
var _currentUser = {};
try { _currentUser = JSON.parse(sessionStorage.getItem('loggedUser') || '{}'); } catch(e) {}

// ===== DEFINISI DATA & METHODS ROOT VUE =====
var rootConfig = {
  el: '#app',

  data: {
    tab: 'dashboard',
    sidebarClosed: false,
    user: _currentUser,
    loading: false,
    upbjjList:     [],
    upbjjNama:     {},
    kategoriList:  [],
    pengirimanList:[],
    paketList:     [],
    mkKatalog:     {},
    stokList:      [],
    trackingList:  [],
    historiList:   [],
    monitoringList:[],
    toastMsg:     '',
    toastType:    '',
    toastVisible: false,
    subSection:   'dashboard',
    filterHistoriQ:      '',
    filterHistoriStatus: '',
    filterRekapQ: '',
    trackingRef: null
  },

  computed: {
    dashStokTotal:    function() { return this.latestStok.length; },
    dashStokQtyTotal: function() { return this.latestStok.reduce(function(s,i){return s+(i.qty||0);},0); },
    dashDOAktif:      function() { return this.latestMonitoring.filter(function(d){return d.status!=='Selesai';}).length; },
    dashTerkirim:     function() { return this.latestHistori.filter(function(h){return h.status==='Selesai';}).length; },

    greetingInfo: function() {
      var hour = new Date().getHours();
      return {
        text: hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam',
        icon: hour < 11 ? '🌅' : hour < 15 ? '☀️' : hour < 18 ? '🌤️' : '🌙',
        userText: this.user.nama || 'Admin'
      };
    },

    latestHistori: function() {
      var base = this.historiList.slice();
      try {
        var extra = JSON.parse(sessionStorage.getItem('newDOList') || '[]');
        extra.forEach(function(d) {
          if (!base.some(function(b){ return b.noDO === d.nomorDO; })) {
            base.push({ id:d.id, tanggal:d.tanggalKirim, noDO:d.nomorDO,
              namaMahasiswa:d.nama, ekspedisi:d.ekspedisi, total:d.total, status:d.status||'Diproses' });
          }
        });
      } catch(e) {}
      return base.slice().reverse();
    },

    latestMonitoring: function() {
      var base = this.monitoringList.slice();
      try {
        var extra = JSON.parse(sessionStorage.getItem('newDOList') || '[]');
        extra.forEach(function(d) {
          if (!base.some(function(b){return b.noDO===d.nomorDO;})) {
            base.push({ noDO:d.nomorDO, utDaerah:'UPBJJ Jakarta', jumlahItem:3,
              status:d.status||'Diproses', tanggal:d.tanggalKirim, progress:20 });
          }
        });
      } catch(e) {}
      return base;
    },

    latestStok: function() {
      try {
        var saved = JSON.parse(localStorage.getItem('stokData') || '[]');
        if (saved.length > 0) return saved;
      } catch(e) {}
      return this.stokList;
    },

    filteredHistori: function() {
      var data = this.latestHistori;
      var q  = (this.filterHistoriQ || '').toLowerCase().trim();
      var st = this.filterHistoriStatus;
      if (q) data = data.filter(function(h){
        return (h.noDO||'').toLowerCase().includes(q)
          || (h.namaMahasiswa||'').toLowerCase().includes(q)
          || (h.ekspedisi||'').toLowerCase().includes(q)
          || (h.status||'').toLowerCase().includes(q);
      });
      if (st) data = data.filter(function(h){ return h.status === st; });
      return data;
    },

    filteredRekap: function() {
      var self = this; var q = (this.filterRekapQ || '').toLowerCase().trim();
      if (!q) return self.latestStok;
      return self.latestStok.filter(function(i){
        return (i.kode||'').toLowerCase().includes(q)
          || (i.judul||'').toLowerCase().includes(q)
          || (i.kategori||'').toLowerCase().includes(q)
          || (self.upbjjNama[i.upbjj]||i.upbjj||'').toLowerCase().includes(q)
          || (i.lokasiRak||'').toLowerCase().includes(q);
      });
    },

    monitoringDiproses:        function() { return this.latestMonitoring.filter(function(d){return d.status==='Diproses';}).length; },
    monitoringDalamPerjalanan: function() { return this.latestMonitoring.filter(function(d){return d.status==='Dalam Perjalanan';}).length; },
    monitoringSelesai:         function() { return this.latestMonitoring.filter(function(d){return d.status==='Selesai';}).length; },
    rekapAman:    function() { return this.latestStok.filter(function(i){return i.qty>=i.safety;}).length; },
    rekapMenipis: function() { return this.latestStok.filter(function(i){return i.qty<i.safety&&i.qty>0;}).length; },
    rekapKosong:  function() { return this.latestStok.filter(function(i){return i.qty===0;}).length; }
  },

  watch: {
    tab: function(val) {
      var titles = {
        dashboard:'Dashboard', stok:'📚 Informasi Bahan Ajar',
        tracking:'🚚 Tracking Delivery Order', order:'📋 Buat Delivery Order'
      };
      var pt = document.getElementById('pageTitle');
      var pb = document.getElementById('pageBreadcrumb');
      if (pt) pt.textContent = titles[val] || val;
      if (pb) pb.textContent = 'SITTA › ' + (titles[val] || val);
    }
  },

  methods: {
    showTab:        function(t) { this.tab = t; this.subSection = t === 'dashboard' ? 'dashboard' : t; },
    showSubSection: function(s) { this.tab = 'dashboard'; this.subSection = s; },
    toggleSidebar:  function() {
      this.sidebarClosed = !this.sidebarClosed;
      var sb = document.getElementById('sidebar');
      var mc = document.getElementById('mainContent');
      if (sb) sb.classList.toggle('closed', this.sidebarClosed);
      if (mc) mc.classList.toggle('sidebar-closed', this.sidebarClosed);
    },
    toggleSubmenu: function() {
      var sub   = document.getElementById('laporan-sub');
      var arrow = document.getElementById('arrow-laporan');
      if (sub)   sub.classList.toggle('open');
      if (arrow) arrow.classList.toggle('open');
    },
    handleLogout: function() {
      this.user = {};
      sessionStorage.removeItem('loggedUser');
    },
    onLoginSuccess: function(user) {
      this.user = user;
      sessionStorage.setItem('loggedUser', JSON.stringify(user));
    },

    fmtRupiah: function(v) { return 'Rp ' + (Number(v)||0).toLocaleString('id-ID'); },
    fmtTgl:    function(v) {
      if (!v) return '-';
      var d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
    },
    statusBadgeClass: function(status) {
      var s = (status||'').toLowerCase();
      if (s.includes('selesai'))    return 'badge-success';
      if (s.includes('perjalanan')) return 'badge-info';
      if (s.includes('diproses'))   return 'badge-warning';
      return 'badge-primary';
    },
    qtyStatusLabel: function(item) {
      if (item.qty === 0)         return 'Kosong';
      if (item.qty < item.safety) return 'Menipis';
      return 'Aman';
    },
    qtyStatusClass: function(item) {
      if (item.qty === 0)         return 'badge-danger';
      if (item.qty < item.safety) return 'badge-warning';
      return 'badge-success';
    },

    showToast: function(msg, type) {
      var self = this;
      self.toastMsg = msg; self.toastType = type || 'info'; self.toastVisible = true;
      clearTimeout(self._toastTimer);
      self._toastTimer = setTimeout(function(){ self.toastVisible = false; }, 3500);
    },

    onToast:      function(msg, type) { this.showToast(msg, type); },
    onStokBerubah:function(list)      { this.stokList = list; },

    onDODibuat: function(doObj) {
      var hrtId = this._generateHrtId();
      doObj.id  = hrtId;
      this.trackingList.push(doObj);
      this.historiList.push({
        id: hrtId, tanggal: doObj.tanggalKirim, noDO: doObj.nomorDO,
        namaMahasiswa: doObj.nama, ekspedisi: doObj.ekspedisi,
        total: doObj.total, status: doObj.status || 'Diproses'
      });
      try {
        var existing = JSON.parse(sessionStorage.getItem('newDOList') || '[]');
        if (!existing.some(function(e){ return e.nomorDO === doObj.nomorDO; })) {
          existing.push(doObj);
          sessionStorage.setItem('newDOList', JSON.stringify(existing));
        }
      } catch(e) {}
      this.showToast('🎉 DO ' + doObj.nomorDO + ' berhasil dibuat!', 'success');
      
      this.tab = 'tracking';
      var self = this;
      this.$nextTick(function() {
        if (self.$refs.doTracking) self.$refs.doTracking.addNewDO(doObj);
      });
    },

    lihatTracking: function(noDO) {
      this.tab = 'tracking';
      var self = this;
      this.$nextTick(function() {
        if (self.$refs.doTracking) {
          self.$refs.doTracking.query = noDO;
          self.$refs.doTracking.search();
        }
      });
    },

    _handleGlobalEsc: function(e) {
      if (e.key === 'Escape') {
        // 1. Prioritas: Tutup Modal Sukses (DOM) jika aktif
        var modalSukses = document.getElementById('modal-sukses-do');
        if (modalSukses && modalSukses.classList.contains('active')) {
          modalSukses.classList.remove('active');
          return;
        }

        // 2. Tutup Submenu Sidebar jika terbuka
        var sub = document.getElementById('laporan-sub');
        if (sub && sub.classList.contains('open')) {
          this.toggleSubmenu();
          return;
        }
      }
    },

    _generateHrtId: function() {
      var prefix = 'HRT-'; var max = 0;
      this.latestHistori.forEach(function(h) {
        var id = (h.id || '').toUpperCase();
        if (id.startsWith(prefix)) {
          var seq = parseInt(id.replace(prefix, '')) || 0;
          if (seq > max) max = seq;
        }
      });
      return prefix + String(max + 1).padStart(3, '0');
    },

    cetakRekap: function() { window.print(); },

    loadData: function() {
      var self = this;
      self.loading = true;
      ApiService.loadData().then(function(d) {
        self.upbjjList     = d.upbjjList      || [];
        self.upbjjNama     = d.upbjjNama      || {};
        self.kategoriList  = d.kategoriList   || [];
        self.pengirimanList= d.pengirimanList  || [];
        self.paketList     = d.paket          || [];
        self.mkKatalog     = d.mkKatalog      || {};
        self.trackingList  = (d.tracking || []).map(function(t){
          return Object.assign({}, t, {perjalanan: t.perjalanan ? t.perjalanan.slice() : []});
        });
        self.historiList   = d.histori        || [];
        self.monitoringList= d.monitoringDO   || [];
        var saved = [];
        try { saved = JSON.parse(localStorage.getItem('stokData') || '[]'); } catch(e) {}
        self.stokList = saved.length > 0
          ? saved
          : (d.stok || []).map(function(i){ return Object.assign({}, i); });
        self.loading = false;
      }).catch(function(err) {
        console.error('Gagal memuat data:', err);
        self.loading = false;
      });
    }
  },

  mounted: function() {
    this.loadData();
    window.addEventListener('keydown', this._handleGlobalEsc);
  },

  destroyed: function() {
    window.removeEventListener('keydown', this._handleGlobalEsc);
  }
};

// ===== INISIALISASI UTAMA =====
async function initApp() {
  try {
    await Promise.all([
      window.__registerLoginForm(),
      window.__registerStatusBadge(),
      window.__registerAppModal(),
      window.__registerStockTable(),
      window.__registerOrderForm(),
      window.__registerDoTracking()
    ]);

    window.sittaApp = new Vue(rootConfig);

  } catch (err) {
    console.error('Gagal menginisialisasi aplikasi:', err);
    // Tampilkan pesan error di halaman jika gagal load template
    var appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML =
        '<div style="padding:40px;text-align:center;font-family:Arial,sans-serif;">' +
        '<h2 style="color:#dc2626;">⚠️ Gagal Memuat Aplikasi</h2>' +
        '<p style="color:#6b7280;">Template komponen tidak dapat dimuat. ' +
        'Pastikan aplikasi dijalankan melalui web server (bukan buka file langsung).</p>' +
        '<code style="background:#f3f4f6;padding:8px 16px;border-radius:6px;font-size:.85rem;">' +
        'python -m http.server 8080</code>' +
        '</div>';
    }
  }
}

// ===== CLOCK (tidak bergantung pada Vue) =====
(function clock() {
  function tick() {
    var now = new Date();
    var cl  = document.getElementById('clockDisplay');
    var dt  = document.getElementById('dateDisplay');
    if (cl) cl.textContent = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    if (dt) dt.textContent = now.toLocaleDateString('id-ID', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
  }
  tick();
  setInterval(tick, 1000);
})();

initApp();
