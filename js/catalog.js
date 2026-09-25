(function() {
    'use strict';
    var allTrains = [], filteredTrains = [], currentCategory = 'all', searchQuery = '';
    var trainIcons = {
        steam: '<svg viewBox="0 0 24 24"><path d="M12 2C8 2 4 3.5 4 6v9.5C4 17.5 6 19 8 19.5V21c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1h0v1c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1.5c2-.5 4-2 4-4V6c0-2.5-4-4-8-4z"/></svg>',
        diesel: '<svg viewBox="0 0 24 24"><path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5z"/></svg>',
        electric: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
        wagon: '<svg viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/></svg>'
    };
    function renderTrainCard(train) {
        var icon = trainIcons[train.category] || trainIcons.diesel;
        return '<a href="/train.html?id=' + train.id + '" class="train-card fade-in"><div class="train-card-image"><div class="train-card-placeholder">' + icon + '</div></div><div class="train-card-content"><h3 class="train-card-title">' + train.name + '</h3><p class="train-card-desc">' + (train.description || '') + '</p><div class="train-card-meta"><span>' + (train.liveries ? train.liveries.length : 0) + ' окрасов</span><span>' + (train.models ? train.models.length : 0) + ' моделей</span></div></div></a>';
    }
    function renderTrains() {
        var grid = document.getElementById('trainsGrid');
        if (!grid) return;
        if (filteredTrains.length === 0) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 24px;"><h3>Поезда не найдены</h3></div>'; return; }
        grid.innerHTML = filteredTrains.map(renderTrainCard).join('');
        setTimeout(function() {
            grid.querySelectorAll('.fade-in').forEach(function(el, i) {
                setTimeout(function() { el.classList.add('visible'); }, i * 50);
            });
        }, 100);
    }
    function filterTrains() {
        filteredTrains = allTrains.filter(function(train) {
            var mc = currentCategory === 'all' || train.category === currentCategory;
            var ms = !searchQuery || train.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
            return mc && ms;
        });
        renderTrains();
    }
    function loadTrains() {
        APP.fetchData('/data/trains.json').then(function(data) {
            if (data && data.trains) {
                allTrains = data.trains;
            } else {
                allTrains = [
                    {id:'t1',name:'Паровоз Class A4',description:'Легендарный британский паровоз',category:'steam',liveries:[{id:'l1',name:'Garter Blue'}],models:[{id:'m1',name:'База'}]},
                    {id:'t2',name:'ТЭ3',description:'Советский тепловоз',category:'diesel',liveries:[{id:'l1',name:'РЖД'}],models:[{id:'m1',name:'База'}]},
                    {id:'t3',name:'ВЛ80С',description:'Советский электровоз',category:'electric',liveries:[{id:'l1',name:'РЖД'}],models:[{id:'m1',name:'База'}]},
                    {id:'t4',name:'Big Boy',description:'Крупнейший паровоз',category:'steam',liveries:[{id:'l1',name:'UP'}],models:[{id:'m1',name:'4000'}]}
                ];
            }
            filteredTrains = allTrains;
            renderTrains();
        });
    }
    document.addEventListener('DOMContentLoaded', function() {
        loadTrains();
        var si = document.getElementById('searchInput');
        if (si) si.addEventListener('input', APP.debounce(function(e) { searchQuery = e.target.value.trim(); filterTrains(); }, 300));
        document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                filterTrains();
            });
        });
    });
})();
