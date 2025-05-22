import React, { useReducer, useEffect } from "react";
import { MyUserContext } from "../configs/Context";
import MyUserReducer, { initialState } from "../reducer/MyUserReducer";
import * as SecureStore from 'expo-secure-store';
import { api } from '../configs/API';

export default function MyUserProvider({ children }) {
  const [state, dispatch] = useReducer(MyUserReducer, initialState);

  // Khi app khởi động, nếu có access_token thì gọi API lấy user mới nhất
  useEffect(() => {
    const loadUser = async () => {
      dispatch({ type: 'setLoading', payload: true });
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          // Gọi API lấy user mới nhất
          const res = await api.getCurrentUser(token);
          const user = res.data;
          // Nếu user chưa xác thực thì logout và xóa token
          if (user.role === 1 && user.is_verified === false) {
            await Promise.all([
              SecureStore.deleteItemAsync('access_token'),
              SecureStore.deleteItemAsync('refresh_token'),
              SecureStore.deleteItemAsync('user')
            ]);
            dispatch({ type: 'logout' });
            return;
          }
          if(user.role === 2 && user.must_change_password === true && user.password_reset_time__lt(datetime.now())){
            await Promise.all([
              SecureStore.deleteItemAsync('access_token'),
              SecureStore.deleteItemAsync('refresh_token'),
              SecureStore.deleteItemAsync('user')
            ]);
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

  // Không lưu user vào SecureStore nữa để luôn đồng bộ với server

  return (
    <MyUserContext.Provider value={{ state, dispatch }}>
      {children}
    </MyUserContext.Provider>
  );
} 