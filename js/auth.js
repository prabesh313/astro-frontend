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

    if(loggedIn){
        loginLink.style.display="none";
        logoutlink.style.display="block";
        kundaliLink.style.display="block";
    }else{
        loginLink.style.display="block";
        logoutlink.style.display="none";
        kundaliLink.style.display="none";
    }
}

document.addEventListener("DOMContentLoaded",updateNavbar);