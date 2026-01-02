const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropText = document.getElementById('dropText');
const svgPreview = document.getElementById('svgPreview');
const validationMessage = document.getElementById('validationMessage');
const animationSection = document.getElementById('animationSection');
const lottiePreviewSection = document.getElementById('lottiePreviewSection');
const downloadSection = document.getElementById('downloadSection');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const convertTgsBtn = document.getElementById('convertTgsBtn');

let uploadedFile = null;
let lottieAnimation = null;
let currentLottieData = null;

// Валідація SVG файлу
async function validateSVG(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');

    const errors = [];

    // Перевірка чи це валідний SVG
    if (doc.querySelector('parsererror')) {
        errors.push('❌ Файл не є валідним SVG');
        return { valid: false, errors, svgText: text };
    }

    const svg = doc.querySelector('svg');
    if (!svg) {
        errors.push('❌ Не знайдено SVG елемент');
        return { valid: false, errors, svgText: text };
    }

    // Перевірка на растрові зображення
    if (doc.querySelector('image')) {
        errors.push('⚠️ SVG містить растрові зображення (тільки вектор)');
    }

    // Перевірка розміру
    const width = svg.getAttribute('width') || svg.viewBox?.baseVal?.width;
    const height = svg.getAttribute('height') || svg.viewBox?.baseVal?.height;

    if (width && height) {
        const w = parseFloat(width);
        const h = parseFloat(height);
        if (w > 512 || h > 512) {
            errors.push(`⚠️ Розмір ${Math.round(w)}×${Math.round(h)}px перевищує 512×512px`);
        }
    }

    // Перевірка розміру файлу - TGS має бути до 64KB
    if (file.size > 64 * 1024) {
        errors.push(`⚠️ Розмір файлу ${Math.round(file.size/1024)}KB (має бути до 64KB для TGS)`);
    }

    return { 
        valid: errors.length === 0, 
        errors, 
        svgText: text,
        hasWarnings: errors.some(e => e.startsWith('⚠️'))
    };
}

// Показ SVG превью - КОМПАКТНА ВЕРСІЯ
function showSVGPreview(svgText) {
    dropText.style.display = 'none';
    svgPreview.innerHTML = svgText;
    svgPreview.style.display = 'flex';
    svgPreview.style.justifyContent = 'center';
    svgPreview.style.alignItems = 'center';
    svgPreview.style.padding = '10px';
    svgPreview.style.minHeight = 'auto';

    const svgEl = svgPreview.querySelector('svg');
    if (svgEl) {
        svgEl.style.maxWidth = '100px';
        svgEl.style.maxHeight = '100px';
        svgEl.style.width = 'auto';
        svgEl.style.height = 'auto';
    }

    // Зменшити розмір drop-zone після завантаження
    dropZone.style.minHeight = '120px';
    dropZone.style.padding = '15px';
}

// Показ повідомлення валідації
function showValidationMessage(validation) {
    validationMessage.style.display = 'block';

    if (validation.valid || validation.hasWarnings) {
        validationMessage.className = 'validation-message success';
        validationMessage.innerHTML = `
            <p><strong>✅ Файл завантажено успішно!</strong></p>
            ${validation.errors.length > 0 ? '<p>' + validation.errors.join('<br>') + '</p>' : ''}
            <p>Оберіть тип анімації нижче:</p>
        `;
        animationSection.style.display = 'block';
        generateLottiePreview();
    } else {
        validationMessage.className = 'validation-message error';
        validationMessage.innerHTML = `
            <p><strong>❌ Файл не відповідає вимогам:</strong></p>
            <p>${validation.errors.join('<br>')}</p>
        `;
        animationSection.style.display = 'none';
        lottiePreviewSection.style.display = 'none';
        downloadSection.style.display = 'none';
    }
}

// Генерація Lottie анімації (базова заглушка - потрібен backend)
function generateLottiePreview() {
    const animationType = document.querySelector('input[name="animation"]:checked').value;

    // Базовий Lottie JSON для демо
    currentLottieData = {
        "v": "5.7.4",
        "fr": 60,
        "ip": 0,
        "op": 180,
        "w": 512,
        "h": 512,
        "nm": "SVG Animation",
        "ddd": 0,
        "assets": [],
        "layers": [{
            "ddd": 0,
            "ind": 1,
            "ty": 4,
            "nm": "Shape",
            "sr": 1,
            "ks": {
                "o": generateOpacityAnimation(animationType),
                "r": generateRotationAnimation(animationType),
                "p": {"a": 0, "k": [256, 256]},
                "s": generateScaleAnimation(animationType)
            },
            "ao": 0,
            "shapes": [],
            "ip": 0,
            "op": 180,
            "st": 0
        }],
        "markers": []
    };

    showLottiePreview();
}

// Функції генерації анімацій
function generateOpacityAnimation(type) {
    if (type === 'fade') {
        return {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 30, "s": [100]},
                {"t": 150, "s": [100]},
                {"t": 180, "s": [0]}
            ]
        };
    }
    return {"a": 0, "k": 100};
}

function generateRotationAnimation(type) {
    if (type === 'rotate') {
        return {
            "a": 1,
            "k": [
                {"t": 0, "s": [0]},
                {"t": 180, "s": [360]}
            ]
        };
    }
    return {"a": 0, "k": 0};
}

function generateScaleAnimation(type) {
    if (type === 'scale') {
        return {
            "a": 1,
            "k": [
                {"t": 0, "s": [80, 80]},
                {"t": 90, "s": [120, 120]},
                {"t": 180, "s": [80, 80]}
            ]
        };
    }
    return {"a": 0, "k": [100, 100]};
}

// Показ Lottie preview
function showLottiePreview() {
    lottiePreviewSection.style.display = 'block';
    downloadSection.style.display = 'block';

    // Очистити попередній preview
    if (lottieAnimation) {
        lottieAnimation.destroy();
    }

    // Створити новий preview
    lottieAnimation = lottie.loadAnimation({
        container: document.getElementById('lottiePreview'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: currentLottieData
    });
}

// Обробка файлів
async function handleFiles(files) {
    const svgFile = Array.from(files).find(f => f.name.endsWith('.svg'));

    if (!svgFile) {
        alert('⚠️ Будь ласка, виберіть SVG файл');
        return;
    }

    uploadedFile = svgFile;

    // Валідація файлу
    const validation = await validateSVG(svgFile);

    // Показати превью SVG
    showSVGPreview(validation.svgText);

    // Показати результат валідації
    showValidationMessage(validation);
}

// Drag & Drop події
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

// Зміна типу анімації
document.querySelectorAll('input[name="animation"]').forEach(radio => {
    radio.addEventListener('change', () => {
        generateLottiePreview();
    });
});

// Завантаження JSON
downloadJsonBtn.addEventListener('click', () => {
    if (!currentLottieData) return;

    const blob = new Blob([JSON.stringify(currentLottieData, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile.name.replace('.svg', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Конвертація в TGS (потребує backend)
convertTgsBtn.addEventListener('click', async () => {
    if (!uploadedFile) return;

    const animationType = document.querySelector('input[name="animation"]:checked').value;

    convertTgsBtn.disabled = true;
    convertTgsBtn.innerHTML = '⏳ Конвертація...';

    try {
        const formData = new FormData();
        formData.append('svg', uploadedFile);
        formData.append('animation', animationType);

        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Помилка конвертації');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = uploadedFile.name.replace('.svg', '.tgs');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        convertTgsBtn.disabled = false;
        convertTgsBtn.innerHTML = '🔄 Конвертувати і завантажити TGS';
    } catch (error) {
        alert('⚠️ Backend ще не підключений. Поки працює тільки завантаження JSON!');
        console.error(error);
        convertTgsBtn.disabled = false;
        convertTgsBtn.innerHTML = '🔄 Конвертувати і завантажити TGS';
    }
});
