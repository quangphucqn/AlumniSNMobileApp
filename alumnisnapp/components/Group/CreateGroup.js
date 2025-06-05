import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { api, getListUsers } from '../../configs/API';
import groupStyles from './GroupStyles';
import { useNavigation } from '@react-navigation/native';
import { EncodingType } from 'expo-file-system';

export default function CreateGroup() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]); // full list
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users with pagination and search
  const fetchUsersList = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoadingUsers(true);
    else setLoadingMore(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const list = await getListUsers(token, q, pageNum);
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

  // Initial load
  useEffect(() => {
    fetchUsersList('', 1, false);
  }, []);

  // Search filter (call API)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsersList(search.trim(), 1, false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Load more users when scroll to end
  const handleLoadMore = () => {
    if (hasNext && !loadingMore && !loadingUsers) {
      fetchUsersList(search.trim(), page + 1, true);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm!');
      return;
    }
    if (selectedUserIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const data = {
        group_name: groupName.trim(),
        users: selectedUserIds,
      };
      await api.createGroup(token, data);
      Alert.alert('Thành công', 'Tạo nhóm thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tạo nhóm!');
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => {
    const selected = selectedUserIds.includes(item.id);
    return (
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: selected ? '#e0e7ff' : '#fff', borderRadius: 8, marginBottom: 4 ,height: 80}}
        onPress={() => toggleSelectUser(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: '#222' }}>{item.last_name} {item.first_name}</Text>
          <Text style={{ color: '#888', fontSize: 13 }}>{item.email}</Text>
        </View>
        <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={24} color={selected ? '#2563eb' : '#bbb'} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[groupStyles.container, { flex: 1 }]} edges={['right', 'left']}> 
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 8, paddingLeft: 0, marginBottom: 8 }}>
        <TouchableOpacity style={[groupStyles.backBtn, { position: 'relative', top: 0, left: 0, marginTop: 0 ,marginLeft: 10}]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      <Text style={groupStyles.title}>Tạo nhóm mới</Text>
      <View style={[groupStyles.searchBar, { marginBottom: 16 }]}> 
        <TextInput
          style={groupStyles.input}
          placeholder="Nhập tên nhóm..."
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>
      <View>
        <Text style={{ marginTop:5,marginLeft: 25, marginBottom: 10, color: '#222', fontWeight: 'bold' }}>Chọn thành viên:</Text>
        <View style={[groupStyles.searchBar, { marginBottom: 12 }]}> 
        <TextInput
          style={groupStyles.input}
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChangeText={setSearch}
        />
        {loadingUsers && <ActivityIndicator size={18} color="darkgray" style={{ marginLeft: 8 }} />}
      </View>
      </View>
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
      <TouchableOpacity
        style={[groupStyles.addBtn, { marginBottom: 24, marginHorizontal: 16, backgroundColor: loading ? '#bbb' : '#2563eb' }]}
        onPress={handleCreateGroup}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={groupStyles.addBtnText}>Tạo nhóm</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
