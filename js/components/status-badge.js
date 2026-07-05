async function registerStatusBadge() {
  const template = await fetch('templates/status-badge.html').then(r => r.text());

  Vue.component('status-badge', {
    template,
    props: {
      item: { type: Object, required: true }
    },
    data: function() {
      return { showTip: false };
    },
    computed: {
      statusLabel: function() {
        if (this.item.qty === 0)              return 'Kosong';
        if (this.item.qty < this.item.safety) return 'Menipis';
        return 'Aman';
      },
      badgeClass: function() {
        if (this.statusLabel === 'Aman')    return 'badge badge-success';
        if (this.statusLabel === 'Menipis') return 'badge badge-warning';
        return 'badge badge-danger';
      },
      ikon: function() {
        if (this.statusLabel === 'Aman')    return '✅';
        if (this.statusLabel === 'Menipis') return '⚠️';
        return '🔴';
      }
    }
  });
}

window.__registerStatusBadge = registerStatusBadge;
