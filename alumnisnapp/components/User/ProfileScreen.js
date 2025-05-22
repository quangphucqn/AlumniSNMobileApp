import React, { useState, useEffect } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { PostItem } from "../Post/PostItem";
import API, { authAPI, endpoints } from "../../configs/API";
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from "@react-navigation/native";

const MyPostsScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("access_token");
        console.log("token 1", storedToken)
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to fetch token:", error);
      }
    };
    fetchToken();
  }, []);

  const loadPosts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log("token 2", token);
      const res = await authAPI(token).get(endpoints["my-posts"]);
      setPosts(res.data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadPosts();
  }, [token]);

  const refresh = () => {
    loadPosts();
  };

  const handleDeleteConfirmed = async (postId) => {
    try {
      await authAPI(token).delete(endpoints["post-detail"](postId));
      Alert.alert("Thành công", "Xóa bài viết thành công!");
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Lỗi xóa bài viết:", error);
      Alert.alert("Thất bại", "Không thể xóa bài viết.");
    }
  };

  const handlePostDeletion = (postId) => {
    Alert.alert("Xác nhận", "Bạn chắc chắn muốn xóa bài viết này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => handleDeleteConfirmed(postId),
      },
    ]);
  };

  const handlePostUpdation = (postId) => {
    navigation.navigate("UpdatePostScreen", {
      post: posts.find((post) => post.id === postId),
      origin: "Profile",
    });
  };

  return (
    <View>
      {posts.length === 0 && !loading ? (
        <Text style={styles.noPostsText}>Bạn chưa có bài viết nào</Text>
      ) : (
        <>
          <FlatList
            data={posts}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PostItem
                post={item}
                onPostDeleted={handlePostDeletion}
                onPostUpdated={handlePostUpdation}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refresh} />
            }
          />
          {loading && <ActivityIndicator />}
        </>
      )}
    </View>
  );
};

export default MyPostsScreen;

const styles = StyleSheet.create({
  listStyle: {
    paddingBottom: 100,
  },
  noPostsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
