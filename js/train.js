(function() {
    'use strict';
    var currentTrain = null, currentTab = 'liveries';

    function renderItemCard(item) {
        return '<div class="item-card fade-in">' +
            '<div class="item-card-image"><svg viewBox="0 0 24 24" style="width:48px;height:48px;fill:var(--text-muted);opacity:0.4"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6z"/></svg></div>' +
            '<div class="item-card-content">' +
            '<h4 class="item-card-title">' + item.name + '</h4>' +
            '<div class="item-card-meta">' +
            '<span>' + (item.author || 'TRCL') + '</span>' +
            '<span>' + (item.downloads || 0) + ' скачиваний</span>' +
            '<span>' + APP.formatDate(item.date || new Date().toISOString()) + '</span>' +
            '</div>' +
            (item.description ? '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:14px">' + item.description + '</p>' : '') +
            '<div class="item-card-actions">' +
            '<button class="btn btn-primary btn-sm" onclick="downloadItem(\'' + item.id + '\', \'' + currentTab + '\')">' +
            '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Скачать</button>' +
            '</div></div></div>';
    }

    function renderItems() {
        var grid = document.getElementById('itemsGrid');
        if (!grid || !currentTrain) return;
        var items = currentTab === 'liveries' ? (currentTrain.liveries || []) : (currentTrain.models || []);
        
        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
                '<svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>' +
                '<h3>Пока нет ' + (currentTab === 'liveries' ? 'окрасов' : 'моделей') + '</h3>' +
                '<p>Первые работы уже появляются в Telegram-канале TRCL — подписывайся, чтобы не пропустить.</p>' +
                '<a href="https://t.me/Texel_railway_club" target="_blank" rel="noopener" class="btn btn-primary">Перейти в Telegram</a>' +
                '</div>';
            return;
        }
        
        grid.innerHTML = items.map(renderItemCard).join('');
        setTimeout(function() { 
            grid.querySelectorAll('.fade-in').forEach(function(el, i) { 
                setTimeout(function() { el.classList.add('visible'); }, i * 50); 
            }); 
        }, 100);
    }

    function loadTrain() {
        var params = new URLSearchParams(window.location.search);
        var trainId = params.get('id');
        if (!trainId) { window.location.href = '/catalog.html'; return; }

        APP.fetchData('/api/trains').then(function(data) {
            if (data && data.trains) {
                currentTrain = data.trains.find(function(t) { return t.id === trainId; });
            }
            
            if (!currentTrain) {
                window.location.href = '/catalog.html';
                return;
            }
            
            document.getElementById('trainName').textContent = currentTrain.name;
            document.getElementById('trainDesc').textContent = currentTrain.description;
            
            var lc = document.getElementById('liveriesCount');
            var mc = document.getElementById('modelsCount');
            if (lc) lc.textContent = currentTrain.liveries ? currentTrain.liveries.length : 0;
            if (mc) mc.textContent = currentTrain.models ? currentTrain.models.length : 0;
            
            renderItems();
        });
    }

    window.downloadItem = function(itemId, itemType) {
        var params = new URLSearchParams(window.location.search);
        var trainId = params.get('id');

        APP.toast.show('Скачивание начато...', 'info', 2000);

        // Увеличиваем счётчик через API
        fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                trainId: trainId, 
                itemId: itemId,
                itemType: itemType 
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
            if (result.success) {
                APP.toast.show('Скачивание #' + result.downloads + '. Спасибо за использование!', 'success');
                
                // Обновляем данные на странице
                if (currentTrain) {
                    var items = itemType === 'liveries' ? currentTrain.liveries : currentTrain.models;
                    var item = items ? items.find(function(i) { return i.id === itemId; }) : null;
                    if (item) {
                        item.downloads = result.downloads;
                        renderItems();
                    }
                }
            }
        })
        .catch(function(err) {
            console.error('Download counter error:', err);
        });

        // Тут можно добавить реальное скачивание файла
        // Например: window.location.href = '/downloads/' + itemId + '.png';
    };

    document.addEventListener('DOMContentLoaded', function() {
        loadTrain();
        document.querySelectorAll('.tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                renderItems();
            });
        });
    });
})();