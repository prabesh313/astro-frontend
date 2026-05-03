function getToken() {
    return localStorage.getItem("access_token");
}

function saveTokens(access,Refresh){
    localStorage.setItem("access_token",access);
    localStorage.setItem("refresh_token",Refresh);
}

function isLoggedIn(){
    return !!localStorage.getItem("access_token");
}

function logout(){
    localStorage.clear();
    window.location.href="login.html";

}

function updateNavbar(){
    const loggedIn=isLoggedIn();
    const loginLink=document.getElementById("nav-login");
    const logoutlink=document.getElementById("nav-logout");
    const kundaliLink = document.getElementById("nav-kundali");


    if (loginLink) loginLink.style.display = loggedIn ? "none" : "block";
    if (logoutlink) logoutlink.style.display = loggedIn ? "block" : "none";
    if (kundaliLink) kundaliLink.style.display = loggedIn ? "block" : "none";

}

document.addEventListener("DOMContentLoaded",updateNavbar);