import * as LocalAuthentication from 'expo-local-authentication';

export const authenticateWithBiometrics = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  console.log('hasHardware:', hasHardware, 'isEnrolled:', isEnrolled);
  if (!hasHardware || !isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Xác thực khuôn mặt để tiếp tục',
    fallbackLabel: 'Nhập mã PIN',
  });
  return result.success;
};
