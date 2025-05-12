import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { api } from '../../configs/API';
import { MyUserContext, MyDispatchContext } from '../../configs/Context';

// Component cho Drawer Content
function DrawerContent({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useContext(MyDispatchContext);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Chỉ xóa access_token và refresh_token khi logout, không cần xóa user
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      dispatch({ type: 'logout' });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigation.closeDrawer();
    setTimeout(() => {
      navigation.getParent()?.navigate('ChangePassword');
    }, 300);
  };

  return (
    <View style={styles.drawerContainer}>
      <SafeAreaView edges={['top', 'right', 'left']} style={styles.safeArea}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Cài đặt</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <View style={styles.drawerItemLeft}>
            <Ionicons name="key-outline" size={24} color="#222" />
            <Text style={styles.drawerItemText}>Đổi mật khẩu</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <View style={styles.drawerItemLeft}>
            <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
            <Text style={[styles.drawerItemText, { color: '#ff3b30' }]}>Đăng xuất</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function ProfileContent() {
  const navigation = useNavigation();
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);
  const [refreshing, setRefreshing] = useState(false);

  // Hàm lấy user mới nhất từ server và cập nhật vào context
  const loadUserData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      if (accessToken) {
        // Gọi API lấy user mới nhất và cập nhật vào context
        const res = await api.getCurrentUser(accessToken);
        dispatch({ type: 'login', payload: res.data });
      } else {
        // Nếu không có token thì logout
        dispatch({ type: 'logout' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      dispatch({ type: 'logout' });
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
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cover + Avatar */}
        <View style={styles.coverContainer}>
          {user.cover ? (
            <Image source={{ uri: user.cover }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatar || 'https://via.placeholder.com/150' }} style={styles.avatarImage} />
          </View>
          <View style={styles.headerAbsolute}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Feather name="menu" size={24} color="#222" />
            </TouchableOpacity>
          </View>
        </View>
        {/* InfoRow dưới cover, tránh bị nút che */}
        <View style={styles.infoRow}>
          <Text style={styles.profileName}>{user.last_name} {user.first_name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        {/* Nội dung cuộn */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.actionButtonText}>Chỉnh sửa trang cá nhân</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Chia sẻ trang cá nhân</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Bài viết</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabText}>Bài viết đang trả lời</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Bạn chưa đăng bài viết nào.</Text>
        </View>
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
            width: '80%',
            backgroundColor: '#fff',
          },
          drawerPosition: 'right',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          drawerType: 'front',
        }}
      >
        <Drawer.Screen name="ProfileContent" component={ProfileContent} />
      </Drawer.Navigator>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  coverContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#f5f5f5',
    marginBottom: 56,
    justifyContent: 'flex-end',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarWrapper: {
    position: 'absolute',
    right: 16,
    bottom: -48,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  infoRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  profileEmail: {
    fontSize: 15,
    color: '#888',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#222',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#222',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginTop: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#222',
  },
});