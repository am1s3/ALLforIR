(function() {
    'use strict';
    window.APP = {
        version: '1.0.0',
        devMode: window.location.hostname.indexOf('dev.') >= 0 || window.location.hostname.indexOf('localhost') >= 0,
        toast: {
            container: null,
            init: function() {
                this.container = document.getElementById('toastContainer');
                if (!this.container) {
                    this.container = document.createElement('div');
                    this.container.className = 'toast-container';
                    this.container.id = 'toastContainer';
                    document.body.appendChild(this.container);
                }
            },
            show: function(message, type, duration) {
                type = type || 'info';
                duration = duration || 4000;
                this.init();
                var icons = {
                    success: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
                    error: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
                    info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
                };
                var toast = document.createElement('div');
                toast.className = 'toast ' + type;
                toast.innerHTML = (icons[type] || icons.info) + '<span class="toast-message">' + message + '</span>';
                this.container.appendChild(toast);
                var self = this;
                setTimeout(function() { self.dismiss(toast); }, duration);
            },
            dismiss: function(toast) {
                toast.style.animation = 'toast-in 0.3s ease reverse';
                setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
            }
        },
        storage: {
            get: function(key, defaultValue) {
                try {
                    var item = localStorage.getItem('allforir_' + key);
                    return item ? JSON.parse(item) : (defaultValue || null);
                } catch(e) { return defaultValue || null; }
            },
            set: function(key, value) {
                try { localStorage.setItem('allforir_' + key, JSON.stringify(value)); return true; }
                catch(e) { return false; }
            },
            remove: function(key) { try { localStorage.removeItem('allforir_' + key); } catch(e) {} }
        },
        fetchData: function(url) {
            return fetch(url).then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }).catch(function(e) {
                console.error('Fetch error:', e);
                return null;
            });
        },
        formatDate: function(dateString) {
            var date = new Date(dateString);
            return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
        },
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var args = arguments, self = this;
                clearTimeout(timeout);
                timeout = setTimeout(function() { func.apply(self, args); }, wait);
            };
        },
        generateId: function() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2); }
    };
    var header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }, { passive: true });
    }
    document.querySelectorAll('.fade-in').forEach(function(el) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) { if (entry.isIntersecting) entry.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        observer.observe(el);
    });
    document.querySelectorAll('[data-count]').forEach(function(el) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var target = parseInt(el.getAttribute('data-count'));
                    var current = 0, increment = target / 60;
                    var timer = setInterval(function() {
                        current += increment;
                        if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
                        else el.textContent = Math.floor(current).toLocaleString();
                    }, 33);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(el);
    });
    window.Modal = {
        show: function(title, content, buttons) {
            buttons = buttons || [];
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            var html = '<div class="modal"><div class="modal-header"><h3>' + title + '</h3><button class="modal-close"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></div><div class="modal-body">' + content + '</div>';
            if (buttons.length) {
                html += '<div class="modal-footer">';
                buttons.forEach(function(btn) { html += '<button class="btn ' + (btn.class || 'btn-secondary') + '" data-action="' + btn.action + '">' + btn.text + '</button>'; });
                html += '</div>';
            }
            html += '</div>';
            overlay.innerHTML = html;
            document.body.appendChild(overlay);
            var self = this;
            overlay.addEventListener('click', function(e) { if (e.target === overlay) self.close(overlay); });
            overlay.querySelector('.modal-close').addEventListener('click', function() { self.close(overlay); });
            overlay.querySelectorAll('[data-action]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var action = btn.dataset.action;
                    var config = buttons.find(function(b) { return b.action === action; });
                    if (config && config.handler) config.handler(overlay);
                });
            });
            return overlay;
        },
        confirm: function(title, message, onConfirm) {
            var self = this;
            return this.show(title, '<p style="color:var(--text-secondary)">' + message + '</p>', [
                { text: 'Отмена', action: 'cancel', handler: function(m) { self.close(m); } },
                { text: 'Подтвердить', action: 'confirm', class: 'btn-primary', handler: function(m) { self.close(m); onConfirm(); } }
            ]);
        },
        close: function(overlay) {
            overlay.style.animation = 'fade-in 0.2s ease reverse';
            setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        }
    };
    if (APP.devMode) console.log('%cDEV MODE ACTIVE', 'background:#ff6b35;color:white;padding:8px;font-weight:bold');
})();
