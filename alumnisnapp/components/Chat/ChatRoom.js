import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../configs/API';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, doc, updateDoc } from "firebase/firestore";
import { app } from '../../configs/firebaseConfig';
import { MyUserContext } from '../../configs/Context';
import ChatRoomStyles from './ChatRoomStyles';

const db = getFirestore(app);

export default function ChatRoom({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const listenersRef = useRef({});
  const { state } = useContext(MyUserContext);
  const currentUserId = state?.user?.id || state?.id;

  // Lấy danh sách phòng chat
  const fetchRooms = useCallback(async (q = '', pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
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
      const token = await AsyncStorage.getItem('access_token');
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
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: isUnread ? '#e6f0ff' : '#fff' }}
        onPress={() => navigation.navigate('ChatRoomDetail', { roomId: item.id })}
      >
        <Image source={{ uri: otherUser.avatar || 'https://via.placeholder.com/100' }} style={{ width: 48, height: 48, borderRadius: 24, marginLeft: 12, backgroundColor: '#eee' }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{otherUser.last_name} {otherUser.first_name}</Text>
          <Text
            style={{
              color: isUnread ? '#222' : '#888',
              fontSize: 13,
              fontWeight: isUnread ? 'bold' : 'normal',
            }}
            numberOfLines={1}
          >
            {lastMsg}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={ChatRoomStyles.container}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'black' }}>Alumni Chat</Text>
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          <TextInput
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f6f7fb',
              borderRadius: 40,
              marginHorizontal: 20,
              marginBottom: 5,
              paddingHorizontal: 12,
              height: 43,
              width: '95%',
              borderWidth: 0.2,
              borderColor: 'lightgray',
              paddingVertical: 6,
              shadowColor: 'gray',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
              alignSelf: 'center',
            }}
            placeholder="Tìm kiếm..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      {loading && page === 1 ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : `room-${index}`)}
          renderItem={renderRoom}
          extraData={lastMessages}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0}
          initialNumToRender={6}
          ListFooterComponent={loadingMore ? <ActivityIndicator size={18} color="#2563eb" /> : null}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
}
