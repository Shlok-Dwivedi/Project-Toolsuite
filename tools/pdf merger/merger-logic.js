// Ensure strict mode for better code quality
'use strict';

// Get references to DOM elements
const fileInput = document.getElementById('pdfFileInput');
const mergeButton = document.getElementById('mergeButton');
const statusMessage = document.getElementById('statusMessage');
const fileListDiv = document.getElementById('fileList');

// Initialize the array to hold the PDF File objects
let selectedFiles = [];

/**
 * Updates the file list display and controls based on current selection.
 */
function updateUI() {
    selectedFiles = Array.from(fileInput.files);
    
    // Clear previous list
    fileListDiv.innerHTML = ''; 

    if (selectedFiles.length === 0) {
        statusMessage.textContent = 'Awaiting file selection...';
        mergeButton.disabled = true;
    } else {
        // Build the file list display
        const ul = document.createElement('ul');
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            ul.appendChild(li);
        });
        fileListDiv.appendChild(ul);

        // Update status and button
        if (selectedFiles.length >= 2) {
            statusMessage.textContent = `Ready to merge ${selectedFiles.length} files.`;
            mergeButton.disabled = false;
        } else {
            statusMessage.textContent = 'Please select at least two PDF files.';
            mergeButton.disabled = true;
        }
    }
}

/**
 * Main function to merge the PDFs using the pdf-lib library.
 */
async function mergeAndDownload() {
    statusMessage.textContent = 'Merging PDFs... Please wait, this may take a moment.';
    mergeButton.disabled = true;

    try {
        // Create a new PDF document (the output container)
        const mergedPdf = await PDFLib.PDFDocument.create();

        // Process each selected file
        for (const file of selectedFiles) {
            // Read the file as an ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Load the PDF from the ArrayBuffer
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // Copy all pages from the source PDF into the new merged PDF
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        // Serialize the merged PDF to a Uint8Array
        const pdfBytes = await mergedPdf.save();

        // --- Create a link and trigger the download ---
        
        // Create a Blob from the bytes
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Create a temporary URL for the Blob
        const downloadUrl = URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'Toolsuite_Merged_PDF.pdf'; // Suggested file name
        
        // Programmatically click the link to start the download
        document.body.appendChild(a);
        a.click();
        
        // Clean up the temporary elements and URL
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        statusMessage.textContent = `Success! Merged ${selectedFiles.length} files and started download.`;

    } catch (error) {
        console.error('An error occurred during merging:', error);
        statusMessage.textContent = `Error: Could not merge files. Check console for details.`;
    } finally {
        // Re-enable the button (in case the user wants to try again)
        mergeButton.disabled = false;
    }
}


// --- Event Listeners ---

// Update the UI whenever the file input changes
fileInput.addEventListener('change', updateUI);

// Attach the main merge function to the button click
mergeButton.addEventListener('click', mergeAndDownload);

// Initial UI setup
updateUI();
