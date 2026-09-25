(function() {
    'use strict';
    var state = {tool:'brush',color:'#ff6b35',size:8,zoom:1,layers:[],activeLayerIndex:0,isDrawing:false,lastX:0,lastY:0,history:[],historyIndex:-1};
    var canvas, ctx;
    var CW = 1024, CH = 512;
    var palette = ['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ff6b35','#e63946','#1e90ff','#2ecc71','#f39c12','#9b59b6','#1abc9c','#34495e','#c0392b','#e74c3c','#3498db','#27ae60','#f1c40f','#8e44ad','#16a085','#2c3e50','#7f8c8d','#95a5a6','#bdc3c7','#ecf0f1','#d35400','#e67e22','#1f77b4','#2ca02c'];
    function init() {
        canvas = document.getElementById('editorCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        canvas.width = CW; canvas.height = CH;
        createLayer('Слой 1', true);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH);
        saveState();
        setupCanvas(); setupToolbar(); setupPanel(); renderPalette(); renderLayers(); updateColor(); updateSize();
    }
    function createLayer(name, isBg) {
        var off = document.createElement('canvas');
        off.width = CW; off.height = CH;
        var layer = {id:APP.generateId(),name:name||'Слой '+(state.layers.length+1),canvas:off,ctx:off.getContext('2d'),visible:true,opacity:1,isBackground:isBg};
        if (isBg) { layer.ctx.fillStyle = '#ffffff'; layer.ctx.fillRect(0, 0, CW, CH); }
        state.layers.push(layer);
        state.activeLayerIndex = state.layers.length - 1;
        composite(); renderLayers();
    }
    function composite() {
        ctx.clearRect(0, 0, CW, CH);
        state.layers.forEach(function(l) { if (l.visible) { ctx.globalAlpha = l.opacity; ctx.drawImage(l.canvas, 0, 0); } });
        ctx.globalAlpha = 1;
    }
    function renderLayers() {
        var list = document.getElementById('layersList');
        if (!list) return;
        list.innerHTML = state.layers.slice().reverse().map(function(layer, revIdx) {
            var idx = state.layers.length - 1 - revIdx;
            var isActive = idx === state.activeLayerIndex;
            return '<div class="layer-item '+(isActive?'active':'')+'" data-index="'+idx+'"><div class="layer-thumb"></div><span class="layer-name">'+layer.name+'</span></div>';
        }).join('');
        list.querySelectorAll('.layer-item').forEach(function(item) {
            item.addEventListener('click', function() {
                state.activeLayerIndex = parseInt(item.dataset.index);
                renderLayers();
            });
        });
    }
    function drawLine(x1,y1,x2,y2,c,s) {
        var layer = state.layers[state.activeLayerIndex];
        layer.ctx.save();
        layer.ctx.lineCap = 'round'; layer.ctx.lineJoin = 'round';
        layer.ctx.strokeStyle = c; layer.ctx.lineWidth = s;
        layer.ctx.beginPath(); layer.ctx.moveTo(x1,y1); layer.ctx.lineTo(x2,y2); layer.ctx.stroke();
        layer.ctx.restore();
    }
    function setupCanvas() {
        function getPos(e) {
            var rect = canvas.getBoundingClientRect();
            var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
            return {x:Math.floor((e.clientX - rect.left) * sx), y:Math.floor((e.clientY - rect.top) * sy)};
        }
        function start(e) {
            state.isDrawing = true;
            var p = getPos(e); state.lastX = p.x; state.lastY = p.y;
            if (state.tool === 'brush' || state.tool === 'eraser') {
                var layer = state.layers[state.activeLayerIndex];
                layer.ctx.save(); layer.ctx.fillStyle = state.color;
                layer.ctx.beginPath(); layer.ctx.arc(p.x, p.y, state.size/2, 0, Math.PI*2); layer.ctx.fill();
                layer.ctx.restore();
                composite();
            }
        }
        function draw(e) {
            var p = getPos(e);
            var cp = document.getElementById('cursorPos');
            if (cp) cp.textContent = 'X: ' + p.x + ' Y: ' + p.y;
            if (!state.isDrawing) return;
            if (state.tool === 'brush') {
                drawLine(state.lastX, state.lastY, p.x, p.y, state.color, state.size);
                composite();
            } else if (state.tool === 'eraser') {
                var layer = state.layers[state.activeLayerIndex];
                layer.ctx.save(); layer.ctx.globalCompositeOperation = 'destination-out';
                drawLine(state.lastX, state.lastY, p.x, p.y, 'rgba(0,0,0,1)', state.size);
                layer.ctx.restore();
                composite();
            }
            state.lastX = p.x; state.lastY = p.y;
        }
        function end() { if (state.isDrawing) { state.isDrawing = false; saveState(); } }
        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('mouseout', end);
    }
    function saveState() {
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({layers:state.layers.map(function(l){return {id:l.id,name:l.name,visible:l.visible,data:l.canvas.toDataURL()};}),activeIndex:state.activeLayerIndex});
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
    }
    function undo() { if (state.historyIndex > 0) { state.historyIndex--; restoreState(); } }
    function redo() { if (state.historyIndex < state.history.length - 1) { state.historyIndex++; restoreState(); } }
    function restoreState() {
        var snap = state.history[state.historyIndex];
        var promises = snap.layers.map(function(l) {
            return new Promise(function(resolve) {
                var off = document.createElement('canvas');
                off.width = CW; off.height = CH;
                var lctx = off.getContext('2d');
                var img = new Image();
                img.onload = function() { lctx.drawImage(img, 0, 0); resolve({id:l.id,name:l.name,canvas:off,ctx:lctx,visible:l.visible,opacity:1}); };
                img.src = l.data;
            });
        });
        Promise.all(promises).then(function(layers) {
            state.layers = layers;
            state.activeLayerIndex = snap.activeIndex;
            composite(); renderLayers();
        });
    }
    function setupToolbar() {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tool-btn[data-tool]').forEach(function(b){b.classList.remove('active');});
                btn.classList.add('active');
                state.tool = btn.dataset.tool;
            });
        });
        var ub = document.querySelector('[data-action="undo"]');
        var rb = document.querySelector('[data-action="redo"]');
        var cb = document.querySelector('[data-action="clear"]');
        if (ub) ub.addEventListener('click', undo);
        if (rb) rb.addEventListener('click', redo);
        if (cb) cb.addEventListener('click', function() {
            var layer = state.layers[state.activeLayerIndex];
            layer.ctx.clearRect(0, 0, CW, CH);
            composite(); saveState();
        });
        var zi = document.getElementById('zoomIn');
        var zo = document.getElementById('zoomOut');
        if (zi) zi.addEventListener('click', function() { setZoom(state.zoom + 0.25); });
        if (zo) zo.addEventListener('click', function() { setZoom(state.zoom - 0.25); });
    }
    function setZoom(level) {
        state.zoom = Math.max(0.1, Math.min(5, level));
        canvas.style.transform = 'scale(' + state.zoom + ')';
        var zv = document.getElementById('zoomValue');
        var zl = document.getElementById('zoomLevel');
        if (zv) zv.textContent = Math.round(state.zoom*100) + '%';
        if (zl) zl.textContent = Math.round(state.zoom*100) + '%';
    }
    function setupPanel() {
        var cp = document.getElementById('colorPicker');
        var ch = document.getElementById('colorHex');
        if (cp) cp.addEventListener('input', function(e) { state.color = e.target.value; updateColor(); });
        if (ch) ch.addEventListener('change', function(e) {
            var val = e.target.value.trim();
            if (val[0] !== '#') val = '#' + val;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) { state.color = val; updateColor(); }
        });
        var ss = document.getElementById('sizeSlider');
        if (ss) ss.addEventListener('input', function(e) { state.size = parseInt(e.target.value); updateSize(); });
        var al = document.getElementById('addLayerBtn');
        if (al) al.addEventListener('click', function() { createLayer(); });
        var sb = document.getElementById('saveBtn');
        if (sb) sb.addEventListener('click', savePNG);
        var spb = document.getElementById('saveProjectBtn');
        if (spb) spb.addEventListener('click', saveProject);
    }
    function savePNG() {
        var exp = document.createElement('canvas');
        exp.width = CW; exp.height = CH;
        var ectx = exp.getContext('2d');
        state.layers.forEach(function(l) { if (l.visible) { ectx.globalAlpha = l.opacity; ectx.drawImage(l.canvas, 0, 0); } });
        exp.toBlob(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = 'allforir_livery_' + Date.now() + '.png';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            APP.toast.show('Окрас сохранен', 'success');
        }, 'image/png');
    }
    function saveProject() {
        var proj = {version:'1.0',timestamp:Date.now(),layers:state.layers.map(function(l){return {id:l.id,name:l.name,visible:l.visible,data:l.canvas.toDataURL()};}),activeIndex:state.activeLayerIndex};
        var blob = new Blob([JSON.stringify(proj)], {type:'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'allforir_project_' + Date.now() + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        APP.toast.show('Проект сохранен', 'success');
    }
    function updateColor() {
        var sw = document.querySelector('#currentColor .color-fill');
        if (sw) sw.style.background = state.color;
        var ch = document.getElementById('colorHex');
        if (ch) ch.value = state.color;
        var cp = document.getElementById('colorPicker');
        if (cp) cp.value = state.color;
        document.querySelectorAll('.palette-color').forEach(function(el) {
            if (el.dataset.color === state.color) el.classList.add('active');
            else el.classList.remove('active');
        });
    }
    function updateSize() {
        var sv = document.getElementById('sizeValue');
        if (sv) sv.textContent = state.size + 'px';
        var ss = document.getElementById('sizeSlider');
        if (ss) ss.value = state.size;
    }
    function renderPalette() {
        var p = document.getElementById('palette');
        if (!p) return;
        p.innerHTML = palette.map(function(c) {
            return '<div class="palette-color '+(c===state.color?'active':'')+'" data-color="'+c+'" style="background:'+c+'"></div>';
        }).join('');
        p.querySelectorAll('.palette-color').forEach(function(el) {
            el.addEventListener('click', function() { state.color = el.dataset.color; updateColor(); });
        });
    }
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); savePNG(); }
    });
})();
