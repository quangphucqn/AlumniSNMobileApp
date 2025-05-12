import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ProgressCircle({ percent, color }) {
  // percent: 0..1
  const size = 38;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - percent);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Nếu muốn vẽ progress thực sự, dùng react-native-svg hoặc thư viện progress circle */}
      <Text style={{ position: 'absolute', fontWeight: 'bold', fontSize: 13, color }}>{Math.round(percent * 100)}%</Text>
    </View>
  );
}

export default function Groups() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const searchTimeout = useRef();

  const fetchGroups = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.getGroups(token, q, pageNum);
      const groups = res.data.results || res.data;
      setData(prev => {
        if (!append) return groups;
        const map = new Map();
        [...prev, ...groups].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setHasNext(!!res.data.next);
      setPage(pageNum);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách nhóm!');
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
      fetchGroups(search.trim(), 1, false);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchGroups('', 1, false);
  }, []);

  const handleLoadMore = () => {
    if (hasNext && !isLoadingMore && !loading) {
      fetchGroups(search.trim(), page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups(search.trim(), 1, false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={[styles.backBtn, { marginTop: insets.top + 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Nhóm</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm nhóm..."
          value={search}
          onChangeText={setSearch}
        />
        {loading && (
          <ActivityIndicator size={18} color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={[styles.groupRow, { backgroundColor: item.color || '#f6f7fb' }]}> 
            <View style={styles.iconBox}>
              {/* icon: nếu có trường icon, render tương ứng, nếu không thì mặc định */}
              <Ionicons name="people" size={28} color="#3b82f6" />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">{item.group_name}</Text>
              <Text style={styles.taskCount}>{item.user_count || 0} Thành viên</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có nhóm nào</Text>}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
  },
  backBtn: {
    marginLeft: 8,
    marginBottom: 0,
    alignSelf: 'flex-start',
    position: 'absolute',
    zIndex: 10,
    top: 0,
    left: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  taskCount: {
    fontSize: 13,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -32,
    marginBottom: 10,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
});
