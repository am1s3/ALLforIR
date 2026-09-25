(function() {
    'use strict';
    var currentTrain = null, currentTab = 'liveries';
    function renderItemCard(item) {
        return '<div class="item-card fade-in"><div class="item-card-image"><div class="train-card-placeholder"><svg viewBox="0 0 24 24" style="width:48px;height:48px;fill:var(--text-muted);opacity:0.5"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6z"/></svg></div></div><div class="item-card-content"><h4 class="item-card-title">' + item.name + '</h4><div class="item-card-meta"><span>' + (item.author || 'Аноним') + '</span><span>' + (item.downloads || 0) + ' скачиваний</span></div><div class="item-card-actions"><button class="btn btn-primary btn-sm" onclick="APP.toast.show(\'Скачивание начато\',\'success\')"><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7z"/></svg>Скачать</button></div></div></div>';
    }
    function renderItems() {
        var grid = document.getElementById('itemsGrid');
        if (!grid || !currentTrain) return;
        var items = currentTab === 'liveries' ? (currentTrain.liveries || []) : (currentTrain.models || []);
        if (items.length === 0) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;"><h3>Пока ничего нет</h3></div>'; return; }
        grid.innerHTML = items.map(renderItemCard).join('');
        setTimeout(function() { grid.querySelectorAll('.fade-in').forEach(function(el, i) { setTimeout(function() { el.classList.add('visible'); }, i * 50); }); }, 100);
    }
    function loadTrain() {
        var params = new URLSearchParams(window.location.search);
        var trainId = params.get('id');
        if (!trainId) { window.location.href = '/catalog.html'; return; }
        APP.fetchData('/data/trains.json').then(function(data) {
            if (data && data.trains) {
                currentTrain = data.trains.find(function(t) { return t.id === trainId; });
            }
            if (!currentTrain) {
                currentTrain = {id:trainId,name:'Паровоз Class A4',description:'Легендарный британский паровоз',liveries:[{id:'l1',name:'Garter Blue',author:'RailFan',downloads:342}],models:[{id:'m1',name:'База',author:'IR Team',downloads:521}]};
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
