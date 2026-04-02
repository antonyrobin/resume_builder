# Resume Builder App

A simple, fast, and feature-rich HTML Resume Builder App designed to help professionals create beautiful resumes effortlessly.

🔗 **Visit Live App:** [Resume Builder](https://antonyrobin.github.io/resume_builder)

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Setup Guidelines](#-setup-guidelines)
- [Functionalities](#-functionalities)
- [License](#-license)

## 🌟 Features
- **Multiple Templates:** Choose from 5 premium templates (Classic, Modern, Creative, Minimalist, Executive).
- **Real-Time Live Preview:** See changes exactly as you type.
- **Export Options:** Instantly export the resume as a high-quality PDF.
- **Data Portability:** Export your resume data to JSON and import it back anytime to continue editing.
- **Dark & Light Themes:** Toggle between beautiful dark and light themes.
- **No Sign-Up Required:** Start building right away without creating an account.

## 🛠 Tech Stack
This project is built directly with web standards and lightweight libraries for speed and minimal dependencies:
- **HTML5:** Semantic structure.
- **CSS3:** Custom responsive styling and theming (no heavy CSS frameworks).
- **Vanilla JavaScript:** Fast, framework-free DOM manipulation and application logic.
- **[jQuery](https://jquery.com/):** For simplifying specific DOM operations and supporting Summernote.
- **[Summernote](https://summernote.org/):** Rich text editor for writing comprehensive professional summaries.
- **[html2pdf.js](https://ekoopmans.github.io/html2pdf.js/):** Client-side HTML to PDF generation.
- **[Lucide Icons](https://lucide.dev/):** Clean, modern SVG icons.

## 🚀 Setup Guidelines

To run this project locally, follow these simple steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/antonyrobin/resume_builder.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd resume_builder
   ```

3. **Open the application:**
   - Since this is a static project without a backend, you can simply open the `index.html` file in any modern web browser.
   - For a better development experience, you can use a local web server like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code or Python's `http.server`:
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000` in your browser.

## ⚙️ Functionalities

- **Template Switching:** Dynamically swap templates without losing any entered data. The preview updates instantly.
- **Image Upload:** Upload a profile picture which gets seamlessly embedded into the selected template.
- **Rich Text Entry:** The summary field uses Summernote, allowing bolding, italicizing, and formatting text easily.
- **Dynamic Array Fields:** Experience, Education, Projects, Courses, and Certifications sections are fully dynamic. You can add as many items as needed.
- **Persistent Data (Export/Import):** The application allows exporting the full state (including images as base64) into a `.json` file, and later importing it to resume work.
- **PDF Generation:** Captures the DOM of the preview container and exports it as a perfectly scaled standard A4 size PDF.

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for more details. Enjoy open-source!