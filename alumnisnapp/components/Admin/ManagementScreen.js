import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
const features = [
  {
    key: 'verify',
    label: 'Xác thực người dùng',
    icon: <Ionicons name="checkmark-done-circle" size={36} color="#3b82f6" />,
  },
  {
    key: 'create_teacher',
    label: 'Tạo tài khoản giảng viên',
    icon: <MaterialCommunityIcons name="account-plus" size={36} color="#8b5cf6" />,
  },
  {
    key: 'change_time',
    label: 'Chỉnh thời gian đổi mật khẩu',
    icon: <Ionicons name="time-outline" size={36} color="#f59e42" />,
  },
  {
    key: 'group',
    label: 'Quản lý nhóm',
    icon: <Ionicons name="people" size={36} color="#10b981" />,
  },
  {
    key: 'users',
    label: 'Quản lý người dùng',
    icon: <Ionicons name="person" size={36} color="blue" />,
  },{
    key: 'postservey',
    label: 'Đăng bài khảo sát',
    icon: <Ionicons name="bar-chart" size={36} color="#FFCC33" />,
  },
  {
    key: 'eventinvite',
    label: 'Đăng thư mời',
    icon: <Ionicons name="paper-plane" size={36} color="#FFCC33" />,
  },
];

export default function ManagementScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Chức năng quản lý</Text>
      <View style={styles.grid}>
        {features.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.square}
            activeOpacity={0.8}
            onPress={() => {
              if (item.key === 'verify') navigation.navigate('VerifyUser');
              if (item.key === 'create_teacher') navigation.navigate('CreateTeacher');
              if (item.key === 'change_time') navigation.navigate('SetTimeTeacher');
              if (item.key === 'group') navigation.navigate('Groups');
              if (item.key === 'users') navigation.navigate('ManageUsers');
              if(item.key==='postservey') navigation.navigate('CreateSurvey');
              if(item.key==='eventinvite') navigation.navigate('EventPost');
            }}
          >
            <View style={styles.iconWrapper}>{item.icon}</View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',     
  },
  square: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    textAlign: 'center',
  },
}); 