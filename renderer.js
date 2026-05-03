// FIX: require('crypto') kaldırıldı, window.crypto.subtle kullanıldı
// FIX: https.request kaldırıldı, fetch API kullanıldı

// ====================== TAB SİSTEMİ ======================
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('active', i === tab);
    });
    document.querySelectorAll('.tab-content').forEach((c, i) => {
        c.style.display = i === tab ? 'block' : 'none';
    });
}

// ====================== SHA-256 HASH (Web Crypto API) ======================
async function sha256Hash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ====================== SHA-1 HASH (HIBP için) ======================
async function sha1Hash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.toUpperCase();
}

// ====================== ŞİFRE ANALİZ ======================
const passInput = document.getElementById('passInput');
const meterFill = document.getElementById('meter-fill');
const statusText = document.getElementById('statusText');
const timeText = document.getElementById('timeText');
const entropyText = document.getElementById('entropyText');
const hashValue = document.getElementById('hashValue');

const commonPasswords = ["123456","123456789","qwerty","password","12345678","111111","123123","admin","welcome","turkey","turkiye","letmein","1234567"];

function analyzePassword(pass) {
    let score = 0;
    let charsetSize = 0;
    let warnings = [];

    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass)) { score++; charsetSize += 26; }
    if (/[A-Z]/.test(pass)) { score++; charsetSize += 26; }
    if (/[0-9]/.test(pass)) { score++; charsetSize += 10; }
    if (/[^A-Za-z0-9]/.test(pass)) { score++; charsetSize += 32; }

    if (commonPasswords.includes(pass.toLowerCase())) warnings.push("Çok yaygın bir şifre!");
    if (/(.)\1{2,}/.test(pass)) warnings.push("Tekrar eden karakterler var.");

    // charsetSize en az 1 olsun
    if (charsetSize === 0) charsetSize = 26;
    
    const entropy = Math.log2(Math.pow(charsetSize, pass.length));
    const seconds = Math.pow(charsetSize, pass.length) / 1e10;

    return { score: Math.min(score, 5), entropy: entropy.toFixed(1), secondsToCrack: seconds, warnings };
}

function updateUI(analysis) {
    const { score, entropy, secondsToCrack, warnings } = analysis;
    const colors = ['#f44336', '#ff9800', '#ffeb3b', '#8bc34a', '#4caf50'];
    const labels = ["Çok Zayıf", "Zayıf", "Orta", "Güçlü", "Çok Güçlü"];

    const index = Math.min(score, 4);
    meterFill.style.width = `${(index + 1) * 20}%`;
    meterFill.style.background = colors[index];

    statusText.innerText = labels[index] + (warnings.length ? " ⚠️" : "");
    statusText.style.color = colors[index];
    entropyText.innerText = entropy;
    timeText.innerText = formatTime(secondsToCrack);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "∞ (neredeyse imkansız)";
    if (seconds < 60) return Math.floor(seconds) + " saniye";
    if (seconds < 3600) return Math.floor(seconds / 60) + " dakika";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " saat";
    return Math.floor(seconds / 31536000).toLocaleString() + " yıl";
}

function resetUI() {
    meterFill.style.width = "0%";
    statusText.innerText = "Bekleniyor...";
    entropyText.innerText = "-";
    timeText.innerText = "-";
    hashValue.innerText = "Henüz veri yok...";
}

// Şifre girişi (Async hash hesaplama ile)
if (passInput) {
    passInput.addEventListener('input', async () => {
        const password = passInput.value;
        if (password.length === 0) {
            resetUI();
            return;
        }

        // FIX: Web Crypto API ile hash hesapla
        const hash = await sha256Hash(password);
        hashValue.innerText = hash;

        const analysis = analyzePassword(password);
        updateUI(analysis);
    });
    
    // FIX: autofocus sorunu için
    passInput.focus();
}

// ====================== ŞİFRE ÜRET ======================
function generatePassword() {
    const length = parseInt(document.getElementById('genLength').value) || 16;
    const upper = document.getElementById('genUpper').checked;
    const lower = document.getElementById('genLower').checked;
    const numbers = document.getElementById('genNumbers').checked;
    const symbols = document.getElementById('genSymbols').checked;

    let chars = '';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars === '') chars = 'abcdefghijklmnopqrstuvwxyz';

    let pass = '';
    for (let i = 0; i < length; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }

    const el = document.getElementById('generatedPass');
    if (el) el.innerText = pass;
}

function copyGenerated() {
    const text = document.getElementById('generatedPass').innerText;
    if (text && text !== "Henüz şifre üretilmedi") {
        navigator.clipboard.writeText(text);
        alert('Şifre kopyalandı!');
    }
}

// ====================== HIBP (Fetch API ile) ======================
async function checkHIBP() {
    const password = document.getElementById('hibpInput').value.trim();
    const resultDiv = document.getElementById('hibpResult');

    if (!password) {
        resultDiv.innerHTML = `<span style="color:red">Şifre girin!</span>`;
        return;
    }

    resultDiv.innerHTML = `<span style="color:orange">Sorgulanıyor...</span>`;

    try {
        // FIX: Web Crypto API ile SHA-1 hash hesapla
        const hash = await sha1Hash(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        // FIX: fetch API kullan (https.request yerine)
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: { 'User-Agent': 'SecurityLab' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.text();
        const found = data.split('\n').some(line => {
            const [hashSuffix] = line.split(':');
            return hashSuffix === suffix;
        });

        if (found) {
            resultDiv.innerHTML = `<span style="color:#f44336">⚠️ Bu şifre veritabanında bulundu! Lütfen değiştirin.</span>`;
        } else {
            resultDiv.innerHTML = `<span style="color:#4caf50">✅ Bu şifre HIBP'ta görünmüyor.</span>`;
        }
    } catch (e) {
        console.error('HIBP hatası:', e);
        resultDiv.innerHTML = `<span style="color:orange">Bağlantı hatası. İnternet bağlantınızı kontrol edin.</span>`;
    }
}

function copyHash() {
    const text = hashValue.innerText;
    if (text && text !== "Henüz veri yok...") {
        navigator.clipboard.writeText(text);
        alert('Hash kopyalandı!');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    switchTab(0);
});
