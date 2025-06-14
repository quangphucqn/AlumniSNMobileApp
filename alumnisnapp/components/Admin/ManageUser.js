import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { api, getListUsers } from '../../configs/API';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import groupStyles from '../Group/GroupStyles';
import styles from '../Admin/AdminStyles';
import { Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const ROLE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Admin', value: 0 },
  { label: 'Giáo viên', value: 2 },
  { label: 'Sinh viên', value: 1 },
];

export default function ManageUser() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [role, setRole] = useState('');
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [modalOpacity] = useState(new Animated.Value(0));
  const navigation = useNavigation();
  // Fetch users with pagination, search, role
  const fetchUsersList = async (q = '', pageNum = 1, append = false, roleValue = role) => {
    if (pageNum === 1) setLoadingUsers(true);
    else setLoadingMore(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const list = await getListUsers(token, q, pageNum, roleValue);
      setUsers(prev => {
        if (!append) return list.results || list;
        const map = new Map();
        [...prev, ...(list.results || list)].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setHasNext(!!(list.next));
      setPage(pageNum);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách user!');
    } finally {
      setLoadingUsers(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsersList('', 1, false, role);
  }, [role]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsersList(search.trim(), 1, false, role);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleLoadMore = () => {
    if (hasNext && !loadingMore && !loadingUsers) {
      fetchUsersList(search.trim(), page + 1, true, role);
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert('Xoá người dùng', `Bạn muốn xoá người dùng ${user.last_name} ${user.first_name}`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try {
          const token = await SecureStore.getItemAsync('access_token');
          await api.deleteUser(token, user.id);
          setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (e) {
          Alert.alert('Lỗi', 'Không thể xoá user!');
        }
      }}
    ]);
  };

  const renderRightActions = (progress, dragX, onDelete) => (
    <View style={{ width: 80, height: '100%', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible' }}>
      <TouchableOpacity style={styles.deleteUserBtnUser} onPress={onDelete}>
        <Text style={styles.deleteTextUser}>Xoá</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUser = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, () => handleDeleteUser(item))}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 70, paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 10, marginBottom: 2, elevation: 1,height: 90 }}>
        <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#eee' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: '#222' }}>{item.last_name} {item.first_name}</Text>
          <Text style={{ color: '#888', fontSize: 13 }}>{item.email}</Text>
        </View>
        <Text style={{ color: '#888', fontSize: 13, marginRight: 8 }}>{item.role === 0 ? 'Admin' : item.role === 2 ? 'Giáo viên' : 'Sinh viên'}</Text>
      </View>
    </Swipeable>
  );

  const openRoleModal = () => {
    setRoleModalVisible(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const closeRoleModal = () => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => setRoleModalVisible(false));
  };

  const handleSelectRole = (value) => {
    setRole(value);
    closeRoleModal();
  };

  return (
    <SafeAreaView style={[groupStyles.container, { flex: 1 }]}>
      <TouchableOpacity style={[styles.backBtn, { marginTop: 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#222" />
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 8, paddingLeft: 0, marginBottom: 8 }}>
        <Text style={[groupStyles.title, { flex: 1, textAlign: 'center' }]}>Quản lý người dùng</Text>
      </View>
      <View style={[groupStyles.searchBar, { marginBottom: 12 }]}> 
        <TextInput
          style={groupStyles.input}
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={openRoleModal} style={{ marginLeft: 8 }}>
          <MaterialIcons name="filter-list" size={28} color={role === '' ? '#888' : '#2563eb'} />
        </TouchableOpacity>
        {loadingUsers && <ActivityIndicator size={18} color="darkgray" style={{ marginLeft: 8 }} />}
      </View>
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeRoleModal}
      >
        <Animated.View style={[styles.roleModalContainer, { backgroundColor: modalOpacity.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)'] }) }] }>
          <Animated.View style={[styles.roleModalBox, { opacity: modalOpacity, transform: [{ scale: modalOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }] }>
            <Text style={styles.roleModalTitle}>Chọn vai trò</Text>
            {ROLE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.roleOption, role === opt.value && styles.roleOptionSelected]}
                onPress={() => handleSelectRole(opt.value)}
              >
                <Text style={[styles.roleOptionText, role === opt.value && styles.roleOptionTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={closeRoleModal} style={styles.roleModalCloseBtn}>
              <Text style={styles.roleModalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
      <FlatList
        data={users}
        keyExtractor={item => item.id?.toString()}
        renderItem={renderUser}
        style={{ flex: 1, marginHorizontal: 16, marginBottom: 12 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={!loadingUsers && <Text style={{ textAlign: 'center', color: '#888', marginTop: 24 }}>Không có người dùng nào</Text>}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={loadingMore ? <ActivityIndicator size={18} color="#3b82f6" /> : null}
      />
    </SafeAreaView>
  );
}
