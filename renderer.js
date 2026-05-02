const crypto = require('crypto');
const https = require('https');

// ====================== TAB SİSTEMİ ======================
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('active', i === tab);
    });
    document.querySelectorAll('.tab-content').forEach((c, i) => {
        c.style.display = i === tab ? 'block' : 'none';
    });
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

    const entropy = Math.log2(Math.pow(charsetSize || 62, pass.length) || 1);
    const seconds = Math.pow(charsetSize || 62, pass.length) / 1e10;

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

// Şifre girişi
if (passInput) {
    passInput.addEventListener('input', () => {
        const password = passInput.value;
        if (password.length === 0) {
            resetUI();
            return;
        }

        const hash = crypto.createHash('sha256').update(password).digest('hex');
        hashValue.innerText = hash;

        const analysis = analyzePassword(password);
        updateUI(analysis);
    });
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
    if (text) {
        navigator.clipboard.writeText(text);
        alert('Şifre kopyalandı!');
    }
}

// ====================== HIBP (Node.js ile) ======================
function checkHIBP() {
    const password = document.getElementById('hibpInput').value.trim();
    const resultDiv = document.getElementById('hibpResult');

    if (!password) {
        resultDiv.innerHTML = `<span style="color:red">Şifre girin!</span>`;
        return;
    }

    resultDiv.innerHTML = `<span style="color:orange">Sorgulanıyor...</span>`;

    try {
        const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        const options = {
            hostname: 'api.pwnedpasswords.com',
            path: `/range/${prefix}`,
            method: 'GET',
            headers: { 'User-Agent': 'SecurityLab' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const found = data.split('\n').some(line => {
                    const [hashSuffix] = line.split(':');
                    return hashSuffix === suffix;
                });

                if (found) {
                    resultDiv.innerHTML = `<span style="color:#f44336">⚠️ Bu şifre veritabanında bulundu! Lütfen değiştirin.</span>`;
                } else {
                    resultDiv.innerHTML = `<span style="color:#4caf50">✅ Bu şifre HIBP'ta görünmüyor.</span>`;
                }
            });
        });

        req.on('error', () => {
            resultDiv.innerHTML = `<span style="color:orange">Bağlantı hatası. İnternet kontrol edin.</span>`;
        });
        req.end();
    } catch (e) {
        resultDiv.innerHTML = `<span style="color:red">Hata oluştu.</span>`;
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