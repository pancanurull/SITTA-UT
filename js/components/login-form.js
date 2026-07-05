async function registerLoginForm() {
  const template = await fetch('templates/login-form.html').then(r => r.text());

  Vue.component('login-form', {
    template,
    data: function() {
      return {
        email: '',
        password: '',
        showPass: false,
        loading: false,
        success: false,
        activeModal: null
      };
    },

    mounted: function() {
      window.addEventListener('keydown', this._handleEsc);
    },

    destroyed: function() {
      window.removeEventListener('keydown', this._handleEsc);
    },

    methods: {
      handleLogin: function() {
        var self = this;
        if (!self.email || !self.password) {
          this.$emit('toast', '⚠️ Email dan password tidak boleh kosong!', 'warning');
          return;
        }
        
        if (!self.email.includes('@')) {
          this.$emit('toast', '📧 Format email tidak valid!', 'warning');
          return;
        }

        if (self.password.length < 3) {
          this.$emit('toast', '🔑 Password minimal 3 karakter!', 'warning');
          return;
        }

        self.loading = true;
        
        setTimeout(function() {
          ApiService.loadData()
            .then(function(data) {
              var user = data.pengguna.find(function(u) {
                return u.email === self.email && u.password === self.password;
              });

              var userByEmail = data.pengguna.find(function(u) {
                return u.email === self.email;
              });

              if (!userByEmail) {
                self.$emit('toast', '❌ Email tidak terdaftar!', 'error');
                self.loading = false;
              } else if (userByEmail.password !== self.password) {
                self.$emit('toast', '❌ Password salah!', 'error');
                self.loading = false;
              } else {
                self.$emit('login-success', userByEmail);
              }
            })
            .catch(function() {
              self.$emit('toast', 'Terjadi kesalahan sistem.', 'error');
              self.loading = false;
            });
        }, 800);
      },
      handleReset: function() {
        this.activeModal = null;
        this.$emit('toast', '✅ Tautan reset password telah dikirim!', 'success');
      },
      _handleEsc: function(e) {
        if (e.key === 'Escape' && this.activeModal) {
          this.activeModal = null;
        }
      }
    }
  });
}

window.__registerLoginForm = registerLoginForm;