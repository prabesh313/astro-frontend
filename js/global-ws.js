const WS_BASE = IS_LOCAL ? 'ws://127.0.0.1:8000' : 'wss://astro-production-6c88.up.railway.app';

//collection of active sockets
let globalCallSockets = {};
let globalNotification = null;

async function initGlobalCallListeners() {
    if (!isLoggedIn()) return;
    //asks browser for notification permission if not already granted or denied
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
    //if a socket already exists for this chat, don't create a new one
    if (globalCallSockets[chat.id]) return;

    const ws = new WebSocket(`${WS_BASE}/ws/calls/${chat.id}/?token=${getToken()}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Ignore messages from self to prevent duplicate notifications
        if (data.sender_username === (localStorage.getItem('username') || '')) return;

        if (data.type === 'call_request') {
            const name = chat.other_user_profile?.full_name || chat.other_username || data.sender_username;
            const callLabel = data.call_type === 'video' ? 'Video Call' : 'Audio Call';
            // Store incoming call details in browser storage for retrieval on chats.html
            localStorage.setItem('incoming_call', JSON.stringify({
                chatId:    chat.id,
                callType:  data.call_type || 'video',
                callerName: name,
                profileImage: chat.other_user_profile?.profile_image || null,
                timestamp: Date.now(),
            }));

            showCallNotification(name, callLabel, chat.id, data.call_type);
        }

        if (data.type === 'call_offer') {
            localStorage.setItem('incoming_offer', JSON.stringify(data));
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
    // Store the WebSocket instance for this chat
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
    // Close any existing notification before showing a new one
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

    // Auto-close the notification after 30 seconds if not interacted with
    setTimeout(() => {
        if (globalNotification) { globalNotification.close(); globalNotification = null; }
        localStorage.removeItem('incoming_call');
    }, 30000);
}
// Clean up WebSocket connections when the user leaves the page
window.addEventListener('beforeunload', () => {
    Object.values(globalCallSockets).forEach(ws => ws.close());
});

//run global call listeners after the page loads to ensure user is authenticated and chats are available
document.addEventListener('DOMContentLoaded', initGlobalCallListeners);