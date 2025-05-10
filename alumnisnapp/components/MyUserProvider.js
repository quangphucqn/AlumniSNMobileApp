import React, { useReducer, useEffect } from "react";
import { MyUserContext, MyDispatchContext } from "../configs/Context";
import MyUserReducer from "../reducer/MyUserReducer";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyUserProvider({ children }) {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  // Load user từ AsyncStorage khi app khởi động
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          dispatch({ type: 'login', payload: JSON.parse(userData) });
        }
      } catch (error) {
        console.error('Lỗi khi load user từ AsyncStorage:', error);
      }
    };
    loadUser();
  }, []);

  // Lưu user vào AsyncStorage mỗi khi user thay đổi
  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Lỗi khi lưu user vào AsyncStorage:', error);
      }
    };
    saveUser();
  }, [user]);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        {children}
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
} 