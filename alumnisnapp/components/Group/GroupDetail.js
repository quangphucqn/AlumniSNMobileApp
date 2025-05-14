import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import groupStyles from './GroupStyles';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const USER_ROW_HEIGHT = 68; // hoặc đúng với style userRow

export default function GroupDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [search, setSearch] = useState('');
  const searchTimeout = useRef();

  const fetchGroupDetail = async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await api.getGroupDetail(token, groupId, pageNum, q);
      // Dữ liệu backend trả về: { count, next, previous, results: { ...group, users: [...] } }
      const { count, next, previous, results } = res.data;
      if (pageNum === 1) {
        setGroup(results);
        setUsers(results.users || []);
      } else {
        setUsers(prev => {
          const map = new Map();
          [...prev, ...(results.users || [])].forEach(u => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
      setHasNext(!!next);
      setPage(pageNum);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết nhóm!');
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
      fetchGroupDetail(search.trim(), 1, false);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchGroupDetail('', 1, false);
  }, [groupId]);

  const handleLoadMore = () => {
    if (hasNext && !isLoadingMore && !loading) {
      fetchGroupDetail(search.trim(), page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroupDetail(search.trim(), 1, false);
  };

  const handleDeleteUser = async (user) => {
    Alert.alert('Xóa thành viên', `Bạn muốn xóa ${user.last_name} ${user.first_name} khỏi nhóm?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('access_token');
          await api.removeUsers(token, groupId, { users: [user.id] });
          fetchGroupDetail(search.trim(), 1, false);
        } catch (e) {
          Alert.alert('Lỗi', 'Không thể xoá thành viên!');
        } finally {
          Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm!');
        }
      }}
    ]);
  };

  const renderRightActionsUser = (progress, dragX, onDelete) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <View style={{ width: 80, height: '100%', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible' }}>
        <Animated.View style={{ transform: [{ translateX: trans }], height: '100%', width: 80, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={[groupStyles.deleteUserBtn]} onPress={onDelete}>
            <Text style={groupStyles.deleteText}>Xóa</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderUser = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActionsUser(progress, dragX, () => handleDeleteUser(item))
      }
    >
      <View style={groupStyles.userRow}>
        <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={groupStyles.userName}>{item.last_name} {item.first_name}</Text>
          <Text style={groupStyles.userEmail}>{item.email}</Text>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <SafeAreaView style={groupStyles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={[groupStyles.backBtn, { marginTop: insets.top + 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#222" />
      </TouchableOpacity>
      {group && (
        <View style={groupStyles.header}>
          <Text style={groupStyles.title}>{group.group_name}</Text>
          {group.description ? <Text style={groupStyles.desc}>{group.description}</Text> : null}
        </View>
      )}
      <View style={groupStyles.searchBar}>
        <TextInput
          style={groupStyles.input}
          placeholder="Tìm kiếm thành viên..."
          value={search}
          onChangeText={setSearch}
        />
        {loading && (
          <ActivityIndicator size={18} color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
        <TouchableOpacity onPress={() => navigation.navigate('AddUser', { groupId, existingUserIds: users.map(u => u.id) })} style={{ marginLeft: 8 }}>
          <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={users}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={renderUser}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có thành viên nào</Text>}
      />
    </SafeAreaView>
  );
}
