import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { api } from '../../configs/API';

// Component cho Drawer Content
function DrawerContent({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.multiRemove(['access_token', 'user']);
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SafeAreaView cho phần trên */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <Feather name="menu" size={24} color="#222" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.last_name} {user.first_name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
            <Image
              source={{ uri: user.avatar || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton}>
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

    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#eee',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    color: '#222',
    marginRight: 6,
    fontWeight: '500',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
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