import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './AdminStyles';

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
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
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
      <TouchableOpacity style={[styles.backBtn, { marginTop: 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#222" />
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
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
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
