import React, { useReducer, useEffect } from "react";
import { MyUserContext, MyDispatchContext } from "../configs/Context";
import MyUserReducer from "../reducer/MyUserReducer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../configs/API';

export default function MyUserProvider({ children }) {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  // Khi app khởi động, nếu có access_token thì gọi API lấy user mới nhất
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          // Gọi API lấy user mới nhất
          const res = await api.getCurrentUser(token);
          dispatch({ type: 'login', payload: res.data });
        } else {
          dispatch({ type: 'logout' });
        }
      } catch (error) {
        // Nếu token hết hạn hoặc lỗi thì logout
        dispatch({ type: 'logout' });
      }
    };
    loadUser();
  }, []);

  // Không lưu user vào AsyncStorage nữa để luôn đồng bộ với server

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        {children}
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
} 