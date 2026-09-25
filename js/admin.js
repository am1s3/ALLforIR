(function() {
    'use strict';
    var session = APP.storage.get('admin_session');
    if (!session || session.expires <= Date.now()) { window.location.href = '/admin/'; return; }
    var trainsData = [];
    function setupNav() {
        document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var section = link.dataset.section;
                document.querySelectorAll('.sidebar-link[data-section]').forEach(function(l) { l.classList.remove('active'); });
                link.classList.add('active');
                document.querySelectorAll('.admin-section').forEach(function(s) { s.style.display = 'none'; });
                document.getElementById('section-' + section).style.display = 'block';
            });
        });
    }
    function loadData() {
        APP.fetchData('/data/trains.json').then(function(data) {
            if (data && data.trains) trainsData = data.trains;
            else trainsData = [
                {id:'t1',name:'Паровоз Class A4',category:'steam',liveries:[{id:'l1',name:'Garter Blue'},{id:'l2',name:'BR Green'}],models:[{id:'m1',name:'База'}]},
                {id:'t2',name:'ТЭ3',category:'diesel',liveries:[{id:'l1',name:'РЖД'}],models:[{id:'m1',name:'База'}]},
                {id:'t3',name:'ВЛ80С',category:'electric',liveries:[{id:'l1',name:'РЖД'}],models:[{id:'m1',name:'База'}]},
                {id:'t4',name:'Big Boy',category:'steam',liveries:[{id:'l1',name:'UP'}],models:[{id:'m1',name:'4000'}]}
            ];
            renderTrainsTable();
        });
    }
    function renderTrainsTable() {
        var tbody = document.getElementById('trainsTableBody');
        if (!tbody) return;
        tbody.innerHTML = trainsData.map(function(train) {
            return '<tr><td><div class="table-train-info"><div class="table-train-icon"><svg viewBox="0 0 24 24"><path d="M12 2C8 2 4 3.5 4 6v9.5C4 17.5 6 19 8 19.5V21c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1h0v1c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1.5c2-.5 4-2 4-4V6c0-2.5-4-4-8-4z"/></svg></div><div><div class="table-train-name">'+train.name+'</div></div></div></td><td><span class="category-badge '+train.category+'">'+train.category+'</span></td><td>'+(train.liveries?train.liveries.length:0)+'</td><td>'+(train.models?train.models.length:0)+'</td><td><div class="table-actions"><button class="table-action delete" onclick="deleteTrain(\''+train.id+'\')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg></button></div></td></tr>';
        }).join('');
    }
    window.deleteTrain = function(id) {
        Modal.confirm('Удалить поезд?', 'Это действие нельзя отменить.', function() {
            trainsData = trainsData.filter(function(t) { return t.id !== id; });
            renderTrainsTable();
            APP.toast.show('Поезд удален', 'success');
        });
    };
    var addBtn = document.getElementById('addTrainBtn');
    if (addBtn) addBtn.addEventListener('click', function() {
        Modal.show('Добавить поезд',
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="newTrainName"></div>'+
            '<div class="form-group"><label class="form-label">Категория</label><select class="form-select" id="newTrainCategory"><option value="steam">Паровоз</option><option value="diesel">Тепловоз</option><option value="electric">Электровоз</option><option value="wagon">Вагон</option></select></div>',
            [
                {text:'Отмена',action:'cancel',handler:function(m){Modal.close(m);}},
                {text:'Создать',action:'create',class:'btn-primary',handler:function(m){
                    var name = document.getElementById('newTrainName').value.trim();
                    if (!name) { APP.toast.show('Введите название','error'); return; }
                    trainsData.push({id:APP.generateId(),name:name,category:document.getElementById('newTrainCategory').value,liveries:[],models:[]});
                    renderTrainsTable();
                    Modal.close(m);
                    APP.toast.show('Поезд создан','success');
                }}
            ]
        );
    });
    var rtb = document.getElementById('runTestsBtn');
    if (rtb) rtb.addEventListener('click', function() {
        var passed = 0, errors = 0;
        var log = document.getElementById('debugLog');
        function addLog(type, msg) { log.innerHTML += '<div class="debug-log-entry"><span class="debug-log-time">['+new Date().toLocaleTimeString('ru-RU')+']</span><span class="debug-log-'+type+'">'+msg+'</span></div>'; log.scrollTop = log.scrollHeight; }
        if (trainsData.length > 0) { passed++; addLog('success','Данные загружены: '+trainsData.length+' поездов'); } else { errors++; addLog('error','Данные не загружены'); }
        var livs = 0, mods = 0;
        trainsData.forEach(function(t) { livs += (t.liveries?t.liveries.length:0); mods += (t.models?t.models.length:0); });
        if (livs > 0) { passed++; addLog('success','Окрасов: '+livs); } else { errors++; addLog('warn','Нет окрасов'); }
        if (mods > 0) { passed++; addLog('success','Моделей: '+mods); } else { errors++; addLog('warn','Нет моделей'); }
        fetch('/').then(function(r) {
            if (r.ok) { passed++; addLog('success','Сайт доступен ('+r.status+')'); }
            else { errors++; addLog('error','Сайт недоступен ('+r.status+')'); }
        }).catch(function(e) { errors++; addLog('error','Ошибка сети: '+e.message); });
        addLog('info','Итог: '+passed+' пройдено, '+errors+' ошибок');
        document.getElementById('debugPassed').textContent = passed;
        document.getElementById('debugErrors').textContent = errors;
    });
    var cdb = document.getElementById('clearDebugBtn');
    if (cdb) cdb.addEventListener('click', function() {
        document.getElementById('debugLog').innerHTML = '<div class="debug-log-entry"><span class="debug-log-time">['+new Date().toLocaleTimeString('ru-RU')+']</span><span class="debug-log-info">Лог очищен</span></div>';
        document.getElementById('debugPassed').textContent = '0';
        document.getElementById('debugErrors').textContent = '0';
    });
    var lb = document.getElementById('logoutBtn');
    if (lb) lb.addEventListener('click', function() {
        APP.storage.remove('admin_session');
        window.location.href = '/admin/';
    });
    document.addEventListener('DOMContentLoaded', function() { setupNav(); loadData(); });
})();
