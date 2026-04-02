const resumeData = {
    personal: { name: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "" },
    summary: "",
    experience: [],
    education: [],
    skills: "",
    projects: [],
    courses: [],
    certificates: []
};

// --- CORE UTILS ---

function updatePreview() {
    // Collect Personal Data (preserve photo)
    const currentPhoto = (resumeData && resumeData.personal) ? resumeData.personal.photo : "";
    resumeData.personal = {
        name: document.getElementById('name').value,
        jobTitle: document.getElementById('job-title').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        linkedin: document.getElementById('linkedin').value,
        github: document.getElementById('github').value,
        photo: currentPhoto
    };

    resumeData.summary = document.getElementById('summary').value;
    resumeData.skills = document.getElementById('skills').value;

    // Collect List Data
    resumeData.experience = collectExperienceData();
    resumeData.education = collectListData('education');
    resumeData.projects = collectListData('projects');
    resumeData.courses = collectListData('courses');
    resumeData.certificates = collectListData('certificates');

    const template = document.getElementById('template-select').value;
    renderResume(template);
}

function collectListData(type) {
    const list = document.getElementById(`${type}-list`);
    const items = [];
    if (!list) return items;

    const containers = list.querySelectorAll('.dynamic-list-item');
    containers.forEach(container => {
        const item = {};
        const inputs = container.querySelectorAll('input:not(.nested), textarea:not(.nested)');
        inputs.forEach(input => {
            const field = input.dataset.field;
            item[field] = input.value;
        });
        items.push(item);
    });
    return items;
}

function collectExperienceData() {
    const list = document.getElementById(`experience-list`);
    const items = [];
    if (!list) return items;

    const containers = list.querySelectorAll('.experience-item');
    containers.forEach(container => {
        const item = {
            company: container.querySelector('[data-field="company"]').value,
            position: container.querySelector('[data-field="position"]').value,
            duration: container.querySelector('[data-field="duration"]').value,
            projects: []
        };
        const projectInputs = container.querySelectorAll('.exp-project-input');
        projectInputs.forEach(proj => {
            if (proj.value) item.projects.push(proj.value);
        });
        items.push(item);
    });
    return items;
}

// --- DOM BUILDERS ---

function addItem(type) {
    const list = document.getElementById(`${type}-list`);
    const div = document.createElement('div');
    div.className = 'dynamic-list-item';
    
    if (type === 'experience') {
        div.className += ' experience-item';
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Company Name" data-field="company" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Position" data-field="position" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Duration (e.g., 2021 - Present)" data-field="duration" oninput="updatePreview()"></div>
            <div class="nested-projects" style="margin-left: 15px; border-left: 2px solid #ddd; padding-left: 10px;">
                <label style="font-size: 0.8rem;">Projects/Responsibilities</label>
                <div class="exp-project-list"></div>
                <button class="btn btn-secondary btn-sm" onclick="addExpProject(this)">+ Project</button>
            </div>
        `;
    } else if (type === 'education') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Institution" data-field="institution" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Degree / Course" data-field="degree" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Year" data-field="year" oninput="updatePreview()"></div>
        `;
    } else if (type === 'projects') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Project Title" data-field="title" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Link (Optional)" data-field="link" oninput="updatePreview()"></div>
            <div class="form-group"><textarea placeholder="Short description" data-field="description" oninput="updatePreview()"></textarea></div>
        `;
    } else if (type === 'courses') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Course Name" data-field="name" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Platform" data-field="platform" oninput="updatePreview()"></div>
        `;
    } else if (type === 'certificates') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Certificate Name" data-field="name" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Issuing Authority" data-field="issuer" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Date/ID" data-field="date" oninput="updatePreview()"></div>
        `;
    }

    list.appendChild(div);
    updatePreview();
}

function addExpProject(btn, value = "") {
    const list = btn.previousElementSibling;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '5px';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <input type="text" class="exp-project-input" placeholder="Project or Task" oninput="updatePreview()" value="${value}">
        <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); updatePreview();">×</button>
    `;
    list.appendChild(div);
    updatePreview();
}

function removeItem(btn) {
    btn.parentElement.remove();
    updatePreview();
}

// --- THEME & RENDERING ---

function toggleTheme() {
    const isDark = document.getElementById('theme-toggle').checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function uploadPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            resumeData.personal.photo = e.target.result;
            document.getElementById('remove-photo-btn').style.display = 'block';
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function removePhoto() {
    resumeData.personal.photo = "";
    document.getElementById('photo').value = "";
    document.getElementById('remove-photo-btn').style.display = 'none';
    updatePreview();
}

function renderResume(template) {
    const container = document.getElementById('preview-container');
    container.className = template;
    
    const p = resumeData.personal;
    let mainHTML = "";

    const photoHTML = p.photo ? `<div class="resume-photo"><img src="${p.photo}" alt="Photo"></div>` : '';

    const contactSection = `
        <div class="contact-info">
            ${p.email ? `<div><i data-lucide="mail"></i> ${p.email}</div>` : ''}
            ${p.phone ? `<div><i data-lucide="phone"></i> ${p.phone}</div>` : ''}
            ${p.location ? `<div><i data-lucide="map-pin"></i> ${p.location}</div>` : ''}
            ${p.linkedin ? `<div><i data-lucide="linkedin"></i> ${p.linkedin}</div>` : ''}
            ${p.github ? `<div><i data-lucide="github"></i> ${p.github}</div>` : ''}
        </div>
    `;

    if (template === 'template-creative') {
        mainHTML = `
            <div class="sidebar">
                ${photoHTML || '<div class="profile-pic" style="width:100px; height:100px; background:#ddd; border-radius:50%; margin: 0 auto 20px;"></div>'}
                <h2 style="color:white; text-align:center;">${p.name || 'Your Name'}</h2>
                <p style="text-align:center; opacity: 0.8; margin-bottom: 30px;">${p.jobTitle || ''}</p>
                <div class="section-h">Contact</div>
                ${contactSection}
                ${resumeData.skills ? `<div class="section-h">Skills</div><p style="font-size: 0.8rem; opacity: 0.9;">${resumeData.skills}</p>` : ''}
                ${renderList(resumeData.courses, 'Courses')}
                ${renderList(resumeData.certificates, 'Certificates')}
            </div>
            <div class="main-content">
                <div class="section-h">About Me</div>
                <div class="summary-content">${resumeData.summary || ''}</div>
                ${renderList(resumeData.experience, 'Experience')}
                ${renderList(resumeData.education, 'Education')}
                ${renderList(resumeData.projects, 'Projects')}
            </div>
        `;
    } else {
        mainHTML = `
            <div class="resume-header">
                ${photoHTML}
                <div class="header-text">
                    <h1>${p.name || 'Your Name'}</h1>
                    ${p.jobTitle ? `<h3 style="color:#2563eb">${p.jobTitle}</h3>` : ''}
                </div>
                ${contactSection}
            </div>
            <div class="resume-body">
                ${resumeData.summary ? `<div class="section-h">Professional Summary</div><div class="summary-content">${resumeData.summary}</div>` : ''}
                ${renderList(resumeData.experience, 'Experience')}
                ${renderList(resumeData.education, 'Education')}
                ${resumeData.skills ? `<div class="section-h">Technical Skills</div><p style="padding: 10px 0;">${resumeData.skills}</p>` : ''}
                ${renderList(resumeData.projects, 'Projects')}
                ${renderList(resumeData.courses, 'Web Courses')}
                ${renderList(resumeData.certificates, 'Certifications')}
            </div>
        `;
    }
    
    container.innerHTML = mainHTML;
    lucide.createIcons();
}

function renderList(items, title) {
    if (!items || items.length === 0) return "";
    
    let html = `<div class="section-h">${title}</div>`;
    items.forEach(item => {
        html += `<div class="list-item" style="margin-bottom: 15px;">`;
        if (title === 'Experience') {
            html += `
                <div style="display:flex; justify-content: space-between; font-weight: 700;">
                    <span>${item.position} - ${item.company}</span>
                    <span>${item.duration}</span>
                </div>
                <ul style="margin: 5px 0 0 20px; font-size: 0.9em; line-height: 1.4;">
                    ${item.projects ? item.projects.map(p => `<li>${p}</li>`).join('') : ''}
                </ul>
            `;
        } else if (title === 'Education') {
            html += `
                <div style="display:flex; justify-content: space-between;">
                    <strong>${item.institution}</strong>
                    <span>${item.year}</span>
                </div>
                <div style="font-size: 0.9em;">${item.degree}</div>
            `;
        } else if (title === 'Projects') {
            html += `
                <div><strong>${item.title}</strong> ${item.link ? `<small style="color:#2563eb">(${item.link})</small>` : ''}</div>
                <div style="font-size: 0.9em; opacity: 0.8; margin-top: 3px;">${item.description}</div>
            `;
        } else if (title === 'Courses' || title === 'Web Courses') {
            html += `<div><strong>${item.name}</strong> • ${item.platform}</div>`;
        } else if (title === 'Certificates' || title === 'Certifications') {
            html += `<div><strong>${item.name}</strong> • ${item.issuer} <small>(${item.date})</small></div>`;
        }
        html += `</div>`;
    });
    return html;
}

// --- IO OPS ---

function exportJSON() {
    const fileName = (resumeData.personal.name || "Resume").replace(/\s+/g, "_");
    const jsonData = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '_Resume.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Success: Resume data exported.');
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                // Personal
                document.getElementById('name').value = data.personal.name || '';
                document.getElementById('job-title').value = data.personal.jobTitle || '';
                document.getElementById('email').value = data.personal.email || '';
                document.getElementById('phone').value = data.personal.phone || '';
                document.getElementById('location').value = data.personal.location || '';
                document.getElementById('linkedin').value = data.personal.linkedin || '';
                document.getElementById('github').value = data.personal.github || '';
                document.getElementById('skills').value = data.skills || '';
                
                resumeData.personal.photo = data.personal.photo || '';
                if (resumeData.personal.photo) {
                    document.getElementById('remove-photo-btn').style.display = 'block';
                }
                
                $('#summary_editor').summernote('code', data.summary || '');

                // Dynamic Lists
                restoreSimpleList('education', data.education);
                restoreSimpleList('projects', data.projects);
                restoreSimpleList('courses', data.courses);
                restoreSimpleList('certificates', data.certificates);
                
                // Experience (Special handling for nested projects)
                restoreExperience(data.experience);

                updatePreview();
                showNotification('Resume data loaded successfully.');
            } catch (err) {
                console.error(err);
                showNotification('Error: Failed to parse JSON.');
            }
        };
        reader.readAsText(file);
    }
}

function restoreSimpleList(type, items) {
    const list = document.getElementById(`${type}-list`);
    list.innerHTML = "";
    if (!items) return;
    items.forEach(item => {
        addItem(type);
        const lastItem = list.lastElementChild;
        const inputs = lastItem.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            const field = input.dataset.field;
            if (item[field]) input.value = item[field];
        });
    });
}

function restoreExperience(items) {
    const list = document.getElementById(`experience-list`);
    list.innerHTML = "";
    if (!items) return;
    items.forEach(item => {
        addItem('experience');
        const lastItem = list.lastElementChild;
        lastItem.querySelector('[data-field="company"]').value = item.company || '';
        lastItem.querySelector('[data-field="position"]').value = item.position || '';
        lastItem.querySelector('[data-field="duration"]').value = item.duration || '';
        
        const projBtn = lastItem.querySelector('button[onclick="addExpProject(this)"]');
        if (item.projects) {
            item.projects.forEach(p => addExpProject(projBtn, p));
        }
    });
}

function showNotification(message) {
    const notifier = document.getElementById('notifier');
    notifier.textContent = message;
    notifier.classList.add('show');
    setTimeout(() => { notifier.classList.remove('show'); }, 3000);
}

async function htmlToPDF() {
    const element = document.getElementById('preview-container');
    const options = { 
        margin: 5,
        filename: (resumeData.personal.name || 'Resume') + '_Resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }; 
    html2pdf().from(element).set(options).save();
}

// --- INIT ---

$(document).ready(function() {
    $('#summary_editor').summernote({
        placeholder: 'Professional background, key achievements...',
        tabsize: 2, height: 120,
        toolbar: [['style', ['bold', 'italic', 'underline', 'clear']], ['para', ['ul', 'ol', 'paragraph']]],
        callbacks : { onChange : (c) => { document.getElementById('summary').value = c; updatePreview(); } }
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.getElementById('theme-toggle').checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.getElementById('theme-toggle').checked = false;
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    updatePreview();
});