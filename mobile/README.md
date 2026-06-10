# CarBooking Mobile

Expo SDK 56 application connected to the CarBooking Express API.

## Included

- Secure JWT storage with Expo SecureStore
- Login, registration, forgot password, and reset password
- Fleet browsing, map route points, current pickup, automatic distance and fare
- Scheduled booking creation and ride history filters
- Native Stripe Payment Sheet
- Live Socket.IO notifications and driver tracking
- Profile name and password updates
- Driver ride claiming and foreground location sharing
- Admin booking status, fleet creation, car image upload, and hero upload

## Environment

Copy .env.example to .env:

    EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:5000
    EXPO_PUBLIC_STRIPE_KEY=pk_test_your_publishable_key
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_development_maps_key
    EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your_android_restricted_key
    EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=your_ios_restricted_key

Physical phones cannot use localhost to reach the computer. Use the computer LAN address, such as http://192.168.1.20:5000, and allow port 5000 through the firewall. Android Emulator defaults to http://10.0.2.2:5000 when no URL is provided. iOS Simulator defaults to http://localhost:5000.

## Google Maps setup

Enable Maps SDK for Android and Maps SDK for iOS in Google Cloud. Android keys must allow package com.jahanmal.carbooking and the signing SHA-1. For the current debug build use SHA-1 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25. iOS keys must allow bundle identifier com.jahanmal.carbooking. A browser key restricted by HTTP referrers will not work in a native app. The shared GOOGLE_MAPS_API_KEY is convenient for local testing; platform-specific keys override it.

Map API keys are native configuration. After adding or changing them, stop Expo and rebuild the binary with npx expo run:android or npx expo run:ios. Hot reload is not sufficient.

## API connectivity

Keep the phone and computer on the same Wi-Fi. EXPO_PUBLIC_API_URL must use the computer LAN address, never localhost on a physical phone. Confirm http://YOUR_IP:5000/api/cars opens from the phone browser and allow inbound TCP port 5000 through Windows Firewall. Restart Expo with npx expo start --clear after changing .env.

## Run

    npm install
    npx expo start

A development build is recommended for native Stripe and maps:

    npx expo run:android
    npx expo run:ios

## Permissions

The app requests foreground location only when a customer uses current pickup or a driver starts live sharing. Photo-library access is requested only when an admin selects a car or hero image. Camera, microphone, and background-location permissions are not requested.

## Test accounts

- Admin: admin@test.com / admin123
- Driver: driver@test.com / driver123

Use only in local development.
