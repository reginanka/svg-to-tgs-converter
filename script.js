const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const resultDiv = document.getElementById('result');
const downloadBtn = document.getElementById('downloadBtn');
const dropZone = document.getElementById('dropZone');

let uploadedFile = null;
let convertedBlob = null;

// Функція обробки файлів
function handleFiles(files) {
    const svgFile = Array.from(files).find(f => f.name.endsWith('.svg'));
    if (svgFile) {
        uploadedFile = svgFile;
        convertBtn.disabled = false;
        convertBtn.textContent = `Конвертувати ${svgFile.name}`;
    } else {
        alert('⚠️ Будь ласка, виберіть SVG файл');
    }
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
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Клік на dropZone для відкриття діалогу вибору файлів
dropZone.addEventListener('click', () => {
    fileInput.click();
});

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
    convertBtn.innerHTML = '⏳ Конвертація...';
    
    try {
        const formData = new FormData();
        formData.append('svg', uploadedFile);
        formData.append('animation', animationType);
        
        const response = await fetch('https://svg-to-tgs-converter.vercel.app/api/convert', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Помилка конвертації');
        }
        
        convertedBlob = await response.blob();
        
        // Показати результат
        resultDiv.style.display = 'block';
        convertBtn.disabled = false;
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
