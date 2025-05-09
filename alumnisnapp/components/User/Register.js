import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function Register({ navigation }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);

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
    if (!firstName || !lastName || !studentId || !email) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setStep(2);
  };

  const handleRegister = () => {
    if (!avatar) {
      Alert.alert('Thông báo', 'Vui lòng chọn ảnh đại diện!');
      return;
    }
    // Xử lý đăng ký ở đây
    Alert.alert('Thành công', 'Đăng ký thành công!');
    // navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ width: '100%' }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 1 ? navigation.goBack() : setStep(1))}
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
              />
            </View>
            <Text style={styles.label}>Tên</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <Text style={styles.label}>Mã số sinh viên</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã số sinh viên"
                value={studentId}
                onChangeText={setStudentId}
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
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
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
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Đăng ký</Text>
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
    marginTop: 8,
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
