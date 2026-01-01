const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const resultDiv = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');
let uploadedFile = null;
let convertedBlob = null;

// Активувати кнопку після вибору файлу
fileInput.addEventListener('change', (e) => {
    uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.name.endsWith('.svg')) {
        convertBtn.disabled = false;
        convertBtn.textContent = `Конвертувати ${uploadedFile.name}`;
    } else {
        alert('⚠️ Будь ласка, виберіть SVG файл');
        uploadedFile = null;
        convertBtn.disabled = true;
    }
});

// Конвертація файлу
convertBtn.addEventListener('click', async () => {
    if (!uploadedFile) return;

    const animationType = document.querySelector('input[name="animation"]:checked').value;
    
    // Показати завантаження
    convertBtn.disabled = true;
    convertBtn.innerHTML = 'Конвертація... <span class="loading"></span>';

    try {
        const formData = new FormData();
        formData.append('svg', uploadedFile);
        formData.append('animation', animationType);

        // УВАГА: Цей API endpoint буде після деплою на Vercel
        // Поки що показуємо демо-версію
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Помилка конвертації');
        }

        convertedBlob = await response.blob();
        
        // Показати результат
        resultDiv.style.display = 'block';
        convertBtn.textContent = 'Конвертувати в TGS';
        
    } catch (error) {
        // Для тестування без backend
        alert('⚠️ Backend ще не підключений. Після деплою на Vercel це буде працювати!\n\nПоки що це демо-версія інтерфейсу.');
        console.error(error);
        convertBtn.disabled = false;
        convertBtn.textContent = 'Конвертувати в TGS';
    }
});

// Завантаження TGS файлу
downloadBtn.addEventListener('click', () => {
    if (!convertedBlob) return;
    
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile.name.replace('.svg', '.tgs');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
