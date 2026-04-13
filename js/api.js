const BASE_URL="https://127.0.0.1:8000/api";

//get token from local storage
function getToken(){
    return localStorage.getItem("access_token");

}
//Generic function to make API calls with token authentication
async function apiFetch(endpoint,options={}){
    const token=getToken();

    const headers={
        "Content-Type":"application/json",
        ...(token && {"Authorization":`Bearer ${token}`}),
        ...options.headers,
    };

    const response=await fetch(`${BASE_URL}${endpoint}`,{
        ...options,
        headers,
    });

    //if token expired, redirect to login
    if(response.status===401){
        localStorage.clear();
        window.location.href="login.html";
        return;
    }
    return response;
}

async function loginUser(username, password) {
    const res = await fetch(`${BASE_URL}/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return res;
}

async function registerUser(username, email, password) {
    const res = await fetch(`${BASE_URL}/users/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });
    return res;
}

// ── Books ─────────────────────────────────────────
async function getBooks(search = "", category = "") {
    let url = `/books/?search=${search}&category=${category}`;
    const res = await apiFetch(url);
    return res.json();
}

// ── Rituals & Mantras ─────────────────────────────
async function getRituals(search = "") {
    const res = await apiFetch(`/rituals/?search=${search}`);
    return res.json();
}

async function getMantras(search = "") {
    const res = await apiFetch(`/mantras/?search=${search}`);
    return res.json();
}

// ── User Profile ──────────────────────────────────
async function getProfile() {
    const res = await apiFetch("/users/profile/");
    return res.json();
}

async function createProfile(data) {
    const res = await apiFetch("/users/profile/", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return res;
}

// ── Astrology ─────────────────────────────────────
async function getTodayPanchang() {
    const res = await apiFetch("/astrology/panchang/today/");
    return res.json();
}

async function generateKundali() {
    const res = await apiFetch("/astrology/kundali/generate/", {
        method: "POST",
    });
    return res;
}

async function getMyKundalis() {
    const res = await apiFetch("/astrology/kundali/");
    return res.json();
}
