// --- STATE ---
const resumeData = {
    personal: { name: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
    summary: "",
    experience: [],
    education: [],
    skills: "",
    projects: [],
    courses: [],
    certificates: [],
    languages: [],
    volunteer: [],
    references: [],
    refUponRequest: false
};

const settings = {
    template: "template-classic",
    fontSize: 12,
    accentColor: "#2563eb",
    margins: "20mm",
    paper: "a4",
    pdfQuality: 3
};

// Undo/Redo stacks
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 20;
let isRestoring = false;

// Template descriptions
const templateDescriptions = {
    "template-classic": "A timeless, serif-based layout ideal for traditional industries like law, finance, and academia.",
    "template-modern": "A bold, modern design with a colored header banner — great for tech, marketing, and creative roles.",
    "template-creative": "A striking two-column layout with a dark sidebar. Perfect for designers, creatives, and portfolio-driven roles.",
    "template-minimalist": "A clean, monospace-driven design for developers and engineers who prefer simplicity and code-like aesthetics.",
    "template-executive": "An elegant, serif-based layout for senior professionals, C-suite executives, and leadership roles.",
    "template-ats-chronological": "⭐ ATS-Optimized. Single-column, system fonts, no icons/images. Lists experience newest-first. The #1 recruiter-preferred format.",
    "template-ats-functional": "⭐ ATS-Optimized. Skills-first layout that emphasizes capabilities over chronology. Ideal for career changers or those with employment gaps.",
    "template-ats-hybrid": "⭐ ATS-Optimized. Combines a prominent skills section with chronological experience. Best for experienced professionals."
};

// --- CORE UTILS ---

function updatePreview() {
    // Collect Personal Data (preserve photo)
    const currentPhoto = (resumeData && resumeData.personal) ? resumeData.personal.photo : "";
    const nameVal = document.getElementById('name') ? document.getElementById('name').value : "";
    const jobTitleVal = document.getElementById('job-title') ? document.getElementById('job-title').value : "";
    const emailVal = document.getElementById('email') ? document.getElementById('email').value : "";
    const phoneVal = document.getElementById('phone') ? document.getElementById('phone').value : "";
    const locationVal = document.getElementById('location') ? document.getElementById('location').value : "";
    const linkedinVal = document.getElementById('linkedin') ? document.getElementById('linkedin').value : "";
    const githubVal = document.getElementById('github') ? document.getElementById('github').value : "";
    const websiteVal = document.getElementById('website') ? document.getElementById('website').value : "";

    resumeData.personal = {
        name: nameVal,
        jobTitle: jobTitleVal,
        email: emailVal,
        phone: phoneVal,
        location: locationVal,
        linkedin: linkedinVal,
        github: githubVal,
        website: websiteVal,
        photo: currentPhoto
    };

    const summaryVal = document.getElementById('summary') ? document.getElementById('summary').value : "";
    const skillsVal = document.getElementById('skills') ? document.getElementById('skills').value : "";
    const refCheck = document.getElementById('ref-upon-request') ? document.getElementById('ref-upon-request').checked : false;

    resumeData.summary = summaryVal;
    resumeData.skills = skillsVal;
    resumeData.refUponRequest = refCheck;

    // Collect List Data
    resumeData.experience = collectExperienceData();
    resumeData.education = collectListData('education');
    resumeData.projects = collectListData('projects');
    resumeData.courses = collectListData('courses');
    resumeData.certificates = collectListData('certificates');
    resumeData.languages = collectListData('languages');
    resumeData.volunteer = collectListData('volunteer');
    resumeData.references = collectListData('references');

    // Update badges
    updateBadges();

    // Update character counter
    updateCharCounter();

    // Update template info
    const templateSelect = document.getElementById('template-select');
    const template = templateSelect ? templateSelect.value : "template-classic";
    settings.template = template;
    updateTemplateInfo();

    renderResume(template);

    // Push undo state
    if (!isRestoring) {
        pushUndoState();
    }

    // Auto-save
    autoSave();
}

function collectListData(type) {
    const list = document.getElementById(`${type}-list`);
    const items = [];
    if (!list) return items;

    const containers = list.querySelectorAll('.dynamic-list-item');
    containers.forEach(container => {
        const item = {};
        const inputs = container.querySelectorAll('input:not(.nested), textarea:not(.nested), select.item-select');
        inputs.forEach(input => {
            const field = input.dataset.field;
            if (field) item[field] = input.value;
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
        const compEl = container.querySelector('[data-field="company"]');
        const posEl = container.querySelector('[data-field="position"]');
        const durEl = container.querySelector('[data-field="duration"]');
        const item = {
            company: compEl ? compEl.value : "",
            position: posEl ? posEl.value : "",
            duration: durEl ? durEl.value : "",
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
    if (!list) return;
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
    } else if (type === 'languages') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Language (e.g., English)" data-field="language" oninput="updatePreview()"></div>
            <div class="form-group">
                <select class="item-select" data-field="proficiency" onchange="updatePreview()">
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Intermediate" selected>Intermediate</option>
                    <option value="Basic">Basic</option>
                </select>
            </div>
        `;
    } else if (type === 'volunteer') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Organization" data-field="organization" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Role" data-field="role" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Duration" data-field="duration" oninput="updatePreview()"></div>
            <div class="form-group"><textarea placeholder="Description (Optional)" data-field="description" oninput="updatePreview()"></textarea></div>
        `;
    } else if (type === 'references') {
        div.innerHTML = `
            <button class="btn btn-danger btn-sm remove-btn" onclick="removeItem(this)">Remove</button>
            <div class="form-group"><input type="text" placeholder="Full Name" data-field="refName" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Title / Position" data-field="refTitle" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Company" data-field="refCompany" oninput="updatePreview()"></div>
            <div class="form-group"><input type="text" placeholder="Contact (Email or Phone)" data-field="refContact" oninput="updatePreview()"></div>
        `;
    }

    list.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updatePreview();
}

function addExpProject(btn, value = "") {
    const list = btn.previousElementSibling;
    if (!list) return;
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
    if (btn && btn.parentElement) {
        btn.parentElement.remove();
        updatePreview();
    }
}

// --- SETTINGS ---

function applySettings() {
    const fontSizeEl = document.getElementById('setting-font-size');
    const accentColorEl = document.getElementById('setting-accent-color');
    const marginsEl = document.getElementById('setting-margins');
    const paperEl = document.getElementById('setting-paper');
    const pdfQualityEl = document.getElementById('setting-pdf-quality');

    if (fontSizeEl) settings.fontSize = fontSizeEl.value;
    if (accentColorEl) settings.accentColor = accentColorEl.value;
    if (marginsEl) settings.margins = marginsEl.value;
    if (paperEl) settings.paper = paperEl.value;
    if (pdfQualityEl) settings.pdfQuality = parseInt(pdfQualityEl.value);

    // Update display value
    const fontSizeVal = document.getElementById('font-size-val');
    if (fontSizeVal) fontSizeVal.textContent = settings.fontSize + 'pt';

    // Apply CSS custom properties
    const container = document.getElementById('preview-container');
    document.documentElement.style.setProperty('--resume-font-size', settings.fontSize + 'pt');
    document.documentElement.style.setProperty('--resume-accent', settings.accentColor);
    document.documentElement.style.setProperty('--resume-margin', settings.margins);

    // Paper size
    if (container) {
        if (settings.paper === 'letter') {
            container.setAttribute('data-paper', 'letter');
        } else {
            container.removeAttribute('data-paper');
        }
    }

    // Save settings
    localStorage.setItem('resumeSettings', JSON.stringify(settings));

    updatePreview();
}

function updateTemplateInfo() {
    const desc = templateDescriptions[settings.template] || "";
    const infoEl = document.getElementById('template-info');
    if (infoEl) infoEl.textContent = desc;
}

// --- SECTION COLLAPSE/EXPAND ---

function toggleSection(titleEl) {
    const body = titleEl.nextElementSibling;
    const indicator = titleEl.querySelector('.collapse-indicator');
    if (body && body.classList.contains('section-body')) {
        body.classList.toggle('collapsed');
        if (indicator) indicator.classList.toggle('collapsed');
    }
}

// --- BADGES ---

function updateBadges() {
    const sections = ['experience', 'education', 'projects', 'courses', 'certificates', 'languages', 'volunteer', 'references'];
    sections.forEach(s => {
        const badge = document.getElementById(`${s}-badge`);
        if (badge) {
            const count = resumeData[s] ? resumeData[s].length : 0;
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

// --- CHARACTER COUNTER ---

function updateCharCounter() {
    const summary = resumeData.summary || "";
    const plainText = summary.replace(/<[^>]*>/g, '').trim();
    const count = plainText.length;
    const counter = document.getElementById('summary-counter');
    if (!counter) return;

    counter.textContent = `${count} characters (ideal: 300–500)`;
    counter.className = 'char-counter';
    if (count >= 300 && count <= 500) {
        counter.classList.add('good');
    } else if (count > 500) {
        counter.classList.add('over');
    } else if (count > 0) {
        counter.classList.add('warning');
    }
}

// --- THEME & RENDERING ---

function toggleTheme() {
    const toggle = document.getElementById('theme-toggle');
    const isDark = toggle ? toggle.checked : true;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function uploadPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            resumeData.personal.photo = e.target.result;
            const removeBtn = document.getElementById('remove-photo-btn');
            if (removeBtn) removeBtn.style.display = 'block';
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function removePhoto() {
    resumeData.personal.photo = "";
    const photoEl = document.getElementById('photo');
    const removeBtn = document.getElementById('remove-photo-btn');
    if (photoEl) photoEl.value = "";
    if (removeBtn) removeBtn.style.display = 'none';
    updatePreview();
}

function renderResume(template) {
    const container = document.getElementById('preview-container');
    if (!container) return;

    container.className = template;
    
    // Reapply paper size attribute
    if (settings.paper === 'letter') {
        container.setAttribute('data-paper', 'letter');
    } else {
        container.removeAttribute('data-paper');
    }
    
    const p = resumeData.personal;
    let mainHTML = "";

    const isATS = template.startsWith('template-ats');

    const photoHTML = (!isATS && p.photo) ? `<div class="resume-photo"><img src="${p.photo}" alt="Photo"></div>` : '';

    // Contact section — ATS templates use plain text separators; others use icons
    let contactSection;
    if (isATS) {
        const contactParts = [];
        if (p.email) contactParts.push(p.email);
        if (p.phone) contactParts.push(p.phone);
        if (p.location) contactParts.push(p.location);
        if (p.linkedin) contactParts.push(p.linkedin);
        if (p.github) contactParts.push(p.github);
        if (p.website) contactParts.push(p.website);
        contactSection = `<div class="contact-info">${contactParts.map((c, i) => `<div>${c}</div>${i < contactParts.length - 1 ? '<span class="sep">|</span>' : ''}`).join('')}</div>`;
    } else {
        contactSection = `
            <div class="contact-info">
                ${p.email ? `<div><i data-lucide="mail"></i> ${p.email}</div>` : ''}
                ${p.phone ? `<div><i data-lucide="phone"></i> ${p.phone}</div>` : ''}
                ${p.location ? `<div><i data-lucide="map-pin"></i> ${p.location}</div>` : ''}
                ${p.linkedin ? `<div><i data-lucide="linkedin"></i> ${p.linkedin}</div>` : ''}
                ${p.github ? `<div><i data-lucide="github"></i> ${p.github}</div>` : ''}
                ${p.website ? `<div><i data-lucide="globe"></i> ${p.website}</div>` : ''}
            </div>
        `;
    }

    // --- Render by template ---
    if (template === 'template-creative') {
        mainHTML = `
            <div class="sidebar">
                ${photoHTML || '<div class="profile-pic" style="width:100px; height:100px; background:#ddd; border-radius:50%; margin: 0 auto 20px;"></div>'}
                <h2 style="color:white; text-align:center;">${p.name || 'Your Name'}</h2>
                <p style="text-align:center; opacity: 0.8; margin-bottom: 30px;">${p.jobTitle || ''}</p>
                <div class="section-h">Contact</div>
                ${contactSection}
                ${resumeData.skills ? `<div class="section-h">Skills</div><p style="font-size: 0.8rem; opacity: 0.9;">${resumeData.skills}</p>` : ''}
                ${renderList(resumeData.languages, 'Languages')}
                ${renderList(resumeData.courses, 'Courses')}
                ${renderList(resumeData.certificates, 'Certificates')}
            </div>
            <div class="main-content">
                <div class="section-h">About Me</div>
                <div class="summary-content">${resumeData.summary || ''}</div>
                ${renderList(resumeData.experience, 'Experience')}
                ${renderList(resumeData.education, 'Education')}
                ${renderList(resumeData.projects, 'Projects')}
                ${renderList(resumeData.volunteer, 'Volunteer Experience')}
                ${renderReferences()}
            </div>
        `;
    } else if (template === 'template-ats-functional') {
        mainHTML = `
            <div class="resume-header">
                <div class="header-text">
                    <h1>${p.name || 'Your Name'}</h1>
                    ${p.jobTitle ? `<h3>${p.jobTitle}</h3>` : ''}
                </div>
                ${contactSection}
            </div>
            <div class="resume-body">
                ${resumeData.summary ? `<div class="section-h">Professional Summary</div><div class="summary-content">${resumeData.summary}</div>` : ''}
                ${resumeData.skills ? `<div class="section-h">Core Competencies</div><div class="skills-grid">${resumeData.skills.split(',').map(s => `<span class="skill-chip">${s.trim()}</span>`).join('')}</div>` : ''}
                ${renderList(resumeData.projects, 'Key Projects')}
                ${renderList(resumeData.experience, 'Experience')}
                ${renderList(resumeData.education, 'Education')}
                ${renderList(resumeData.certificates, 'Certifications')}
                ${renderList(resumeData.languages, 'Languages')}
                ${renderList(resumeData.volunteer, 'Volunteer Experience')}
                ${renderList(resumeData.courses, 'Professional Development')}
                ${renderReferences()}
            </div>
        `;
    } else if (template === 'template-ats-hybrid') {
        mainHTML = `
            <div class="resume-header">
                <div class="header-text">
                    <h1>${p.name || 'Your Name'}</h1>
                    ${p.jobTitle ? `<h3>${p.jobTitle}</h3>` : ''}
                </div>
                ${contactSection}
            </div>
            <div class="resume-body">
                ${resumeData.summary ? `<div class="section-h">Professional Summary</div><div class="summary-content">${resumeData.summary}</div>` : ''}
                ${resumeData.skills ? `<div class="section-h">Technical Skills</div><div class="skills-grid">${resumeData.skills.split(',').map(s => `<span class="skill-chip">${s.trim()}</span>`).join('')}</div>` : ''}
                ${renderList(resumeData.experience, 'Professional Experience')}
                ${renderList(resumeData.projects, 'Projects')}
                ${renderList(resumeData.education, 'Education')}
                ${renderList(resumeData.certificates, 'Certifications')}
                ${renderList(resumeData.languages, 'Languages')}
                ${renderList(resumeData.volunteer, 'Volunteer Experience')}
                ${renderList(resumeData.courses, 'Courses')}
                ${renderReferences()}
            </div>
        `;
    } else {
        mainHTML = `
            <div class="resume-header">
                ${photoHTML}
                <div class="header-text">
                    <h1>${p.name || 'Your Name'}</h1>
                    ${p.jobTitle ? `<h3 style="color:${isATS ? '#333' : settings.accentColor}">${p.jobTitle}</h3>` : ''}
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
                ${renderList(resumeData.languages, 'Languages')}
                ${renderList(resumeData.volunteer, 'Volunteer Experience')}
                ${renderReferences()}
            </div>
        `;
    }
    
    container.innerHTML = mainHTML;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderList(items, title) {
    if (!items || items.length === 0) return "";
    
    let html = `<div class="section-h">${title}</div>`;
    items.forEach(item => {
        html += `<div class="list-item" style="margin-bottom: 15px;">`;
        if (title === 'Experience' || title === 'Professional Experience') {
            html += `
                <div style="display:flex; justify-content: space-between; font-weight: 700; flex-wrap: wrap;">
                    <span>${item.position} - ${item.company}</span>
                    <span>${item.duration}</span>
                </div>
                <ul style="margin: 5px 0 0 20px; font-size: 0.9em; line-height: 1.4;">
                    ${item.projects ? item.projects.map(p => `<li>${p}</li>`).join('') : ''}
                </ul>
            `;
        } else if (title === 'Education') {
            html += `
                <div style="display:flex; justify-content: space-between; flex-wrap: wrap;">
                    <strong>${item.institution}</strong>
                    <span>${item.year}</span>
                </div>
                <div style="font-size: 0.9em;">${item.degree}</div>
            `;
        } else if (title === 'Projects' || title === 'Key Projects') {
            html += `
                <div><strong>${item.title}</strong> ${item.link ? `<small style="color:${settings.accentColor}">(${item.link})</small>` : ''}</div>
                <div style="font-size: 0.9em; opacity: 0.8; margin-top: 3px;">${item.description}</div>
            `;
        } else if (title === 'Courses' || title === 'Web Courses' || title === 'Professional Development') {
            html += `<div><strong>${item.name}</strong> • ${item.platform}</div>`;
        } else if (title === 'Certificates' || title === 'Certifications') {
            html += `<div><strong>${item.name}</strong> • ${item.issuer} <small>(${item.date})</small></div>`;
        } else if (title === 'Languages') {
            html += `<div><strong>${item.language}</strong> — ${item.proficiency}</div>`;
        } else if (title === 'Volunteer Experience') {
            html += `
                <div style="display:flex; justify-content: space-between; font-weight: 700; flex-wrap: wrap;">
                    <span>${item.role} - ${item.organization}</span>
                    <span>${item.duration}</span>
                </div>
                ${item.description ? `<div style="font-size: 0.9em; opacity: 0.8; margin-top: 3px;">${item.description}</div>` : ''}
            `;
        }
        html += `</div>`;
    });
    return html;
}

function renderReferences() {
    if (resumeData.refUponRequest) {
        return `<div class="section-h">References</div><p style="padding: 10px 0; font-style: italic;">Available upon request.</p>`;
    }
    if (!resumeData.references || resumeData.references.length === 0) return "";

    let html = `<div class="section-h">References</div>`;
    resumeData.references.forEach(ref => {
        html += `<div class="list-item" style="margin-bottom: 15px;">
            <div><strong>${ref.refName}</strong></div>
            <div style="font-size: 0.9em;">${ref.refTitle}${ref.refCompany ? `, ${ref.refCompany}` : ''}</div>
            ${ref.refContact ? `<div style="font-size: 0.85em; opacity: 0.7;">${ref.refContact}</div>` : ''}
        </div>`;
    });
    return html;
}

// --- SAMPLE DATA LOAD ---

function loadSampleData() {
    isRestoring = true;

    if (document.getElementById('name')) document.getElementById('name').value = "John Doe";
    if (document.getElementById('job-title')) document.getElementById('job-title').value = "Senior Software Engineer";
    if (document.getElementById('email')) document.getElementById('email').value = "john.doe@example.com";
    if (document.getElementById('phone')) document.getElementById('phone').value = "+1 (555) 019-2834";
    if (document.getElementById('location')) document.getElementById('location').value = "New York, USA";
    if (document.getElementById('linkedin')) document.getElementById('linkedin').value = "https://linkedin.com/in/johndoe";
    if (document.getElementById('github')) document.getElementById('github').value = "https://github.com/johndoe";
    if (document.getElementById('website')) document.getElementById('website').value = "https://johndoe.dev";
    if (document.getElementById('skills')) document.getElementById('skills').value = "JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS, REST APIs";

    $('#summary_editor').summernote('code', 'Experienced Senior Software Engineer with over 6 years of expertise in full-stack web development, cloud architecture, and technical leadership. Passionate about building high-performance web applications and mentoring engineering teams.');

    restoreExperience([
        {
            company: "Tech Solutions Inc.",
            position: "Senior Software Engineer",
            duration: "2021 - Present",
            projects: [
                "Led architectural migration to React & TypeScript, improving app performance by 35%.",
                "Mentored a team of 4 junior developers and established CI/CD pipeline automation."
            ]
        },
        {
            company: "Digital Dynamics",
            position: "Software Developer",
            duration: "2018 - 2021",
            projects: [
                "Designed and implemented RESTful microservices handling 2M+ daily requests.",
                "Automated multi-region cloud deployments using Docker and AWS."
            ]
        }
    ]);

    restoreSimpleList('education', [
        { institution: "Columbia University", degree: "B.S. in Computer Science", year: "2014 - 2018" }
    ]);

    restoreSimpleList('projects', [
        { title: "AI Resume Generator", link: "github.com/johndoe/resume-builder", description: "Open-source web tool built for crafting ATS-optimized PDF resumes." }
    ]);

    restoreSimpleList('certificates', [
        { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2023" }
    ]);

    restoreSimpleList('languages', [
        { language: "English", proficiency: "Native" },
        { language: "Spanish", proficiency: "Fluent" }
    ]);

    isRestoring = false;
    updatePreview();
}

// --- AUTO-SAVE ---

function autoSave() {
    try {
        const saveData = {
            resumeData: JSON.parse(JSON.stringify(resumeData)),
            settings: JSON.parse(JSON.stringify(settings))
        };
        localStorage.setItem('resumeAutoSave', JSON.stringify(saveData));
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

function autoRestore() {
    try {
        const saved = localStorage.getItem('resumeAutoSave');
        if (!saved) return false;

        const data = JSON.parse(saved);
        if (!data.resumeData || !data.resumeData.personal) return false;

        isRestoring = true;

        // Restore personal info
        const p = data.resumeData.personal;
        if (document.getElementById('name')) document.getElementById('name').value = p.name || '';
        if (document.getElementById('job-title')) document.getElementById('job-title').value = p.jobTitle || '';
        if (document.getElementById('email')) document.getElementById('email').value = p.email || '';
        if (document.getElementById('phone')) document.getElementById('phone').value = p.phone || '';
        if (document.getElementById('location')) document.getElementById('location').value = p.location || '';
        if (document.getElementById('linkedin')) document.getElementById('linkedin').value = p.linkedin || '';
        if (document.getElementById('github')) document.getElementById('github').value = p.github || '';
        if (document.getElementById('website')) document.getElementById('website').value = p.website || '';
        if (document.getElementById('skills')) document.getElementById('skills').value = data.resumeData.skills || '';

        resumeData.personal.photo = p.photo || '';
        const removeBtn = document.getElementById('remove-photo-btn');
        if (removeBtn) removeBtn.style.display = resumeData.personal.photo ? 'block' : 'none';

        // Restore summary
        $('#summary_editor').summernote('code', data.resumeData.summary || '');

        // Restore references toggle
        const refCheck = document.getElementById('ref-upon-request');
        if (refCheck) refCheck.checked = data.resumeData.refUponRequest || false;

        // Restore dynamic lists
        restoreSimpleList('education', data.resumeData.education);
        restoreSimpleList('projects', data.resumeData.projects);
        restoreSimpleList('courses', data.resumeData.courses);
        restoreSimpleList('certificates', data.resumeData.certificates);
        restoreSimpleList('languages', data.resumeData.languages);
        restoreSimpleList('volunteer', data.resumeData.volunteer);
        restoreSimpleList('references', data.resumeData.references);
        restoreExperience(data.resumeData.experience);

        // Restore settings
        if (data.settings) {
            if (document.getElementById('template-select')) document.getElementById('template-select').value = data.settings.template || 'template-classic';
            if (document.getElementById('setting-font-size')) document.getElementById('setting-font-size').value = data.settings.fontSize || 12;
            if (document.getElementById('setting-accent-color')) document.getElementById('setting-accent-color').value = data.settings.accentColor || '#2563eb';
            if (document.getElementById('setting-margins')) document.getElementById('setting-margins').value = data.settings.margins || '20mm';
            if (document.getElementById('setting-paper')) document.getElementById('setting-paper').value = data.settings.paper || 'a4';
            if (document.getElementById('setting-pdf-quality')) document.getElementById('setting-pdf-quality').value = data.settings.pdfQuality || 3;
            if (document.getElementById('font-size-val')) document.getElementById('font-size-val').textContent = (data.settings.fontSize || 12) + 'pt';

            Object.assign(settings, data.settings);

            document.documentElement.style.setProperty('--resume-font-size', settings.fontSize + 'pt');
            document.documentElement.style.setProperty('--resume-accent', settings.accentColor);
            document.documentElement.style.setProperty('--resume-margin', settings.margins);
        }

        isRestoring = false;
        updatePreview();
        return true;
    } catch (e) {
        console.warn('Auto-restore failed:', e);
        isRestoring = false;
        return false;
    }
}

// --- UNDO / REDO ---

function pushUndoState() {
    const state = JSON.stringify(resumeData);

    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === state) return;

    undoStack.push(state);
    if (undoStack.length > MAX_UNDO) undoStack.shift();

    redoStack.length = 0;
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length <= 1) return;

    redoStack.push(undoStack.pop());

    const prevState = undoStack[undoStack.length - 1];
    restoreFromState(JSON.parse(prevState));
    updateUndoRedoButtons();
    showNotification('Undo applied.');
}

function redo() {
    if (redoStack.length === 0) return;

    const nextState = redoStack.pop();
    undoStack.push(nextState);

    restoreFromState(JSON.parse(nextState));
    updateUndoRedoButtons();
    showNotification('Redo applied.');
}

function restoreFromState(data) {
    isRestoring = true;

    if (document.getElementById('name')) document.getElementById('name').value = data.personal.name || '';
    if (document.getElementById('job-title')) document.getElementById('job-title').value = data.personal.jobTitle || '';
    if (document.getElementById('email')) document.getElementById('email').value = data.personal.email || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = data.personal.phone || '';
    if (document.getElementById('location')) document.getElementById('location').value = data.personal.location || '';
    if (document.getElementById('linkedin')) document.getElementById('linkedin').value = data.personal.linkedin || '';
    if (document.getElementById('github')) document.getElementById('github').value = data.personal.github || '';
    if (document.getElementById('website')) document.getElementById('website').value = data.personal.website || '';
    if (document.getElementById('skills')) document.getElementById('skills').value = data.skills || '';
    if (document.getElementById('ref-upon-request')) document.getElementById('ref-upon-request').checked = data.refUponRequest || false;

    resumeData.personal.photo = data.personal.photo || '';
    const removeBtn = document.getElementById('remove-photo-btn');
    if (removeBtn) removeBtn.style.display = resumeData.personal.photo ? 'block' : 'none';

    $('#summary_editor').summernote('code', data.summary || '');

    restoreSimpleList('education', data.education);
    restoreSimpleList('projects', data.projects);
    restoreSimpleList('courses', data.courses);
    restoreSimpleList('certificates', data.certificates);
    restoreSimpleList('languages', data.languages);
    restoreSimpleList('volunteer', data.volunteer);
    restoreSimpleList('references', data.references);
    restoreExperience(data.experience);

    isRestoring = false;
    updatePreview();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// --- IO OPS ---

function exportJSON() {
    const fileName = (resumeData.personal.name || "Resume").replace(/\s+/g, "_");
    const exportData = {
        resumeData: resumeData,
        settings: settings
    };
    const jsonData = JSON.stringify(exportData, null, 2);
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
                let rawData = JSON.parse(e.target.result);

                let data, importedSettings;
                if (rawData.resumeData) {
                    data = rawData.resumeData;
                    importedSettings = rawData.settings;
                } else {
                    data = rawData;
                }

                isRestoring = true;

                if (document.getElementById('name')) document.getElementById('name').value = data.personal.name || '';
                if (document.getElementById('job-title')) document.getElementById('job-title').value = data.personal.jobTitle || '';
                if (document.getElementById('email')) document.getElementById('email').value = data.personal.email || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = data.personal.phone || '';
                if (document.getElementById('location')) document.getElementById('location').value = data.personal.location || '';
                if (document.getElementById('linkedin')) document.getElementById('linkedin').value = data.personal.linkedin || '';
                if (document.getElementById('github')) document.getElementById('github').value = data.personal.github || '';
                if (document.getElementById('website')) document.getElementById('website').value = data.personal.website || '';
                if (document.getElementById('skills')) document.getElementById('skills').value = data.skills || '';
                if (document.getElementById('ref-upon-request')) document.getElementById('ref-upon-request').checked = data.refUponRequest || false;
                
                resumeData.personal.photo = data.personal.photo || '';
                const removeBtn = document.getElementById('remove-photo-btn');
                if (removeBtn) removeBtn.style.display = resumeData.personal.photo ? 'block' : 'none';
                
                $('#summary_editor').summernote('code', data.summary || '');

                restoreSimpleList('education', data.education);
                restoreSimpleList('projects', data.projects);
                restoreSimpleList('courses', data.courses);
                restoreSimpleList('certificates', data.certificates);
                restoreSimpleList('languages', data.languages);
                restoreSimpleList('volunteer', data.volunteer);
                restoreSimpleList('references', data.references);
                restoreExperience(data.experience);

                if (importedSettings) {
                    if (document.getElementById('template-select')) document.getElementById('template-select').value = importedSettings.template || 'template-classic';
                    if (document.getElementById('setting-font-size')) document.getElementById('setting-font-size').value = importedSettings.fontSize || 12;
                    if (document.getElementById('setting-accent-color')) document.getElementById('setting-accent-color').value = importedSettings.accentColor || '#2563eb';
                    if (document.getElementById('setting-margins')) document.getElementById('setting-margins').value = importedSettings.margins || '20mm';
                    if (document.getElementById('setting-paper')) document.getElementById('setting-paper').value = importedSettings.paper || 'a4';
                    if (document.getElementById('setting-pdf-quality')) document.getElementById('setting-pdf-quality').value = importedSettings.pdfQuality || 3;
                    if (document.getElementById('font-size-val')) document.getElementById('font-size-val').textContent = (importedSettings.fontSize || 12) + 'pt';

                    Object.assign(settings, importedSettings);

                    document.documentElement.style.setProperty('--resume-font-size', settings.fontSize + 'pt');
                    document.documentElement.style.setProperty('--resume-accent', settings.accentColor);
                    document.documentElement.style.setProperty('--resume-margin', settings.margins);
                }

                isRestoring = false;
                updatePreview();
                showNotification('Resume data loaded successfully.');
            } catch (err) {
                console.error(err);
                isRestoring = false;
                showNotification('Error: Failed to parse JSON.');
            }
        };
        reader.readAsText(file);
    }
}

function restoreSimpleList(type, items) {
    const list = document.getElementById(`${type}-list`);
    if (!list) return;
    list.innerHTML = "";
    if (!items) return;
    items.forEach(item => {
        addItem(type);
        const lastItem = list.lastElementChild;
        const inputs = lastItem.querySelectorAll('input, textarea, select.item-select');
        inputs.forEach(input => {
            const field = input.dataset.field;
            if (field && item[field] !== undefined) input.value = item[field];
        });
    });
}

function restoreExperience(items) {
    const list = document.getElementById(`experience-list`);
    if (!list) return;
    list.innerHTML = "";
    if (!items) return;
    items.forEach(item => {
        addItem('experience');
        const lastItem = list.lastElementChild;
        const compEl = lastItem.querySelector('[data-field="company"]');
        const posEl = lastItem.querySelector('[data-field="position"]');
        const durEl = lastItem.querySelector('[data-field="duration"]');
        if (compEl) compEl.value = item.company || '';
        if (posEl) posEl.value = item.position || '';
        if (durEl) durEl.value = item.duration || '';
        
        const projBtn = lastItem.querySelector('button[onclick="addExpProject(this)"]');
        if (item.projects && projBtn) {
            item.projects.forEach(p => addExpProject(projBtn, p));
        }
    });
}

// --- CONFIRM DIALOGS ---

function showConfirm(title, message, onConfirm) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-action-btn');
    const overlay = document.getElementById('confirm-dialog');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            closeConfirm();
            onConfirm();
        };
    }
    if (overlay) overlay.style.display = 'flex';
}

function closeConfirm() {
    const overlay = document.getElementById('confirm-dialog');
    if (overlay) overlay.style.display = 'none';
}

function confirmNewResume() {
    showConfirm(
        'Start New Resume?',
        'This will populate standard sample fields to help you craft your resume.',
        loadSampleData
    );
}

function confirmClearAll() {
    showConfirm(
        'Clear All Data?',
        'This will permanently remove all resume data, settings, and auto-saved content from your browser.',
        clearAllData
    );
}

function clearAllData() {
    isRestoring = true;

    ['name', 'job-title', 'email', 'phone', 'location', 'linkedin', 'github', 'website', 'skills', 'photo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const refCheck = document.getElementById('ref-upon-request');
    if (refCheck) refCheck.checked = false;
    const removeBtn = document.getElementById('remove-photo-btn');
    if (removeBtn) removeBtn.style.display = 'none';

    $('#summary_editor').summernote('code', '');

    ['experience', 'education', 'projects', 'courses', 'certificates', 'languages', 'volunteer', 'references'].forEach(type => {
        const list = document.getElementById(`${type}-list`);
        if (list) list.innerHTML = '';
    });

    resumeData.personal = { name: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", photo: "" };
    resumeData.summary = "";
    resumeData.experience = [];
    resumeData.education = [];
    resumeData.skills = "";
    resumeData.projects = [];
    resumeData.courses = [];
    resumeData.certificates = [];
    resumeData.languages = [];
    resumeData.volunteer = [];
    resumeData.references = [];
    resumeData.refUponRequest = false;

    if (document.getElementById('template-select')) document.getElementById('template-select').value = 'template-classic';
    if (document.getElementById('setting-font-size')) document.getElementById('setting-font-size').value = 12;
    if (document.getElementById('setting-accent-color')) document.getElementById('setting-accent-color').value = '#2563eb';
    if (document.getElementById('setting-margins')) document.getElementById('setting-margins').value = '20mm';
    if (document.getElementById('setting-paper')) document.getElementById('setting-paper').value = 'a4';
    if (document.getElementById('setting-pdf-quality')) document.getElementById('setting-pdf-quality').value = 3;
    if (document.getElementById('font-size-val')) document.getElementById('font-size-val').textContent = '12pt';

    settings.template = 'template-classic';
    settings.fontSize = 12;
    settings.accentColor = '#2563eb';
    settings.margins = '20mm';
    settings.paper = 'a4';
    settings.pdfQuality = 3;

    document.documentElement.style.setProperty('--resume-font-size', '12pt');
    document.documentElement.style.setProperty('--resume-accent', '#2563eb');
    document.documentElement.style.setProperty('--resume-margin', '20mm');

    localStorage.removeItem('resumeAutoSave');
    localStorage.removeItem('resumeSettings');

    undoStack.length = 0;
    redoStack.length = 0;
    updateUndoRedoButtons();

    isRestoring = false;
    updatePreview();
    showNotification('All data cleared. Starting fresh!');
}

// --- FAQ TOGGLE ---

function toggleFAQ(el) {
    if (el && el.parentElement) {
        el.parentElement.classList.toggle('open');
    }
}

// --- NOTIFICATION ---

function showNotification(message) {
    const notifier = document.getElementById('notifier');
    if (!notifier) return;
    notifier.textContent = message;
    notifier.classList.add('show');
    setTimeout(() => { notifier.classList.remove('show'); }, 3000);
}

// --- PDF EXPORT ---

async function htmlToPDF() {
    const element = document.getElementById('preview-container');
    if (!element) return;

    const scale = settings.pdfQuality || 3;
    const format = settings.paper === 'letter' ? 'letter' : 'a4';
    
    const options = { 
        margin: 5,
        filename: (resumeData.personal.name || 'Resume') + '_Resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: scale, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: format, orientation: 'portrait' }
    }; 
    html2pdf().from(element).set(options).save();
    showNotification('Generating PDF...');
}

// --- KEYBOARD SHORTCUTS ---

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }
});

// --- INIT ---

$(document).ready(function() {
    $('#summary_editor').summernote({
        placeholder: 'Professional background, key achievements...',
        tabsize: 2, height: 120,
        toolbar: [['style', ['bold', 'italic', 'underline', 'clear']], ['para', ['ul', 'ol', 'paragraph']]],
        callbacks : { onChange : (c) => { document.getElementById('summary').value = c; updatePreview(); } }
    });

    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        if (themeToggle) themeToggle.checked = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        if (themeToggle) themeToggle.checked = false;
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Restore or load sample data
    const restored = autoRestore();
    if (!restored) {
        loadSampleData();
    }

    showNotification(restored ? 'Welcome back! Resume restored.' : 'Welcome! Start customizing your resume.');
});