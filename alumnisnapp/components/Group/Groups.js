import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import groupStyles from './GroupStyles';
import Swipeable from 'react-native-gesture-handler/Swipeable';

// function ProgressCircle({ percent, color }) {
//   // percent: 0..1
//   const size = 38;
//   const strokeWidth = 4;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const progress = circumference * (1 - percent);
//   return (
//     <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
//       {/* Nếu muốn vẽ progress thực sự, dùng react-native-svg hoặc thư viện progress circle */}
//       <Text style={{ position: 'absolute', fontWeight: 'bold', fontSize: 13, color }}>{Math.round(percent * 100)}%</Text>
//     </View>
//   );
// }

const GROUP_ROW_HEIGHT = 64; // hoặc đúng với style groupRow
const renderRightActionsGroup = (progress, dragX, onDelete) => {
  const trans = dragX.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 80],
    extrapolate: 'clamp',
  });
  return (
    <View style={{ width: 80, height: '100%', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible' }}>
      <Animated.View style={{ transform: [{ translateX: trans }], height: '100%', width: 80, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity style={[groupStyles.deleteGroupBtn]} onPress={onDelete}>
          <Text style={groupStyles.deleteText}>Xóa</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

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

  const handleDeleteGroup = (group) => {

    Alert.alert('Xóa nhóm', `Bạn muốn xóa nhóm: ${group.group_name}?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('access_token');
            await api.deleteGroup(token, group.id);
            fetchGroups(search.trim(), 1, false);
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xoá nhóm!');
          } finally {
            Alert.alert('Thành công', 'Đã xóa nhóm!');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={groupStyles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={[groupStyles.backBtn, { marginTop: insets.top + 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#222" />
      </TouchableOpacity>
      <Text style={groupStyles.title}>Danh sách nhóm</Text>
      <View style={groupStyles.searchBar}>
        <TextInput
          style={groupStyles.input}
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={(progress, dragX) =>
              renderRightActionsGroup(progress, dragX, () => handleDeleteGroup(item))
            }
          >
            <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })} activeOpacity={0.8}>
              <View style={groupStyles.groupRow}>
                <View style={groupStyles.iconBox}>
                  <Ionicons name="people" size={28} color="#3b82f6" />
                </View>
                <View style={groupStyles.infoCol}>
                  <Text style={groupStyles.groupName} numberOfLines={1} ellipsizeMode="tail">{item.group_name}</Text>
                  <Text style={groupStyles.taskCount}>{item.user_count || 0} Thành viên</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có nhóm nào</Text>}
      />
      <TouchableOpacity style={groupStyles.fab} activeOpacity={0.8} onPress={() => navigation.navigate('CreateGroup')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
