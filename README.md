# Arbor 🌿

A plant care and community plant-sitting app built with React Native and Expo.

## Features
- Plant identification using AI scanning
- Watering reminders and plant health tracking
- Community plant-sitting requests with map view
- Real-time chat between plant owners and sitters

## Setup

1. Clone the repository:
   git clone https://github.com/masarrahsgit/Arbor.git cd Arbor

2. Install dependencies:
   npm install --legacy-peer-deps

3. Set up environment variables:
   cp .env.example .env
   Fill in your own API keys in `.env`

4. Start the app
   npx expo start --tunnel


## Environment Variables

See `.env.example` for required keys:
- `EXPO_PUBLIC_SUPABASE_URL` — from your Supabase project settings
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings
- `EXPO_PUBLIC_GEMINI_API_KEY` — from Google AI Studio
- `EXPO_PUBLIC_PLANT_ID_KEY` — from plant.id

## Tech Stack
- React Native + Expo
- Expo Router (file-based navigation)
- Supabase (auth + database)
- Google Gemini (plant identification)
- React Native Maps
