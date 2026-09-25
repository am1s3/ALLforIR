// POST /api/download — увеличить счётчик скачиваний

export async function onRequestPost(context) {
    const { env, request } = context;
    
    try {
        const { trainId, itemId, itemType } = await request.json();
        
        if (!trainId || !itemId || !itemType) {
            return new Response(JSON.stringify({ error: 'Неверные параметры' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Читаем текущие данные
        const data = await env.ALLFORIR_KV.get('trains', 'json') || { trains: [] };
        
        // Ищем поезд
        const train = data.trains.find(function(t) { return t.id === trainId; });
        if (!train) {
            return new Response(JSON.stringify({ error: 'Поезд не найден' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Ищем элемент
        const items = itemType === 'liveries' ? train.liveries : train.models;
        const item = items ? items.find(function(i) { return i.id === itemId; }) : null;
        
        if (!item) {
            return new Response(JSON.stringify({ error: 'Элемент не найден' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Увеличиваем счётчик
        item.downloads = (item.downloads || 0) + 1;
        
        // Сохраняем обратно
        await env.ALLFORIR_KV.put('trains', JSON.stringify({
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            trains: data.trains
        }));
        
        return new Response(JSON.stringify({ 
            success: true, 
            downloads: item.downloads 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
