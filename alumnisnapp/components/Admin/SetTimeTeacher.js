import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatVNTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Chuyển sang UTC+7
  date.setHours(date.getHours() + 7 - date.getTimezoneOffset() / 60);
  const pad = n => n < 10 ? '0' + n : n;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SetTimeTeacher() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingId, setSettingId] = useState(null); // id đang chỉnh thời gian
  const [hasNext, setHasNext] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimeout = useRef();

  const fetchTeachers = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.getTeachersExpiredPassword(token, q, pageNum);
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
      Alert.alert('Lỗi', 'Không thể tải danh sách giảng viên!');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchTeachers(search.trim(), 1, false);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    fetchTeachers('', 1, false);
    // eslint-disable-next-line
  }, []);

  const handleLoadMore = () => {
    if (hasNext && !isLoadingMore && !loading) {
      fetchTeachers(search.trim(), page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeachers(search.trim(), 1, false);
  };

  const handleSetTime = async (id) => {
    setSettingId(id);
    try {
      const token = await AsyncStorage.getItem('access_token');
      await api.setPasswordResetTime(token, id);
      Alert.alert('Thành công', 'Đã chỉnh lại thời gian đổi mật khẩu!');
      fetchTeachers(search.trim(), 1, false);
    } catch (e) {
      Alert.alert('Lỗi', 'Chỉnh thời gian thất bại!');
    } finally {
      setSettingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userRow}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.infoCol}>
        <Text style={styles.name}>{item.last_name} {item.first_name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.time}>Ngày quá hạn: {formatVNTime(item.password_reset_time)}</Text>
      </View>
      <TouchableOpacity
        style={styles.setBtn}
        onPress={() => handleSetTime(item.id)}
        disabled={settingId === item.id}
      >
        {settingId === item.id ? (
          <ActivityIndicator color="#fff" size={18} />
        ) : (
          <Text style={styles.setText}>Chỉnh thời gian</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={[styles.backBtn, { marginTop: insets.top + 4 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Giảng viên quá hạn đổi mật khẩu</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm giảng viên..."
          value={search}
          onChangeText={setSearch}
        />
        {loading && (
          <ActivityIndicator size={18} color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có giảng viên nào</Text>}
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
  backBtn: {
    marginLeft: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 8,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 4,
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
  email: {
    fontSize: 14,
    color: '#444',
    marginBottom: 1,
  },
  time: {
    fontSize: 13,
    color: '#e11d48',
  },
  setBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginLeft: 6,
  },
  setText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
