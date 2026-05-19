const firebaseConfig = {
    apiKey: "AIzaSyD5I0tSk73Iue1WaU3Jx_Q1LuwnFA2yrTo",
    authDomain: "ahmad-1a32b.firebaseapp.com",
    projectId: "ahmad-1a32b",
    storageBucket: "ahmad-1a32b.firebasestorage.app",
    messagingSenderId: "585031300322",
    appId: "1:585031300322:web:d0af3e433e4ca3bf975abb",
    measurementId: "G-C0GFV8C96P"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---- الأسعار ----
let usdSyrBuy = 137, usdSyrSell = 138, usdTryBuy = 44, usdTrySell = 45;
const ratesRef = ref(db, 'rates');

// متغير لتتبع عدد المهام المطلوبة قبل إخفاء شاشة التحميل
let loadedCount = 0;
const totalToLoad = 2; // rates + adsArray

function hideSplashIfReady() {
    loadedCount++;
    if (loadedCount >= totalToLoad) {
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            const main = document.getElementById('mainContent');
            if (splash) splash.style.opacity = '0';
            setTimeout(() => {
                if (splash) splash.style.display = 'none';
                if (main) main.style.display = 'block';
            }, 500);
        }, 500);
    }
}

onValue(ratesRef, (snapshot) => {
    if (!snapshot.exists()) {
        set(ratesRef, {
            usd_syr_buy: 137, usd_syr_sell: 138,
            usd_try_buy: 44, usd_try_sell: 45,
            last_update: new Date().toISOString()
        }).catch(console.error);
    } else {
        const data = snapshot.val();
        usdSyrBuy = data.usd_syr_buy || 137;
        usdSyrSell = data.usd_syr_sell || 138;
        usdTryBuy = data.usd_try_buy || 44;
        usdTrySell = data.usd_try_sell || 45;

        document.getElementById('usdRate').innerHTML = `شراء: ${usdSyrBuy} / بيع: ${usdSyrSell}`;
        const trySyrBuy = usdSyrBuy / usdTrySell;
        const trySyrSell = usdSyrSell / usdTryBuy;
        document.getElementById('trySyrRate').innerHTML = `شراء: ${trySyrBuy.toFixed(2)} / بيع: ${trySyrSell.toFixed(2)}`;
        document.getElementById('usdTryRate').innerHTML = `شراء: ${usdTryBuy} / بيع: ${usdTrySell}`;

        const lastUpdate = data.last_update || "";
        if (lastUpdate) {
            const d = new Date(lastUpdate);
            document.getElementById('lastDate').innerText = d.toLocaleDateString('ar-EG');
            document.getElementById('lastTime').innerText = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }
    hideSplashIfReady();
});

// ---- الإعلانات ----
let adsArray = [];
let currentAdIndex = 0;
let adInterval = null;
let adsEnabled = false;

const adBanner = document.getElementById('adBanner');
const adLink = document.getElementById('adLink');
const adImage = document.getElementById('adImage');
const adText = document.getElementById('adText');

function showNextAd() {
    if (!adsEnabled || !adsArray.length) {
        if (adBanner) adBanner.style.display = 'none';
        return;
    }
    if (adBanner) adBanner.style.display = 'block';
    const ad = adsArray[currentAdIndex];
    if (ad) {
        adImage.src = ad.imageUrl || '';
        adText.innerText = ad.text || '';
        adLink.href = ad.link || '#';
        if (!ad.imageUrl) adImage.style.display = 'none';
        else adImage.style.display = 'block';
    }
    currentAdIndex = (currentAdIndex + 1) % adsArray.length;
}

function startAdRotation() {
    if (adInterval) clearInterval(adInterval);
    if (adsEnabled && adsArray.length) {
        showNextAd();
        adInterval = setInterval(showNextAd, 7000);
    } else {
        if (adBanner) adBanner.style.display = 'none';
    }
}

const adsArrayRef = ref(db, 'adsArray');
onValue(adsArrayRef, (snapshot) => {
    if (snapshot.exists() && Array.isArray(snapshot.val())) {
        adsArray = snapshot.val();
    } else {
        adsArray = [];
    }
    startAdRotation();
    hideSplashIfReady();
});

const adsEnabledRef = ref(db, 'adsEnabled');
onValue(adsEnabledRef, (snapshot) => {
    adsEnabled = snapshot.val() === true;
    startAdRotation();
});

// ---- دوال التحويل (نفس السابق) ----
function getSellPrice(amount, from, to) {
    if (from === to) return amount;
    if (from === 'syr_old' && to === 'syr_new') return amount / 100;
    if (from === 'syr_new' && to === 'syr_old') return amount * 100;
    let usdValue = 0;
    switch (from) {
        case 'usd': usdValue = amount; break;
        case 'try': usdValue = amount / usdTrySell; break;
        case 'syr_new': usdValue = amount / usdSyrSell; break;
        case 'syr_old': usdValue = (amount / 100) / usdSyrSell; break;
    }
    switch (to) {
        case 'usd': return usdValue;
        case 'try': return usdValue * usdTryBuy;
        case 'syr_new': return usdValue * usdSyrBuy;
        case 'syr_old': return (usdValue * usdSyrBuy) * 100;
    }
    return 0;
}

function getBuyPrice(amount, from, to) {
    if (from === to) return amount;
    if (from === 'syr_old' && to === 'syr_new') return amount / 100;
    if (from === 'syr_new' && to === 'syr_old') return amount * 100;
    let usdValue = 0;
    switch (from) {
        case 'usd': usdValue = amount; break;
        case 'try': usdValue = amount / usdTryBuy; break;
        case 'syr_new': usdValue = amount / usdSyrBuy; break;
        case 'syr_old': usdValue = (amount / 100) / usdSyrBuy; break;
    }
    switch (to) {
        case 'usd': return usdValue;
        case 'try': return usdValue * usdTrySell;
        case 'syr_new': return usdValue * usdSyrSell;
        case 'syr_old': return (usdValue * usdSyrSell) * 100;
    }
    return 0;
}

document.getElementById('convertBtn').addEventListener('click', () => {
    let amount = parseFloat(document.getElementById('amount').value);
    if (isNaN(amount)) amount = 0;
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    document.getElementById('sellResult').innerText = getSellPrice(amount, from, to).toFixed(2);
    document.getElementById('buyResult').innerText = getBuyPrice(amount, from, to).toFixed(2);
});

// الوضع الليلي
const themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    themeToggle.innerText = document.body.classList.contains('dark') ? '☀️ نهاري' : '🌙 ليلي';
});
if (document.body.classList.contains('dark')) themeToggle.innerText = '☀️ نهاري';
else themeToggle.innerText = '🌙 ليلي';

// شاشة التحميل
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        const main = document.getElementById('mainContent');
        if (splash && main) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                main.style.display = 'block';
            }, 500);
        }
    }, 1500);
});

// مودال التواصل
const modal = document.getElementById('contactModal');
const contactLink = document.getElementById('contactLink');
const closeModal = document.querySelector('.close-modal');

if (contactLink) {
    contactLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    });
}
if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});