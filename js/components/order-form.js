/*Indikator: Component, computed, watch x2, v-model, v-bind, v-if, v-for,
 *            @keyup.enter, generate nomor DO otomatis
 */

async function registerOrderForm() {
  const template = await fetch('templates/order-form.html').then(r => r.text());

  Vue.component('order-form', {
    template,
    props: {
      paket:         { type: Array,  default: function() { return []; } },
      pengirimanList:{ type: Array,  default: function() { return []; } },
      mkKatalog:     { type: Object, default: function() { return {}; } },
      allTracking:   { type: Array,  default: function() { return []; } }
    },
    data: function() {
      return {
        visible: false,
        paketDetails: [],
        newDO: {
          nomor:'', nim:'', nama:'', ekspedisi:'', paket:'',
          tanggal: new Date().toISOString().split('T')[0],
          total: 0, catatan:''
        },
        errors: {}
      };
    },
    computed: {
      totalDisplay: function() {
        return this.newDO.total > 0 ? 'Rp ' + Number(this.newDO.total).toLocaleString('id-ID') : 'Rp 0';
      },
      tanggalDisplay: function() {
        if (!this.newDO.tanggal) return '-';
        var d = new Date(this.newDO.tanggal);
        return isNaN(d.getTime()) ? this.newDO.tanggal
          : d.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
      }
    },
    watch: {
      // WATCHER 3: Auto-generate nomor DO saat form dibuka 
      visible: function(val) {
        if (val) { this.newDO.nomor = this._generateNomor(); this.errors = {}; }
      },
      // WATCHER 4: Auto-update detail paket + harga saat paket dipilih 
      'newDO.paket': function(val) {
        var self = this;
        var found = (self.paket || []).find(function(p){ return p.kode === val; });
        if (found) {
          self.newDO.total  = found.harga;
          self.paketDetails = found.isi.map(function(kode){
            return self.mkKatalog[kode] || { kode: kode, judul: '-' };
          });
        } else {
          self.newDO.total  = 0;
          self.paketDetails = [];
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
      toggle: function() { this.visible = !this.visible; if (!this.visible) this.reset(); },

      _generateNomor: function() {
        var tahun = new Date().getFullYear();
        var prefix = 'DO' + tahun + '-';
        var max = 0;
        (this.allTracking || []).forEach(function(t) {
          var no = (t.nomorDO || '').toUpperCase();
          if (no.startsWith(prefix)) {
            var seq = parseInt(no.replace(prefix, '')) || 0;
            if (seq > max) max = seq;
          }
        });
        try {
          var extra = JSON.parse(sessionStorage.getItem('newDOList') || '[]');
          extra.forEach(function(d) {
            var no = (d.nomorDO || '').toUpperCase();
            if (no.startsWith(prefix)) {
              var seq = parseInt(no.replace(prefix, '')) || 0;
              if (seq > max) max = seq;
            }
          });
        } catch(e) {}
        return prefix + String(max + 1).padStart(3, '0');
      },

      validate: function() {
        var f = this.newDO; var err = {};
        if (!f.nim.trim())  err.nim       = 'NIM wajib diisi';
        if (!f.nama.trim()) err.nama      = 'Nama wajib diisi';
        if (!f.ekspedisi)   err.ekspedisi = 'Pilih ekspedisi';
        if (!f.paket)       err.paket     = 'Pilih paket';
        if (!f.tanggal)     err.tanggal   = 'Tanggal kirim wajib diisi';
        this.errors = err;
        return Object.keys(err).length === 0;
      },

      // @keyup.enter (Indikator 6)
      onKeyup: function(e) { if (e.key === 'Enter') this.createDO(); },

      _handleEsc: function(e) {
        if (e.key === 'Escape' && this.visible) {
          this.toggle();
        }
      },

      createDO: function() {
        if (!this.validate()) return;
        var f = this.newDO;
        var waktu = new Date().toLocaleString('id-ID', {
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit', second:'2-digit'
        }).replace(/\//g, '-');
        var doObj = {
          nomorDO:      f.nomor,
          nim:          f.nim.trim(),
          nama:         f.nama.trim(),
          status:       'Diproses',
          ekspedisi:    f.ekspedisi,
          tanggalKirim: f.tanggal,
          paket:        f.paket,
          total:        f.total,
          catatan:      f.catatan,
          perjalanan:   [{ waktu: waktu, keterangan: 'Delivery Order baru dibuat di sistem SITTA UT' }]
        };
        this.$emit('do-dibuat', doObj);

        // ===== KODE DARI TUGAS 2 =====
        var modalEl = document.getElementById('modal-sukses-do');
        var modalNum = document.getElementById('modal-do-number');

        if (modalEl) {
            modalEl.classList.add('active');
        }

        if (modalNum) {
            modalNum.textContent = doObj.nomorDO;
        }

        this.visible = false;
        this.reset();
      },

      reset: function() {
        this.newDO = { nomor:'', nim:'', nama:'', ekspedisi:'', paket:'',
          tanggal: new Date().toISOString().split('T')[0], total:0, catatan:'' };
        this.paketDetails = []; this.errors = {};
        if (this.visible) this.newDO.nomor = this._generateNomor();
      }
    }
  });
}

window.__registerOrderForm = registerOrderForm;
