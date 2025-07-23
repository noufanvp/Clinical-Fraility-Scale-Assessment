# Clinical Frailty Scale Assessment App

A comprehensive Progressive Web App (PWA) for conducting Clinical Frailty Scale (CFS) assessments with full offline functionality and intelligent data management.

## 🏥 Overview

The Clinical Frailty Scale is a validated assessment tool used to measure frailty in older adults across healthcare settings. This app provides a structured, offline-first approach to conducting CFS assessments with intelligent form validation and automatic data handling.

## ✨ Key Features

### Core Functionality
- **📱 Progressive Web App**: Install as native app on mobile/desktop devices
- **🔌 Offline First**: Complete functionality without internet connection
- **📊 Intelligent Scoring**: Automatic CFS score calculation (1-9 scale)
- **🎯 Smart Form Logic**: Dynamic sections based on user responses
- **💾 Local Data Storage**: Secure IndexedDB storage with no external servers
- **🔄 Data Sync**: Smart defaults for incomplete responses

### Assessment Components
- **Patient Demographics**: Comprehensive patient information collection
- **Terminal Illness Screening**: Initial assessment gateway
- **Basic ADLs (BADLs)**: 5 essential daily living activities
- **Instrumental ADLs (IADLs)**: 6 complex daily living tasks  
- **Chronic Conditions**: 22 standardized chronic health conditions
- **Self-Care Assessment**: Health perception, effort, and activity levels
- **Clinical Outcomes**: ED disposition, DNR orders, mortality, length of stay

### Data Management
- **Smart Defaults**: Unselected chronic conditions auto-default to "No" on save
- **Edit Capability**: Modify saved assessments with preserved data integrity
- **Export Functionality**: JSON export for external analysis
- **Assessment History**: View and manage all saved assessments
- **Data Validation**: Comprehensive form validation with user feedback

## 🏥 CFS Score Levels

| Score | Level | Description |
|-------|-------|-------------|
| **1** | Very Fit | Robust, active, energetic, motivated, regularly exercise |
| **2** | Fit | No active disease symptoms, less fit than level 1, occasionally active |
| **3** | Managing Well | Medical problems well controlled, not regularly active beyond walking |
| **4** | Living with Very Mild Frailty | Not dependent but symptoms limit activities, "slowed up" |
| **5** | Living with Mild Frailty | Need help with high-order IADLs (finances, transportation, housework) |
| **6** | Living with Moderate Frailty | Need help with outside activities and housekeeping, problems with stairs |
| **7** | Living with Severe Frailty | Completely dependent for personal care but stable |
| **8** | Living with Very Severe Frailty | Completely dependent, approaching end of life |
| **9** | Terminally Ill | Life expectancy <6 months, not otherwise evidently frail |

## 🚀 Installation & Setup

### Access the App
Visit the live application at: `https://noufanvp.github.io/Clinical-Fraility-Scale-Assessment`

### Method 1: Install as PWA on Android
1. **Open in Chrome Browser**:
   - Navigate to the app URL in Chrome
   - Look for the "Add to Home Screen" banner at the bottom
   - Tap "Add to Home Screen" or "Install"

2. **Manual Installation**:
   - Tap the three-dot menu (⋮) in Chrome
   - Select "Add to Home Screen" or "Install App"
   - Confirm the installation when prompted
   - The app icon will appear on your home screen

3. **Use as Native App**:
   - Tap the app icon to launch in standalone mode
   - Full offline functionality available
   - No browser UI - looks and feels like a native app

### Method 2: Install as PWA on iOS (iPhone/iPad)
1. **Open in Safari Browser**:
   - Navigate to the app URL in Safari
   - Ensure you're using Safari (not Chrome or other browsers)

2. **Add to Home Screen**:
   - Tap the Share button (📤) at the bottom of Safari
   - Scroll down and tap "Add to Home Screen"
   - Edit the app name if desired
   - Tap "Add" in the top right corner

3. **Launch the App**:
   - Find the app icon on your home screen
   - Tap to launch in full-screen mode
   - Works offline once initially loaded

### Method 3: Desktop Installation
1. **Chrome/Edge/Firefox**:
   - Visit the app URL in your browser
   - Look for the install icon (⊕) in the address bar
   - Click "Install" when prompted
   - App will open in its own window

2. **Alternative Method**:
   - Click the three-dot menu in browser
   - Select "Install [App Name]" or "Create Shortcut"
   - Choose "Open as window" for app-like experience

### 📱 PWA Benefits
- ✅ **Offline Access**: Works without internet connection
- ✅ **Native Feel**: Full-screen experience without browser UI
- ✅ **Home Screen Icon**: Easy access like any other app
- ✅ **Fast Loading**: Cached resources for instant startup
- ✅ **Cross-Platform**: Same experience on all devices
- ✅ **Automatic Updates**: Updates when you revisit the web version

## 📋 Usage Workflow

### 1. Patient Information Entry
- Enter required patient demographics (MRNO, age, gender)
- Record ED visit details (date, time)
- Document presenting illness and vital signs

### 2. CFS Assessment Process
- **Step 1**: Answer terminal illness screening question
- **Step 2**: Complete relevant assessment sections based on responses:
  - If terminally ill → Skip to results (CFS = 9)
  - If not terminally ill → Complete BADLs, IADLs, chronic conditions, self-care

### 3. Intelligent Form Flow
- **BADLs**: If any dependencies detected → Continue to IADLs
- **IADLs**: If any limitations detected → Continue to chronic conditions  
- **Chronic Conditions**: Always assessed for scores ≥5
- **Self-Care**: Final assessment component

### 4. Results & Documentation
- View calculated CFS score and interpretation
- Review/modify chronic conditions in results section
- Complete disposition and outcome information
- Save assessment for future reference

## 🛠 Technical Architecture

### Frontend Technologies
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern responsive design with medical color palette
- **Vanilla JavaScript**: No external dependencies except idb wrapper

### Data Storage
- **IndexedDB**: Client-side database with automatic indexing
- **Service Worker**: Offline functionality and caching
- **Local Storage**: No external servers or data transmission

### PWA Features
- **Manifest**: App installation configuration
- **Service Worker**: Offline caching and background sync
- **Responsive Design**: Mobile-first approach with desktop compatibility

## 📁 File Structure

```
medical-survey-pwa/
├── index.html          # Main application interface
├── app.js              # Core application logic (2200+ lines)
├── style.css           # Responsive styling with medical theme
├── sw.js               # Service worker for offline functionality  
├── manifest.json       # PWA configuration and metadata
├── README.md           # This documentation
└── icons/              # App icons for installation
    ├── icon-192.png    # Standard app icon
    └── icon-512.png    # High-resolution app icon
```

## 🔧 Development Features

### Debugging Tools
```javascript
// Access all stored assessments
await window.debugExport()

// View current assessment state
console.log(currentAssessment)
```

### Browser Compatibility
- ✅ Chrome/Chromium (fully supported)
- ✅ Firefox (fully supported)
- ✅ Safari (supported with minor limitations)
- ✅ Edge (fully supported)

### Performance Optimizations
- Lazy loading of assessment sections
- Efficient IndexedDB queries with proper indexing
- Minimal external dependencies (only idb wrapper)
- Service worker caching for instant loading

## 🔒 Privacy & Security

- **No External Data Transfer**: All data remains on device
- **Local Storage Only**: No cloud storage or external databases
- **HIPAA Considerations**: Suitable for protected health information
- **Data Persistence**: Data survives browser sessions until manually deleted
- **Export Control**: Users control data export and sharing

## 📊 Assessment Validation

### Required Fields by Section
- **Basic Details**: Patient MRNO (required)
- **Terminal Illness**: Must be answered
- **BADLs**: All 5 activities if section is active
- **IADLs**: Contextual based on BADL responses
- **Chronic Conditions**: Auto-defaults applied for missing responses
- **Self-Care**: All 3 components when section is active

### Data Integrity Features
- Real-time form validation with visual feedback
- Automatic default value assignment for incomplete responses
- Preservation of user selections during edits
- Comprehensive error handling and user notifications

## 🚨 Medical Disclaimer

**IMPORTANT**: This tool is designed for clinical assessment support only. It should not replace professional medical judgment or clinical decision-making. Always consult qualified healthcare professionals for medical diagnosis, treatment decisions, and patient care planning.

## 📄 License & Usage

This application is provided for educational and clinical assessment purposes. Ensure compliance with your institution's policies and applicable healthcare regulations when using for patient care.

---

**Version**: 1.0.0  
**Last Updated**: July 2025  
**Compatibility**: Modern browsers with IndexedDB support
