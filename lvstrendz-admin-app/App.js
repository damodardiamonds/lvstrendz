import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Default server URLs - update according to environment
const DEFAULT_PROD_URL = "https://lvstrendz.com/admin";
const DEFAULT_DEV_URL = Platform.OS === "android" ? "http://10.0.2.2:3000/admin" : "http://localhost:3000/admin";

export default function App() {
  const [adminUrl, setAdminUrl] = useState(DEFAULT_PROD_URL);
  const [useLocalHost, setUseLocalHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  
  const webViewRef = useRef(null);

  const currentTargetUrl = useLocalHost ? DEFAULT_DEV_URL : adminUrl;

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToBackend(token, currentTargetUrl);
      }
    });

    // Listen for incoming notifications when app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification Received:", notification);
    });

    // Listen for user clicking a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.url && webViewRef.current) {
        webViewRef.current.navigate(data.url);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [currentTargetUrl]);

  async function sendTokenToBackend(token, baseUrl) {
    try {
      const apiHost = baseUrl.replace(/\/admin.*$/, "");
      await fetch(`${apiHost}/api/admin/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: token }),
      });
    } catch (err) {
      console.warn("Failed to register push token with backend:", err);
    }
  }

  const handleRefresh = () => {
    setIsError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const toggleEnvironment = () => {
    setUseLocalHost((prev) => !prev);
    setIsError(false);
    setIsLoading(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#A0463E" />

      {/* Admin App Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>LV&apos;s Trendz Admin</Text>
          <Text style={styles.headerSubtitle}>
            {useLocalHost ? "Local Dev" : "Live Store"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.envButton}
            onPress={toggleEnvironment}
          >
            <Text style={styles.envButtonText}>
              {useLocalHost ? "Use Live" : "Use Local"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A0463E" />
          <Text style={styles.loadingText}>Loading Admin Control Center...</Text>
        </View>
      )}

      {/* Error Fallback Screen */}
      {isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to connect to Admin Panel</Text>
          <Text style={styles.errorSub}>
            Target URL: {currentTargetUrl}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: currentTargetUrl }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setIsError(true);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          style={styles.webview}
        />
      )}
    </SafeAreaView>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#A0463E",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted.");
      return null;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A0463E",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  header: {
    height: 54,
    backgroundColor: "#A0463E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  headerTitleContainer: {
    flexDirection: "column",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  envButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  envButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    color: "#4A5568",
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSub: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#A0463E",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
