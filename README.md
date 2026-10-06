# MediPick - Customer UI

This is the customer-facing mobile application for MediPick, built with React Native and Expo.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory based on `.env.example` (if provided) and set your backend API URL. For example:
   ```env
   EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   ```
   *(Note: If testing on a physical device via Expo Go, you must use your computer's local IP address instead of 127.0.0.1)*

3. **Start the app:**
   ```bash
   npx expo start
   ```
   Press `w` to open in a web browser, or scan the QR code with the Expo Go app on your phone.

## Project Structure
- `/src/api` - API client configurations and endpoints (communicates with the Customer Backend)
- `/src/screens` - All the UI screens for the application
- `/src/components` - Reusable UI components
- `/src/context` - React contexts (Auth, Theme, Cart, etc.)
- `/assets` - Static assets like images and fonts
