import { StyleSheet } from 'react-native';

const ChatRoomStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 12,
    backgroundColor: '#eee',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatLastMsg: {
    fontSize: 13,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 6,
    marginHorizontal: 12,
  },
  messageMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 12,
    padding: 8,
    maxWidth: '80%',
    marginLeft: 40,
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    borderRadius: 12,
    padding: 8,
    maxWidth: '80%',
    marginRight: 40,
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#fff',
    textAlign: 'right',
  },
  messageSenderOther: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#222',
    textAlign: 'left',
  },
  messageContent: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'right',
  },
  messageContentOther: {
    fontSize: 15,
    color: '#222',
    textAlign: 'left',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 2,
  },
  messageTimeOther: {
    fontSize: 10,
    color: '#777',
    textAlign: 'left',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    marginLeft: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
  },
  userLabel: {
    color: '#666',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  chatRoomHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  chatRoomTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  newChatButton: {
    position: 'absolute',
    right: 25,
    top: 16,
  },
  searchBox: {
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
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  chatRoomItemUnread: {
    backgroundColor: '#e6f0ff',
  },
  chatRoomItemRead: {
    backgroundColor: '#fff',
  },
  chatRoomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 12,
    backgroundColor: '#eee',
  },
  chatRoomContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatRoomName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastMessageUnread: {
    color: '#222',
    fontSize: 13,
    fontWeight: 'bold',
  },
  lastMessageRead: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'normal',
  },
  loadingIndicator: {
    marginTop: 32,
  },
  loadingMore: {
    marginTop: 10,
  },
});

export default ChatRoomStyles; 