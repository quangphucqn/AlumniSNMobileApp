import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { api, getListUsers } from '../../configs/API';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, doc, updateDoc } from "firebase/firestore";
import { app } from '../../configs/firebaseConfig';
import { MyUserContext } from '../../configs/Context';
import ChatRoomStyles from './ChatRoomStyles';

const db = getFirestore(app);

// Component Modal danh sách người dùng
const UserListModal = ({ visible, onClose, onSelectUser, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeout = useRef(null);

  const loadUsers = async (query = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const list = await getListUsers(token, query, pageNum);
      setUsers(prev => {
        if (!append) return list.results || list;
        const map = new Map();
        [...prev, ...(list.results || list)].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setHasMore(!!(list.next));
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadUsers('', 1, false);
    } else {
      // Reset state khi đóng modal
      setSearchQuery('');
      setUsers([]);
      setPage(1);
      setHasMore(true);
    }
  }, [visible]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    // Clear timeout cũ nếu có
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    // Set timeout mới
    searchTimeout.current = setTimeout(() => {
      loadUsers(text, 1, false);
    }, 500);
  };

  // Clear timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadUsers(searchQuery, page + 1, true);
    }
  };

  const renderUser = ({ item }) => {
    const isCurrentUser = String(item.id) === String(currentUserId);
    return (
      <TouchableOpacity
        style={ChatRoomStyles.userItem}
        onPress={() => onSelectUser(item)}
        disabled={isCurrentUser}
      >
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/100' }}
          style={ChatRoomStyles.userAvatar}
        />
        <View style={ChatRoomStyles.userInfo}>
          <Text style={ChatRoomStyles.userName}>
            {item.last_name} {item.first_name}
          </Text>
          {isCurrentUser && (
            <Text style={ChatRoomStyles.userLabel}>(Bạn)</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={ChatRoomStyles.modalOverlay}>
        <View style={ChatRoomStyles.modalContainer}>
          <View style={ChatRoomStyles.modalHeader}>
            <Text style={ChatRoomStyles.modalTitle}>
              Tin nhắn mới
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={ChatRoomStyles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={ChatRoomStyles.searchInput}
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery !== '' && (
              <TouchableOpacity
                onPress={() => handleSearch('')}
                style={ChatRoomStyles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={item => String(item.id)}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => loadingMore && (
              <ActivityIndicator style={ChatRoomStyles.loadingMore} />
            )}
            ListEmptyComponent={() => loading ? (
              <ActivityIndicator style={ChatRoomStyles.loadingIndicator} size="large" color="#2563eb" />
            ) : (
              <Text style={ChatRoomStyles.emptyText}>
                Không tìm thấy người dùng nào
              </Text>
            )}
          />
        </View>
    </View>
    </Modal>
  );
};

export default function ChatRoom({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  const listenersRef = useRef({});
  const { state } = useContext(MyUserContext);
  const currentUserId = state?.user?.id || state?.id;

  // Lấy danh sách phòng chat
  const fetchRooms = useCallback(async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      console.log('Fetching page:', pageNum);
      const res = await api.getChatRooms(token, q, pageNum);
      const list = res.data.results || res.data;
      console.log('API getChatRooms response:', list);
      setRooms(prev => {
        if (!append) {
          return list.map(room => {
            const old = prev.find(r => r.id === room.id);
            return old && old.last_message
              ? { ...room, last_message: old.last_message, last_message_time: old.last_message_time }
              : room;
          });
        }
        const map = new Map();
        [...prev, ...list].forEach(room => {
          if (room.id) map.set(room.id, room);
        });
        return Array.from(map.values());
      });
      setLastMessages(prev => {
        const newLastMessages = { ...prev };
        list.forEach(room => {
          newLastMessages[room.id] = {
            last_message: room.last_message,
            last_message_time: room.last_message_time,
            is_read: room.is_read,
          };
        });
        return newLastMessages;
      });
      setHasNext(!!res.data.next);
      setPage(pageNum);
    } catch (e) {
      // Xử lý lỗi nếu cần
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms('', 1, false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRooms(search.trim(), 1, false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

// 1. Sửa useEffect cho Firestore listener
useEffect(() => {
  // Huỷ các listener cũ nếu có
  Object.values(listenersRef.current).forEach(unsub => unsub && unsub());
  listenersRef.current = {};

  // Lắng nghe collection lastMessages
  const q = query(
    collection(db, 'lastMessages'),
    orderBy('timestamp', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const updates = {};
    const listenedRoomIds = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      updates[data.roomId] = {
        last_message: data.lastMessage,
        last_message_time: data.timestamp,
        is_read: data.is_read,
        sender_id: data.senderId,
      };
      listenedRoomIds.push(data.roomId);
    });
    console.log('Firestore lastMessages snapshot:', updates);
    console.log('Đang lắng nghe các phòng:', listenedRoomIds);
    setLastMessages(prev => ({ ...prev, ...updates }));

    // Nếu có roomId chưa có trong rooms, fetch thêm thông tin phòng đó
    const currentRoomIds = new Set(rooms.map(r => String(r.id)));
    const missingRoomIds = listenedRoomIds.filter(roomId => !currentRoomIds.has(String(roomId)));
    
    if (missingRoomIds.length > 0) {
      const token = await SecureStore.getItemAsync('access_token');
      const newRooms = [];
      
      for (const roomId of missingRoomIds) {
        try {
          const res = await api.getChatRoomDetail(token, roomId);
          newRooms.push(res.data);
        } catch (e) {
          // Có thể phòng đã bị xoá hoặc lỗi, bỏ qua
        }
      }
      
      if (newRooms.length > 0) {
        setRooms(prev => {
          // Sử dụng Map để loại bỏ trùng lặp
          const map = new Map();
          [...prev, ...newRooms].forEach(room => {
            if (room.id) map.set(String(room.id), room);
          });
          return Array.from(map.values());
        });
      }
    }
  });
  
  listenersRef.current['lastMessages'] = unsubscribe;
  return () => unsubscribe();
}, [currentUserId]); // Chỉ phụ thuộc vào currentUserId

  useEffect(() => {
    // Khi lastMessages thay đổi, sắp xếp lại rooms theo last_message_time mới nhất
    setRooms(prevRooms => {
      // Lấy last_message_time từ lastMessages nếu có, ưu tiên hơn item.last_message_time
      const sorted = [...prevRooms].sort((a, b) => {
        const aTime = (lastMessages[a.id]?.last_message_time || a.last_message_time);
        const bTime = (lastMessages[b.id]?.last_message_time || b.last_message_time);
        // Chuyển về timestamp số nếu là object Firestore
        const getTime = t => {
          if (!t) return 0;
          if (typeof t === 'object' && t.seconds) return t.seconds * 1000 + (t.nanoseconds || 0) / 1e6;
          return new Date(t).getTime();
        };
        return getTime(bTime) - getTime(aTime);
      });
      return sorted;
    });
  }, [lastMessages]);

  const handleLoadMore = () => {
    if (hasNext && !loadingMore && !loading) {
      fetchRooms(search.trim(), page + 1, true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRooms(search.trim(), 1, false);
    setRefreshing(false);
  };

  // Render từng phòng chat
  const renderRoom = ({ item }) => {
    const otherUser = item.other_user || {};
    const lastMsgObj = lastMessages[item.id] || {};
    const lastMsg = lastMsgObj.last_message || item.last_message || 'Chưa có tin nhắn';
    const lastSenderId = lastMsgObj.sender_id || item.last_message_sender_id;
    const isRead = lastMsgObj.is_read !== undefined ? lastMsgObj.is_read : item.is_read;
    let isUnread = false;
    // Nếu sender_id là mình thì luôn là đã đọc
    if (lastSenderId && String(lastSenderId) === String(currentUserId)) {
      isUnread = false;
    } else {
      isUnread = isRead === false;
    }
    console.log('renderRoom', item.id, lastMessages[item.id]);
    return (
      <TouchableOpacity
        style={[
          ChatRoomStyles.chatRoomItem,
          isUnread ? ChatRoomStyles.chatRoomItemUnread : ChatRoomStyles.chatRoomItemRead
        ]}
        onPress={() => navigation.navigate('ChatRoomDetail', { roomId: item.id })}
      >
        <Image 
          source={{ uri: otherUser.avatar || 'https://via.placeholder.com/100' }} 
          style={ChatRoomStyles.chatRoomAvatar} 
        />
        <View style={ChatRoomStyles.chatRoomContent}>
          <Text style={ChatRoomStyles.chatRoomName}>
            {otherUser.last_name} {otherUser.first_name}
          </Text>
          <Text
            style={isUnread ? ChatRoomStyles.lastMessageUnread : ChatRoomStyles.lastMessageRead}
            numberOfLines={1}
          >
            {lastMsg}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Xử lý khi chọn user để chat
  const handleSelectUser = async (selectedUser) => {
    try {
      if (String(selectedUser.id) === String(currentUserId)) {
        Alert.alert('Thông báo', 'Bạn không thể nhắn tin cho chính mình');
        return;
      }

      // Kiểm tra xem đã có phòng chat với user này chưa
      const token = await SecureStore.getItemAsync('access_token');
      const existingRoom = rooms.find(room => 
        String(room.other_user?.id) === String(selectedUser.id)
      );

      if (existingRoom) {
        navigation.navigate('ChatRoomDetail', { roomId: existingRoom.id });
      } else {
        // Tạo phòng chat mới
        const response = await api.createChatRoom(token, {
          user_id: selectedUser.id
        });
        
        if (response.data) {
          navigation.navigate('ChatRoomDetail', { roomId: response.data.id });
        }
      }
      setShowUserList(false);
    } catch (error) {
      console.error('Error handling user selection:', error);
      Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.');
    }
  };

  return (
    <SafeAreaView style={ChatRoomStyles.container}>
      <View style={ChatRoomStyles.chatRoomHeader}>
        <Text style={ChatRoomStyles.chatRoomTitle}>Alumni Chat</Text>
        <TouchableOpacity 
          style={ChatRoomStyles.newChatButton}
          onPress={() => setShowUserList(true)}
        >
          <Ionicons name="chatbubbles-outline" size={28} color="#2563eb" />
        </TouchableOpacity>
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          <TextInput
            style={ChatRoomStyles.searchBox}
            placeholder="Tìm kiếm..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator style={ChatRoomStyles.loadingIndicator} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : `room-${index}`)}
          renderItem={renderRoom}
          extraData={lastMessages}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0}
          initialNumToRender={6}
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator style={ChatRoomStyles.loadingMore} size={18} color="#2563eb" />
          ) : null}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <UserListModal
        visible={showUserList}
        onClose={() => setShowUserList(false)}
        onSelectUser={handleSelectUser}
        currentUserId={currentUserId}
      />
    </SafeAreaView>
  );
}
