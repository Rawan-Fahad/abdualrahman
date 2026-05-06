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

// طريقة بسيطة وقوية لاستخراج uid من الرابط
let userId = null;

// افحص الرابط كله للبحث عن uid=
const fullUrl = window.location.href;
const match = fullUrl.match(/uid=([^&]+)/);
if (match && match[1]) {
    userId = match[1];
}

console.log("UID المستخرج:", userId);
console.log("الرابط الكامل:", fullUrl);

const container = document.getElementById('accountsListPublic');

if (!userId) {
    container.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <p style="color:red;">❌ لم يتم العثور على UID في الرابط</p>
            <p>الرابط الحالي: <code>${fullUrl}</code></p>
            <p>الرابط الصحيح يجب أن يكون: <code>${window.location.origin}/public.html?uid=معرف_المستخدم</code></p>
        </div>
    `;
} else {
    container.innerHTML = '<p style="text-align:center;">⏳ جاري تحميل الحسابات...</p>';
    loadAccounts(userId);
}

async function loadAccounts(uid) {
    try {
        const q = query(collection(db, "accounts"), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        
        console.log("عدد الحسابات:", snapshot.size);
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;">😞 لا توجد حسابات منشورة لهذا المستخدم.</p>';
            return;
        }
        
        container.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
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
        console.error(err);
        container.innerHTML = `<p style="color:red; text-align:center;">⚠️ خطأ: ${err.message}</p>`;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
}