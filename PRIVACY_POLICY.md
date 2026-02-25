# Privacy Policy

**Gemini Live Agent**  
**Effective Date**: February 25, 2026  
**Last Updated**: February 25, 2026

---

## 1. Overview

Gemini Live Agent ("**App**," "**we**," "**us**," or "**our**") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and accompanying services (collectively, the "**Service**").

Please read this Privacy Policy carefully. By accessing and using Gemini Live Agent, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.

---

## 2. Information We Collect

### 2.1 Information You Provide Directly

#### **User Input Data**
- **Story Prompts**: Text descriptions, story tones, and beat sequences you enter in the "Story Director" mode
- **Navigation Goals**: Text descriptions of UI navigation objectives in the "Navigator" mode
- **Voice Input**: Audio recordings when you use the "Live Audio" mode
- **Session Context**: Planning steps, notes, and navigation history during your session

#### **File Uploads**
- **Screenshots**: Images you upload for UI analysis in Navigator mode
- Screenshots are processed for analysis but are **not stored permanently** on our servers

#### **Export Data**
- **Workflow JSON**: When you export your session, you explicitly generate a JSON file that summarizes your inputs, outputs, and actions

### 2.2 Information Automatically Collected

#### **Device Information**
- Device model, OS version, and Android API level
- Screen resolution and viewport dimensions
- App version and installation timestamp

#### **Usage Data**
- Feature usage (which modes you accessed, frequency of use)
- Session timestamps and duration
- Error logs and crash reports (if enabled)
- **We do NOT track**:
  - Location data
  - Browsing history
  - Personal identifying information beyond app usage

#### **WebSocket Connection Data**
- Connection IP address (for security and rate-limiting purposes)
- Connection timestamps and duration
- Message frequency and types (aggregated, non-content data)

---

## 3. How We Use Your Information

### 3.1 To Provide and Improve the Service
- Processing your prompts and inputs through the Google Gemini API
- Generating stories, navigation actions, and recommendations
- Debugging and improving app performance
- Providing customer support

### 3.2 To Ensure Security
- Detecting and preventing fraudulent activity
- Rate-limiting to prevent API abuse
- Monitoring for security vulnerabilities
- Enforcing our Terms of Use

### 3.3 To Comply with Legal Requirements
- Responding to lawful requests from authorities
- Protecting our legal rights
- Preventing harm or damage

### 3.4 Analytics and Improvements
- Analyzing anonymous usage patterns
- Improving user experience and feature design
- **Aggregated, non-identifiable data only**

---

## 4. Data Sharing and Disclosure

### 4.1 Third-Party Service Providers

We share your information **only as necessary** with:

#### **Google Cloud Platform**
- **Service**: Gemini API processing, Cloud Run backend
- **Data Shared**: User prompts, goals, context (necessary for functionality)
- **Purpose**: AI response generation
- **Governed By**: [Google Cloud Privacy Policy](https://cloud.google.com/terms/cloud-privacy-notice)

### 4.2 We Do NOT Share

We **explicitly do not**:
- Sell user data to advertisers or marketing firms
- Share personal information with unaffiliated third parties
- Use screenshots for training other models without consent
- Disclose user activity logs unless legally required

### 4.3 Legal Compulsion

We may disclose your information if required by law (subpoena, court order, etc.). We will **notify you** before such disclosure unless legally prohibited.

---

## 5. Data Storage and Retention

### 5.1 Local Storage (Your Device)

**Location**: Android device's encrypted local storage  
**Protection**: EncryptedSharedPreferences with AES-256 encryption  
**Retention**: Until you delete the app or manually clear app data  
**You Control**: You can delete all local data at any time via Settings → Apps → Gemini Live Agent → Storage → Clear Data

### 5.2 Backend Temporary Storage

**WebSocket Session Data**: Held in memory during active connections only  
**Screenshots**: Processed in real-time, deleted immediately after analysis (not stored)  
**API Logs**: Retained for 30 days for debugging and security purposes, then automatically deleted

### 5.3 Google API Processing

**Prompt/Response Data**: Google's Gemini API processes your inputs per [Google's Privacy Policy](https://ai.google.dev/privacy)  
**Retention**: Google may retain conversation data per their policies. Check Google's terms for details.

---

## 6. Data Security

### 6.1 Encryption

- **In Transit**: All data is encrypted using TLS 1.3 (HTTPS/WSS)
- **At Rest**: Local app data uses AES-256 encryption via EncryptedSharedPreferences
- **WebSocket**: Secure WebSocket (WSS) protocol only

### 6.2 Access Controls

- API keys are **never exposed** in the app
- Backend validation and rate-limiting on all requests
- Certificate pinning for backend communication
- Regular security audits and updates

### 6.3 Limitations

No method of transmission over the internet is 100% secure. While we implement industry-standard protections, we cannot guarantee absolute security.

---

## 7. Your Privacy Rights

### 7.1 Right to Access

You have the right to request what personal information we hold about you. Email us at `privacy@geminiliveagent.dev` with your request.

### 7.2 Right to Delete

You can delete your local app data anytime:
1. Open **Settings** → **Apps** → **Gemini Live Agent**
2. Select **Storage** → **Clear Data**
3. All locally stored information will be permanently deleted

### 7.3 Right to Export

Use the App's built-in "Export" feature to download your session data as JSON at any time.

### 7.4 Right to Withdraw Consent (if applicable)

If you've given permission for analytics or data collection, you can disable it in:
- **Settings** → **Privacy Settings** → toggle off analytics

### 7.5 California Privacy Rights (CCPA)

If you are a California resident, you have the right to:
- Know what personal information is collected
- Delete personal information (with exceptions)
- Opt-out of the sale or sharing of personal information

We do not sell your information. Contact `privacy@geminiliveagent.dev` for CCPA inquiries.

### 7.6 EU Users (GDPR)

If you are in the EU, you have rights including:
- Access to your data
- Correction of inaccurate data
- Deletion ("right to be forgotten")
- Data portability
- Objection to processing

Contact `privacy@geminiliveagent.dev` to exercise these rights.

---

## 8. Children's Privacy

Gemini Live Agent is **not intended for children under 13** (COPPA) or under 16 (GDPR). We do not knowingly collect information from children.

If we become aware that we've collected data from a child, we will delete it immediately. Contact `privacy@geminiliveagent.dev` if you believe we have collected a child's data.

---

## 9. Changes to This Privacy Policy

We may update this Privacy Policy periodically. When we make material changes:
- We will notify you via in-app notification or email
- Your continued use of the App after changes constitutes acceptance

**Version History**:
- v1.0 (Feb 25, 2026): Initial release

---

## 10. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy:

**Email**: `privacy@geminiliveagent.dev`

**Mailing Address**:  
Gemini Live Agent Support  
[Your Company Address]  
[City, State ZIP]  

**Response Time**: We aim to respond to privacy inquiries within 30 days.

---

## 11. Jurisdiction and Governing Law

This Privacy Policy is governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions.

For disputes:
- First, contact us to resolve the issue
- If unresolved, disputes will be handled per our Terms of Use

---

## 12. Additional Information for Android Users

### Permission Justification

This app requests the following Android permissions:

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| `RECORD_AUDIO` | Capture your voice for Live Audio conversations with Gemini | Yes (Live mode) |
| `CAMERA` | Capture device screen for UI navigation analysis | Yes (Navigator mode) |
| `INTERNET` | Communicate with our backend and Google APIs | Yes |
| `WRITE_EXTERNAL_STORAGE` | Save exported workflow JSON to device storage | Optional (export feature) |
| `READ_EXTERNAL_STORAGE` | Read screenshots you upload | Yes (Navigator mode) |

You can revoke any permission at any time:
1. Go to **Settings** → **Apps** → **Gemini Live Agent** → **Permissions**
2. Toggle off any permission
3. Features requiring that permission will be disabled

---

## 13. Summary of Privacy Practices

| Practice | Status | Details |
|----------|--------|---------|
| Data Minimization | ✅ Yes | We collect only what's necessary |
| End-to-End Encryption | 🟡 Partial | Transit encrypted; backend sees data for processing |
| Permanent Storage | ❌ No | Data deleted after 30 days (server-side) |
| Third-Party Sharing | ❌ No | Data never sold or shared | 
| Ad Tracking | ❌ No | No advertisements or tracking |
| User Deletion Right | ✅ Yes | You can delete local data anytime |
| Data Export Right | ✅ Yes | Use in-app export feature |
| Automatic Deletion | ✅ Yes | Server logs deleted after 30 days |

---

**Last Updated**: February 25, 2026  
**Version**: 1.0  

*This document is a template. Please consult with a legal professional in your jurisdiction before publishing.*
