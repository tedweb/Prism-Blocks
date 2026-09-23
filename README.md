# Prism Blocks

An original, ad-free block puzzle for iPhone and Android, built with Expo SDK 57 and React Native.

## Features

- Drag-and-drop placement on an 8×8 board
- Row and column clears, combo multiplier, high score persistence
- Haptic feedback with an in-game toggle
- First-run tutorial and game-over detection
- Offline-only; no ads, analytics, accounts, tracking, or network calls
- Responsive portrait layout for phones and tablets

## Run locally

1. Install Node.js 20+ and the Expo Go app on your phone.
2. In this folder, run `npm install`.
3. Sign in with the same Expo account used in Expo Go by running `npx expo login`.
4. Run `npm start`.
5. On iPhone, scan the QR code using Apple's Camera app and tap **Open in Expo Go**.

If the phone and computer cannot connect over local Wi-Fi, run `npx expo start --tunnel` instead.

Use `npm run ios` or `npm run android` with a configured simulator/emulator.

## Install on a physical device

### Option 1: Expo Go (fastest for development)

Install Expo Go from the App Store or Google Play, run `npm start`, and scan the QR code. The computer must keep the Expo development server running. If local Wi-Fi discovery fails, use `npx expo start --tunnel`.

### Prepare standalone test builds

Standalone builds run without Expo Go or a development server. They require an Expo account and EAS Build.

1. Set unique values for `ios.bundleIdentifier` and `android.package` in `app.json`.
2. Run `npx eas-cli@latest login`.
3. Run `npx eas-cli@latest build:configure`.
4. Add an internal-distribution profile to `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### iPhone

#### EAS internal distribution (direct device installation)

This uses Apple's ad hoc distribution and requires a paid Apple Developer Program membership. Every iPhone must be registered before the build is created.

1. Register the iPhone by running `npx eas-cli@latest device:create` and opening the provided link on that iPhone.
2. Build with `npx eas-cli@latest build --platform ios --profile preview`.
3. Open the EAS build link on a registered iPhone and follow the installation prompts.

Adding another iPhone requires registering it and creating a new build. An `.ipa` cannot normally be installed on an arbitrary, unregistered iPhone.

#### TestFlight (recommended for wider beta testing)

TestFlight also requires a paid Apple Developer Program membership, but testers do not need to provide device identifiers.

1. Create the app record in App Store Connect.
2. Build with `npx eas-cli@latest build --platform ios --profile production`.
3. Upload the latest build with `npx eas-cli@latest submit --platform ios --latest`.
4. Add testers in App Store Connect. Testers install Apple's TestFlight app and accept the invitation or public link.

### Android

#### Install an APK from an EAS link

1. Build with `npx eas-cli@latest build --platform android --profile preview`.
2. Open the EAS build link on the Android device and download the `.apk`.
3. If prompted, allow the browser or file manager to **Install unknown apps**.
4. Open the downloaded APK and approve the installation.

Android App Bundles (`.aab`) are intended for Google Play and cannot be installed directly. Use an `.apk` for sideloading.

#### Install an APK over USB

Enable Developer options and USB debugging on the Android device, connect it to the computer, and run:

```bash
adb install -r path/to/prism-blocks.apk
```

The Android SDK Platform Tools must be installed so the `adb` command is available.

Official references: [Expo internal distribution](https://docs.expo.dev/build/internal-distribution/), [Expo APK builds](https://docs.expo.dev/build-reference/apk/), and [Apple TestFlight](https://developer.apple.com/testflight/).

## Before publishing

Change `com.example.prismblocks` in `app.json` to a bundle/package ID you own. Add 1024×1024 app icon and splash artwork, then configure an EAS account and run `npx eas build:configure`.

## Product note

Prism Blocks uses an original name and visual identity. Its familiar block-puzzle rules are implemented from scratch; it does not include Block Blast branding, artwork, code, sounds, or other proprietary assets.
