import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, startAfter, addDoc, doc } from "firebase/firestore";
import { app } from '../../configs/firebaseConfig';
import { MyUserContext } from '../../configs/Context';
import ChatRoomStyles from './ChatRoomStyles';
import { Ionicons } from '@expo/vector-icons';

const db = getFirestore(app);

export default function ChatRoomDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId } = route.params;
  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [hasNext, setHasNext] = useState(true);
  const { state } = useContext(MyUserContext);
  const currentUserId = state?.user?.id || state?.id;

  // Lấy thông tin phòng chat
  useEffect(() => {
    console.log('ChatRoomDetail useEffect chạy với roomId:', roomId);
    console.log('roomId type:', typeof roomId);
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        const res = await api.getChatRoomDetail(token, roomId);
        console.log('Room info received:', res.data);
        setRoomInfo(res.data);
      } catch (error) {
        console.error('Error fetching room details:', error);
      }
    })();
  }, [roomId]);

  // Khi vào phòng chat
  useEffect(() => {
    setMessages([]); // Reset lại state khi vào phòng chat mới
    console.log('Setting up Firestore listener with roomId:', roomId);

    let unsub;
    (async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('access_token');

        // Thiết lập lắng nghe Firestore
        const messagesCol = collection(db, 'chat_rooms', String(roomId), 'messages');

        try {
          const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(20));

          unsub = onSnapshot(
            q,
            (snapshot) => {
              const firestoreMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id };
              });

              console.log('firestoreMessages:', firestoreMessages);

              const normalizedMessages = firestoreMessages.map(normalizeTimestamp);
              setMessages(
                normalizedMessages
                  .filter(msg => !(typeof msg.id === 'string' && msg.id.startsWith('temp-')))
                  .sort((a, b) => {
                    const getTime = (msg) => msg.timestamp ? msg.timestamp.getTime() : 0;
                    return getTime(b) - getTime(a);
                  })
              );

              // Kiểm tra tin nhắn mới để đánh dấu đã đọc
              if (firestoreMessages.length > 0) {
                const lastMsg = firestoreMessages[0];
                if (lastMsg.sender_id && 
                    String(lastMsg.sender_id) !== String(currentUserId) && 
                    lastMsg.is_read === false) {
                  api.markAsRead(token, roomId);
                }
              }
            },
            (error) => {
              console.error('Firestore onSnapshot error:', error);
            }
          );
        } catch (firestoreError) {
          console.error('Error setting up Firestore listener:', firestoreError);
        }

        // Tải tin nhắn ban đầu từ API
        try {
          const res = await api.getMessages(token, roomId, null);
          const apiMessages = Array.isArray(res.data.results) ? res.data.results : [];

          const normalizedApiMessages = apiMessages.map(normalizeTimestamp);
          if (normalizedApiMessages.length > 0) {
            setMessages(
              normalizedApiMessages
                .filter(msg => !(typeof msg.id === 'string' && msg.id.startsWith('temp-')))
                .sort((a, b) => {
                  const getTime = (msg) => msg.timestamp ? msg.timestamp.getTime() : 0;
                  return getTime(b) - getTime(a);
                })
            );
          }
        } catch (apiError) {
          console.error('Error fetching messages from API:', apiError);
        }
      } catch (error) {
        console.error('Error in chat setup:', error);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) {
        unsub();
        console.log('Listener unsubscribed');
      }
    };
  }, [roomId, currentUserId]);

  // Khi scroll lên để lấy tin nhắn cũ
  const loadMore = async () => {
    if (loadingMore || !hasNext) return;

    setLoadingMore(true);
    console.log('Loading more messages...');

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const lastMsgId = messages.length > 0 ? messages[messages.length - 1]?.id : null;

      console.log('Loading messages before ID:', lastMsgId);
      const res = await api.getMessages(token, roomId, lastMsgId);

      const newMessages = Array.isArray(res.data.results) ? res.data.results : [];
      console.log('Loaded additional messages:', newMessages.length);

      if (newMessages.length === 0) {
        setHasNext(false);
        console.log('No more messages to load');
      } else {
        setMessages(prev => {
          // Tránh duplicate
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));

          return [...prev, ...uniqueNewMessages];
        });
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!input.trim()) return;
    const token = await SecureStore.getItemAsync('access_token');
    const tempId = 'temp-' + Date.now().toString(); // Thêm tiền tố để tránh trùng với ID từ Firestore
    const tempMsg = {
      id: tempId,
      content: input.trim(),
      sender_id: currentUserId,
      sending: true,
      sent: false,
      error: false,
      timestamp: new Date(),
    };

    // Thêm tin nhắn tạm vào state
    setMessages(prev => [tempMsg, ...prev]);
    setInput('');

    try {
      console.log('Sending message to API:', tempMsg.content);
      const result = await api.sendMessage(token, roomId, { content: tempMsg.content });
      console.log('API response after sending message:', result);

      // Khi gửi thành công, chỉ cập nhật trạng thái của tin nhắn tạm
      // và KHÔNG thêm tin nhắn mới từ API vào đây - để Firestore listener lo
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, sending: false, sent: true } : msg
        )
      );
    } catch (e) {
      console.error('Error sending message:', e);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, sending: false, error: true } : msg
        )
      );
    }
  };

  const normalizeTimestamp = (msg) => {
    let ts = msg.timestamp || msg.created_date || msg.updated_date;
    if (!ts) return { ...msg, timestamp: null };
    if (typeof ts.toDate === 'function') {
      return { ...msg, timestamp: ts.toDate() };
    }
    if (ts.seconds) {
      return { ...msg, timestamp: new Date(ts.seconds * 1000) };
    }
    if (typeof ts === 'string' || typeof ts === 'number') {
      return { ...msg, timestamp: new Date(ts) };
    }
    return { ...msg, timestamp: null };
  };

  // Render tin nhắn
  const renderMessage = ({ item }) => {
    const sender = item.sender || item.sender_info || {};
    const isMine =
      sender.id === currentUserId ||
      sender.user_id === currentUserId ||
      item.sender_id === currentUserId ||
      String(sender.id) === String(currentUserId) ||
      String(item.sender_id) === String(currentUserId);

    // Nếu là tin nhắn của mình và thiếu tên, lấy từ context user
    const displayName = isMine
      ? `${state.user?.last_name || ''} ${state.user?.first_name || ''}`.trim()
      : `${roomInfo?.other_user?.last_name || ''} ${roomInfo?.other_user?.first_name || ''}`.trim();

    const avatar = isMine
      ? state.user?.avatar
      : roomInfo?.other_user?.avatar || 'https://via.placeholder.com/40';

    // Format timestamp
    let timeDisplay = '';
    if (item.timestamp instanceof Date && !isNaN(item.timestamp)) {
      timeDisplay = item.timestamp.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginVertical: 6,
          marginHorizontal: 12,
        }}
      >
        {!isMine && (
          <Image
            source={{ uri: avatar }}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#eee' }}
          />
        )}
        <View
          style={{
            backgroundColor: isMine ? '#2563eb' : '#f1f1f1',
            borderRadius: 12,
            padding: 8,
            maxWidth: '80%',
            alignSelf: isMine ? 'flex-end' : 'flex-start',
            marginLeft: isMine ? 40 : 0,
            marginRight: !isMine ? 40 : 0,
          }}
        >
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 13,
              color: isMine ? '#fff' : '#222',
              textAlign: isMine ? 'right' : 'left',
            }}
          >
            {displayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 15,
                color: isMine ? '#fff' : '#222',
                textAlign: isMine ? 'right' : 'left',
              }}
            >
              {item.content}
            </Text>
            {isMine && item.sending && (
              <Text style={{ fontSize: 11, color: '#fff', marginLeft: 6 }}>Đang gửi...</Text>
            )}
            {isMine && item.sent && !item.sending && !item.error && (
              <Text style={{ fontSize: 11, color: '#fff', marginLeft: 6 }}>Đã gửi</Text>
            )}
            {isMine && item.error && (
              <Text style={{ fontSize: 11, color: 'red', marginLeft: 6 }}>Lỗi</Text>
            )}
          </View>
          {timeDisplay && (
            <Text
              style={{
                fontSize: 10,
                color: isMine ? 'rgba(255,255,255,0.7)' : '#777',
                textAlign: 'left',
                marginTop: 2,
              }}
            >
              {timeDisplay}
            </Text>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={ChatRoomStyles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={ChatRoomStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Image source={{ uri: roomInfo?.other_user?.avatar || 'https://via.placeholder.com/40' }} style={ChatRoomStyles.avatar} />
          <Text style={ChatRoomStyles.userName}>{roomInfo?.other_user?.last_name} {roomInfo?.other_user?.first_name}</Text>
        </View>
        {/* Danh sách tin nhắn */}
        {loading ? (
          <ActivityIndicator style={{ flex: 1, marginTop: 32 }} size="large" color="#2563eb" />
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => typeof item.id === 'string' ? item.id : `msg-${item.id}`}
            inverted
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ActivityIndicator size={18} color="#2563eb" /> : null}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        )}
        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 0.5, borderColor: '#eee', backgroundColor: '#fff' }}>
          {/* Ô nhập */}
          <TextInput
            style={{ flex: 1, borderWidth: 0.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 16, backgroundColor: '#f6f7fb' }}
            placeholder="Nhập tin nhắn..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          {/* Nút gửi */}
          <TouchableOpacity onPress={handleSend} style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 30, color: '#2563eb' }}>➤</Text>
          </TouchableOpacity>
    </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});