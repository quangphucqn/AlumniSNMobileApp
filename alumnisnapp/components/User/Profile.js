import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, RefreshControl, Switch,FlatList } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { api } from '../../configs/API';
import { MyUserContext } from '../../configs/Context';
import UserStyles from './UserStyles';
import ProfileScreen from "../User/ProfileScreen";
import { authenticateWithBiometrics } from '../../configs/Utils';

// Component cho Drawer Content
function DrawerContent({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const { state, dispatch } = useContext(MyUserContext);
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(false);

  useEffect(() => {
    // Kiểm tra trạng thái Face ID khi component mount
    const checkFaceIDStatus = async () => {
      try {
        const username = state?.user?.username;
        if (username) {
          const status = await AsyncStorage.getItem(`faceIDEnabled_${username}`);
          setIsFaceIDEnabled(status === 'true');
        }
      } catch (error) {
        console.error('Error checking Face ID status:', error);
      }
    };
    checkFaceIDStatus();
  }, [state?.user?.username]);

  const toggleFaceID = async () => {
    try {
      if (!isFaceIDEnabled) {
        // Nếu đang tắt và muốn bật
        const isAuthenticated = await authenticateWithBiometrics();
        if (isAuthenticated) {
          const username = state?.user?.username;
          if (username) {
            await AsyncStorage.setItem(`faceIDEnabled_${username}`, 'true');
          }
          setIsFaceIDEnabled(true);
          Alert.alert('Thành công', 'Đã bật xác thực khuôn mặt');
        } else {
          Alert.alert('Thất bại', 'Xác thực khuôn mặt không thành công');
        }
      } else {
        // Nếu đang bật và muốn tắt
        const username = state?.user?.username;
        if (username) {
          await AsyncStorage.removeItem(`faceIDEnabled_${username}`);
        }
        setIsFaceIDEnabled(false);
        Alert.alert('Thông báo', 'Đã tắt xác thực khuôn mặt');
      }
    } catch (error) {
      console.error('Error toggling Face ID:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái xác thực khuôn mặt');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Chỉ xóa access_token khi logout
      await Promise.all([
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('user')
      ]);
      
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

        <View style={UserStyles.drawerItem}>
          <View style={UserStyles.drawerItemLeft}>
            <Image source={require('../../assets/face-id.png')} style={{ width: 30, height: 30 }} />
            <Text style={UserStyles.drawerItemText}>Đăng nhập bằng khuôn mặt</Text>
          </View>
          <Switch
            value={isFaceIDEnabled}
            onValueChange={toggleFaceID}
            trackColor={{ false: "#767577", true: "#00FF00" }}
            thumbColor={isFaceIDEnabled ? "white" : "#f4f3f4"}
          />
        </View>

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
      const accessToken = await SecureStore.getItemAsync("access_token");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View>
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

            {/* Thông tin cá nhân */}
            <View style={UserStyles.infoRow}>
              <Text style={UserStyles.profileName}>
                {user.last_name} {user.first_name}
              </Text>
              <Text style={UserStyles.profileEmail}>{user.email}</Text>
            </View>

            {/* Hành động */}
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
          </View>
        }
        ListFooterComponent={
          activeTab === "posts" ? (
            <View style={{ flex: 1 }}>
              <ProfileScreen />
            </View>
          ) : (
            <View style={UserStyles.emptyState}>
              <Text style={UserStyles.emptyText}>
                Chưa có bài viết đang trả lời.
              </Text>
            </View>
          )
        }
        keyExtractor={(_, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
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
