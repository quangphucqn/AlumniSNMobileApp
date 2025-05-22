import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../configs/API';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export default function CreateTeacher() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null); // uri
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const handleCreate = async () => {
    setErrorMsg('');
    if (!firstname.trim() || !lastname.trim() || !email.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ, tên và email.');
      return;
    }
    setLoading(true);
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        setErrorMsg('Không tìm thấy access token.');
        setLoading(false);
        return;
      }
      let formData = new FormData();
      formData.append('first_name', firstname);
      formData.append('last_name', lastname);
      formData.append('email', email);
      if (avatar && avatar.uri) {
        const avatarInfo = await FileSystem.getInfoAsync(avatar.uri);
        if (avatarInfo.size > MAX_IMAGE_SIZE) {
          setErrorMsg('Ảnh đại diện vượt quá 10MB. Vui lòng chọn ảnh khác!');
          setLoading(false);
          return;
        }
        formData.append('avatar', {
          uri: avatar.uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
      }
      await api.createTeacher(accessToken, formData);
      Alert.alert('Thành công', 'Tạo tài khoản giảng viên thành công!');
      navigation.goBack();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        if (error.response.data.email) {
          setErrorMsg('Email đã đã được sử dụng!');
        } else {
          setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại!');
        }
      } else {
        setErrorMsg('Đã có lỗi xảy ra, vui lòng thử lại!');
      }
    } finally {
    setLoading(false);
  }
};

return (
  <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    {/* Back Button */}
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + 8 }]}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name="chevron-back" size={28} color="#222" />
    </TouchableOpacity>
    <View style={[styles.container, { marginTop: 40 }]}>
      <Text style={styles.title}>Tạo tài khoản giảng viên</Text>
      <TouchableOpacity style={styles.avatarPicker} onPress={pickImage} activeOpacity={0.8}>
        {avatar ? (
          <Image source={{ uri: avatar.uri }} style={styles.avatar} />
        ) : (
          <Ionicons name="camera" size={40} color="#888" />
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Họ"
        value={lastname}
        onChangeText={setLastname}
      />
      <TextInput
        style={styles.input}
        placeholder="Tên"
        value={firstname}
        onChangeText={setFirstname}
      />
      <TextInput
        style={styles.input}
        placeholder="Email giảng viên"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <TouchableOpacity
        style={[styles.createButton, loading && { opacity: 0.7 }]}
        onPress={handleCreate}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Tạo tài khoản</Text>
        )}
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    borderRadius: 20,
    padding: 4,
    elevation: 2,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: 18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
