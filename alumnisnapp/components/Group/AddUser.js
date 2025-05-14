import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../configs/API';
import groupStyles from './GroupStyles';

export default function AddUser() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, existingUserIds = [] } = route.params;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users with pagination and search
  const fetchUsers = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoadingUsers(true);
    else setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.userList(token, q, pageNum);
      const list = res.data.results || res.data;
      setUsers(prev => {
        if (!append) return list;
        const map = new Map();
        [...prev, ...list].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setHasNext(!!res.data.next);
      setPage(pageNum);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách user!');
    } finally {
      setLoadingUsers(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers('', 1, false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(search.trim(), 1, false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleLoadMore = () => {
    if (hasNext && !loadingMore && !loadingUsers) {
      fetchUsers(search.trim(), page + 1, true);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleAddUsers = async () => {
    if (selectedUserIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 người dùng!');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      await api.addUsers(token, groupId, { users: selectedUserIds });
      Alert.alert('Thành công', 'Đã thêm thành viên!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể thêm thành viên!');
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => {
    const selected = selectedUserIds.includes(item.id);
    const alreadyInGroup = existingUserIds.includes(item.id);
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 8,
          backgroundColor: alreadyInGroup ? '#f3f4f6' : (selected ? '#e0e7ff' : '#fff'),
          borderRadius: 8,
          marginBottom: 4,
          opacity: alreadyInGroup ? 0.5 : 1
        }}
        onPress={() => !alreadyInGroup && toggleSelectUser(item.id)}
        activeOpacity={alreadyInGroup ? 1 : 0.7}
        disabled={alreadyInGroup}
      >
        <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: '#222' }}>{item.last_name} {item.first_name}</Text>
          <Text style={{ color: '#888', fontSize: 13 }}>{item.email}</Text>
        </View>
        {alreadyInGroup ? (
          <Ionicons name="checkmark-circle" size={24} color="#bbb" />
        ) : (
          <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={24} color={selected ? '#2563eb' : '#bbb'} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[groupStyles.container, { flex: 1 }]}> 
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 8, paddingLeft: 0, marginBottom: 8 }}>
        <TouchableOpacity style={[groupStyles.backBtn, { position: 'relative', top: 0, left: 0, marginTop: 0 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={[groupStyles.title, { flex: 1, textAlign: 'center', marginLeft: -24 }]}>Thêm thành viên</Text>
      </View>
      <View style={[groupStyles.searchBar, { marginBottom: 12 }]}> 
        <TextInput
          style={groupStyles.input}
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChangeText={setSearch}
        />
        {loadingUsers && <ActivityIndicator size={18} color="darkgray" style={{ marginLeft: 8 }} />}
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
        onPress={handleAddUsers}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={groupStyles.addBtnText}>Thêm thành viên</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
} 