'use strict';

const imgInput = document.getElementById('imgInput');
const previewImg = document.getElementById('previewImg');
const previewContainer = document.getElementById('imagePreviewContainer');
const paletteDisplay = document.getElementById('paletteDisplay');
const status = document.getElementById('status');

imgInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    status.textContent = "Reading file...";
    const reader = new FileReader();

    reader.onload = (event) => {
        previewImg.src = event.target.result;
        previewContainer.style.display = "inline-block";
        previewImg.onload = () => extractPalette(previewImg);
    };
    reader.readAsDataURL(file);
};

function extractPalette(imgEl) {
    status.textContent = "Extracting most prominent distinct colors...";
    paletteDisplay.innerHTML = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 200x200 provides 40,000 data points for high accuracy
    canvas.width = 200;
    canvas.height = 200;
    ctx.drawImage(imgEl, 0, 0, 200, 200);

    const imageData = ctx.getImageData(0, 0, 200, 200).data;
    const colorMap = {};

    for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 125) continue;

        // Block size 2 for near-exact color matching
        const block = 2; 
        const qr = Math.round(r / block) * block;
        const qg = Math.round(g / block) * block;
        const qb = Math.round(b / block) * block;
        const rgb = `${qr},${qg},${qb}`;

        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
    }

    // Sort all colors by how often they appear (Prominence)
    const sortedAll = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1]);

    const finalPalette = [];
    const minDiff = 40; // Adjust this to control how 'different' colors must be

    // Filter logic: Pick the most prominent color, then only pick 
    // subsequent colors if they are visually different from ones already picked.
    for (const [rgbStr] of sortedAll) {
        if (finalPalette.length >= 12) break; // Increased to 12 colors

        const current = rgbStr.split(',').map(Number);
        
        const isDistinct = finalPalette.every(picked => {
            const dR = Math.abs(current[0] - picked[0]);
            const dG = Math.abs(current[1] - picked[1]);
            const dB = Math.abs(current[2] - picked[2]);
            return (dR + dG + dB) > minDiff;
        });

        if (isDistinct) {
            finalPalette.push(current);
        }
    }

    status.textContent = "Success: Top distinct prominent colors extracted.";
    
    finalPalette.forEach(rgb => {
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        createColorSwatch(hex);
    });
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.min(255, Math.max(0, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function createColorSwatch(hex) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    
    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.backgroundColor = hex;

    const code = document.createElement('div');
    code.className = 'color-code';
    code.innerText = hex.toUpperCase();

    swatch.onclick = () => {
        navigator.clipboard.writeText(hex.toUpperCase());
        const originalText = code.innerText;
        code.innerText = "COPIED!";
        setTimeout(() => code.innerText = originalText, 1000);
    };

    swatch.appendChild(box);
    swatch.appendChild(code);
    paletteDisplay.appendChild(swatch);
}
