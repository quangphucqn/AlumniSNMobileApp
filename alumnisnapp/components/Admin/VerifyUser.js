import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyUser() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null); // id user đang xác thực
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimeout = useRef();

  const fetchUsers = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.getUnverifiedUsers(token, q, pageNum);
      // Giả sử backend trả về { results, next }
      const users = res.data.results || res.data;
      setData(prev => {
        if (!append) return users;
        const map = new Map();
        [...prev, ...users].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setHasNext(!!res.data.next);
      setPage(pageNum);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng!');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Lần đầu load hoặc khi search thay đổi
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchUsers(search.trim(), 1, false);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Load thêm khi kéo tới cuối
  const handleLoadMore = () => {
    if (hasNext && !isLoadingMore && !loading) {
      fetchUsers(search.trim(), page + 1, true);
    }
  };

  // Kéo để làm mới
  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(search.trim(), 1, false);
  };

  // Xác thực user
  const handleVerify = async (id) => {
    setVerifying(id);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.verifyUser(token, id);
      console.log(res.data);
      Alert.alert('Thành công', 'Đã xác thực người dùng!');
      fetchUsers();
    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Xác thực thất bại!');
    } finally {
      setVerifying(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userRow}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.infoCol}>
        <Text style={styles.name}>{item.last_name} {item.first_name}</Text>
        <Text style={styles.mssv}>{item.mssv}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item.id)} disabled={verifying === item.id}>
        {verifying === item.id ? (
          <ActivityIndicator color="#fff" size={18} />
        ) : (
          <Text style={styles.verifyText}>Xác thực</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Danh sách người dùng chưa xác thực</Text>
      <View style={[styles.searchBar, { marginTop: insets.top + 4 }]}>
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChangeText={setSearch}
        />
        {loading && (
          <ActivityIndicator size={18} color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
      </View>
      {/* Danh sách user */}
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có người dùng nào</Text>}
      />
      {loading && (
        <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#222" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    marginLeft: 16,
    // marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 4,
  },
  filterBtn: {
    marginLeft: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  mssv: {
    fontSize: 14,
    color: '#444',
    marginBottom: 1,
  },
  email: {
    fontSize: 13,
    color: '#888',
  },
  verifyBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verifyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
