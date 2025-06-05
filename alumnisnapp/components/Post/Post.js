import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { MyUserContext } from "../../configs/Context";
import { endpoints } from "../../configs/API";
import axios from "../../configs/API";

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { state } = useContext(MyUserContext);
  const user = state.user;

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const isPostButtonEnabled = content.trim() !== "" || images.length > 0;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const deleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getToken = async () => {
    try {
      return await SecureStore.getItemAsync("access_token");
    } catch (error) {
      console.error("Lỗi lấy token:", error);
      return null;
    }
  };

  const submitPost = async () => {
    if (loading || !isPostButtonEnabled) return;

    const token = await getToken();
    if (!token) return Alert.alert("Lỗi", "Không tìm thấy token.");

    const formData = new FormData();
    formData.append("content", content);

    images.forEach((image, index) => {
      formData.append("images", {
        uri: image.uri,
        type: "image/jpeg",
        name: `image-${index}.jpg`,
      });
    });

    try {
      setLoading(true);
      const res = await axios.post(endpoints.post, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201) {
        setContent("");
        setImages([]);
        Alert.alert("Đăng bài thành công!");
        navigation.navigate("Home");
      } else {
        Alert.alert("Lỗi", "Không thể đăng bài.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi khi đăng bài.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: StatusBar.currentHeight }]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài viết</Text>
          <TouchableOpacity
            onPress={submitPost}
            disabled={!isPostButtonEnabled}
          >
            <Text
              style={[
                styles.postButton,
                { color: isPostButtonEnabled ? "#007BFF" : "#ccc" },
              ]}
            >
              ĐĂNG
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* User Info */}
          <View style={styles.userRow}>
            <Image
              source={{ uri: user.avatar || "https://via.placeholder.com/150" }}
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {user.role === 0
                ? "Quản Trị Viên"
                : `${user.first_name} ${user.last_name}`}
            </Text>
          </View>

          {/* Image Button */}
          <TouchableOpacity style={styles.imageIconButton} onPress={pickImages}>
            <Ionicons name="image-outline" size={28} color="#28A745" />
            <Text style={styles.iconText}>Chọn ảnh</Text>
          </TouchableOpacity>

          {/* TextInput */}
          <TextInput
            style={styles.input}
            multiline
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChangeText={setContent}
          />

          {/* Image preview */}
          <ScrollView horizontal style={styles.imageScrollView}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <Ionicons
                  name="close-circle"
                  size={26}
                  color="black"
                  style={styles.deleteIcon}
                  onPress={() => deleteImage(index)}
                />
              </View>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007BFF" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CreatePostScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  postButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    padding: 15,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  imageIconButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 16,
    color: "#28A745",
    marginLeft: 8,
  },
  input: {
    minHeight: 80,
    fontSize: 16,
    paddingTop: 10,
    textAlignVertical: "top",
  },
  imageScrollView: {
    marginVertical: 15,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  deleteIcon: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
