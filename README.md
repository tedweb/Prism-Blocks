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

## Before publishing

Change `com.example.prismblocks` in `app.json` to a bundle/package ID you own. Add 1024×1024 app icon and splash artwork, then configure an EAS account and run `npx eas build:configure`.

## Product note

Prism Blocks uses an original name and visual identity. Its familiar block-puzzle rules are implemented from scratch; it does not include Block Blast branding, artwork, code, sounds, or other proprietary assets.
