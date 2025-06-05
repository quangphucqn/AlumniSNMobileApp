import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  Text,
  RefreshControl,
} from "react-native";
import API, { authAPI, endpoints } from "../../configs/API";
import { ActivityIndicator, Searchbar } from "react-native-paper";
import { PostItem } from "../Post/PostItem";
import * as SecureStore from "expo-secure-store";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [token, setToken] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("access_token");
        console.log("Stored token:", storedToken);
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to fetch token:", error);
      }
    };
    fetchToken();
  }, []);
  const loadPosts = async () => {
    if (page > 0 && token) {
      setLoading(true);
      try {
        let url = `${endpoints["post"]}?page=${page}`;
        if (q) url = `${url}&q=${q}`;
        console.log("Fetching posts from:", url);
        let res = await authAPI(token).get(url);
        console.log("Response data:", res.data);
        setPosts(page > 1 ? [...posts, ...res.data.results] : res.data.results);
        if (res.data.next === null) setPage(0);
      } catch (ex) {
        console.error("Error in loadPosts:", ex);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (token) {
      console.log("Searching with q =", q, "and page =", page);
      let timer = setTimeout(() => loadPosts(), 500);
      return () => clearTimeout(timer);
    }
  }, [q, page, token]);

  const loadMore = () => {
    if (page > 0 && !loading) setPage(page + 1);
  };

  const search = (value) => {
    setQ(value);
    setPage(1);
  };

  const refresh = () => {
    setPage(1);
    loadPosts();
  };

  const handleDeleteConfirmed = async (postId) => {
    try {
      const response = await authAPI(token).delete(
        endpoints["post-detail"](postId),
        {
          validateStatus: (status) =>
            status === 204 || (status >= 200 && status < 300),
        }
      );

      Alert.alert("Bài viết", "Xóa bài viết thành công!");
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Lỗi xóa bài viết:", error);
      Alert.alert("Bài viết", "Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  const handlePostDeletion = (postId) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa bài viết này?", [
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
      origin: "HomeScreen",
    });
  };
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      loadPosts();
    }, [token])
  );

  return (
    <View>
      <Searchbar
        placeholder="Tìm kiếm bài viết..."
        onChangeText={search}
        value={q}
        style={styles.searchBar}
      />
      {posts.length === 0 && !loading ? (
        <Text style={styles.noPostsText}>Không có kết quả tìm kiếm nào</Text>
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
                fromScreen="Home"
                onPostDeleted={handlePostDeletion}
                onPostUpdated={handlePostUpdation}
              />
            )}
            onEndReached={loadMore}
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

export default Home;

const styles = StyleSheet.create({
  listStyle: {
    paddingBottom: 100,
  },
  searchBar: {
    margin: 10,
  },
  noPostsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "gray",
  },
});
