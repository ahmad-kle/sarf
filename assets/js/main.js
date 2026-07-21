// ============================================================
//  صرّاف - النسخة النهائية مع تحسينات للهواتف
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD5I0tSk73Iue1WaU3Jx_Q1LuwnFA2yrTo",
    authDomain: "ahmad-1a32b.firebaseapp.com",
    projectId: "ahmad-1a32b",
    storageBucket: "ahmad-1a32b.firebasestorage.app",
    messagingSenderId: "585031300322",
    appId: "1:585031300322:web:d0af3e433e4ca3bf975abb",
    measurementId: "G-C0GFV8C96P"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------- عناصر DOM ----------
const splash = document.getElementById('splashScreen');
const main = document.getElementById('mainContent');
const usdSyrRateEl = document.getElementById('usdSyrRate');
const usdTryRateEl = document.getElementById('usdTryRate');
const trySyrRateEl = document.getElementById('trySyrRate');
const gold21GramRateEl = document.getElementById('gold21GramRate');
const gold21GramSubEl = document.getElementById('gold21GramSub');
const lastDateEl = document.getElementById('lastDate');
const lastTimeEl = document.getElementById('lastTime');
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const sellResult = document.getElementById('sellResult');
const buyResult = document.getElementById('buyResult');
const convertBtn = document.getElementById('convertBtn');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const installBtn = document.getElementById('installAppBtn');
const goldWeight = document.getElementById('goldWeight');
const goldKarat = document.getElementById('goldKarat');
const calcGoldBtn = document.getElementById('calcGoldBtn');
const goldUsdPrice = document.getElementById('goldUsdPrice');
const goldSyrPrice = document.getElementById('goldSyrPrice');
const goldTryPrice = document.getElementById('goldTryPrice');
const contactLink = document.getElementById('contactLink');
const contactModal = document.getElementById('contactModal');

// ---------- القيم المتغيرة ----------
let usdSyrBuy = "";
let usdSyrSell = "";
let usdTryBuy = "";
let usdTrySell = "";
let goldUsdOunce = "";

const ratesRef = ref(db, 'rates');

// ---------- دوال مساعدة ----------
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (Number.isInteger(num)) {
        return new Intl.NumberFormat('en', { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(num);
    } else {
        return new Intl.NumberFormat('en', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num);
    }
}

function formatDate(ts) {
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleDateString('ar-EG');
}
function formatTime(ts) {
    if (!ts) return '--';
    const d = new Date(ts);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============================================================
// 🔥 مراقبة تغييرات Firebase (للعملات فقط)
// ============================================================
function listenToFirebaseRates() {
    onValue(ratesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            usdSyrBuy = data.usd_syr_buy || "";
            usdSyrSell = data.usd_syr_sell || "13100";
            usdTryBuy = data.usd_try_buy || "";
            usdTrySell = data.usd_try_sell || "";
            console.log('📊 تحديث العملات من Firebase');
            updateUI();
            if (data.last_update) {
                lastDateEl.textContent = formatDate(data.last_update);
                lastTimeEl.textContent = formatTime(data.last_update);
            }
        } else {
            console.log('📊 لا توجد بيانات، استخدام القيم الافتراضية');
            usdSyrBuy = "";
            usdSyrSell = "";
            usdTryBuy = "";
            usdTrySell = "";
            updateUI();
        }
    }, (error) => {
        console.warn('⚠️ خطأ في Firebase:', error);
        // استخدام القيم الافتراضية عند فشل Firebase
        usdSyrBuy = "";
        usdSyrSell = "";
        usdTryBuy = "";
        usdTrySell = "";
        updateUI();
    });
}

// ============================================================
// 🔥 جلب سعر الذهب من API مع مهلة زمنية وتجربة إعادة المحاولة
// ============================================================
async function fetchGoldPrice(showToastMsg = true, retry = 3) {
    try {
        console.log('🥇 جاري جلب سعر الذهب...');
        let newPrice = null;
        // محاولة مع مهلة 10 ثوانٍ
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
            const res = await fetch('https://api.gold-api.com/price/XAU', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data && data.price && data.price > 0) {
                    newPrice = parseFloat(data.price);
                    console.log('✅ Gold (Gold-API):', newPrice);
                }
            }
        } catch (fetchErr) {
            console.warn('⚠️ Gold-API فشل:', fetchErr.message);
        }

        if (!newPrice) {
            // محاولة عبر Proxy
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const proxyController = new AbortController();
            const proxyTimeout = setTimeout(() => proxyController.abort(), 10000);
            try {
                const altRes = await fetch(proxyUrl + 'https://api.gold-api.com/price/XAU', { signal: proxyController.signal });
                clearTimeout(proxyTimeout);
                if (altRes.ok) {
                    const altData = await altRes.json();
                    if (altData && altData.price && altData.price > 0) {
                        newPrice = parseFloat(altData.price);
                        console.log('✅ Gold (Gold-API via proxy):', newPrice);
                    }
                }
            } catch (proxyErr) {
                console.warn('⚠️ Proxy فشل:', proxyErr.message);
            }
        }

        if (newPrice) {
            goldUsdOunce = newPrice;
            console.log(`✅ تم تحديث الذهب: ${goldUsdOunce}`);
            updateUI();
            if (showToastMsg) {
                showToast('✅ تم تحديث الذهب');
            }
        } else {
            if (retry > 0) {
                console.log(`🔄 إعادة المحاولة... ${retry} محاولات متبقية`);
                setTimeout(() => fetchGoldPrice(showToastMsg, retry - 1), 2000);
            } else {
                console.warn('⚠️ فشل جلب الذهب بعد جميع المحاولات');
                if (showToastMsg) {
                    showToast('⚠️ فشل تحديث الذهب');
                }
            }
        }
    } catch (err) {
        console.error('❌ خطأ في جلب الذهب:', err);
        if (showToastMsg) {
            showToast('⚠️ حدث خطأ');
        }
    }
}

// ---------- تحديث الواجهة ----------
function updateUI() {
    usdSyrRateEl.textContent = `${formatNumber(usdSyrBuy)} / ${formatNumber(usdSyrSell)}`;
    usdTryRateEl.textContent = `${formatNumber(usdTryBuy)} / ${formatNumber(usdTrySell)}`;
    const tryToSyrBuy = usdSyrBuy / usdTrySell;
    const tryToSyrSell = usdSyrSell / usdTryBuy;
    trySyrRateEl.textContent = `${formatNumber(tryToSyrBuy)} / ${formatNumber(tryToSyrSell)}`;

    const gramPriceUsd = goldUsdOunce / 31.1035;
    const karat21Factor = 21 / 24;
    const gram21Usd = gramPriceUsd * karat21Factor;
    const sellPrice = gram21Usd + 1;
    const buyPrice = gram21Usd - 1;
    
    gold21GramRateEl.textContent = `${formatNumber(buyPrice)} / ${formatNumber(sellPrice)}`;
    gold21GramSubEl.innerHTML = `$ / غرام · <span style="color:#d32f2f; font-weight:800; background:#ffebee; padding:2px 8px; border-radius:12px; font-size:0.6rem;">⚠️ تجريبي</span>`;
}

// ============================================================
// دوال التحويل (نفسها)
// ============================================================
function convertCurrency(amount, from, to, type = 'sell') {
    if (amount === 0) return 0;
    if (from === to) return amount;

    let usdAmount = 0;
    switch (from) {
        case 'usd':
            usdAmount = amount;
            break;
        case 'try':
            usdAmount = amount / (type === 'sell' ? usdTrySell : usdTryBuy);
            break;
        case 'syr_new':
            usdAmount = amount / (type === 'sell' ? usdSyrSell : usdSyrBuy);
            break;
        case 'syr_old':
            usdAmount = (amount / 100) / (type === 'sell' ? usdSyrSell : usdSyrBuy);
            break;
        default:
            return 0;
    }

    switch (to) {
        case 'usd':
            return usdAmount;
        case 'try':
            return usdAmount * (type === 'sell' ? usdTryBuy : usdTrySell);
        case 'syr_new':
            return usdAmount * (type === 'sell' ? usdSyrBuy : usdSyrSell);
        case 'syr_old':
            return (usdAmount * (type === 'sell' ? usdSyrBuy : usdSyrSell)) * 100;
        default:
            return 0;
    }
}

function convert() {
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;
    const sellAmount = convertCurrency(amount, from, to, 'sell');
    const buyAmount = convertCurrency(amount, from, to, 'buy');
    sellResult.textContent = formatNumber(sellAmount);
    buyResult.textContent = formatNumber(buyAmount);
}

// ---------- حاسبة الذهب ----------
function calcGold() {
    const weight = parseFloat(goldWeight.value) || 0;
    const karat = parseInt(goldKarat.value) || 24;
    if (weight <= 0) {
        goldUsdPrice.textContent = '0 / 0';
        goldSyrPrice.textContent = '0 / 0';
        goldTryPrice.textContent = '0 / 0';
        return;
    }

    const gramPriceUsd = (goldUsdOunce / 31.1035) * (karat / 24);
    const sellPricePerGram = gramPriceUsd + 1;
    const buyPricePerGram = gramPriceUsd - 1;

    const totalSellUsd = sellPricePerGram * weight;
    const totalBuyUsd = buyPricePerGram * weight;
    const totalSellSyr = totalSellUsd * usdSyrBuy;
    const totalBuySyr = totalBuyUsd * usdSyrSell;
    const totalSellTry = totalSellUsd * usdTryBuy;
    const totalBuyTry = totalBuyUsd * usdTrySell;

    goldUsdPrice.textContent = `${formatNumber(totalBuyUsd)} / ${formatNumber(totalSellUsd)}`;
    goldSyrPrice.textContent = `${formatNumber(totalBuySyr)} / ${formatNumber(totalSellSyr)}`;
    goldTryPrice.textContent = `${formatNumber(totalBuyTry)} / ${formatNumber(totalSellTry)}`;
}

// ---------- Toast ----------
function showToast(msg) {
    const old = document.querySelector('.custom-toast');
    if (old) old.remove();
    const div = document.createElement('div');
    div.className = 'custom-toast';
    div.style.cssText = `
        position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
        background: var(--gold); color: #1a1a1a; padding: 10px 20px;
        border-radius: 40px; font-weight: 700; z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15); font-family: 'Tajawal', sans-serif;
        transition: opacity 0.3s; font-size: 0.9rem;
    `;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3000);
}

// ---------- مستمعات الأحداث ----------
convertBtn.addEventListener('click', convert);
amountInput.addEventListener('input', convert);
fromSelect.addEventListener('change', convert);
toSelect.addEventListener('change', convert);

refreshBtn.addEventListener('click', () => {
    showToast('🔄 جاري التحديث...');
    fetchGoldPrice(true);
});

calcGoldBtn.addEventListener('click', calcGold);
goldWeight.addEventListener('input', calcGold);
goldKarat.addEventListener('change', calcGold);

// ---------- الوضع الليلي ----------
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    themeToggle.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// ---------- مودال التواصل ----------
contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    contactModal.style.display = 'flex';
});
contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) contactModal.style.display = 'none';
});

// ---------- تثبيت PWA ----------
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
    }
});

// ---------- الإعلانات ----------
let adsArray = [];
let currentAd = 0;
let adInterval = null;
let adsEnabled = false;

const adBanner = document.getElementById('adBanner');
const adLink = document.getElementById('adLink');
const adImage = document.getElementById('adImage');
const adText = document.getElementById('adText');

function showAd() {
    if (!adsEnabled || !adsArray.length) {
        adBanner.style.display = 'none';
        return;
    }
    adBanner.style.display = 'block';
    const ad = adsArray[currentAd];
    if (ad) {
        adImage.src = ad.imageUrl || '';
        adText.textContent = ad.text || '';
        adLink.href = ad.link || '#';
        adImage.style.display = ad.imageUrl ? 'block' : 'none';
    }
    currentAd = (currentAd + 1) % adsArray.length;
}

function startAds() {
    if (adInterval) clearInterval(adInterval);
    if (adsEnabled && adsArray.length) {
        showAd();
        adInterval = setInterval(showAd, 7000);
    } else {
        adBanner.style.display = 'none';
    }
}

const adsRef = ref(db, 'adsArray');
const adsEnabledRef = ref(db, 'adsEnabled');

onValue(adsRef, (snap) => {
    if (snap.exists() && Array.isArray(snap.val())) {
        adsArray = snap.val();
    } else {
        adsArray = [];
    }
    startAds();
});

onValue(adsEnabledRef, (snap) => {
    adsEnabled = snap.val() === true;
    startAds();
});

// ============================================================
// 🚀 تشغيل التطبيق
// ============================================================
setTimeout(() => {
    splash.classList.add('hidden');
    main.style.display = 'block';
}, 1200);

listenToFirebaseRates();
// محاولة جلب الذهب مع تأخير بسيط لضمان تحميل الصفحة
setTimeout(() => fetchGoldPrice(false), 500);
setInterval(() => fetchGoldPrice(false), 300000);
setTimeout(convert, 800);

console.log('✅ تطبيق صرّاف جاهز (مُحسّن للهواتف)');