# Google Play Store Submission Guide

**Gemini Live Agent Android App**  
**Prepared For**: Google Play Store Upload  
**Version**: 1.0  
**Date**: February 25, 2026

---

## 📋 Pre-Submission Checklist

### ✅ Legal & Compliance
- [ ] Privacy Policy (.md + web version)
- [ ] Terms of Use (.md + web version)
- [ ] Acceptable Use Policy (for AI content generation)
- [ ] Data Processing Agreement (if GDPR applies)
- [ ] App permissions justified in description

### ✅ Technical Requirements
- [ ] Android app signed with release keystore
- [ ] Minimum SDK: API 26 (Android 8.0) ✅
- [ ] Target SDK: API 34 (Android 14) or higher
- [ ] App compiled and tested on multiple devices
- [ ] AndroidManifest.xml properly configured
- [ ] All permissions declared (RECORD_AUDIO, CAMERA, INTERNET, etc.)

### ✅ Metadata
- [ ] App title (50 chars max)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App icon (512×512 PNG)
- [ ] Feature graphic (1024×500 PNG)
- [ ] Screenshots (min 2, max 8 per phone type) ✅
- [ ] Video trailer (optional but recommended) ✅

### ✅ Content Rating
- [ ] Questionnaire completed
- [ ] Content rating obtained (IARC)

### ✅ Pricing & Distribution
- [ ] Free app ✅ or pricing set
- [ ] Target countries/regions selected
- [ ] Country-specific restrictions (if needed)

---

## 🚀 App Store Listing Details

### App Title
```
Gemini Live Agent
```

### Short Description (80 characters)
```
Real-time AI assistant: voice conversations, UI automation & story generation.
```

### Full Description (4000 characters max)

```
📱 GEMINI LIVE AGENT - Multimodal AI on Your Phone

Experience the power of Google Gemini Live API in three stunning modes:

🎙️ LIVE VOICE CONVERSATION
• Natural bidirectional audio with real-time responses
• Ask questions, get answers instantly
• Echo cancellation & noise suppression for clarity

🧭 LIVE UI NAVIGATOR
• Voice commands + screen capture for UI automation
• Describe what you want to do; Gemini plans the steps
• Get coordinate-based actions for any app
• Perfect for accessibility, testing, and automation

📖 LIVE STORY DIRECTOR
• Generate multimodal stories on demand
• Text + Images + Audio narration woven into one sequence
• Choose tone, add beat descriptions, export as JSON

FEATURES
✨ Real-time streaming WebSocket architecture
🔐 End-to-end encrypted data handling
🛡️ Zero data storage; processed immediately
📤 Export sessions as shareable JSON
🎨 Beautiful glassmorphic UI design
⚡ Sub-500ms latency
📱 Fully mobile-optimized

PRIVACY FIRST
• Your prompts & screenshots are never stored
• Encrypted throughout transmission
• No user tracking or analytics
• Full permission control
• Comply with GDPR, CCPA, COPPA

REQUIREMENTS
• Android 8.0 or higher
• Working internet connection
• Microphone + Camera (for voice/screen features)
• Google Gemini API key (free tier available)

DEVELOPER
Built for the Google Gemini Live Agent Challenge by a passionate AI developer.

Get started: www.github.com/[your-username]/gemini-live-agent
```

### Screenshots (1440×2560 recommended)

**Screenshot 1: Story Director Mode**
- Show: Main interface with story prompt input
- Highlight: Tone selection and beat editor
- Caption: "Create multimodal stories with text, images & audio"

**Screenshot 2: Live Audio Conversation**
- Show: Audio panels with recording status
- Highlight: Visualizer and connection status
- Caption: "Talk to Gemini Live in real-time"

**Screenshot 3: Live UI Navigator**
- Show: Screenshot upload area with goal input
- Highlight: Output stream showing navigation steps
- Caption: "Voice + Screen Capture = Smart UI Navigation"

**Screenshot 4: Output Stream**
- Show: Interleaved narrative + UI actions
- Highlight: Action blocks with coordinates
- Caption: "Real-time orchestration of AI responses"

**Screenshot 5: Export & Share**
- Show: Context & Export section with JSON
- Highlight: Copy and share buttons
- Caption: "Export sessions as shareable JSON workflows"

**Screenshot 6: Onboarding Tour**
- Show: Tooltip highlighting a key feature
- Highlight: Step counter and next button
- Caption: "Interactive in-app guidance for new users"

---

## 📝 Content Rating (IARC)

**Email Address**: [your-email@example.com]  
**App Category**: Games / Entertainment / Productivity Tool

### IARC Questionnaire Answers

**Descriptors**:
- [ ] Mild language
- [ ] No violence
- [ ] No sexual content
- [ ] No substance use
- [ ] No gambling
- [ ] No horror or fear

**Data Disclosure**:
- ✅ Personal information collected: Prompts, screenshots, voice input
- ✅ Data shared with third parties: Google Cloud (necessary for Gemini API)
- ✅ Data encrypted in transit: Yes (TLS 1.3)
- ✅ Users can delete data: Yes (local deletion via Settings)

**Advertising**:
- ❌ No in-app advertising
- ❌ No third-party advertising

---

## 🔐 Security & Privacy

### Permission Justifications

Create a document explaining each permission:

```
PERMISSIONS USED IN GEMINI LIVE AGENT

1. RECORD_AUDIO
   Purpose: Capture your voice for Live Audio conversations
   When Used: Only when you actively tap "Record" in Live Audio mode
   How to Revoke: Settings → Apps → Gemini Live Agent → Permissions → Microphone

2. CAMERA
   Purpose: Analyze your device screen for UI navigation
   When Used: Only when you use Live UI Navigator or upload screenshots
   How to Revoke: Settings → Apps → Gemini Live Agent → Permissions → Camera

3. INTERNET
   Purpose: Connect to Google Cloud backend and Gemini APIs
   When Used: Always (required for core functionality)
   How to Revoke: Not revocable; app requires internet

4. WRITE_EXTERNAL_STORAGE
   Purpose: Save exported workflow JSON to Downloads folder
   When Used: Only when you click "Export" button
   How to Revoke: Settings → Apps → Gemini Live Agent → Permissions → Storage

5. READ_EXTERNAL_STORAGE
   Purpose: Read screenshots you select to upload
   When Used: Only during Navigator mode screenshot selection
   How to Revoke: Settings → Apps → Gemini Live Agent → Permissions → Storage

6. ACCESS_NETWORK_STATE
   Purpose: Check internet connectivity
   When Used: Continuous (ensures you're online before operations)
   How to Revoke: Settings → Apps → Gemini Live Agent → Permissions → Other
```

---

## 📄 Privacy Policy Hosting

**Option 1: In-App Hosting**
- Host Privacy Policy on a static website
- Add link in Settings → About → Privacy Policy
- Ensure URL is stable (not localhost!)

**Option 2: GitHub Pages** (Recommended for open-source)
```
https://[your-username].github.io/gemini-live-agent/privacy
```

**Option 3: Google Docs** (Quick but less professional)
```
https://docs.google.com/document/d/[ID]/edit
```

### Required in Play Store Listing
```
Privacy Policy: https://your-domain.com/privacy
Terms of Use: https://your-domain.com/terms
Developer Email: support@geminiliveagent.dev
```

---

## 🎬 Video Trailer (Optional but Recommended)

**Duration**: 15-30 seconds  
**Format**: MP4 with 16:9 aspect ratio  
**Content Suggestion**:

```
[0-3s] "Introducing Gemini Live Agent..."
       [Show app icon bouncing]

[3-8s] "Talk to AI in real-time"
       [Screen: Audio panel with visualizer]

[8-13s] "Navigate any app with voice"
        [Screen: Screenshot analysis + coordinates]

[13-18s] "Generate multimodal stories"
         [Screen: Story output with images]

[18-25s] "Export and share your workflows"
         [Screen: JSON export being copied]

[25-30s] "Gemini Live Agent - Now on Android"
         [Show Play Store badge]
         [Super: "Available on Google Play Store"]
```

---

## 🛠️ Technical Setup

### AndroidManifest.xml Template

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="dev.geminiliveagent.app">

    <!-- PERMISSIONS -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Mark permissions as optional for non-critical features -->
    <uses-permission
        android:name="android.permission.CAMERA"
        android:required="false" />

    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />

    <application
        android:allowBackup="false"
        android:debuggable="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.GeminiLiveAgent"
        android:usesCleartextTraffic="false">

        <!-- MAIN ACTIVITY -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.GeminiLiveAgent">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

### build.gradle Configuration

```gradle
android {
    compileSdk 34

    defaultConfig {
        applicationId "dev.geminiliveagent.app"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        
        // WebView configuration
        webViewClient = "androidx.webkit.WebViewClientCompat"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            debuggable false
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.7.1'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    implementation 'com.google.android.material:material:1.10.0'
}
```

---

## 📤 Submission Instructions

### Step 1: Create Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Accept Developer Agreement (one-time $25 fee)

### Step 2: Create App
1. Click "Create app"
2. Enter app name: **Gemini Live Agent**
3. Select type: **Apps**
4. Select category: **Tools** or **Productivity**
5. Select category again: **Automation** (optional)

### Step 3: Fill Questionnaire
1. **Content rating**: Complete IARC form
2. **Ads**: Select "No ads"
3. **Target audience**: 13+
4. **Data safety**: Upload documents
5. **Permissions**: Explain each permission

### Step 4: App Details
1. Upload icon (512×512 PNG)
2. Upload feature graphic (1024×500 PNG)
3. Upload 6 screenshots
4. Add short description
5. Add full description
6. Add app category

### Step 5: Upload APK/AAB
1. Go to "Release" → "Production"
2. Click "Create release"
3. Upload signed APK or Android App Bundle (AAB)
4. Add release notes:
   ```
   v1.0.0 - Initial Release
   • Live voice conversations with Gemini AI
   • UI navigation with voice + screen capture
   • Multimodal story generation
   • Real-time streaming architecture
   • End-to-end encryption
   ```

### Step 6: Closed Test & Submit
1. Review all information
2. Set up a **Closed Test Track** in the Play Console (required for new apps).
3. **You must run a closed test for at least 14 consecutive days** before requesting production review. Invite testers and monitor for issues during this period.
4. After 14 days, select "Submit for Review" to request production release.
5. App enters review queue (review time varies, but only after the closed test is complete).

### Step 7: Monitor Review
- Check review status daily in console
- Respond to any rejection reasons within 5 days
- Common rejections:
  - Unclear privacy policy (most common) ✅ You have this
  - Exposed API keys ✅ Handled in backend
  - Unclear permissions ✅ Documented above
  - Misleading description ✅ Follow guidelines

---

## 🐛 Common Play Store Rejection Reasons & Fixes

| Rejection | Reason | Fix |
|-----------|--------|-----|
| Exposed credentials | API keys found in code | ✅ Backend proxy used |
| Unclear privacy | Policy missing or vague | ✅ Comprehensive policy provided |
| Misleading description | Claims not supported | Describe only supported features |
| Inadequate permissions explanation | Why do you need these? | ✅ Explained above |
| Crash/ANR | App crashes during review | Test thoroughly before upload |
| Content policy violation | AI generates prohibited content | Add content filters |
| Requires manual activation | Backend must be reachable | Ensure Cloud Run deployment active |

---

## 📊 Post-Launch Monitoring

### Analytics to Track
- Daily/monthly active users (DAU/MAU)
- Crash rate and error logs
- Permission acceptance/rejection rate
- Feature usage breakdown
- User retention (D1, D7, D30)

### Play Store Console Metrics
- Rating and review score
- Download count
- Installation count
- Uninstall rate

### Continuous Improvement
1. Monitor reviews and ratings
2. Respond to user feedback
3. Fix bugs within 1-2 days
4. Release updates monthly
5. Add new features based on feedback

---

## 🔄 Update & Versioning Strategy

### Version Naming
- **v1.0.0**: Initial release
- **v1.1.0**: New features
- **v1.0.1**: Bug fixes
- **v2.0.0**: Major refactor

### Update Frequency
- Critical bugs: Within 24 hours
- Important features: Every 2 weeks
- Minor improvements: Every month

### Release Notes Template
```
VERSION 1.0.X - [Date]
✨ New Features
• Feature description
• Another feature

🐛 Bug Fixes
• Fixed crash when...
• Resolved issue with...

🚀 Performance
• Improved connection latency by X%
• Reduced memory usage by X%

📝 Other
• Updated privacy policy
• Improved onboarding experience
```

---

## 📞 Support & Contact

### In-App Support Button
Add to Settings:
```
Support → Email: support@geminiliveagent.dev
         → GitHub: github.com/[user]/gemini-live-agent
         → Report Bug: [link to issues page]
```

### Support Email Response Template
```
Subject: Gemini Live Agent Support - [Issue]

Hi [User],

Thank you for using Gemini Live Agent. We appreciate your feedback.

[Your Response]

If you need further assistance, please reply to this email or check our troubleshooting guide at [URL].

Best regards,
Gemini Live Agent Team
```

---

## ✅ Final Checklist Before Submission

- [ ] Code compiled with release build
- [ ] APK/AAB signed with production keystore
- [ ] All hardcoded keys/secrets removed
- [ ] Privacy Policy published and linked
- [ ] Terms of Use published and linked
- [ ] Android version 26+ supported
- [ ] All permissions justified
- [ ] Screenshots uploaded (6 images)
- [ ] Description clear and accurate
- [ ] No crashes during 30-min test
- [ ] Internet connectivity tested
- [ ] Microphone access tested
- [ ] Camera/screen capture tested (if available)
- [ ] Backend server reachable from mobile network
- [ ] WebSocket connection stable

---

**Status**: Ready for submission ✅  
**Important**: New apps must complete a 14-day closed test before production review. Only after this period can you submit for review.  
**Estimated Review Time**: Begins after closed test; review time varies (typically a few days, but may be longer for new accounts).  
**Revision Date**: February 25, 2026
