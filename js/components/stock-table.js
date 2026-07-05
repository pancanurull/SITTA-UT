/*Indikator: Component, computed, watch x2, v-for+index, v-if/v-else-if/v-else, v-show,
 *            v-model, v-bind, v-text, v-html, @click, @change, @keyup.enter, @keyup.esc,
 *            filter rupiah+buah, CRUD, validasi
 */

async function registerStockTable() {
  const template = await fetch('templates/stock-table.html').then(r => r.text());

  Vue.component('ba-stock-table', {
    template,
    props: {
      stokAwal:    { type: Array,  default: function() { return []; } },
      upbjjList:   { type: Array,  default: function() { return []; } },
      upbjjNama:   { type: Object, default: function() { return {}; } },
      kategoriList:{ type: Array,  default: function() { return []; } }
    },
    data: function() {
      var saved = [];
      try { saved = JSON.parse(localStorage.getItem('stokData') || '[]'); } catch(e) {}
      var list = saved.length > 0
        ? saved
        : this.stokAwal.map(function(i) { return Object.assign({}, i); });
      return {
        stokList:       list,
        search:         '',
        filterUpbjj:    '',
        filterKategori: '',
        filterStatus:   '',
        showReorderOnly:false,
        sortBy:         '',
        showModal:      false,
        editMode:       false,
        formData:       {},
        formErrors:     {},
        previewImg:     '',
        showModalHapus: false,
        hapusTarget:    null,
        hoveredKode:    null
      };
    },

    computed: {
      // Statistik — computed property 
      countAman:    function() { return this.stokList.filter(function(i){return i.qty > i.safety;}).length; },
      countMenipis: function() { return this.stokList.filter(function(i){return i.qty <= i.safety && i.qty > 0;}).length; },
      countKosong:  function() { return this.stokList.filter(function(i){return i.qty === 0;}).length; },
      totalQty:     function() { 
        return this.stokList.reduce(function(sum, item) { return sum + (Number(item.qty) || 0); }, 0); 
      },

      // UPBJJ unik untuk dropdown filter
      upbjjFilterList: function() {
        var seen = {};
        return this.stokList.map(function(i){return i.upbjj;})
          .filter(function(u){ if(seen[u])return false; seen[u]=true; return !!u; }).sort();
      },

      // Kategori — dependent filter berdasarkan UPBJJ yang dipilih 
      kategoriFilterList: function() {
        var self = this; var seen = {};
        var src = self.filterUpbjj
          ? self.stokList.filter(function(i){return i.upbjj === self.filterUpbjj;})
          : self.stokList;
        return src.map(function(i){return i.kategori;})
          .filter(function(k){if(seen[k])return false; seen[k]=true; return !!k;}).sort();
      },

      // filteredList: gabungan filter + sort — tidak recompute jika data tidak berubah 
      filteredList: function() {
        var self = this;
        var data = this.stokList.slice();
        if (self.search.trim()) {
          var q = self.search.toLowerCase();
          data = data.filter(function(i){
            return (i.kode||'').toLowerCase().includes(q)
                || (i.judul||'').toLowerCase().includes(q)
                || (i.kategori||'').toLowerCase().includes(q)
                || (self.upbjjNama[i.upbjj]||i.upbjj||'').toLowerCase().includes(q)
                || (i.lokasiRak||'').toLowerCase().includes(q);
          });
        }
        if (self.filterUpbjj) data = data.filter(function(i){return i.upbjj === self.filterUpbjj;});
        if (self.filterKategori && self.filterUpbjj) data = data.filter(function(i){return i.kategori === self.filterKategori;});
        if (self.filterStatus) {
          data = data.filter(function(i){
            if (self.filterStatus === 'Aman')    return i.qty > i.safety;
            if (self.filterStatus === 'Menipis') return i.qty <= i.safety && i.qty > 0;
            if (self.filterStatus === 'Kosong')  return i.qty === 0;
            return true;
          });
        }
        if (self.showReorderOnly) data = data.filter(function(i){return i.qty < i.safety || i.qty === 0;});
        if (self.sortBy === 'judulAsc')  data.sort(function(a,b){return a.judul.localeCompare(b.judul);});
        if (self.sortBy === 'judulDesc') data.sort(function(a,b){return b.judul.localeCompare(a.judul);});
        if (self.sortBy === 'qtyAsc')    data.sort(function(a,b){return a.qty - b.qty;});
        if (self.sortBy === 'qtyDesc')   data.sort(function(a,b){return b.qty - a.qty;});
        if (self.sortBy === 'hargaAsc')  data.sort(function(a,b){return a.harga - b.harga;});
        if (self.sortBy === 'hargaDesc') data.sort(function(a,b){return b.harga - a.harga;});
        return data;
      }
    },

    watch: {
      // WATCHER 1: Reset filterKategori saat UPBJJ berubah 
      filterUpbjj: function(val, old) {
        if (val !== old) this.filterKategori = '';
      },
      // WATCHER 2: Auto-save ke localStorage + emit ke parent saat stokList berubah 
      stokList: {
        deep: true,
        handler: function(val) {
          try { localStorage.setItem('stokData', JSON.stringify(val)); } catch(e) {}
          this.$emit('stok-berubah', val);
        }
      }
    },

    mounted: function() {
      window.addEventListener('keydown', this._handleEsc);
    },

    destroyed: function() {
      window.removeEventListener('keydown', this._handleEsc);
    },

    methods: {
      formatRupiah: function(val) { return 'Rp ' + (Number(val)||0).toLocaleString('id-ID'); },
      formatBuah:   function(val) { return (Number(val)||0) + ' buah'; },
      getUpbjjNama: function(kode){ return this.upbjjNama[kode] || kode; },

      setFilter:   function(status){ this.filterStatus = this.filterStatus === status ? '' : status; },
      resetFilter: function() {
        this.search=''; this.filterUpbjj=''; this.filterKategori='';
        this.filterStatus=''; this.showReorderOnly=false; this.sortBy='';
      },

      onHover: function(kode) { this.hoveredKode = kode; },
      onLeave: function()     { this.hoveredKode = null; },

      openAddModal: function() {
        this.editMode   = false;
        this.formErrors = {};
        this.previewImg = '';
        this.formData   = { kode:'', judul:'', kategori:'BMP', upbjj:'', lokasiRak:'', harga:0, qty:0, safety:0, catatanHTML:'', cover:'' };
        this.showModal  = true;
        var self = this;
        this.$nextTick(function(){ var el = document.getElementById('f3_kode'); if(el) el.focus(); });
      },

      openEditModal: function(item) {
        this.editMode   = true;
        this.formErrors = {};
        this.previewImg = item.cover || '';
        this.formData   = Object.assign({}, item);
        this.showModal  = true;
      },

      closeModal: function() { this.showModal = false; },

      handleImageUpload: function(e) {
        var self = this; var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) { self.previewImg = ev.target.result; self.formData.cover = ev.target.result; };
        reader.readAsDataURL(file);
      },

      validate: function() {
        var f = this.formData; var err = {};
        if (!f.kode.trim())      err.kode      = 'Kode wajib diisi';
        if (!f.judul.trim())     err.judul     = 'Judul wajib diisi';
        if (!f.kategori)         err.kategori  = 'Pilih kategori';
        if (!f.upbjj)            err.upbjj     = 'Pilih UPBJJ';
        if (!f.lokasiRak.trim()) err.lokasiRak = 'Lokasi rak wajib diisi';
        if (!(Number(f.harga) > 0)) err.harga  = 'Harga harus > 0';
        this.formErrors = err;
        return Object.keys(err).length === 0;
      },

      simpanItem: function() {
        if (!this.validate()) return;
        var f = this.formData;
        var item = {
          kode: f.kode.trim(), judul: f.judul.trim(), kategori: f.kategori, upbjj: f.upbjj,
          lokasiRak: f.lokasiRak.trim(), harga: Number(f.harga)||0,
          qty: Number(f.qty)||0, safety: Number(f.safety)||0,
          catatanHTML: f.catatanHTML||'', cover: f.cover||''
        };
        if (this.editMode) {
          var idx = this.stokList.findIndex(function(i){return i.kode === item.kode;});
          if (idx > -1) Vue.set(this.stokList, idx, item);
          this.$emit('toast', '✅ Bahan ajar berhasil diperbarui!', 'success');
        } else {
          if (this.stokList.some(function(i){return i.kode === item.kode;})) {
            Vue.set(this.formErrors, 'kode', 'Kode sudah ada!'); return;
          }
          this.stokList.push(item);
          this.$emit('toast', '✅ Bahan ajar berhasil ditambahkan!', 'success');
        }
        this.showModal = false;
      },

      // @keyup.enter = simpan, @keyup.esc = tutup modal 
      onFormKeyup: function(e) {
        if (e.key === 'Enter')  this.simpanItem();
        if (e.key === 'Escape') this.closeModal();
      },

      _handleEsc: function(e) {
        if (e.key === 'Escape') {
          if (this.showModal) this.closeModal();
          else if (this.showModalHapus) this.showModalHapus = false;
        }
      },

      konfirmasiHapus: function(item) { this.hapusTarget = item; this.showModalHapus = true; },
      hapusItem: function() {
        var kode = this.hapusTarget.kode;
        this.stokList = this.stokList.filter(function(i){return i.kode !== kode;});
        this.showModalHapus = false; this.hapusTarget = null;
        this.$emit('toast', '🗑️ Bahan ajar berhasil dihapus!', 'warning');
      }
    }
  });
}

window.__registerStockTable = registerStockTable;
