import React, { useState, useContext } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MyUserContext } from '../../configs/Context';
import UserStyles from './UserStyles';
import { CLIENT_ID, CLIENT_SECRET } from '@env';
import { authenticateWithBiometrics } from '../../configs/Utils';


export default function Login({ navigation, route }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordDeadline, setChangePasswordDeadline] = useState(null);
  const [showExpiredPasswordModal, setShowExpiredPasswordModal] = useState(false);
  const [expiredPasswordMessage, setExpiredPasswordMessage] = useState('');
  const [pendingLoginUser, setPendingLoginUser] = useState(null);

  // Lấy hàm dispatch từ context để cập nhật trạng thái user toàn app
  const { dispatch } = useContext(MyUserContext);

  const handleUnverifiedUser = async () => {
    setShowVerifyModal(true);
    // Không dispatch login, không lưu token
  };

  const handlePasswordChangeModal = (resetTime, expired = false, user = null) => {
    setChangePasswordDeadline(resetTime);
    if (expired) {
      setExpiredPasswordMessage('Bạn đã quá hạn đổi mật khẩu. Vui lòng liên hệ quản trị viên để được cập nhật lại thời gian đổi mật khẩu.');
      setShowExpiredPasswordModal(true);
    } else {
      setShowChangePasswordModal(true);
      if (user) setPendingLoginUser(user);
    }
  };

  const handleLoginSuccess = async (user) => {
    if (user.role === 2 && user.must_change_password) {
      if (user.password_reset_time) {
        const resetTime = new Date(user.password_reset_time);
        const now = new Date();
        if (now < resetTime) {
          handlePasswordChangeModal(resetTime, false, user);
          return;
        } else {
          handlePasswordChangeModal(resetTime, true);
          return;
        }
      }
    }
    dispatch({ type: 'login', payload: user });
    if (user.role === 0) {
      await AsyncStorage.setItem('showAdminTab', 'true');
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } else if (user.role === 1) {
      await AsyncStorage.removeItem('showAdminTab');
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } else if (user.role === 2) {
      await AsyncStorage.removeItem('showAdminTab');
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } else {
      Alert.alert('Lỗi', 'Tài khoản không hợp lệ!');
      await Promise.all([
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('refresh_token'),
        SecureStore.deleteItemAsync('user')
      ]);
      dispatch({ type: 'logout' });
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');
      formData.append('client_id', CLIENT_ID);
      formData.append('client_secret', CLIENT_SECRET);
      const response = await api.login(formData);
      if (response.data.access_token) {
        // Lưu username của lần đăng nhập cuối cùng
        await SecureStore.setItemAsync('lastLoginUsername', username);
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
        const userResponse = await api.getCurrentUser(response.data.access_token);
        const user = userResponse.data;
        if (user.role === 1 && !user.is_verified) {
          await handleUnverifiedUser();
          return;
        }
        await handleLoginSuccess(user);
      } else {
        throw new Error('Không nhận được access token từ server');
      }
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại!';
      if (error.response?.data?.error === 'invalid_client') {
        errorMessage = 'Lỗi xác thực client. Vui lòng kiểm tra lại cấu hình.';
      } else if (error.response?.data?.error === 'invalid_grant') {
        errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      Alert.alert('Lỗi đăng nhập', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập bằng khuôn mặt
  const handleFaceLogin = async () => {
    try {
      const lastUsername = await SecureStore.getItemAsync('lastLoginUsername');
      console.log('Last username:', lastUsername);
      if (!lastUsername) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập bằng mật khẩu trước khi sử dụng xác thực khuôn mặt.');
        return;
      }

      const isFaceIDEnabled = await AsyncStorage.getItem(`faceIDEnabled_${lastUsername}`);
      console.log('Face ID status:', isFaceIDEnabled);
      if (!isFaceIDEnabled) {
        Alert.alert('Thông báo', 'Vui lòng bật xác thực khuôn mặt trong phần cài đặt.');
        return;
      }

      setLoading(true);
      const isAuthenticated = await authenticateWithBiometrics();
      console.log('Biometric result:', isAuthenticated);
      if (!isAuthenticated) {
        Alert.alert('Thông báo', 'Xác thực khuôn mặt thất bại!');
        return;
      }
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      console.log('Refresh token:', refreshToken);
      if (!refreshToken) {
        Alert.alert('Thông báo', 'Không tìm thấy refresh token. Vui lòng đăng nhập bằng mật khẩu.');
        return;
      }
      const formData = new FormData();
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refreshToken);
      formData.append('client_id', CLIENT_ID);
      formData.append('client_secret', CLIENT_SECRET);

      const response = await api.login(formData);
      console.log('API response:', response.data);
      if (response.data.access_token) {
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
        const userResponse = await api.getCurrentUser(response.data.access_token);
        const user = userResponse.data;
        await handleLoginSuccess(user);
      } else {
        throw new Error('Không nhận được access token từ server');
      }
    } catch (error) {
      console.log('Face login error:', error, error?.response?.data);
      let errorMessage = 'Đăng nhập bằng khuôn mặt thất bại. Vui lòng thử lại!';
      if (error.response?.data?.error === 'invalid_grant') {
        errorMessage = 'Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu.';
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={UserStyles.container}>
        <TouchableOpacity style={UserStyles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ marginTop: 16 }} />
        <Text style={UserStyles.title}>Đăng nhập ngay nàooo!</Text>
        <View style={{ height: 32 }} />
        <Text style={UserStyles.label}>Tên đăng nhập</Text>
        <View style={UserStyles.inputContainer}>
          <TextInput
            style={UserStyles.input}
            placeholder="Nhập tên đăng nhập"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        <Text style={UserStyles.label}>Mật khẩu</Text>
        <View style={UserStyles.inputContainer}>
          <TextInput
            style={UserStyles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#aaa" />
          </TouchableOpacity>
        </View>
        <View style={UserStyles.orContainer}>
          <View style={UserStyles.line} />
          <Text style={UserStyles.orText}>hoặc</Text>
          <View style={UserStyles.line} />
        </View>
        <View style={UserStyles.socialContainer}>
          <TouchableOpacity style={UserStyles.socialButton}>
            <AntDesign name="google" size={24} color="#EA4335" />
          </TouchableOpacity>
        </View>
        <View style={{ flexGrow: 1 }} />
        <View>
          <View style={UserStyles.registerRow}>
            <Text style={UserStyles.registerText}>Bạn chưa có tài khoản ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={UserStyles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              style={[UserStyles.loginButton, loading && UserStyles.loginButtonDisabled, { flex: 1 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={UserStyles.loginButtonText}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[UserStyles.socialButton, { marginLeft: 12, marginBottom:15,width:50,height:50 }]} 
              onPress={handleFaceLogin}
              disabled={loading}
            >
              <Image source={require('../../assets/face-id.png')} style={{ width: 35, height: 35, color:'black' }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Modal chờ xác thực */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={UserStyles.modalOverlay}>
          <View style={UserStyles.modalContainer}>
            <Ionicons name="alert-circle" size={48} color="#FFA500" style={{ marginBottom: 12 }} />
            <Text style={UserStyles.modalTitle}>Tài khoản chưa được xác thực</Text>
            <Text style={UserStyles.modalMessage}>
              Tài khoản của bạn chưa được xác thực bởi quản trị viên. Vui lòng chờ xác thực để có thể đăng nhập.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                setShowVerifyModal(false);
                await Promise.all([
                  SecureStore.deleteItemAsync('access_token'),
                  SecureStore.deleteItemAsync('refresh_token'),
                  SecureStore.deleteItemAsync('user')
                ]);
                dispatch({ type: 'logout' });
              }}
              style={UserStyles.modalButton}
            >
              <Text style={UserStyles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal đổi mật khẩu */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={UserStyles.modalOverlay}>
          <View style={UserStyles.modalContainer}>
            <Ionicons name="time-outline" size={48} color="#007AFF" style={{ marginBottom: 12 }} />
            <Text style={UserStyles.modalTitle}>Bạn cần đổi mật khẩu</Text>
            <Text style={UserStyles.modalMessage}>
              Bạn cần đổi mật khẩu trong vòng 24 giờ kể từ khi được cấp tài khoản. Vui lòng vào phần đổi mật khẩu để cập nhật mật khẩu mới.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                setShowChangePasswordModal(false);
                if (pendingLoginUser) {
                  dispatch({ type: 'login', payload: pendingLoginUser });
                  await AsyncStorage.removeItem('showAdminTab');
                  navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
                  setPendingLoginUser(null);
                }
              }}
              style={UserStyles.modalButton}
            >
              <Text style={UserStyles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal quá hạn đổi mật khẩu */}
      <Modal
        visible={showExpiredPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpiredPasswordModal(false)}
      >
        <View style={UserStyles.modalOverlay}>
          <View style={UserStyles.modalContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" style={{ marginBottom: 12 }} />
            <Text style={UserStyles.modalTitle}>Quá hạn đổi mật khẩu</Text>
            <Text style={UserStyles.modalMessage}>{expiredPasswordMessage}</Text>
            <TouchableOpacity
              onPress={async () => {
                setShowExpiredPasswordModal(false);
                await Promise.all([
                  SecureStore.deleteItemAsync('access_token'),
                  SecureStore.deleteItemAsync('refresh_token'),
                  SecureStore.deleteItemAsync('user')
                ]);
                dispatch({ type: 'logout' });
              }}
              style={UserStyles.modalButton}
            >
              <Text style={UserStyles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
