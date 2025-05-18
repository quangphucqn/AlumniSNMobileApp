import React, { useReducer, useEffect } from "react";
import { MyUserContext } from "../configs/Context";
import MyUserReducer, { initialState } from "../reducer/MyUserReducer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../configs/API';

export default function MyUserProvider({ children }) {
  const [state, dispatch] = useReducer(MyUserReducer, initialState);

  // Khi app khởi động, nếu có access_token thì gọi API lấy user mới nhất
  useEffect(() => {
    const loadUser = async () => {
      dispatch({ type: 'setLoading', payload: true });
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          // Gọi API lấy user mới nhất
          const res = await api.getCurrentUser(token);
          const user = res.data;
          // Nếu user chưa xác thực thì logout và xóa token
          if (user.role === 1 && user.is_verified === false) {
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            dispatch({ type: 'logout' });
            return;
          }
          dispatch({ type: 'login', payload: user });
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
    <MyUserContext.Provider value={{ state, dispatch }}>
      {children}
    </MyUserContext.Provider>
  );
} 