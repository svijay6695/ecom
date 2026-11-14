# 🥜 VP Nuts — React Native Mobile App

The official native mobile storefront for **VP Nuts (Kumbakonam, Tamil Nadu)** built with **React Native & Expo**.

---

## 📱 Features

- **Storefront & Catalog**: Fast browsing of premium California almonds, cashews, walnuts, dates, and seeds with live search & category filters.
- **Dynamic Weight Selector**: Switch seamlessly between 250g, 500g, and 1kg packs with live price calculations.
- **Smart Cart & Coupon Engine**: Persistent local cart powered by `@react-native-async-storage/async-storage` with instant promo code support (`VPNUTS10`).
- **Live Dispatch Stepper**: Real-time order tracking journey from Kumbakonam packaging hub to customer doorstep.
- **Native Checkout**: Choose between Cash on Delivery (COD) and Online UPI / Razorpay payment modes.
- **Profile & Address Manager**: Save, edit, and manage multiple delivery addresses across Tamil Nadu.

---

## 🚀 How to Run the App

### Option 1: On Your Physical Phone (Easiest & Fastest)
1. Install **Expo Go** from Google Play Store (Android) or App Store (iOS).
2. From the root directory, start the development server:
   ```bash
   npm run mobile
   # or: cd mobile && npx expo start
   ```
3. Open the **Expo Go** app on Android and tap **Scan QR code**, or on iPhone scan the QR code using the **Camera app**.
4. The app opens and runs live on your phone with Fast Refresh!

### Option 2: On Android Emulator / iOS Simulator
```bash
# Android Emulator
npm run mobile:android

# iOS Simulator (macOS only)
npm run mobile:ios
```

---

## 📦 How to Build Standalone APK / AAB (For Google Play)

Using **EAS Build** (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
Download the resulting `.apk` file directly to your phone and install it!

