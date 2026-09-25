// GET /api/trains — получить все поезда
// POST /api/trains — сохранить все поезда (только админ)

export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const data = await env.ALLFORIR_KV.get('trains', 'json');
        return new Response(JSON.stringify(data || { version: '1.0', trains: [] }), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Ошибка чтения данных' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;
    
    // Проверяем авторизацию
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Требуется авторизация' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const adminSecret = env.ADMIN_SECRET || 'change-me-in-production';
    
    if (token !== adminSecret) {
        return new Response(JSON.stringify({ error: 'Неверный токен' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const data = await request.json();
        
        // Валидация
        if (!data || !Array.isArray(data.trains)) {
            return new Response(JSON.stringify({ error: 'Некорректный формат данных' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Сохраняем в KV
        await env.ALLFORIR_KV.put('trains', JSON.stringify({
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            trains: data.trains
        }));
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Данные сохранены',
            count: data.trains.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Ошибка сохранения: ' + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
