import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { api } from '../../configs/API';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyDispatchContext } from '../../configs/Context';

export default function Login({ navigation, route }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordDeadline, setChangePasswordDeadline] = useState(null);

  // Lấy hàm dispatch từ context để cập nhật trạng thái user toàn app
  const dispatch = useContext(MyDispatchContext);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      setLoading(true);
      const loginData = {
        username: username,
        password: password,
        grant_type: 'password'
      };
      const response = await api.login(loginData);
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
        const userResponse = await api.getCurrentUser(response.data.access_token);
        const user = userResponse.data;
        // Cập nhật user vào context toàn app
        dispatch({ type: 'login', payload: user });
        // console.log(user);

        // Xử lý theo role
        if (user.role === 0) {
          await AsyncStorage.setItem('showAdminTab', 'true');
          navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        } else if (user.role === 1) {
          if (!user.is_verified) {
            setShowVerifyModal(true);
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            dispatch({ type: 'logout' });
            return;
          } else {
            await AsyncStorage.removeItem('showAdminTab');
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
          }
        } else if (user.role === 2) {
          if (!user.must_change_password) {
            await AsyncStorage.removeItem('showAdminTab');
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
          } else {
            if (user.password_reset_time) {
              const resetTime = new Date(user.password_reset_time);
              const now = new Date();
              const diffHours = (now - resetTime) / (1000 * 60 * 60);
              if (diffHours > 24) {
                Alert.alert('Thông báo', 'Bạn đã quá hạn đổi mật khẩu. Vui lòng liên hệ quản trị viên để được cập nhật lại thời gian đổi mật khẩu.');
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
                dispatch({ type: 'logout' });
                return;
              } else {
                setChangePasswordDeadline(resetTime);
                setShowChangePasswordModal(true);
                await AsyncStorage.removeItem('showAdminTab');
                return;
              }
            } else {
              await AsyncStorage.removeItem('showAdminTab');
              navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
            }
          }
        } else {
          Alert.alert('Lỗi', 'Tài khoản không hợp lệ!');
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
          dispatch({ type: 'logout' });
        }
      } else {
        throw new Error('Không nhận được access token từ server');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ marginTop: 16 }} />
        <Text style={styles.title}>Đăng nhập ngay nàooo!</Text>
        <View style={{ height: 32 }} />
        <Text style={styles.label}>Tên đăng nhập</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên đăng nhập"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
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
        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <AntDesign name="google" size={24} color="#EA4335" />
          </TouchableOpacity>
        </View>
        <View style={{ flexGrow: 1 }} />
        <View>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Bạn chưa có tài khoản ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Modal chờ xác thực */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', width: '80%' }}>
            <Ionicons name="alert-circle" size={48} color="#FFA500" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Tài khoản chưa được xác thực</Text>
            <Text style={{ fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 16 }}>
              Tài khoản của bạn chưa được xác thực bởi quản trị viên. Vui lòng chờ xác thực để có thể đăng nhập.
            </Text>
            <TouchableOpacity onPress={() => setShowVerifyModal(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Đóng</Text>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', width: '80%' }}>
            <Ionicons name="time-outline" size={48} color="#007AFF" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Bạn cần đổi mật khẩu</Text>
            <Text style={{ fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 16 }}>
              Bạn cần đổi mật khẩu trong vòng 24 giờ kể từ khi được cấp tài khoản. Vui lòng vào phần đổi mật khẩu để cập nhật mật khẩu mới.
            </Text>
            <TouchableOpacity onPress={() => {
              setShowChangePasswordModal(false);
              navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
            }} style={{ marginTop: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingTop: 24,
    paddingHorizontal: 0,
  },
  backButton: {
    marginTop: 8,
    marginLeft: -8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#888',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
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
    marginBottom: 12,
    backgroundColor: '#fff',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#222',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  orText: {
    marginHorizontal: 8,
    color: '#aaa',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: '#fff',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  registerText: {
    color: '#888',
    fontSize: 14,
  },
  registerLink: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 24,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#888',
  },
});
