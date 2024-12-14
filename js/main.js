const resumeData = {};
let isResizing = false;
const resizer = document.getElementById('resizer');
const formSection = document.getElementById('form-section');
const previewSection = document.getElementById('preview-section');

resizer.addEventListener('mousedown', startResizing);

function updatePreview() {
    resumeData.name = document.getElementById('name').value;
    resumeData.email = document.getElementById('email').value;
    resumeData.phone = document.getElementById('phone').value;
    resumeData.objective = document.getElementById('objective').value;
    resumeData.summary = document.getElementById('summary').value;

    document.getElementById('preview-name').textContent = resumeData.name || '';
    document.getElementById('preview-email').textContent = resumeData.email || '';
    document.getElementById('preview-phone').textContent = resumeData.phone || '';
    document.getElementById('preview-objective').textContent = resumeData.objective || '';
    document.getElementById('preview-summary').innerHTML = resumeData.summary || '';
}

function exportJSON() {
    let fileName = document.getElementById('name').value;
    fileName = fileName == undefined ? "" : fileName;
    if (fileName == "") {
        showNotification('Please enter the name');
        return;
    }
    fileName = fileName + "_";
    const jsonData = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + 'Resume.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Resume exported as JSON file.');
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                document.getElementById('name').value = data.name || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('objective').value = data.objective || '';
                document.getElementById('summary').value = data.summary || '';
                destroySummaryEditor();
                document.getElementById('summary_editor').innerHTML = data.summary || '';
                createSummaryEditor();
                updatePreview();
                showNotification('Resume loaded successfully.');
            } catch (err) {
                showNotification('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    }
}

async function htmlToPDF() {
    const element = document.getElementById('preview-container');
    const options = { 
        margin: 1,
        filename: resumeData.name ? `${resumeData.name}_Resume.pdf` : 'Resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }; 
    html2pdf().from(element).set(options).save();
}


function startResizing(event) {
    isResizing = true;
    document.addEventListener('mousemove', resizePanels);
    document.addEventListener('mouseup', stopResizing);
}

function resizePanels(event) {
    if (!isResizing) return;

    const containerWidth = document.querySelector('.resizable').offsetWidth;
    const offsetLeft = event.clientX;
    const formWidth = offsetLeft;
    const previewWidth = containerWidth - offsetLeft - resizer.offsetWidth;

    if (formWidth > 100 && previewWidth > 100) {
        formSection.style.flexBasis = `${formWidth}px`;
        previewSection.style.flexBasis = `${previewWidth}px`;
    }
}

function showNotification(message) {
    const notifier = document.getElementById('notifier');
    notifier.textContent = message;
    notifier.classList.add('show');
    setTimeout(() => {
        notifier.classList.remove('show');
    }, 3000); // Hide after 3 seconds
}


function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resizePanels);
    document.removeEventListener('mouseup', stopResizing);
}

function createSummaryEditor() {
    $('#summary_editor').summernote({
        callbacks : {
            onChange : function(contents, $editable){
                document.getElementById('summary').value = contents;
                updatePreview();
            }
        }
    });
}

function destroySummaryEditor() {
    $('#summary_editor').summernote('destroy');
}

$(document).ready(function() {
    createSummaryEditor();
});