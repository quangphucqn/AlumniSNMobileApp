import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, startAfter, addDoc, doc } from "firebase/firestore";
import { app } from '../../configs/firebaseConfig';
import { MyUserContext } from '../../configs/Context';
import ChatRoomStyles from './ChatRoomStyles';

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
  const lastVisibleRef = useRef(null);
  const { state } = useContext(MyUserContext);
  const currentUserId = state?.user?.id || state?.id;

  // Lấy thông tin phòng chat
  useEffect(() => {
    console.log('ChatRoomDetail useEffect chạy với roomId:', roomId);
    console.log('roomId type:', typeof roomId);
    (async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
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
    console.log('Setting up Firestore listener with roomId:', roomId);

    let unsub;
    (async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');

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

              // Sử dụng hàm cập nhật state để tránh closure problems
              setMessages(prevMessages => {
                // Tạo một Map từ dữ liệu hiện tại để dễ dàng kiểm tra trùng lặp
                const messageMap = new Map();

                // Thêm tin nhắn từ Firestore vào Map (ưu tiên hơn)
                firestoreMessages.forEach(msg => {
                  messageMap.set(msg.id, msg);
                });

                // Thêm các tin nhắn cũ chưa có trong Firestore (ví dụ: tin nhắn đang gửi)
                prevMessages.forEach(msg => {
                  if (!messageMap.has(msg.id)) {
                    messageMap.set(msg.id, msg);
                  }
                });

                // Chuyển Map thành mảng và sắp xếp theo thời gian
                return Array.from(messageMap.values()).sort((a, b) => {
                  const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
                  const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
                  return timeB - timeA; // Sắp xếp mới đến cũ
                });
              });

              // Kiểm tra tin nhắn mới để đánh dấu đã đọc nếu cần
              if (firestoreMessages.length > 0) {
                const lastMsg = firestoreMessages[0];
                if (lastMsg.sender_id && String(lastMsg.sender_id) !== String(currentUserId) && lastMsg.is_read === false) {
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

        // Tải tin nhắn ban đầu từ API nếu cần
        try {
          const res = await api.getMessages(token, roomId, null);
          const apiMessages = Array.isArray(res.data.results) ? res.data.results : [];

          // Chỉ cập nhật từ API nếu có dữ liệu và chưa có từ Firestore
          if (apiMessages.length > 0) {
            setMessages(prevMessages => {
              // Chỉ thêm tin nhắn từ API nếu chưa có trong danh sách hiện tại
              const existingIds = new Set(prevMessages.map(m => m.id));
              const newMessages = apiMessages.filter(m => !existingIds.has(m.id));
              if (newMessages.length === 0) return prevMessages;

              // Kết hợp và sắp xếp lại
              return [...prevMessages, ...newMessages].sort((a, b) => {
                const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
                const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
                return timeB - timeA;
              });
            });
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
  }, [roomId, currentUserId])

  // Khi scroll lên để lấy tin nhắn cũ
  const loadMore = async () => {
    if (loadingMore || !hasNext) return;

    setLoadingMore(true);
    console.log('Loading more messages...');

    try {
      const token = await AsyncStorage.getItem('access_token');
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
    const token = await AsyncStorage.getItem('access_token');
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
    if (item.timestamp) {
      try {
        let msgTime;
        if (typeof item.timestamp.toDate === 'function') {
          // Firestore Timestamp object
          msgTime = item.timestamp.toDate();
        } else if (item.timestamp.seconds) {
          // Firestore Timestamp plain object
          msgTime = new Date(item.timestamp.seconds * 1000);
        } else if (typeof item.timestamp === 'string' || typeof item.timestamp === 'number') {
          msgTime = new Date(item.timestamp);
        }
        if (msgTime && !isNaN(msgTime)) {
          timeDisplay = msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {
        console.error('Error formatting timestamp:', e, item.timestamp);
      }
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
            <Text style={{ fontSize: 22 }}>←</Text>
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
          {/* Nút sticker */}
          <TouchableOpacity style={{ marginRight: 8 }}>
            <Text style={{ fontSize: 22 }}>😊</Text>
          </TouchableOpacity>
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