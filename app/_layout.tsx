import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";

import "./global.css";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";

Sentry.init({
  dsn: 'https://35e1118a3e79924172f890a21177e7f7@o4510543395684352.ingest.de.sentry.io/4510543442018384',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// 👈 REQUIRED for Expo Router fonts to work
SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
    const {isLoading, fetchAuthenticatedUser}= useAuthStore();


    const [fontsLoaded, error] = useFonts({
        "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
        "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
        "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
        "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
        "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
    });

    useEffect(() => {
        if (error) throw error;

        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, error]);


    useEffect(() => {
        fetchAuthenticatedUser()
    }, []);

    if (!fontsLoaded || isLoading) return null; // 👈 important



    return <Stack screenOptions={{ headerShown: false }} />;
});