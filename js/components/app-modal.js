async function registerAppModal() {
  const template = await fetch('templates/app-modal.html').then(r => r.text());

  Vue.component('app-modal', {
    template,
    props: {
      show:   { type: Boolean, default: false },
      title:  { type: String,  default: '' },
      size:   { type: String,  default: 'normal' },
      danger: { type: Boolean, default: false }
    },
    computed: {
      modalStyle: function() {
        if (this.size === 'sm') return 'max-width:380px;';
        if (this.size === 'lg') return 'max-width:700px;';
        return 'max-width:560px;';
      }
    },
    methods: {
      close: function()         { this.$emit('close'); },
      overlayClick: function(e) { if (e.target === e.currentTarget) this.close(); }
    }
  });
}

window.__registerAppModal = registerAppModal;
