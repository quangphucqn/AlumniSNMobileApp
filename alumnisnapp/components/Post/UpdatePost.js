import * as SecureStore from "expo-secure-store";
import { useEffect, useState, useContext } from "react";
import { MyUserContext } from "../../configs/Context";
import {
  ScrollView,
  Alert,
  View,
  TextInput,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { endpoints, getSurveyData } from "../../configs/API";
import axios from "../../configs/API";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const UpdatePost = ({ route }) => {
  const { post } = route.params;
  const { state } = useContext(MyUserContext);
  const user = state.user;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [surveyType, setSurveyType] = useState("");
  const [endTime, setEndTime] = useState("");
  const [token, setToken] = useState(null);
  const [questions, setQuestions] = useState([
    {
      id: "",
      question: "",
      options: [{ id: "", option: "" }],
      multi_choice: false,
    },
  ]);

  useEffect(() => {
    if (route.params?.surveyType) setSurveyType(route.params.surveyType);
    if (route.params?.endTime) setEndTime(new Date(route.params.endTime));
    if (route.params?.questions) setQuestions(route.params.questions);

    if (route.params?.post) {
      console.log("Images from post:", post.images);
      setContent(post.content);

      setImages(
        post.images.map((img) => {
          let rawImage = img.image;

          // Nếu chuỗi bắt đầu bằng "image/upload/http", cắt phần "image/upload/" ra
          if (rawImage.startsWith("image/upload/http")) {
            rawImage = rawImage.replace("image/upload/", ""); // chỉ cắt đúng phần đầu
          }

          return {
            uri: rawImage.startsWith("http")
              ? rawImage // là URL đầy đủ thì giữ nguyên
              : `https://res.cloudinary.com/dizuiutpe/image/upload/${rawImage}`, // còn lại thì nối vào
            id: img.id,
          };
        })
      );

      if (
        post.object_type === "survey" &&
        route.params.origin === "HomeScreen"
      ) {
        const fetchSurvey = async () => {
          const storedToken = await SecureStore.getItemAsync("access_token");
          console.log("Token:", storedToken);
          setToken(storedToken);
          const surveyData = await getSurveyData(post.id, storedToken);
          setSurveyType(surveyData.survey_type);
          setEndTime(new Date(surveyData.end_time));
          setQuestions(surveyData.questions);
        };
        fetchSurvey();
      }
    }
  }, [route.params]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = images.concat(result.assets);
      setImages(newImages);
    }
  };

  const deleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) return token;
      throw new Error("Không tìm thấy token.");
    } catch (error) {
      console.error("Lỗi khi lấy token:", error);
      return null;
    }
  };

  const submitPost = async () => {
    if (loading || !content) {
      Alert.alert("Cập nhật bài viết", "Vui lòng nhập nội dung bài viết.");
      return;
    }

    const token = await getToken();
    const formData = new FormData();
    formData.append("content", content);

    const newImage = images.find((img) => !img.id);
    if (newImage) {
      const uri = newImage.uri; // giữ nguyên file://
      formData.append("image", {
        uri,
        type: "image/jpeg", // hoặc png nếu ảnh png
        name: "image.jpg",
      });
    } else if (images.length === 0) {
      // Gửi image = "" để backend biết xóa ảnh
      formData.append("image", "");
    }

    // Debug log
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      setLoading(true);
      const url = endpoints["post-detail"](post.id);

      const response = await axios.put(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        Alert.alert("Đăng bài thành công!");
        navigation.navigate("Home");
      } else {
        Alert.alert("Đăng bài không thành công");
      }
    } catch (error) {
      if (error.response) {
        console.error("Server responded with:", error.response.data);
        Alert.alert("Lỗi từ server:", JSON.stringify(error.response.data));
      } else {
        console.error("Error submitting post:", error.message);
        Alert.alert("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: user.avatar
              ? user.avatar.replace(/^image\/upload\//, "")
              : "https://example.com/default-avatar.jpg",
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>
          {user.first_name} {user.last_name}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        multiline
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChangeText={setContent}
      />

      <ScrollView horizontal style={styles.imageScrollView}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => deleteImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          style={styles.pickImagesButton}
          onPress={pickImages}
        >
          Chọn ảnh
        </Button>

        {user.role === 0 && post.object_type === "survey" && (
          <Button
            mode="outlined"
            style={styles.createSurveyButton}
            onPress={() =>
              navigation.navigate("UpdateSurveyScreen", {
                surveyType,
                endTime,
                questions,
                post,
              })
            }
          >
            Chỉnh sửa khảo sát
          </Button>
        )}

        <Button
          mode="contained"
          loading={loading}
          style={styles.submitButton}
          onPress={submitPost}
        >
          Cập nhật bài viết
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    minHeight: 100,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
  },
  imageScrollView: {
    marginVertical: 10,
    paddingLeft: 16,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
    resizeMode: "cover",
  },
  deleteIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  pickImagesButton: {
    marginBottom: 12,
  },
  createSurveyButton: {
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#007BFF",
  },
});

export default UpdatePost;
