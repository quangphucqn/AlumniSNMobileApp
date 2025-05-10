import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../configs/API';

export default function Register({ navigation }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !studentId || !email) {
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!username || !password || !confirmPassword) {
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự!');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp!');
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!avatar) {
      Alert.alert('Thông báo', 'Vui lòng chọn ảnh đại diện!');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('mssv', studentId);
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('avatar', {
        uri: avatar,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });
      if (cover) {
        formData.append('cover', {
          uri: cover,
          name: 'cover.jpg',
          type: 'image/jpeg',
        });
      }
      formData.append('role', 1);
      // Gọi API đăng ký
      await api.register(formData);
      Alert.alert('Thành công', 'Đăng ký thành công!');
      navigation.navigate('Login');
    } catch (error) {
      let message = 'Đăng ký thất bại. Vui lòng thử lại!';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          message = error.response.data;
        } else if (error.response.data.detail) {
          message = error.response.data.detail;
        } else if (error.response.data.message) {
          message = error.response.data.message;
        } else if (typeof error.response.data === 'object') {
          message = Object.values(error.response.data).join('\n');
        }
      }
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ width: '100%' }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 1 ? navigation.goBack() : setStep(step - 1))}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <View style={{ width: '100%' }}>
            <Text style={styles.title}>Đăng ký tài khoản</Text>
            <Text style={styles.label}>Họ</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ"
                value={lastName}
                onChangeText={setLastName}
                autoCorrect={true}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.label}>Tên</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên"
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect={true}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.label}>Mã số sinh viên</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã số sinh viên"
                value={studentId}
                onChangeText={setStudentId}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
              <Text style={styles.nextButtonText}>Tiếp theo</Text>
            </TouchableOpacity>
          </View>
        ) : step === 2 ? (
          <View style={{ width: '100%' }}>
            <Text style={styles.title}>Tài khoản & Mật khẩu</Text>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChangeText={setUsername}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
              <Text style={styles.nextButtonText}>Tiếp theo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            <Text style={styles.title}>Ảnh đại diện & Cover</Text>
            <Text style={styles.label}>Ảnh đại diện <Text style={{ color: 'red' }}>*</Text></Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setAvatar)}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <Text style={styles.imagePickerText}>Chọn ảnh đại diện</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.label}>Ảnh cover (không bắt buộc)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setCover)}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.cover} />
              ) : (
                <Text style={styles.imagePickerText}>Chọn ảnh cover</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              <Text style={styles.registerButtonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#222',
  },
  nextButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginTop: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  imagePickerText: {
    color: '#888',
    fontSize: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cover: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  registerButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginTop: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
  },
});
