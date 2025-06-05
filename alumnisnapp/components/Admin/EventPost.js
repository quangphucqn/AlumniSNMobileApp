import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator, Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, SectionList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../configs/API';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getValidImageUrl } from '../Post/PostItem';

const ROLE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Admin', value: 0 },
  { label: 'Giáo viên', value: 2 },
  { label: 'Sinh viên', value: 1 },
];

export default function EventPost() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [recipientType, setRecipientType] = useState('all'); // 'all' | 'groups' | 'users'
  const [selectedGroups, setSelectedGroups] = useState([]); // id nhóm
  const [selectedUsers, setSelectedUsers] = useState([]); // id user
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'groups' | 'users'
  const [groupSearch, setGroupSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [groupList, setGroupList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [groupHasNext, setGroupHasNext] = useState(true);
  const [userHasNext, setUserHasNext] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [pageGroups, setPageGroups] = useState(1);
  const [pageUsers, setPageUsers] = useState(1);
  const groupSearchTimeout = useRef();
  const userSearchTimeout = useRef();
  const [tempRecipientType, setTempRecipientType] = useState(recipientType);
  const [tempSelectedGroups, setTempSelectedGroups] = useState([...selectedGroups]);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([...selectedUsers]);
  const [loading, setLoading] = useState(false);
  const [loadingAllGroups, setLoadingAllGroups] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      try {
        const resGroups = await api.getGroups(token);
        setGroups(resGroups.data?.results || []);
      } catch (e) {
        setGroups([]);
      }
      try {
        const resUsers = await api.userList(token);
        setUsers(resUsers.data?.results || []);
      } catch (e) {
        setUsers([]);
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // --- Fetch group list ---
  const fetchGroups = async (search = '', page = 1, append = false) => {
    if (page === 1) setGroupLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await api.getGroups(token, search, page);
      const results = res.data?.results || res.data;
      setGroupList(prev => {
        if (!append) return results;
        const map = new Map();
        [...prev, ...results].forEach(g => map.set(g.id, g));
        return Array.from(map.values());
      });
      setGroupHasNext(!!res.data.next);
      setPageGroups(page);
    } catch (e) {
      if (!append) setGroupList([]);
    } finally {
      setGroupLoading(false);
    }
  };
  // --- Fetch user list ---
  const fetchUsers = async (search = '', page = 1, append = false) => {
    if (page === 1) setUserLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await api.userList(token, search, page);
      const results = res.data?.results || res.data;
      setUserList(prev => {
        if (!append) return results;
        const map = new Map();
        [...prev, ...results].forEach(u => map.set(u.id, u));
        return Array.from(map.values());
      });
      setUserHasNext(!!res.data.next);
      setPageUsers(page);
    } catch (e) {
      if (!append) setUserList([]);
    } finally {
      setUserLoading(false);
    }
  };

  // --- Debounce search group ---
  useEffect(() => {
    if (activeTab !== 'groups' || !recipientModalVisible) return;
    if (groupSearchTimeout.current) clearTimeout(groupSearchTimeout.current);
    groupSearchTimeout.current = setTimeout(() => {
      fetchGroups(groupSearch, 1, false);
    }, 400);
    return () => clearTimeout(groupSearchTimeout.current);
  }, [groupSearch, activeTab, recipientModalVisible]);

  // --- Debounce search user ---
  useEffect(() => {
    if (activeTab !== 'users' || !recipientModalVisible) return;
    if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);
    userSearchTimeout.current = setTimeout(() => {
      fetchUsers(userSearch, 1, false);
    }, 400);
    return () => clearTimeout(userSearchTimeout.current);
  }, [userSearch, activeTab, recipientModalVisible]);

  // --- Fetch first page when open modal ---
  useEffect(() => {
    if (recipientModalVisible && activeTab === 'groups') fetchGroups('', 1, false);
    if (recipientModalVisible && activeTab === 'users') fetchUsers('', 1, false);
  }, [recipientModalVisible, activeTab]);

  // Khi mở modal, sync state tạm
  useEffect(() => {
    if (recipientModalVisible) {
      setTempRecipientType(recipientType);
      setTempSelectedGroups([...selectedGroups]);
      setTempSelectedUsers([...selectedUsers]);
    }
  }, [recipientModalVisible]);

  // --- Toggle select ---
  const toggleGroup = (id) => {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };
  const toggleUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  // --- Toggle chọn tất cả ---
  const toggleAll = () => {
    if (tempRecipientType === 'all') {
      setTempRecipientType('');
      setTempSelectedGroups([]);
      setTempSelectedUsers([]);
    } else {
      setTempRecipientType('all');
      setTempSelectedGroups([]);
      setTempSelectedUsers([]);
    }
  };

  // --- Toggle chọn nhóm/người trong state tạm ---
  const toggleTempGroup = (id) => {
    setTempRecipientType('groups');
    setTempSelectedGroups(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };
  const toggleTempUser = (id) => {
    setTempRecipientType('users');
    setTempSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  // --- Render group item ---
  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={[eventPostStyles.item, tempSelectedGroups.includes(item.id) && eventPostStyles.selectedItem, { minWidth: 90 }]}
      onPress={() => toggleTempGroup(item.id)}
    >
      <Text style={{ color: tempSelectedGroups.includes(item.id) ? '#fff' : '#222', fontWeight: 'bold' }}>{item.group_name}</Text>
    </TouchableOpacity>
  );
  // --- Render user item ---
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[eventPostStyles.userRow, tempSelectedUsers.includes(item.id) && { backgroundColor: '#2563eb' }]}
      onPress={() => toggleTempUser(item.id)}
    >
      <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={eventPostStyles.avatar} />
      <View style={eventPostStyles.infoCol}>
        <Text style={[eventPostStyles.name, tempSelectedUsers.includes(item.id) && { color: '#fff' }]} numberOfLines={1}>{item.last_name} {item.first_name}</Text>
        <Text style={[eventPostStyles.email, tempSelectedUsers.includes(item.id) && { color: '#e0e7ff' }]} numberOfLines={1}>{item.email}</Text>
        <Text style={[eventPostStyles.mssv, tempSelectedUsers.includes(item.id) && { color: '#e0e7ff' }]} numberOfLines={1}>{item.role === 0 ? 'Admin' : item.role === 2 ? 'Giáo viên' : 'Sinh viên'}</Text>
      </View>
    </TouchableOpacity>
  );

  const fetchMoreGroups = async () => {
    if (!groupHasNext || groupLoading) return;
    fetchGroups(groupSearch, pageGroups + 1, true);
  };
  const fetchMoreUsers = async () => {
    if (!userHasNext || userLoading) return;
    fetchUsers(userSearch, pageUsers + 1, true);
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và nội dung!');
      return;
    }
    if (recipientType !== 'all' && selectedGroups.length === 0 && selectedUsers.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn người nhận!');
      return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      let data;
      let isFormData = false;
      if (image) {
        data = new FormData();
        data.append('title', title.trim());
        data.append('content', content.trim());
        data.append('send_to_all', recipientType === 'all');
        selectedGroups.forEach(id => data.append('groups', id));
        selectedUsers.forEach(id => data.append('individuals', id));
        // xác định định dạng ảnh
        const getMimeType = (filename) => {
          const ext = filename.split('.').pop().toLowerCase();
          if (ext === 'png') return 'image/png';
          if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
          return 'application/octet-stream';
        };
        data.append('images', {
          uri: image.uri,
          name: image.fileName || 'event.jpg',
          type: getMimeType(image.fileName || 'event.jpg'),
        });
        isFormData = true;
      } else {
        data = {
          title: title.trim(),
          content: content.trim(),
          send_to_all: recipientType === 'all',
          groups: selectedGroups,
          individuals: selectedUsers,
        };
      }
      const res = await api.createEvent(token, data, isFormData);
      console.log('API response:', res.data);
      Alert.alert('Thành công', 'Đã đăng thư mời!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đăng thư mời!');
    } finally {
      setLoading(false);
    }
  };

  // Thêm logic kiểm tra chọn tất cả
  const isAllGroupsChecked = groupList.length > 0 && tempSelectedGroups.length === groupList.length;
  const isAllUsersChecked = userList.length > 0 && tempSelectedUsers.length === userList.length;

  const handleToggleAllGroups = async () => {
    if (isAllGroupsChecked) {
      setTempSelectedGroups([]);
    } else {
      setLoadingAllGroups(true);
      let allGroups = [...groupList];
      let page = 1;
      let hasNext = groupHasNext;
      // Load toàn bộ group
      while (hasNext) {
        page += 1;
        try {
          const token = await SecureStore.getItemAsync('access_token');
          const res = await api.getGroups(token, groupSearch, page);
          const results = res.data?.results || res.data;
          if (results && results.length > 0) {
            allGroups = [...allGroups, ...results];
          }
          hasNext = !!res.data.next;
        } catch (e) {
          hasNext = false;
        }
      }
      // Loại bỏ trùng id
      const allIds = Array.from(new Set(allGroups.map(g => g.id)));
      setTempSelectedGroups(allIds);
      setTempRecipientType('groups');
      setLoadingAllGroups(false);
    }
  };

  return (
    <SafeAreaView style={eventPostStyles.container} edges={['left', 'right']}>
      <TouchableOpacity style={[eventPostStyles.backBtn, { marginTop: insets.top + 2 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#222" />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ position: 'absolute', right: 18, top: insets.top + 2, zIndex: 10, padding: 6, backgroundColor: loading ? '#bbb' : '#2563eb', borderRadius: 8 }}
        onPress={handleCreateEvent}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, paddingHorizontal: 12, paddingVertical: 4 }}>Đăng</Text>}
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView style={eventPostStyles.contentContainer} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={eventPostStyles.title}>Đăng thư mời</Text>
          <Text style={eventPostStyles.label}>Tiêu đề</Text>
          <TextInput
            style={eventPostStyles.input}
            placeholder="Nhập tiêu đề thư mời"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={eventPostStyles.label}>Nội dung</Text>
          <TextInput
            style={[eventPostStyles.input, { height: 200 }]}
            placeholder="Nhập nội dung bài viết"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <Text style={eventPostStyles.label}>Ảnh đính kèm</Text>
          <TouchableOpacity style={[eventPostStyles.imagePicker, { marginBottom: 12 }]} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={eventPostStyles.image} />
            ) : (
              <Text style={{ color: '#888' }}>Chọn ảnh</Text>
            )}
          </TouchableOpacity>
          {/* --- Dòng người nhận --- */}
          <TouchableOpacity onPress={() => setRecipientModalVisible(true)} style={{marginVertical: 10}}>
            <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
              <Text style={{fontWeight: 'bold'}}>Người nhận: </Text>
              {recipientType === 'all' ? (
                <Text style={{color: '#2563eb'}}>Tất cả</Text>
              ) : selectedGroups.length > 0 && selectedUsers.length > 0 ? (
                <Text style={{color: '#2563eb'}}>Nhóm ({selectedGroups.length}), Người dùng ({selectedUsers.length})</Text>
              ) : selectedGroups.length > 0 ? (
                <Text style={{color: '#2563eb'}}>Nhóm ({selectedGroups.length})</Text>
              ) : selectedUsers.length > 0 ? (
                <Text style={{color: '#2563eb'}}>Người dùng ({selectedUsers.length})</Text>
              ) : (
                <Text style={{color: '#888'}}>Chưa chọn người nhận thư mời</Text>
              )}
              <Ionicons name="chevron-forward" size={18} color="#2563eb" style={{marginLeft: 4}} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* --- Modal chọn người nhận --- */}
      <Modal visible={recipientModalVisible} animationType="slide" transparent onRequestClose={() => setRecipientModalVisible(false)}>
        <View style={eventPostStyles.bottomModal}>
          <View style={eventPostStyles.modalHeader}>
            <TouchableOpacity style={eventPostStyles.doneBtn} onPress={() => {
              setRecipientType(tempRecipientType);
              setSelectedGroups([...tempSelectedGroups]);
              setSelectedUsers([...tempSelectedUsers]);
              setRecipientModalVisible(false);
            }}>
              <Text style={eventPostStyles.doneText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRecipientModalVisible(false)}>
              <Text style={eventPostStyles.modalClose}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection: 'row', marginBottom: 10}}>
            {/* Tab All: tick chọn/bỏ chọn */}
            <TouchableOpacity style={[eventPostStyles.tabBtn, {flex: 1}]} onPress={toggleAll}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name={tempRecipientType === 'all' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={tempRecipientType === 'all' ? '#2563eb' : '#bbb'} style={{marginRight: 4}} />
                <Text style={[eventPostStyles.tabText, tempRecipientType === 'all' && eventPostStyles.tabTextActive]}>Tất cả</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[eventPostStyles.tabBtn, {flex: 1}, activeTab === 'groups' && eventPostStyles.tabBtnActive]} onPress={() => setActiveTab('groups')}>
              <Text style={[eventPostStyles.tabText, activeTab === 'groups' && eventPostStyles.tabTextActive]}>Nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[eventPostStyles.tabBtn, {flex: 1}, activeTab === 'users' && eventPostStyles.tabBtnActive]} onPress={() => setActiveTab('users')}>
              <Text style={[eventPostStyles.tabText, activeTab === 'users' && eventPostStyles.tabTextActive]}>Cá nhân</Text>
            </TouchableOpacity>
          </View>
          {/* Tab content dưới đây */}
          <View style={{flex: 1}}>
            {activeTab === 'groups' && (
              <>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                  onPress={handleToggleAllGroups}
                  disabled={loadingAllGroups}
                >
                  <Ionicons
                    name={isAllGroupsChecked ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isAllGroupsChecked ? '#2563eb' : '#bbb'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: isAllGroupsChecked ? '#2563eb' : '#222', fontWeight: 'bold' }}>
                    {isAllGroupsChecked ? 'Bỏ chọn tất cả nhóm' : 'Chọn tất cả nhóm'}
                  </Text>
                  {loadingAllGroups && <ActivityIndicator size="small" color="#2563eb" style={{marginLeft: 8}} />}
                </TouchableOpacity>
                <TextInput
                  style={eventPostStyles.searchInput}
                  placeholder="Tìm kiếm nhóm..."
                  value={groupSearch}
                  onChangeText={setGroupSearch}
                />
                <FlatList
                  data={groupList}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderGroupItem}
                  onEndReached={fetchMoreGroups}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={groupLoading && <ActivityIndicator />}
                  style={{ marginTop: 8 }}
                  contentContainerStyle={{paddingBottom: 16}}
                />
              </>
            )}
            {activeTab === 'users' && (
              <>
                <TextInput
                  style={eventPostStyles.searchInput}
                  placeholder="Tìm kiếm người dùng..."
                  value={userSearch}
                  onChangeText={setUserSearch}
                />
                <FlatList
                  data={userList}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderUserItem}
                  onEndReached={fetchMoreUsers}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={userLoading && <ActivityIndicator />}
                  style={{ marginTop: 8 }}
                  contentContainerStyle={{paddingBottom: 16}}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const eventPostStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: 0,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 16,
    marginBottom: 6,
    color: '#222',
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f6f7fb',
    marginBottom: 4,
  },
  imagePicker: {
    height: 120,
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#f6f7fb',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    marginRight: 8,
    height: 65,
    marginBottom: 4,
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: '#2563eb',
  },
  selectAllBtn: {
    alignSelf: 'flex-end',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#e6edfa',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 220,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  mssv: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  roleModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  roleModalBox: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  roleModalTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleOption: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 6,
    alignItems: 'center',
    width: '100%',
  },
  roleOptionSelected: {
    backgroundColor: '#2563eb',
  },
  roleOptionText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  roleModalCloseBtn: {
    marginTop: 8,
    alignItems: 'center',
  },
  roleModalCloseText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  },
  backBtn: {
    marginLeft: 14,
    marginBottom: 0,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 15,
  },
  bottomModal: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '92.5%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  modalClose: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f6f7fb',
    marginBottom: 8,
  },
  doneBtn: {
    marginTop: 0,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  doneText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6edfa',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabTextActive: {
    color: '#2563eb',
  },
});
