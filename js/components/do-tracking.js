/* Indikator: Component, computed, watch x2, v-for+index, v-if/v-show,
 *            @keyup.enter, @keyup.esc, @click, tambah progress timeline
 */

async function registerDoTracking() {
  const template = await fetch('templates/do-tracking.html').then(r => r.text());

  Vue.component('do-tracking', {
    template,
    props: {
      trackingList: { type: Array,  default: function() { return []; } },
      paket:        { type: Array,  default: function() { return []; } },
      mkKatalog:    { type: Object, default: function() { return {}; } }
    },
    data: function() {
      return {
        query:            '',
        selected:         null,
        searched:         false,
        progress:         0,
        localTracking:    [],
        showProgressForm: false,
        newProgressKet:   ''
      };
    },
    computed: {
      // Gabungkan tracking dari props + DO baru dibuat + sessionStorage (Indikator 4)
      allTracking: function() {
        var map = {};
        (this.trackingList || []).forEach(function(t){ map[t.nomorDO] = t; });
        this.localTracking.forEach(function(t){ map[t.nomorDO] = t; });
        try {
          var extra = JSON.parse(sessionStorage.getItem('newDOList') || '[]');
          extra.forEach(function(d){ if(d.nomorDO) map[d.nomorDO] = d; });
        } catch(e) {}
        return Object.keys(map).map(function(k){ return map[k]; });
      },
      riwayatDO: function() {
        return this.allTracking.slice().reverse().slice(0, 10);
      },
      doExamples: function() {
        return ['DO2025-001','DO2025-002','DO2025-003','DO2023-001'];
      }
    },
    watch: {
      // WATCHER 5: Update progress bar otomatis saat selected berubah 
      selected: function(val) {
        if (val) { this._updateProgress(); }
        else     { this.progress = 0; this.showProgressForm = false; this.newProgressKet = ''; }
      },
      // WATCHER 6: Reset hasil saat query dikosongkan 
      query: function(val) {
        if (!val || !val.trim()) {
          if (this.searched) { this.selected = null; this.searched = false; }
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
      search: function() {
        var input = (this.query || '').trim();
        if (!input) {
          this.$emit('toast', '⚠️ Masukkan nomor DO atau NIM!', 'warning');
          this.searched = true; this.selected = null; return;
        }
        var upper = input.toUpperCase();
        var clean = upper.replace(/[-\s]/g, '');
        var all   = this.allTracking;
        var found = all.find(function(t) {
          var noDO      = (t.nomorDO || '').toUpperCase();
          var cleanNoDO = noDO.replace(/[-\s]/g, '');
          var nim       = (t.nim || '').trim();
          if (noDO === upper || cleanNoDO === clean || noDO.startsWith(upper)) return true;
          if (nim === input) return true;
          return false;
        });
        this.selected = found || null;
        this.searched  = true;
        if (this.selected) this.$emit('toast', '✅ Data ditemukan!', 'success');
        else                this.$emit('toast', '❌ Data tidak ditemukan.', 'error');
      },
      // @keyup.esc 
      clearSearch: function() { this.query=''; this.selected=null; this.searched=false; },
      onEnter:     function() { this.search(); },
      onEsc:       function() { this.clearSearch(); },
      cariContoh:  function(no){ this.query = no; this.search(); },
      cariDO:      function(no){ this.query = no; this.search(); },

      _updateProgress: function() {
        if (!this.selected) { this.progress = 0; return; }
        var s = (this.selected.status || '').toLowerCase();
        if (s.includes('selesai'))    { this.progress = 100; return; }
        if (s.includes('perjalanan')) { this.progress = 65;  return; }
        if (s.includes('dikirim'))    { this.progress = 80;  return; }
        if (s.includes('diproses'))   { this.progress = 30;  return; }
        this.progress = 15;
      },

      formatTanggal: function(val) {
        if (!val) return '-';
        var d = new Date(val);
        return isNaN(d.getTime()) ? val : d.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
      },
      formatRupiah: function(val) { return 'Rp ' + (Number(val)||0).toLocaleString('id-ID'); },
      getNamaPaket: function(kode){
        var found = (this.paket||[]).find(function(p){return p.kode===kode;});
        return found ? found.nama : kode;
      },

      tambahProgress: function() {
        if (!this.newProgressKet.trim()) { this.$emit('toast', '⚠️ Keterangan tidak boleh kosong!', 'warning'); return; }
        if (!this.selected) return;
        var waktu = new Date().toLocaleString('id-ID', {
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit', second:'2-digit'
        }).replace(/\//g, '-');
        this.selected.perjalanan.push({ waktu: waktu, keterangan: this.newProgressKet.trim() });
        var tmp = this.selected; this.selected = null; this.selected = tmp;
        this.newProgressKet = ''; this.showProgressForm = false;
        this.$emit('toast', '✅ Progress perjalanan ditambahkan!', 'success');
      },
      // @keyup.enter + @keyup.esc di form progress 
      onProgressKeyup: function(e) {
        if (e.key === 'Enter')  this.tambahProgress();
        if (e.key === 'Escape') { this.showProgressForm = false; this.newProgressKet = ''; }
      },

      _handleEsc: function(e) {
        if (e.key === 'Escape' && this.showProgressForm) {
          this.showProgressForm = false;
          this.newProgressKet = '';
        }
      },

      addNewDO: function(doObj) {
        this.localTracking.push(doObj);
        this.query = doObj.nomorDO;
        this.search();
      }
    }
  });
}

window.__registerDoTracking = registerDoTracking;
