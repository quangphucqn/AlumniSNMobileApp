import React, { useState } from 'react';
import { KeyboardAvoidingView, View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../configs/API';
import * as FileSystem from 'expo-file-system';
import UserStyles from './UserStyles';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Register({ navigation }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 8 ký tự!');
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
      // Kiểm tra kích thước avatar
      const avatarInfo = await FileSystem.getInfoAsync(avatar);
      if (avatarInfo.size > MAX_IMAGE_SIZE) {
        Alert.alert('Thông báo', 'Ảnh đại diện vượt quá 10MB. Vui lòng chọn ảnh khác!');
        setLoading(false);
        return;
      }

      // Kiểm tra kích thước ảnh bìa nếu có
      if (cover) {
        const coverInfo = await FileSystem.getInfoAsync(cover);
        if (coverInfo.size > MAX_IMAGE_SIZE) {
          Alert.alert('Thông báo', 'Ảnh bìa vượt quá 10MB. Vui lòng chọn ảnh khác!');
          setLoading(false);
          return;
        }
      }
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
      // Gọi API đăng ký
      await api.register(formData);
      Alert.alert('Thành công', 'Đăng ký thành công!');
      navigation.navigate('Login');
    } catch (error) {
      console.log('Register error:', error, error.response);
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
          style={UserStyles.backButton}
          onPress={() => (step === 1 ? navigation.goBack() : setStep(step - 1))}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20} // chỉnh độ nhích tùy thích
      >
        <ScrollView contentContainerStyle={UserStyles.container} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <View style={{ width: '100%' }}>
              <Text style={UserStyles.title}>Đăng ký tài khoản</Text>
              <Text style={UserStyles.label}>Họ</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập họ"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCorrect={true}
                  autoCapitalize="words"
                  placeholderTextColor='darkgray'
                />
              </View>
              <Text style={UserStyles.label}>Tên</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập tên"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCorrect={true}
                  autoCapitalize="words"
                />
              </View>
              <Text style={UserStyles.label}>Mã số sinh viên</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập mã số sinh viên"
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              <Text style={UserStyles.label}>Email</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={UserStyles.nextButton} onPress={handleNext} disabled={loading}>
                <Text style={UserStyles.nextButtonText}>Tiếp theo</Text>
              </TouchableOpacity>
            </View>
          ) : step === 2 ? (
            <View style={{ width: '100%' }}>
              <Text style={UserStyles.title}>Tài khoản & Mật khẩu</Text>
              <Text style={UserStyles.label}>Tên đăng nhập</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChangeText={setUsername}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              <Text style={UserStyles.label}>Mật khẩu</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={UserStyles.showPasswordButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="darkgray" />
                </TouchableOpacity>
              </View>
              <Text style={UserStyles.label}>Xác nhận mật khẩu</Text>
              <View style={UserStyles.inputContainer}>
                <TextInput
                  style={UserStyles.input}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={UserStyles.showPasswordButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="darkgray" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={UserStyles.nextButton} onPress={handleNext} disabled={loading}>
                <Text style={UserStyles.nextButtonText}>Tiếp theo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <Text style={UserStyles.title}>Ảnh đại diện & Cover</Text>
              <Text style={UserStyles.label}>Ảnh đại diện <Text style={{ color: 'red' }}>*</Text></Text>
              <TouchableOpacity style={UserStyles.imagePicker} onPress={() => pickImage(setAvatar)}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={UserStyles.avatar} />
                ) : (
                  <Text style={UserStyles.imagePickerText}>Chọn ảnh đại diện</Text>
                )}
              </TouchableOpacity>
              <Text style={UserStyles.label}>Ảnh cover (không bắt buộc)</Text>
              <TouchableOpacity style={UserStyles.imagePicker} onPress={() => pickImage(setCover)}>
                {cover ? (
                  <Image source={{ uri: cover }} style={UserStyles.cover} />
                ) : (
                  <Text style={UserStyles.imagePickerText}>Chọn ảnh cover</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={UserStyles.registerButton} onPress={handleRegister} disabled={loading}>
                <Text style={UserStyles.registerButtonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
