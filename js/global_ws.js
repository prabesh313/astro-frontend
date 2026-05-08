let globalCallSockets = {};
let globalNotification = null;

async function initGlobalCallListeners() {
    if (!isLoggedIn()) return;

    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }

    try {
        const res  = await fetch(`${BASE_URL}/chats/`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });
        const data = await res.json();
        const chats = data.results || data;
        if (!Array.isArray(chats)) return;

        chats.forEach(chat => openGlobalCallSocket(chat));
    } catch (err) {
        console.error('Global call listener error:', err);
    }
}

function openGlobalCallSocket(chat) {
    if (globalCallSockets[chat.id]) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/calls/${chat.id}/?token=${getToken()}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.sender_username === (localStorage.getItem('username') || '')) return;

        if (data.type === 'call_request') {
            const name = chat.other_user_profile?.full_name || chat.other_username || data.sender_username;
            const callLabel = data.call_type === 'video' ? 'Video Call' : 'Audio Call';

            localStorage.setItem('incoming_call', JSON.stringify({
                chatId:    chat.id,
                callType:  data.call_type || 'video',
                callerName: name,
                timestamp: Date.now(),
            }));

            showCallNotification(name, callLabel, chat.id, data.call_type);
        }

        if (data.type === 'call_end' || data.type === 'call_reject') {
            localStorage.removeItem('incoming_call');
            if (globalNotification) { globalNotification.close(); globalNotification = null; }
        }
    };

    ws.onclose = () => {
        delete globalCallSockets[chat.id];
        setTimeout(() => openGlobalCallSocket(chat), 5000);
    };

    globalCallSockets[chat.id] = ws;
}

function showCallNotification(callerName, callLabel, chatId, callType) {
    if (window.location.pathname.includes('chats.html')) return;

    if (Notification.permission !== 'granted') {

        if (confirm(`📞 Incoming ${callLabel} from ${callerName}. Go to chat?`)) {
            window.location.href = `chats.html?incoming_call=1&chat_id=${chatId}`;
        }
        return;
    }

    if (globalNotification) globalNotification.close();

    globalNotification = new Notification(`📞 Incoming ${callLabel}`, {
        body: `${callerName} is calling you`,
        icon: 'img/logo.png',
        requireInteraction: true,
        tag: 'incoming-call',
    });

    globalNotification.onclick = () => {
        window.focus();
        window.location.href = `chats.html?incoming_call=1&chat_id=${chatId}&call_type=${callType}`;
        globalNotification.close();
    };

    setTimeout(() => {
        if (globalNotification) { globalNotification.close(); globalNotification = null; }
        localStorage.removeItem('incoming_call');
    }, 30000);
}

window.addEventListener('beforeunload', () => {
    Object.values(globalCallSockets).forEach(ws => ws.close());
});


document.addEventListener('DOMContentLoaded', initGlobalCallListeners);