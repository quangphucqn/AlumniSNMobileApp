import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <Image source={require('../assets/alumnis_icon.png')} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>Welcome to{"\n"}<Text style={styles.brand}>Alumni Social Network</Text></Text>
        <Text style={styles.subtitle}>
          Social networks for alumni, help you find friends, exchange experiences and find job opportunities
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 24,
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    marginHorizontal: 12,
  },
  loginButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 12,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
  },
  registerText: {
    color: '#222',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
}); 