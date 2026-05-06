import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4sIfT6u6n8XWRPn2dLktlKfEP16VPw40",
    authDomain: "my-social-links-ede8c.firebaseapp.com",
    projectId: "my-social-links-ede8c",
    storageBucket: "my-social-links-ede8c.firebasestorage.app",
    messagingSenderId: "515940881963",
    appId: "1:515940881963:web:5093dc75b133024d52bc6e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const container = document.getElementById('accountsListPublic');
const usernameDisplaySpan = document.getElementById('usernameDisplay');
const fullUrl = window.location.href;

// استخراج المعرف القصير (id) من الرابط
let shortId = null;
const match = fullUrl.match(/[?&]id=([^&]+)/);
if (match && match[1]) {
    shortId = match[1];
}

console.log("المعرف القصير المستخرج:", shortId);
console.log("الرابط الكامل:", fullUrl);

if (!shortId) {
    container.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p style="color:red;">❌ رابط غير صالح</p>
            <p>الرابط الحالي: <code>${escapeHTML(fullUrl)}</code></p>
            <p>الرجاء استخدام رابط المشاركة من داخل حسابك.</p>
        </div>
    `;
    if (usernameDisplaySpan) usernameDisplaySpan.innerText = "غير معروف";
} else {
    container.innerHTML = '<p style="text-align:center;">⏳ جاري تحميل الحسابات...</p>';
    if (usernameDisplaySpan) usernameDisplaySpan.innerText = "جاري التحميل...";
    // البحث عن userId المرتبط بالمعرف القصير
    findUserIdByShortId(shortId);
}

async function findUserIdByShortId(shortId) {
    try {
        // البحث في مجموعة shortLinks
        const shortLinksRef = collection(db, 'shortLinks');
        const q = query(shortLinksRef, where("shortId", "==", shortId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:red;">❌ رابط غير صالح أو منتهي الصلاحية</p>';
            if (usernameDisplaySpan) usernameDisplaySpan.innerText = "غير موجود";
            return;
        }
        
        const userId = snapshot.docs[0].data().userId;
        console.log("تم العثور على userId:", userId);
        
        // تحميل الحسابات وعرض اسم المستخدم
        await loadAccounts(userId);
        
    } catch (err) {
        console.error("خطأ:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">⚠️ خطأ: ${escapeHTML(err.message)}</p>`;
        if (usernameDisplaySpan) usernameDisplaySpan.innerText = "خطأ";
    }
}

async function loadAccounts(uid) {
    try {
        const q = query(collection(db, "accounts"), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        
        console.log("عدد الحسابات:", snapshot.size);
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;">😞 لا توجد حسابات منشورة لهذا المستخدم.</p>';
            if (usernameDisplaySpan) usernameDisplaySpan.innerText = "لا توجد حسابات";
            return;
        }
        
        // محاولة استخراج اسم المستخدم من أول حساب (أو يمكنك تخزينه في مكان منفصل)
        let username = null;
        const accountsList = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            accountsList.push(data);
            // إذا لم نجد اسم المستخدم بعد، خذه من أول حساب
            if (!username && data.username) {
                username = data.username;
            }
        });
        
        // عرض اسم المستخدم في العنوان
        if (usernameDisplaySpan) {
            usernameDisplaySpan.innerText = username || "المستخدم";
        }
        
        // عرض الحسابات
        container.innerHTML = "";
        accountsList.forEach(data => {
            const card = document.createElement("div");
            card.style.cssText = "background: #f8f9fa; border-radius: 12px; padding: 15px; margin-bottom: 12px; border-right: 5px solid #2a5298; text-align: right;";
            card.innerHTML = `
                <h3 style="margin:0 0 8px 0; color:#2a5298;">📱 ${escapeHTML(data.platform)}</h3>
                <p style="margin:5px 0; color:#555;">@${escapeHTML(data.username)}</p>
                <a href="${data.url}" target="_blank" style="display:inline-block; margin-top:8px; background:#2a5298; color:white; padding:6px 15px; border-radius:20px; text-decoration:none;">🔗 زيارة الحساب</a>
            `;
            container.appendChild(card);
        });
        
    } catch (err) {
        console.error("خطأ في تحميل الحسابات:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">⚠️ خطأ في تحميل البيانات: ${escapeHTML(err.message)}</p>`;
        if (usernameDisplaySpan) usernameDisplaySpan.innerText = "خطأ";
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
}
