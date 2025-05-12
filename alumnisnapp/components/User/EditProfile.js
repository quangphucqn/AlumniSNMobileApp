import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyUserContext, MyDispatchContext } from '../../configs/Context';
import * as FileSystem from 'expo-file-system';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export default function EditProfile() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [cover, setCover] = useState(user?.cover || null);

  React.useEffect(() => {
    setAvatar(user?.avatar || null);
    setCover(user?.cover || null);
  }, [user]);

  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [3, 1],
      quality: 1,
    });
    if (!result.canceled) {
      if (type === 'avatar') {
        handleUpdateAvatar(result.assets[0].uri);
      } else {
        handleUpdateCover(result.assets[0].uri);
      }
    }
  };

  const handleUpdateAvatar = async (uri) => {
    setLoading(true);
    try {
      // Kiểm tra kích thước avatar
      const avatarInfo = await FileSystem.getInfoAsync(uri);
      if (avatarInfo.size > MAX_IMAGE_SIZE) {
        Alert.alert('Thông báo', 'Ảnh đại diện vượt quá 10MB. Vui lòng chọn ảnh khác!');
        setLoading(false);
        return;
      }
      const accessToken = await AsyncStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });
      await api.updateAvatar(accessToken, formData);
      setAvatar(uri);
      const res = await api.getCurrentUser(accessToken);
      dispatch({ type: 'login', payload: res.data });
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
    } catch (e) {
      Alert.alert('Lỗi', 'Cập nhật ảnh đại diện thất bại!');
      console.log(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCover = async (uri) => {
    setLoading(true);
    try {
      // Kiểm tra kích thước cover
      const coverInfo = await FileSystem.getInfoAsync(uri);
      if (coverInfo.size > MAX_IMAGE_SIZE) {
        Alert.alert('Thông báo', 'Ảnh bìa vượt quá 10MB. Vui lòng chọn ảnh khác!');
        setLoading(false);
        return;
      }
      const accessToken = await AsyncStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('cover', {
        uri,
        name: 'cover.jpg',
        type: 'image/jpeg',
      });
      await api.updateCover(accessToken, formData);
      setCover(uri);
      const res = await api.getCurrentUser(accessToken);
      dispatch({ type: 'login', payload: res.data });
      Alert.alert('Thành công', 'Cập nhật ảnh cover thành công!');
    } catch (e) {
      Alert.alert('Lỗi', 'Cập nhật ảnh cover thất bại!');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#222" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableOpacity style={[styles.backButton, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>Chỉnh sửa trang cá nhân</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Ảnh đại diện</Text>
        <TouchableOpacity style={styles.avatarPicker} onPress={() => pickImage('avatar')} disabled={loading}>
          <Image source={{ uri: avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          <View style={styles.editIcon}><Ionicons name="camera" size={20} color="#fff" /></View>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Ảnh cover</Text>
        <TouchableOpacity style={styles.coverPicker} onPress={() => pickImage('cover')} disabled={loading}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}><Ionicons name="image" size={32} color="#bbb" /></View>
          )}
          <View style={styles.editIconCover}><Ionicons name="camera" size={20} color="#fff" /></View>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#222" style={{ marginTop: 16 }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop:40,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  avatarPicker: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 4,
  },
  coverPicker: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  editIconCover: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 4,
  },
});
