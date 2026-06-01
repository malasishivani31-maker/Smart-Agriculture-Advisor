// ================= API =================
const API_URL = 'http://localhost:5000/api/recommend';
const WEATHER_API_URL = 'http://localhost:5000/api/weather';

// ================= GLOBAL =================
let currentMode = "expert";
let weatherChart = null;

// ================= LANGUAGE =================
const TEXT = {
    en: { crop: "🌾 Crop", tips: "💡 Tips", error: "Enter location", send: "Send" },
    hi: { crop: "🌾 फसल", tips: "💡 सुझाव", error: "स्थान दर्ज करें", send: "भेजें" }
};
// Optional: Hindi translation for tips
const tipsHindiMap = {
    "Add nitrogen fertilizer": "नाइट्रोजन उर्वरक डालें",
    "Add phosphorus fertilizer": "फास्फोरस उर्वरक डालें",
    "Add potassium fertilizer": "पोटाश उर्वरक डालें",
    "Low rainfall - irrigation needed": "कम वर्षा - सिंचाई आवश्यक है",
    "Prune the plants": "पौधों की छंटाई करें",
    "Use pesticide spray": "कीट नाशक का छिड़काव करें"
    // Add more mappings as needed
};


// ================= RANGE =================
function startAnalysis(){
    document.querySelector(".hero").style.display = "none";
    document.getElementById("appPage").style.display = "block";
}

function setupRangeDisplays() {
    const map = { N: "Nval", P: "Pval", K: "Kval", ph: "phval" };

    Object.keys(map).forEach(id => {
        const input = document.getElementById(id);
        const span = document.getElementById(map[id]);

        if (!input || !span) return;

        const update = () => span.textContent = input.value;
        input.addEventListener("input", update);
        update();
    });
}

// ================= SECTION =================
function showSection(id) {
    ["recommend", "diseaseSection", "marketSection"].forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = "none";
    });

    const active = document.getElementById(id);
    if (active) active.style.display = "block";

    if (id === "marketSection") loadMarketplace();
}

// ================= MODE =================
function setMode(mode) {
    currentMode = mode;

    const farmer = document.getElementById("farmerInputs");
    const expert = document.getElementById("expertInputs");

    if (farmer) farmer.style.display = (mode === "farmer") ? "block" : "none";
    if (expert) expert.style.display = (mode === "expert") ? "block" : "none";
}

// ================= LOCATION =================
function detectLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const coords = pos.coords.latitude + ", " + pos.coords.longitude;
        document.getElementById("location").value = coords;
    });
}

// ================= MAIN =================
async function getRecommendation() {

    const location = document.getElementById('location').value.trim();

    if (!location) {
        showError("Enter location");
        return;
    }

    let N, P, K, ph;
    let temperature, humidity, rainfall;
    let weather = null;   // 🔥 IMPORTANT

    // ================= FARMER MODE =================
    if (currentMode === "farmer") {

        N = 50;
        P = 50;
        K = 50;
        ph = 6.5;

        temperature = +document.getElementById('tempFarmer').value || 25;
        humidity = +document.getElementById('humidityFarmer').value || 50;
        rainfall = +document.getElementById('rainfallFarmer').value || 0;

        // create fake weather object for graph
        weather = {
            current: {
                temperature,
                humidity,
                rainfall
            }
        };
    }

    // ================= EXPERT MODE =================
    else {

        N = +document.getElementById('N').value;
        P = +document.getElementById('P').value;
        K = +document.getElementById('K').value;
        ph = +document.getElementById('ph').value;

        try {
            const weatherRes = await fetch(WEATHER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location })
            });

            weather = await weatherRes.json();

            temperature = weather?.current?.temperature || 25;
            humidity = weather?.current?.humidity || 50;
            rainfall = weather?.current?.rainfall || 0;

        } catch (err) {
            console.error(err);

            temperature = 25;
            humidity = 50;
            rainfall = 0;

            weather = {
                current: { temperature, humidity, rainfall }
            };
        }
    }

    // ================= API CALL =================
    toggleUI(false, true);

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                N, P, K,
                temperature,
                humidity,
                rainfall,
                ph
            })
        });

        const data = await res.json();

        // 🔥 IMPORTANT FIXES
        displayRecommendation(data, weather);
        drawWeatherChart(weather);

    } catch (err) {
        console.error(err);
        showError("Server error");
    }

    toggleUI(true, false);
}
// ================= WEATHER GRAPH =================
function drawWeatherChart(weather) {

    if (!weather || !weather.current) return;

    const ctx = document.getElementById("weatherChart");

    if (weatherChart) weatherChart.destroy();

    weatherChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Temperature", "Humidity", "Rainfall"],
            datasets: [{
                label: "Weather Data",
                data: [
                    weather.current.temperature,
                    weather.current.humidity,
                    weather.current.rainfall
                ],
                backgroundColor: ["red", "blue", "green"]
            }]
        }
    });
}
// ================= DISPLAY =================
function displayRecommendation(data, weather) {

   
    console.log("===== DEBUG =====");
    console.log("API returned data:", data);
    console.log("Crop from API:", data.crop);
    console.log("Products from API:", data.products);

    document.getElementById('cropRecommendation').innerHTML =
        `<h2>${data.crop || "No data"}</h2>`;
      // 🔊 VOICE (Crop)
    const lang = localStorage.getItem("lang") || "en";

if (lang === "hi") {
    speak(`सुझाई गई फसल है ${data.crop}`);
} else {
    speak(`Recommended crop is ${data.crop}`);
}

    // Use API products if available, otherwise fallback to crop-based products
let products = (data.products && data.products.length) ? data.products : getRecommendedProducts(data.crop);
console.log("Products to display:", products);

// Always show at most 5 products
products = products.slice(0, 5);

document.getElementById('productSection').innerHTML =
    products.map(p => `
        <div class="product-card">
            <h4>${p.name}</h4>
            ${p.price ? `<p class="price">${p.price}</p>` : ""}
            <a href="${p.link}" target="_blank">
                <button class="buy-btn">🛒 Buy Now</button>
            </a>
        </div>`).join("");
    document.getElementById('farmingTips').innerHTML =
        "<ul>" + (data.tips || []).map(t => `<li>${t}</li>`).join("") + "</ul>";

     // 🔊 VOICE (Tips)
if (data.tips && data.tips.length) {
    const lang = localStorage.getItem("lang") || "en";

    const translatedTips = data.tips.map(t =>
        (lang === "hi" && tipsHindiMap[t]) ? tipsHindiMap[t] : t
    );

    if (lang === "hi") {
        speak("खेती के सुझाव: " + translatedTips.join(", "));
    } else {
        speak("Farming tips: " + data.tips.join(", "));
    }
}

    document.getElementById('weatherForecast').innerHTML =
        `🌡️ ${weather?.current?.temperature || '--'}°C`;
}

function getRecommendedProducts(cropName) {
    if (!cropName) return [];
    const name = cropName.toLowerCase().trim(); // lowercase & trim spaces

    const map = {
        wheat: [
            { name: "Wheat Seeds", price: "₹120/kg", link: "https://www.amazon.in/" },
            { name: "Nitrogen Fertilizer", price: "₹300/bag", link: "https://www.flipkart.com/" },
            { name: "Urea Fertilizer", price: "₹280/bag", link: "https://www.amazon.in/" },
            { name: "Soil Testing Kit", price: "₹1200", link: "https://www.flipkart.com/" },
            { name: "Water Sprayer", price: "₹850", link: "https://www.amazon.in/" }
        ],
        rice: [
            { name: "Rice Seeds", price: "₹140/kg", link: "https://www.amazon.in/" },
            { name: "Pesticide Spray", price: "₹600", link: "https://www.flipkart.com/" },
            { name: "Organic Fertilizer", price: "₹450/bag", link: "https://www.amazon.in/" },
            { name: "Drip Irrigation Kit", price: "₹2500", link: "https://www.flipkart.com/" },
            { name: "Garden Tools Kit", price: "₹999", link: "https://www.amazon.in/" }
        ],
        corn: [
            { name: "Corn Seeds", price: "₹130/kg", link: "https://www.amazon.in/" },
            { name: "Organic Fertilizer", price: "₹450/bag", link: "https://www.flipkart.com/" },
            { name: "Urea Fertilizer", price: "₹300/bag", link: "https://www.amazon.in/" },
            { name: "Pesticide Spray", price: "₹600", link: "https://www.flipkart.com/" },
            { name: "Compost Maker", price: "₹1800", link: "https://www.amazon.in/" }
        ],
        mango: [   // ✅ Added Mango products
            { name: "Mango Saplings", price: "₹250/tree", link: "https://www.amazon.in/" },
            { name: "Organic Fertilizer", price: "₹500/bag", link: "https://www.flipkart.com/" },
            { name: "Mulch Sheets", price: "₹200/pc", link: "https://www.amazon.in/" },
            { name: "Pesticide Spray", price: "₹650", link: "https://www.flipkart.com/" },
            { name: "Drip Irrigation Kit", price: "₹2500", link: "https://www.amazon.in/" }
        ]
    };

    return map[name] || [];
}
// ================= MARKET =================
function loadMarketplace() {

    const items = [
        {
            name: "Wheat Seeds",
            price: "₹120/kg",
            link: "https://www.amazon.in/"
        },
        {
            name: "Rice Seeds",
            price: "₹140/kg",
            link: "https://www.flipkart.com/"
        },
        {
            name: "Organic Fertilizer",
            price: "₹450/bag",
            link: "https://www.amazon.in/"
        },
        {
            name: "Urea Fertilizer",
            price: "₹300/bag",
            link: "https://www.flipkart.com/"
        },
        {
            name: "Garden Tools Kit",
            price: "₹999",
            link: "https://www.amazon.in/"
        },
        {
            name: "Water Sprayer",
            price: "₹850",
            link: "https://www.flipkart.com/"
        },
        {
            name: "Drip Irrigation Kit",
            price: "₹2500",
            link: "https://www.amazon.in/"
        },
        {
            name: "Pesticide Spray",
            price: "₹600",
            link: "https://www.flipkart.com/"
        },
        {
            name: "Soil Testing Kit",
            price: "₹1200",
            link: "https://www.amazon.in/"
        },
        {
            name: "Compost Maker",
            price: "₹1800",
            link: "https://www.flipkart.com/"
        }
    ];

    document.getElementById("marketplace").innerHTML =
        items.map(p => `
            <div class="product-card">
                <h4>${p.name}</h4>
                <p class="price">${p.price}</p>
                <a href="${p.link}" target="_blank">
                    <button class="buy-btn">🛒 Buy Now</button>
                </a>
            </div>
        `).join("");
}
// ================= CHATBOT =================
// ================= CHATGPT-LIKE ASSISTANT =================

async function sendMessage() {

    const input = document.getElementById("chatInput");
    const box = document.getElementById("chatMessages");
    const imageInput = document.getElementById("chatImage");

    const msg = input.value.trim();

    if (!msg && !imageInput.files.length) return;

    // Show user message
    if (msg) {
        box.innerHTML += `<div>👤 ${msg}</div>`;
    }

    // Show image if uploaded
    if (imageInput.files.length) {
        const imgURL = URL.createObjectURL(imageInput.files[0]);
        box.innerHTML += `<div>👤 <img src="${imgURL}" width="100"></div>`;
    }

    input.value = "";

    // Show typing effect
    box.innerHTML += `<div id="typing">🤖 Typing...</div>`;
    box.scrollTop = box.scrollHeight;

    // Fake AI delay
    setTimeout(() => {

        document.getElementById("typing")?.remove();

        const lang = localStorage.getItem("lang") || "en";

        let reply = generateSmartReply(msg, lang, imageInput.files.length);

        box.innerHTML += `<div>🤖 ${reply}</div>`;

        speak(reply);

        box.scrollTop = box.scrollHeight;

        imageInput.value = "";

    }, 1000);
}

// ================= SMART REPLY =================
function generateSmartReply(msg, lang, hasImage) {

    msg = msg.toLowerCase();

    // Image-based response
    if (hasImage) {
        return lang === "hi"
            ? "📸 छवि प्राप्त हुई। यह पौधे की बीमारी हो सकती है, कृपया डिटेक्शन सेक्शन का उपयोग करें।"
            : "📸 Image received. This might be a plant disease. Please use disease detection section.";
    }

    // Crop queries
    if (msg.includes("crop") || msg.includes("farming")) {
        return lang === "hi"
            ? "🌾 मिट्टी और मौसम के अनुसार फसल चुनें।"
            : "🌾 Choose crops based on soil and weather conditions.";
    }

    // Wheat
    if (msg.includes("wheat")) {
        return lang === "hi"
            ? "🌾 गेहूं ठंडे मौसम में अच्छी तरह उगता है।"
            : "🌾 Wheat grows best in cool climates.";
    }

    // Water
    if (msg.includes("water") || msg.includes("irrigation")) {
        return lang === "hi"
            ? "💧 नियमित सिंचाई आवश्यक है।"
            : "💧 Regular irrigation is important.";
    }

    // Default
    return lang === "hi"
        ? "🤖 मैं आपकी मदद के लिए यहाँ हूँ। खेती से जुड़ा सवाल पूछें।"
        : "🤖 I'm here to help! Ask anything about farming.";
}
// ================= VOICE INPUT =================
function startVoice() {

    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice not supported");
        return;
    }

    const recognition = new webkitSpeechRecognition();

    recognition.lang = localStorage.getItem("lang") === "hi" ? "hi-IN" : "en-US";

    recognition.onresult = function(event) {
        document.getElementById("chatInput").value =
            event.results[0][0].transcript;
    };

    recognition.start();
}

// ================= VOICE OUTPUT =================
function speak(text) {

    if (!('speechSynthesis' in window)) {
        console.log("Speech not supported");
        return;
    }

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance();

    msg.text = text;

    // Language selection
    const lang = localStorage.getItem("lang") || "en";
    msg.lang = (lang === "hi") ? "hi-IN" : "en-US";

    // Voice tuning
    msg.rate = 1;     // speed (0.5 to 2)
    msg.pitch = 1;    // tone (0 to 2)
    msg.volume = 1;   // volume (0 to 1)

    // Optional: choose better voice
    const voices = speechSynthesis.getVoices();

    const selectedVoice = voices.find(v =>
        lang === "hi"
            ? v.lang.includes("hi")
            : v.lang.includes("en")
    );

    if (selectedVoice) msg.voice = selectedVoice;

     setTimeout(() => {
        speechSynthesis.speak(msg);
    }, 100);
}
// ================= CHATBOT TOGGLE =================
function toggleChatbot() {
    const bot = document.getElementById("chatbot");
    if (!bot) return;

    bot.style.display = (bot.style.display === "none") ? "block" : "none";
}

// ================= UI =================
function toggleUI(show, load) {
    document.getElementById('resultsSection').style.display = show ? 'block' : 'none';
    document.getElementById('loadingSection').style.display = load ? 'block' : 'none';
}

// ================= ERROR =================
function showError(msg) {
    const err = document.getElementById("errorSection");
    document.getElementById("errorMessage").textContent = msg;
    if (err) err.style.display = "block";
}

// ================= LANGUAGE =================
function applyLanguage() {

    const lang = localStorage.getItem("lang") || "en";
    const t = TEXT[lang] || TEXT.en;

    document.getElementById("cropTitle").innerText = t.crop;
    document.getElementById("tipsTitle").innerText = t.tips;

    // 🔥 Update button text
    const btn = document.getElementById("submitBtn");
    if (btn) {
        btn.innerText = (lang === "hi")
            ? "सुझाव प्राप्त करें"
            : "Get Recommendation";
    }
}

function changeLanguage(lang) {

    // Save selected language
    localStorage.setItem("lang", lang);

    // Apply UI changes
    applyLanguage();

    // 🔊 Speak confirmation
    if (lang === "hi") {
        speak("भाषा हिंदी में बदल दी गई है");
    } else {
        speak("Language changed to English");
    }
}

// ================= detectdisease =================

// Detect disease from uploaded image
let cameraStream = null;

// Show uploaded image preview
function previewImage(event) {
    const preview = document.getElementById("imagePreview");
    const file = event.target.files[0];
    if (!file) return;
    
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
}

// Open camera
function openCamera() {
    const video = document.getElementById("camera");
    video.style.display = "block";

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            console.error(err);
            alert("Cannot access camera");
        });
}

// Close camera
function closeCamera() {
    const video = document.getElementById("camera");
    video.style.display = "none";

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Detect disease (from upload OR camera)
async function detectDisease() {
    const resultDiv = document.getElementById("diseaseResult");
    resultDiv.innerText = "Processing...";

    let formData = new FormData();

    const fileInput = document.getElementById("plantImage");
    const video = document.getElementById("camera");

    // Case 1: File uploaded
    if (fileInput.files.length) {
        formData.append("image", fileInput.files[0]);
    }
    // Case 2: Capture from camera
    else if (cameraStream) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
            formData.append("image", blob, "capture.jpg");
            sendDiseaseRequest(formData);
        });
        return;
    }
    else {
        alert("Please upload an image or open camera to capture one!");
        resultDiv.innerText = "";
        return;
    }

    // If using uploaded file
    sendDiseaseRequest(formData);
}

// Send API request
async function sendDiseaseRequest(formData) {
    const resultDiv = document.getElementById("diseaseResult");
    try {
        const response = await fetch("http://localhost:5000/api/disease", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        resultDiv.innerHTML = `
            <p>Detected Disease: <strong>${data.disease}</strong></p>
            <p>Confidence: ${(data.confidence * 100).toFixed(1)}%</p>
            <p>Suggested Solution: ${data.solution}</p>
        `;
    } catch (err) {
        console.error(err);
        resultDiv.innerText = "Error detecting disease. Make sure server is running.";
    }
}
// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    setupRangeDisplays();
    applyLanguage();
    setMode("expert");

    document.getElementById("submitBtn")
        ?.addEventListener("click", getRecommendation);

    document.getElementById("langSelect")
        ?.addEventListener("change", e => changeLanguage(e.target.value));
});