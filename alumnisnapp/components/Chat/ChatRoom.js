import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatRoom() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat Room Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
