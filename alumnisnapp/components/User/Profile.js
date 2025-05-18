import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { api } from '../../configs/API';
import { MyUserContext } from '../../configs/Context';
import UserStyles from './UserStyles';
import ProfileScreen from "../User/ProfileScreen";

// Component cho Drawer Content
function DrawerContent({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useContext(MyUserContext);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Chỉ xóa access_token khi logout
      await AsyncStorage.removeItem('access_token');
      
      dispatch({ type: 'logout' })

    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigation.closeDrawer();
    setTimeout(() => {
      navigation.getParent()?.navigate("ChangePassword");
    }, 300);
  };

  return (
    <View style={UserStyles.drawerContainer}>
      <SafeAreaView
        edges={["top", "right", "left"]}
        style={UserStyles.safeArea}
      >
        <View style={UserStyles.drawerHeader}>
          <Text style={UserStyles.drawerTitle}>Cài đặt</Text>
        </View>

        <TouchableOpacity
          style={UserStyles.drawerItem}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <View style={UserStyles.drawerItemLeft}>
            <Ionicons name="key-outline" size={24} color="#222" />
            <Text style={UserStyles.drawerItemText}>Đổi mật khẩu</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={UserStyles.drawerItem}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <View style={UserStyles.drawerItemLeft}>
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
            <Text style={[UserStyles.drawerItemText, { color: "#ff3b30" }]}>
              Đăng xuất
            </Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function ProfileContent() {
  const navigation = useNavigation();
  const { state, dispatch } = useContext(MyUserContext);
  const user = state.user;
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // ✅ THÊM useState CHỖ NÀY

  const loadUserData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      if (accessToken) {
        const res = await api.getCurrentUser(accessToken);
        dispatch({ type: "login", payload: res.data });
      } else {
        dispatch({ type: "logout" });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      dispatch({ type: "logout" });
    }
  };

  

  useEffect(() => {
    loadUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cover + Avatar */}
        <View style={UserStyles.coverContainer}>
          {user.cover ? (
            <Image source={{ uri: user.cover }} style={UserStyles.coverImage} />
          ) : (
            <View style={UserStyles.coverPlaceholder} />
          )}
          <View style={UserStyles.avatarWrapper}>
            <Image
              source={{ uri: user.avatar || "https://via.placeholder.com/150" }}
              style={UserStyles.avatarImage}
            />
          </View>
          <View style={UserStyles.headerAbsolute}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Feather name="menu" size={24} color="#222" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={UserStyles.infoRow}>
          <Text style={UserStyles.profileName}>
            {user.last_name} {user.first_name}
          </Text>
          <Text style={UserStyles.profileEmail}>{user.email}</Text>
        </View>

        <View style={UserStyles.buttonRow}>
          <TouchableOpacity
            style={UserStyles.actionButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={UserStyles.actionButtonText}>
              Chỉnh sửa trang cá nhân
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={UserStyles.actionButton}>
            <Text style={UserStyles.actionButtonText}>
              Chia sẻ trang cá nhân
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={UserStyles.tabs}>
          <TouchableOpacity
            style={[
              UserStyles.tabItem,
              activeTab === "posts" && UserStyles.tabActive,
            ]}
            onPress={() => setActiveTab("posts")}
          >
            <Text
              style={[
                UserStyles.tabText,
                activeTab === "posts" && UserStyles.tabTextActive,
              ]}
            >
              Bài viết
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              UserStyles.tabItem,
              activeTab === "replies" && UserStyles.tabActive,
            ]}
            onPress={() => setActiveTab("replies")}
          >
            <Text
              style={[
                UserStyles.tabText,
                activeTab === "replies" && UserStyles.tabTextActive,
              ]}
            >
              Bài viết đang trả lời
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nội dung tabs */}
        {activeTab === "posts" ? (
          <View style={{ marginTop: 10 }}>
            <ProfileScreen />
          </View>
        ) : (
          <View style={UserStyles.emptyState}>
            <Text style={UserStyles.emptyText}>
              Chưa có bài viết đang trả lời.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Wrap Profile with Drawer Navigator
export default function Profile() {
  const Drawer = createDrawerNavigator();

  return (
    <SafeAreaProvider>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: "80%",
            backgroundColor: "#fff",
          },
          drawerPosition: "right",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          drawerType: "front",
        }}
      >
        <Drawer.Screen name="ProfileContent" component={ProfileContent} />
      </Drawer.Navigator>
    </SafeAreaProvider>
  );
}
