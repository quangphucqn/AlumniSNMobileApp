import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../configs/API';
import UserStyles from './UserStyles';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    try {
      setIsLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        throw new Error('Không tìm thấy token');
      }

      await api.changePassword(accessToken, {
        old_password: oldPassword,
        new_password: newPassword,
      });

      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={UserStyles.container} edges={['left', 'right']}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 0 }}>
        <TouchableOpacity style={[UserStyles.backButton, { position: 'relative', top: 0, left: 0, marginBottom: 8 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}
      >
        <View style={{ marginTop: 8, flex: 1 }}>
          <Text style={[UserStyles.title, { textAlign: 'center', marginBottom: 24 }]}>Đổi mật khẩu</Text>
          <View style={UserStyles.form}>
            <Text style={UserStyles.label}>Mật khẩu hiện tại</Text>
            <View style={UserStyles.inputContainer}>
              <TextInput
                style={UserStyles.input}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </View>
            <Text style={UserStyles.label}>Mật khẩu mới</Text>
            <View style={UserStyles.inputContainer}>
              <TextInput
                style={UserStyles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
              />
            </View>
            <Text style={UserStyles.label}>Xác nhận mật khẩu mới</Text>
            <View style={UserStyles.inputContainer}>
              <TextInput
                style={UserStyles.input}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />
            </View>
            <TouchableOpacity
              style={[UserStyles.button, isLoading && UserStyles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={UserStyles.buttonText}>
                {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}