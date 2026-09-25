(function() {
    'use strict';
    function renderRecent() {
        var box = document.getElementById('recentItems');
        APP.fetchData('/data/trains.json').then(function(data) {
            var trains = (data && data.trains) ? data.trains : [];
            var all = [];
            trains.forEach(function(t) {
                (t.liveries || []).forEach(function(l) {
                    all.push({ name: l.name, train: t.name, author: l.author, date: l.date, trainId: t.id });
                });
            });
            all.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
            var recent = all.slice(0, 6);

            if (recent.length === 0) {
                box.innerHTML =
                    '<div class="empty-state">' +
                    '<svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>' +
                    '<h3>Пока пусто</h3>' +
                    '<p>Мы только начинаем наполнять сайт. Первые окрасы уже появляются в нашем Telegram-канале — загляни туда.</p>' +
                    '<a href="https://t.me/Texel_railway_club" target="_blank" rel="noopener" class="btn btn-primary">Перейти в Telegram</a>' +
                    '</div>';
                return;
            }

            box.innerHTML = '<div class="items-grid">' + recent.map(function(item) {
                return '<div class="item-card">' +
                    '<div class="item-card-image"><svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:var(--text-muted);opacity:0.4"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6z"/></svg></div>' +
                    '<div class="item-card-content">' +
                    '<h4 class="item-card-title">' + item.name + '</h4>' +
                    '<div class="item-card-meta"><span>' + item.train + '</span><span>' + (item.author || 'TRCL') + '</span></div>' +
                    '<div class="item-card-actions"><a href="/train.html?id=' + item.trainId + '" class="btn btn-secondary btn-sm">Подробнее</a></div>' +
                    '</div></div>';
            }).join('') + '</div>';
        });
    }
    document.addEventListener('DOMContentLoaded', renderRecent);
})();
