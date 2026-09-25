(function() {
    'use strict';
    
    var session = APP.storage.get('admin_session');
    if (!session || session.expires <= Date.now()) { 
        window.location.href = '/admin/'; 
        return; 
    }
    
    // Токен для API (должен совпадать с ADMIN_SECRET в Cloudflare)
    var ADMIN_TOKEN = 'mySuperSecretToken2026ForALLforIR'; // В продакшене используй переменную окружения
    
    var trainsData = [];

    function setupNav() {
        document.querySelectorAll('.sidebar-link[data-section]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var section = link.dataset.section;
                document.querySelectorAll('.sidebar-link[data-section]').forEach(function(l) { l.classList.remove('active'); });
                link.classList.add('active');
                document.querySelectorAll('.admin-section').forEach(function(s) { s.style.display = 'none'; });
                var el = document.getElementById('section-' + section);
                if (el) el.style.display = 'block';
            });
        });
    }

    function loadData() {
        APP.toast.show('Загрузка данных...', 'info', 2000);
        APP.fetchData('/api/trains').then(function(data) {
            trainsData = (data && data.trains) ? data.trains : [];
            renderTrainsTable();
            updateStats();
            APP.toast.show('Загружено ' + trainsData.length + ' поездов', 'success');
        }).catch(function(err) {
            APP.toast.show('Ошибка загрузки: ' + err.message, 'error');
        });
    }

    function saveData() {
        return fetch('/api/trains', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ADMIN_TOKEN
            },
            body: JSON.stringify({ trains: trainsData })
        })
        .then(function(r) { 
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json(); 
        })
        .then(function(result) {
            if (result.success) {
                APP.toast.show('Изменения сохранены в базу', 'success');
                return true;
            } else {
                throw new Error(result.error || 'неизвестная ошибка');
            }
        })
        .catch(function(err) {
            APP.toast.show('Ошибка сохранения: ' + err.message, 'error');
            return false;
        });
    }

    function updateStats() {
        var liveries = 0, models = 0, downloads = 0;
        trainsData.forEach(function(t) {
            (t.liveries || []).forEach(function(l) { liveries++; downloads += (l.downloads || 0); });
            (t.models || []).forEach(function(m) { models++; downloads += (m.downloads || 0); });
        });
        setText('statTrains', trainsData.length);
        setText('statLiveries', liveries);
        setText('statModels', models);
        setText('statDownloads', downloads.toLocaleString('ru-RU'));
    }

    function setText(id, val) { 
        var el = document.getElementById(id); 
        if (el) el.textContent = val; 
    }

    function renderTrainsTable() {
        var tbody = document.getElementById('trainsTableBody');
        if (!tbody) return;
        if (trainsData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">Поездов пока нет. Добавь первый через кнопку выше.</td></tr>';
            return;
        }
        tbody.innerHTML = trainsData.map(function(train) {
            return '<tr><td><div class="table-train-info"><div class="table-train-icon"><svg viewBox="0 0 24 24"><path d="M12 2C8 2 4 3.5 4 6v9.5C4 17.5 6 19 8 19.5V21c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1h0v1c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-1.5c2-.5 4-2 4-4V6c0-2.5-4-4-8-4z"/></svg></div><div><div class="table-train-name">' + train.name + '</div></div></div></td><td><span class="category-badge ' + train.category + '">' + train.category + '</span></td><td>' + (train.liveries ? train.liveries.length : 0) + '</td><td>' + (train.models ? train.models.length : 0) + '</td><td><div class="table-actions"><button class="table-action edit" onclick="editTrain(\'' + train.id + '\')"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg></button><button class="table-action delete" onclick="deleteTrain(\'' + train.id + '\')"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg></button></div></td></tr>';
        }).join('');
    }

    window.editTrain = function(id) {
        var train = trainsData.find(function(t) { return t.id === id; });
        if (!train) return;

        Modal.show('Редактировать поезд',
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="editTrainName" value="' + train.name + '"></div>' +
            '<div class="form-group"><label class="form-label">Описание</label><textarea class="form-textarea" id="editTrainDesc">' + (train.description || '') + '</textarea></div>' +
            '<div class="form-group"><label class="form-label">Категория</label><select class="form-select" id="editTrainCategory">' +
            '<option value="steam"' + (train.category === 'steam' ? ' selected' : '') + '>Паровоз</option>' +
            '<option value="diesel"' + (train.category === 'diesel' ? ' selected' : '') + '>Тепловоз</option>' +
            '<option value="electric"' + (train.category === 'electric' ? ' selected' : '') + '>Электровоз</option>' +
            '<option value="wagon"' + (train.category === 'wagon' ? ' selected' : '') + '>Вагон</option>' +
            '</select></div>',
            [
                { text: 'Отмена', action: 'cancel', handler: function(m) { Modal.close(m); } },
                { text: 'Сохранить', action: 'save', class: 'btn-primary', handler: function(m) {
                    train.name = document.getElementById('editTrainName').value.trim();
                    train.description = document.getElementById('editTrainDesc').value.trim();
                    train.category = document.getElementById('editTrainCategory').value;
                    renderTrainsTable();
                    updateStats();
                    Modal.close(m);
                    saveData();
                }}
            ]
        );
    };

    window.deleteTrain = function(id) {
        Modal.confirm('Удалить поезд?', 'Все связанные окрасы и модели тоже удалятся.', function() {
            trainsData = trainsData.filter(function(t) { return t.id !== id; });
            renderTrainsTable();
            updateStats();
            saveData();
        });
    };

    var addBtn = document.getElementById('addTrainBtn');
    if (addBtn) addBtn.addEventListener('click', function() {
        Modal.show('Добавить поезд',
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="newTrainName" placeholder="Например: Электровоз ЧС7"></div>' +
            '<div class="form-group"><label class="form-label">Описание</label><textarea class="form-textarea" id="newTrainDesc"></textarea></div>' +
            '<div class="form-group"><label class="form-label">Категория</label><select class="form-select" id="newTrainCategory"><option value="steam">Паровоз</option><option value="diesel">Тепловоз</option><option value="electric">Электровоз</option><option value="wagon">Вагон</option></select></div>',
            [
                { text: 'Отмена', action: 'cancel', handler: function(m) { Modal.close(m); } },
                { text: 'Создать', action: 'create', class: 'btn-primary', handler: function(m) {
                    var name = document.getElementById('newTrainName').value.trim();
                    if (!name) { APP.toast.show('Введи название', 'error'); return; }
                    trainsData.push({
                        id: APP.generateId(),
                        name: name,
                        description: document.getElementById('newTrainDesc').value.trim(),
                        category: document.getElementById('newTrainCategory').value,
                        liveries: [],
                        models: []
                    });
                    renderTrainsTable();
                    updateStats();
                    Modal.close(m);
                    saveData();
                }}
            ]
        );
    });

    var rtb = document.getElementById('runTestsBtn');
    if (rtb) rtb.addEventListener('click', function() {
        var passed = 0, errors = 0;
        var log = document.getElementById('debugLog');
        function addLog(type, msg) { 
            log.innerHTML += '<div class="debug-log-entry"><span class="debug-log-time">[' + new Date().toLocaleTimeString('ru-RU') + ']</span><span class="debug-log-' + type + '">' + msg + '</span></div>'; 
            log.scrollTop = log.scrollHeight; 
        }

        addLog('info', 'Запуск тестов...');

        // Test 1: API доступность
        fetch('/api/trains')
            .then(function(r) {
                if (r.ok) { passed++; addLog('success', 'API доступен (' + r.status + ')'); return r.json(); }
                else { errors++; addLog('error', 'API вернул ' + r.status); throw new Error('API error'); }
            })
            .then(function(data) {
                // Test 2: Структура данных
                if (data && Array.isArray(data.trains)) {
                    passed++;
                    addLog('success', 'Структура корректна (' + data.trains.length + ' поездов)');
                } else {
                    errors++;
                    addLog('error', 'Некорректная структура данных');
                }

                // Test 3: Главный сайт
                return fetch('/');
            })
            .then(function(r) {
                if (r.ok) { passed++; addLog('success', 'Сайт отвечает (' + r.status + ')'); }
                else { errors++; addLog('error', 'Сайт вернул ' + r.status); }
            })
            .catch(function(e) {
                errors++;
                addLog('error', 'Ошибка: ' + e.message);
            })
            .finally(function() {
                setText('debugPassed', passed);
                setText('debugErrors', errors);
                addLog('info', 'Готово: ' + passed + ' пройдено, ' + errors + ' ошибок');
                APP.toast.show('Тесты завершены', passed > 0 && errors === 0 ? 'success' : 'info');
            });
    });

    var cdb = document.getElementById('clearDebugBtn');
    if (cdb) cdb.addEventListener('click', function() {
        document.getElementById('debugLog').innerHTML = '<div class="debug-log-entry"><span class="debug-log-time">[' + new Date().toLocaleTimeString('ru-RU') + ']</span><span class="debug-log-info">Лог очищен</span></div>';
        setText('debugPassed', '0');
        setText('debugErrors', '0');
    });

    var lb = document.getElementById('logoutBtn');
    if (lb) lb.addEventListener('click', function() {
        APP.storage.remove('admin_session');
        window.location.href = '/admin/';
    });

    document.addEventListener('DOMContentLoaded', function() { 
        setupNav(); 
        loadData(); 
    });
})();