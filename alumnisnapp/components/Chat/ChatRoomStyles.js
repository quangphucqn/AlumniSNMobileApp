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
});

export default ChatRoomStyles; 