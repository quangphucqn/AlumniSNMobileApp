import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './AdminStyles';

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
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{item.last_name} {item.first_name}</Text>
        <Text style={styles.mssv} numberOfLines={1} ellipsizeMode="tail">{item.mssv}</Text>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
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
        <Ionicons name="chevron-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Danh sách sinh viên chưa xác thực</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm sinh viên..."
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
