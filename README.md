# ResearchAgent Pro

<div align="center">

![ResearchAgent Pro](https://img.shields.io/badge/ResearchAgent-Pro-blueviolet?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Hosted-orange?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)

**AI-Powered Research Assistant for Academic Paper Discovery, Literature Review, and AI-Assisted Writing**

[Live Demo](https://research-agent-pro.web.app) · [Report Bug](https://github.com/nimallansa937/research-agent-pro/issues) · [Request Feature](https://github.com/nimallansa937/research-agent-pro/issues)

</div>

---

## 🚀 Features

### 🔍 AI-Powered Search

- **Intelligent Paper Discovery** - Search across academic databases with AI-enhanced query understanding
- **Deep Research Mode** - Multi-phase research with automatic source analysis and synthesis
- **Prompt Enhancement** - AI suggestions to improve your research queries

### 📚 Reference Library

- **Paper Management** - Save, organize, and manage your research papers
- **PDF Reader** - Built-in reader with annotation capabilities
- **Export Options** - Export to multiple formats (PDF, Word, LaTeX)

### ✍️ AI Writing Assistant

- **Smart Writing** - AI-powered writing suggestions and completions
- **Literature Review Workbench** - Tools for synthesizing multiple sources
- **Citation Management** - Automatic citation formatting

### 🔬 Deep Research

- **Multi-Phase Analysis** - Structured research workflow
- **Research History** - Save and resume past research sessions
- **Source Synthesis** - AI-powered synthesis of multiple sources

### 👤 User Management

- **User Profiles** - Customizable display name and preferences
- **Notification Settings** - Email and in-app notification controls
- **Google Authentication** - Secure sign-in with Google

### ☁️ Cloud Integration

- **Google Drive** - Save and sync research to Google Drive
- **Firebase Backend** - Real-time data synchronization
- **Cross-Device Access** - Access your research from anywhere

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Firebase** | Authentication & Database |
| **Google Gemini AI** | AI Capabilities |
| **Tailwind CSS** | Utility Styling |
| **Lucide React** | Icons |

---

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Google Gemini API key

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/nimallansa937/research-agent-pro.git
   cd research-agent-pro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3005`

---

## 🚀 Deployment

### Firebase Hosting

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase**

   ```bash
   firebase deploy --only hosting
   ```

The app is deployed at: <https://research-agent-pro.web.app>

---

## 📁 Project Structure

```
research-agent-pro/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── UserMenu.tsx
│   │   └── ProtectedRoute.tsx
│   ├── layout/         # Layout components
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── search/         # Search & research components
│   │   ├── AISearch.tsx
│   │   ├── DeepResearch.tsx
│   │   └── ResearchHistory.tsx
│   ├── library/        # Reference library
│   ├── reader/         # PDF reader
│   ├── writer/         # AI writing assistant
│   ├── profile/        # User profile
│   ├── settings/       # App settings
│   └── report/         # Report viewer
├── contexts/           # React contexts
├── services/           # API & Firebase services
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── index.css           # Global styles
└── types.ts            # TypeScript definitions
```

---

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Google provider)
3. Create a Firestore database
4. Copy your Firebase config to `.env.local`

### Gemini API Setup

1. Get an API key from [Google AI Studio](https://ai.google.dev/)
2. Add the key to your `.env.local` as `VITE_GEMINI_API_KEY`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ using React and Firebase**

</div>
