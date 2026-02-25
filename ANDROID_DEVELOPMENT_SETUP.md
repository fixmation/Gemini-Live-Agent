# Android App Development Setup Guide

**Gemini Live Agent - Native Android Implementation**  
**Framework**: Kotlin + Android WebView  
**Date**: February 25, 2026

---

## 🏗️ Project Structure

```
gemini-live-agent-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml          # Permissions & permissions declarations
│   │   │   ├── java/dev/geminiliveagent/
│   │   │   │   ├── MainActivity.kt          # Main activity with WebView
│   │   │   │   ├── WebViewBridge.kt         # JavaScript-to-Native bridge
│   │   │   │   ├── modules/
│   │   │   │   │   ├── AudioCaptureModule.kt
│   │   │   │   │   ├── ScreenCaptureModule.kt
│   │   │   │   │   ├── SecureStorageModule.kt
│   │   │   │   │   └── PermissionManager.kt
│   │   │   │   └── utils/
│   │   │   │       ├── CertificatePinning.kt
│   │   │   │       └── CustomWebViewClient.kt
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   └── activity_main.xml
│   │   │   │   ├── values/
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   └── styles.xml
│   │   │   │   ├── drawable/
│   │   │   │   │   └── ic_launcher.xml
│   │   │   │   └── mipmap/
│   │   │   │       └── ic_launcher.png
│   │   │   └── assets/
│   │   │       └── react_app/              # Built React app (vite build output)
│   │   │           ├── index.html
│   │   │           ├── assets/
│   │   │           └── ...
│   │   ├── test/                           # Unit tests
│   │   └── androidTest/                    # UI tests
│   ├── build.gradle                        # App-level build configuration
│   └── proguard-rules.pro                  # Code obfuscation rules
├── build.gradle                            # Project-level build configuration
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── settings.gradle
└── .gitignore
```

---

## 🔧 Prerequisites

- **Android Studio**: Latest version (Hedgehog or newer)
- **Android SDK**: API 34 (Android 14)
- **Kotlin**: 1.9.0+
- **Gradle**: 8.0+
- **Java**: 11 or 17
- **Git**: For version control

### Installation Steps

```bash
# 1. Install Android Studio
# Download from: https://developer.android.com/studio

# 2. Install Android SDKs via SDK Manager in Android Studio
# Tools → SDK Manager → Install:
#   - Android SDK Platform 34
#   - Android SDK Platform 26 (min SDK)
#   - Android Emulator
#   - Android SDK Tools

# 3. Verify Java installation
java -version

# 4. Clone this repository
git clone https://github.com/[username]/gemini-live-agent.git
cd gemini-live-agent-android
```

---

## 📝 Step 1: Initialize Android Project

### Using Android Studio
1. **File** → **New** → **New Android Project**
2. **Project Name**: `Gemini Live Agent`
3. **Package Name**: `dev.geminiliveagent.app`
4. **Minimum SDK**: API 26 (Android 8.0)
5. **Target SDK**: API 34 (Android 14)
6. **Project Type**: Basic Activity (or Empty Activity)

### Manual Setup

```bash
# Create project structure
mkdir -p app/src/main/java/dev/geminiliveagent
mkdir -p app/src/main/res/{layout,values,drawable,mipmap}
mkdir -p app/src/test
mkdir -p app/src/androidTest

# Generate signing keystore for production
keytool -genkey -v -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias production
```

---

## 🛠️ Step 2: Configure build.gradle

### Project-Level `build.gradle`
```gradle
plugins {
    id 'com.android.application' version '8.1.0' apply false
    id 'com.android.library' version '8.1.0' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.0' apply false
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
```

### App-Level `build.gradle`
```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace 'dev.geminiliveagent.app'
    compileSdk 34

    defaultConfig {
        applicationId 'dev.geminiliveagent.app'
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName '1.0.0'

        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
    }

    signingConfigs {
        release {
            storeFile file(System.getenv('KEYSTORE_PATH') ?: 'release.jks')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS') ?: 'production'
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            debuggable false
            signingConfig signingConfigs.release
        }
        debug {
            minifyEnabled false
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = '11'
    }

    buildFeatures {
        viewBinding true
    }
}

dependencies {
    // Core Android
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'

    // Material Design
    implementation 'com.google.android.material:material:1.10.0'

    // WebView
    implementation 'androidx.webkit:webkit:1.7.1'

    // Encrypted Storage
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'

    // Permissions (AndroidX)
    implementation 'androidx.activity:activity-ktx:1.8.0'
    implementation 'androidx.fragment:fragment-ktx:1.6.1'

    // OkHttp for HTTP requests with certificate pinning
    implementation 'com.squareup.okhttp:okhttp:2.7.5'

    // JSON parsing
    implementation 'com.google.code.gson:gson:2.10.1'

    // Lifecycle
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.2'

    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

---

## 📱 Step 3: Android Manifest Configuration

### `AndroidManifest.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="dev.geminiliveagent.app">

    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Optional Permissions (user can grant/revoke) -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <!-- Feature declarations -->
    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:debuggable="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.GeminiLiveAgent"
        android:usesCleartextTraffic="false">

        <!-- Main Activity -->
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

---

## 🚀 Step 4: Implement MainActivity with WebView

### `MainActivity.kt`
```kotlin
package dev.geminiliveagent.app

import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import dev.geminiliveagent.app.modules.PermissionManager
import dev.geminiliveagent.app.modules.AudioCaptureModule
import dev.geminiliveagent.app.modules.ScreenCaptureModule
import dev.geminiliveagent.app.utils.CustomWebViewClient

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var permissionManager: PermissionManager
    private lateinit var audioCaptureModule: AudioCaptureModule
    private lateinit var screenCaptureModule: ScreenCaptureModule

    companion object {
        const val PERMISSION_REQUEST_CODE = 100
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize modules
        permissionManager = PermissionManager(this)
        audioCaptureModule = AudioCaptureModule(this)
        screenCaptureModule = ScreenCaptureModule(this)

        // Initialize WebView
        initWebView()

        // Request permissions
        checkAndRequestPermissions()
    }

    private fun initWebView() {
        webView = findViewById(R.id.webview)

        // Configure WebView settings
        val settings: WebSettings = webView.settings.apply {
            // JavaScript
            javaScriptEnabled = true
            domStorageEnabled = true

            // Performance
            databaseEnabled = false
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true

            // Security
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
        }

        // Set custom WebViewClient for SSL/security handling
        webView.webViewClient = CustomWebViewClient()

        // Add JavaScript bridge
        webView.addJavascriptInterface(
            WebViewBridge(
                audioCaptureModule,
                screenCaptureModule,
                permissionManager
            ),
            "Android"
        )

        // Load React app from assets
        webView.loadUrl("file:///android_asset/react_app/index.html")
    }

    private fun checkAndRequestPermissions() {
        val permissions = listOf(
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.CAMERA,
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S)
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
            else
                null,
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.S)
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            else
                null
        ).filterNotNull().toTypedArray()

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missingPermissions, PERMISSION_REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                permissions.forEachIndexed { index, permission ->
                    val granted = grantResults[index] == PackageManager.PERMISSION_GRANTED
                    // Notify WebView of permission status
                    webView.evaluateJavascript(
                        "window.permissionCallback && window.permissionCallback('$permission', $granted)"
                    ) {}
                }
            }
        }
    }

    override fun onDestroy() {
        webView.destroy()
        audioCaptureModule.stop()
        screenCaptureModule.stop()
        super.onDestroy()
    }
}
```

### `WebViewBridge.kt`
```kotlin
package dev.geminiliveagent.app

import android.webkit.JavascriptInterface
import android.webkit.WebView
import dev.geminiliveagent.app.modules.AudioCaptureModule
import dev.geminiliveagent.app.modules.ScreenCaptureModule
import dev.geminiliveagent.app.modules.PermissionManager

class WebViewBridge(
    private val audioModule: AudioCaptureModule,
    private val screenModule: ScreenCaptureModule,
    private val permissionManager: PermissionManager
) {

    @JavascriptInterface
    fun startAudioCapture(callbackId: String) {
        try {
            audioModule.startCapture { audioData ->
                // Send audio data back to JavaScript
                val base64Audio = android.util.Base64.encodeToString(audioData, android.util.Base64.NO_WRAP)
                // JavaScript callback here
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @JavascriptInterface
    fun stopAudioCapture() {
        audioModule.stop()
    }

    @JavascriptInterface
    fun startScreenCapture() {
        screenModule.startCapture()
    }

    @JavascriptInterface
    fun getScreenFrame(): String {
        return screenModule.captureFrame() // Returns Base64 JPEG
    }

    @JavascriptInterface
    fun stopScreenCapture() {
        screenModule.stop()
    }

    @JavascriptInterface
    fun hasPermission(permissionName: String): Boolean {
        return permissionManager.hasPermission(permissionName)
    }

    @JavascriptInterface
    fun requestPermission(permissionName: String) {
        permissionManager.requestPermission(permissionName)
    }

    @JavascriptInterface
    fun setEncrypted(key: String, value: String) {
        permissionManager.encryptedStorage.setItem(key, value)
    }

    @JavascriptInterface
    fun getEncrypted(key: String): String {
        return permissionManager.encryptedStorage.getItem(key) ?: ""
    }
}
```

---

## 🔐 Step 5: Security Modules

### `CustomWebViewClient.kt`
```kotlin
package dev.geminiliveagent.app.utils

import android.net.http.SslError
import android.webkit.SslErrorHandler
import android.webkit.WebView
import android.webkit.WebViewClient

class CustomWebViewClient : WebViewClient() {

    override fun onReceivedSslError(
        view: WebView?,
        handler: SslErrorHandler?,
        error: SslError?
    ) {
        // For production: Implement certificate pinning
        // For now: Only allow known backends
        val allowedHosts = listOf("your-backend-domain.com", "localhost")
        
        val urlHost = error?.url?.let { android.net.Uri.parse(it).host } ?: ""
        
        if (allowedHosts.contains(urlHost)) {
            handler?.proceed()
        } else {
            handler?.cancel()
        }
    }

    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        return false // Let WebView handle URL loading
    }
}
```

### `PermissionManager.kt`
```kotlin
package dev.geminiliveagent.app.modules

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class PermissionManager(private val context: Context) {

    val encryptedStorage: SecureStorage

    init {
        encryptedStorage = SecureStorage(context)
    }

    fun hasPermission(permission: String): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun requestPermission(permission: String) {
        // Called from MainActivity via ActivityCompat
    }
}

class SecureStorage(private val context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secret_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun setItem(key: String, value: String) {
        sharedPreferences.edit().putString(key, value).apply()
    }

    fun getItem(key: String): String? {
        return sharedPreferences.getString(key, null)
    }

    fun removeItem(key: String) {
        sharedPreferences.edit().remove(key).apply()
    }

    fun clear() {
        sharedPreferences.edit().clear().apply()
    }
}
```

---

## 🎙️ Step 6: Audio Capture Module

### `AudioCaptureModule.kt`
```kotlin
package dev.geminiliveagent.app.modules

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.*

class AudioCaptureModule(private val context: Context) {

    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private val scope = CoroutineScope(Dispatchers.Default + Job())

    fun startCapture(onChunk: (ByteArray) -> Unit) {
        if (isRecording) return

        val sampleRate = 16000
        val channelConfig = AudioFormat.CHANNEL_IN_MONO
        val audioFormat = AudioFormat.ENCODING_PCM_16BIT

        val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            channelConfig,
            audioFormat,
            bufferSize * 2
        )

        audioRecord?.startRecording()
        isRecording = true

        scope.launch {
            val buffer = ByteArray(bufferSize)
            while (isRecording) {
                val read = audioRecord?.read(buffer, 0, bufferSize) ?: 0
                if (read > 0) {
                    val audioData = buffer.slice(0 until read).toByteArray()
                    onChunk(audioData)
                }
            }
        }
    }

    fun stop() {
        isRecording = false
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        scope.cancel()
    }
}
```

---

## 📸 Step 7: Screen Capture Module

### `ScreenCaptureModule.kt`
```kotlin
package dev.geminiliveagent.app.modules

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.util.Base64
import androidx.activity.result.ActivityResultLauncher
import java.io.ByteArrayOutputStream

class ScreenCaptureModule(private val context: Context) {

    private var mediaProjection: android.media.projection.MediaProjection? = null
    private var virtualDisplay: android.hardware.display.VirtualDisplay? = null
    private var surface: android.view.Surface? = null

    fun startCapture(resultLauncher: ActivityResultLauncher<Intent>) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val projectionManager = context.getSystemService(
                Context.MEDIA_PROJECTION_SERVICE
            ) as MediaProjectionManager
            resultLauncher.launch(projectionManager.createScreenCaptureIntent())
        }
    }

    fun onScreenCapturePermission(resultCode: Int, data: Intent?) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val projectionManager = context.getSystemService(
                Context.MEDIA_PROJECTION_SERVICE
            ) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, data!!)
        }
    }

    fun captureFrame(): String {
        // Simplified: Capture a screenshot without MediaProjection for testing
        val window = (context as android.app.Activity).window
        val view = window.decorView.rootView
        
        view.isDrawingCacheEnabled = true
        val bitmap = Bitmap.createBitmap(view.drawingCache)
        view.isDrawingCacheEnabled = false

        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
        val jpegData = outputStream.toByteArray()
        
        return Base64.encodeToString(jpegData, Base64.NO_WRAP)
    }

    fun stop() {
        virtualDisplay?.release()
        mediaProjection?.stop()
    }
}
```

---

## 📐 Step 8: Layout Files

### `activity_main.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@color/background">

    <!-- WebView -->
    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>
```

### `strings.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Gemini Live Agent</string>
    <string name="permission_audio_rationale">Microphone access required for voice conversations</string>
    <string name="permission_camera_rationale">Camera access required for screen capture</string>
</resources>
```

---

## 🔄 Step 9: Build and Release

### Build Debug APK
```bash
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK (Signed)
```bash
export KEYSTORE_PATH="/path/to/release.jks"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_ALIAS="production"
export KEY_PASSWORD="your-key-password"

./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Build Android App Bundle (AAB) for Play Store
```bash
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## 📦 Step 10: Deploy React App to Android Assets

```bash
# From project root
cd frontend

# Build React app with Vite
npm run build

# Copy dist to Android assets
cp -r dist/* ../android/app/src/main/assets/react_app/

# Ensure index.html loads correctly
# Update MainActivity to load: "file:///android_asset/react_app/index.html"
```

---

## 🧪 Testing

### Test on Emulator
```bash
# List available emulators
emulator -list-avds

# Launch emulator
emulator -avd Pixel_4_API_34

# Install app
adb install app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep "GeminiLiveAgent"
```

### Test on Physical Device
```bash
# Enable USB Debugging on device
# Settings > Developer Options > USB Debugging

# Connect device via USB
adb devices

# Install and run
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n dev.geminiliveagent.app/.MainActivity
```

---

## ✅ Pre-Submission Checklist

- [ ] All code compiles without errors
- [ ] APK/AAB built and signed with production key
- [ ] All permissions declared in AndroidManifest.xml
- [ ] WebView loads React app successfully
- [ ] Microphone access works (if testing available)
- [ ] Network connectivity functional
- [ ] No API keys hardcoded
- [ ] Privacy Policy and Terms linked
- [ ] Screenshots prepared for Play Store
- [ ] Version code incremented
- [ ] Proguard rules configured for release

---

**Version**: 1.0  
**Last Updated**: February 25, 2026  
**Status**: Ready for development
