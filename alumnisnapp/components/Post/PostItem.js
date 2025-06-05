import React, { useEffect, useState, useContext, useCallback } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { hp } from "../Post/common";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getPostComments,
  getPostReacts,
  authAPI,
  endpoints,
} from "../../configs/API";
import { theme } from "../Post/theme";
import { MyUserContext } from "../../configs/Context";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
import "moment/locale/vi";
import { IconButton } from "react-native-paper";

moment.locale("vi");

export const getValidImageUrl = (url) => {
  if (!url) return "";

  // Nếu là URL đầy đủ, dùng luôn
  if (url.startsWith("http")) return url;

  // Nếu là 'image/upload/https://...' => cắt 'image/upload/' ở đầu
  if (url.startsWith("image/upload/http")) {
    return url.replace(/^image\/upload\//, "");
  }

  // Nếu là đường dẫn đã có 'image/upload/' ở đầu, chỉ nối domain
  if (url.startsWith("image/upload/")) {
    return `https://res.cloudinary.com/dizuiutpe/${url}`;
  }

  // Nếu là đường dẫn tương đối khác, thêm 'image/upload/' vào
  return `https://res.cloudinary.com/dizuiutpe/image/upload/${url}`;
};

export const PostItem = ({ post, onPostDeleted, onPostUpdated }) => {
  const cleanAvatarUrlAvatar = post.user.avatar.replace(/^image\/upload\//, "");
  const navigation = useNavigation();
  const { state } = useContext(MyUserContext);
  const user = state.user;

  const [commentCount, setCommentCount] = useState(0);
  const [reactCount, setReactCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [hahaCount, setHahaCount] = useState(0);
  const [loveCount, setLoveCount] = useState(0);

  const [selectedReaction, setSelectedReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const fetchPostData = async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");

      const comments = await getPostComments(post.id, token);
      setCommentCount(comments.length);

      const reacts = await getPostReacts(post.id, token);
      setReactCount(reacts.length);
      const userReact = reacts.find(
        (react) => String(react.user.id) === String(user.id)
      );
      setSelectedReaction(userReact ? userReact.reaction : null);

      setLikeCount(reacts.filter((r) => r.reaction === 1).length);
      setHahaCount(reacts.filter((r) => r.reaction === 2).length);
      setLoveCount(reacts.filter((r) => r.reaction === 3).length);
    } catch (err) {
      console.error("Error in fetchPostData:", err);
    }
  };

  useEffect(() => {
    fetchPostData();
  }, [post.id]);

  const reactions = [
    { id: 1, name: "LIKE", icon: "thumbs-up", color: "#1877F2" },
    { id: 2, name: "HAHA", icon: "smile-o", color: "#FFD700" },
    { id: 3, name: "LOVE", icon: "heart", color: "#FF3040" },
  ];

  const handleReaction = async (reactionId) => {
    console.log(
      "handleReaction called with id:",
      reactionId,
      "selectedReaction:",
      selectedReaction
    );
    try {
      const token = await SecureStore.getItemAsync("access_token");
      const api = authAPI(token);

      if (selectedReaction === reactionId) {
        // Nếu reaction đang chọn giống reaction hiện tại -> xóa reaction
        console.log("Deleting reaction");
        await api.delete(endpoints.react(post.id), {
          validateStatus: (status) => status >= 200 && status < 300,
          headers: { Accept: "application/json" },
        });

        setSelectedReaction(null); // Reset ngay UI
      } else {
        // Nếu reaction khác -> post hoặc update reaction
        console.log("Posting/updating reaction");
        await api.post(endpoints.react(post.id), { reaction: reactionId });
        setSelectedReaction(reactionId);
      }

      // Cập nhật lại số liệu bài post sau thao tác
      await fetchPostData();

      setShowReactions(false);
    } catch (error) {
      console.error("Error reacting to post:", error);
    }
  };

  const updateCommentCount = (commentCount) => {
    setCommentCount(commentCount);
  };
  useFocusEffect(
    useCallback(() => {
      fetchPostData();
    }, [post.id])
  );
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Image source={{ uri: cleanAvatarUrlAvatar }} style={styles.avatar} />
        <View>
          {post.user.first_name || post.user.last_name ? (
            <Text style={styles.username}>
              {post.user.last_name} {post.user.first_name}
            </Text>
          ) : (
            <Text style={styles.username}>Quản Trị Viên</Text>
          )}
          <Text style={styles.postTime}>
            {moment(post.created_date).fromNow()}
          </Text>
        </View>
        <View style={{ flexDirection: "row", flex: 1 }}>
          <View style={{ flexDirection: "row" }}>
            {(user.role === 0 || user.id === post.user.id) && (
              <IconButton
                icon="delete"
                color="red"
                size={20}
                onPress={async () => {
                  try {
                    await onPostDeleted(post.id); // chính là handlePostDeletion
                  } catch (err) {
                    console.error(
                      "Lỗi khi gọi onPostDeleted trong PostItem:",
                      err
                    );
                    Alert.alert(
                      "Bài viết",
                      "Không thể xóa bài viết. Vui lòng thử lại."
                    );
                  }
                }}
                style={{ marginRight: -10 }}
              />
            )}
            {user.id === post.user.id && (
              <IconButton
                icon="lead-pencil"
                color="red"
                size={20}
                onPress={() => onPostUpdated(post.id)}
              />
            )}
          </View>

          <View style={{ flexDirection: "column", marginLeft: "auto" }}>
            <TouchableOpacity
              onPress={() =>
            navigation.navigate("PostDetailScreen", {
                postId: post.id,
                onCommentAdded: updateCommentCount,
            })}
              style={{ padding: 5, marginLeft: "auto" }}
            >
              <FontAwesome
                name="ellipsis-h"
                size={hp(2.4)}
                color={theme.colors.text}
                style={styles.moreIcon}
              />
            </TouchableOpacity>

            {post.object_type === "survey" && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("SurveyScreen", { post: post })
                }
                style={{ flex: 1, alignItems: "flex-end" }}
              >
                <Text style={{ color: "#007BFF" }}>Tiến hành khảo sát</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.images && post.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {post.images
            .filter((img) => img?.image)
            .map((image) => {
              const uri = getValidImageUrl(image.image);
              console.log("Image URI to render:", uri);
              return (
                <Image
                  key={`post-img-${image.id || image.image}`}
                  source={{ uri }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              );
            })}
        </View>
      )}

      <View style={styles.reactionCounts}>
        <View style={styles.reactionCountItem}>
          <FontAwesome name="thumbs-up" size={18} color="#1877F2" />
          <Text style={styles.reactionCountText}>{likeCount}</Text>
        </View>
        <View style={styles.reactionCountItem}>
          <FontAwesome name="smile-o" size={18} color="#FFD700" />
          <Text style={styles.reactionCountText}>{hahaCount}</Text>
        </View>
        <View style={styles.reactionCountItem}>
          <FontAwesome name="heart" size={18} color="#FF3040" />
          <Text style={styles.reactionCountText}>{loveCount}</Text>
        </View>
      </View>
      <View style={styles.interactions}>
        <TouchableOpacity onPress={() => setShowReactions(!showReactions)}>
          <FontAwesome
            name={
              reactions.find((r) => r.id === selectedReaction)?.icon ||
              "thumbs-up"
            }
            size={18}
            color={
              reactions.find((r) => r.id === selectedReaction)?.color || "#888"
            }
          />
        </TouchableOpacity>
        <Text style={styles.interactionText}>{reactCount}</Text>

        {showReactions && (
          <View style={styles.reactionMenu}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.id}
                onPress={() => {
                  console.log("Clicked reaction id:", reaction.id);
                  handleReaction(reaction.id);
                }}
                style={styles.reactionButton}
              >
                <FontAwesome
                  name={reaction.icon}
                  size={20}
                  color={reaction.color}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("PostDetailScreen", {
                postId: post.id,
                onCommentAdded: updateCommentCount,
            })
          }
          style={{ marginLeft: 10 }}
        >
          <FontAwesome name="comment" size={18} color="#888" />
        </TouchableOpacity>

        <Text style={styles.interactionText}>{commentCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  interactionText: {
    marginLeft: 4,
    marginRight: 15,
    fontSize: 14,
    color: "#555",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  interactions: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  reactionMenu: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    marginRight: 15,
    position: "absolute",
    bottom: 35,
    left: 0,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
    zIndex: 999,
  },
  reactionButton: {
    marginHorizontal: 5,
  },
  reactionCounts: {
    flexDirection: "row",
    marginTop: 10,
  },
  reactionCountItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  reactionCountText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#555",
  },
  container: {
    backgroundColor: "#FFF",
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
  },
  userInfo: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  avatar: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: 50,
    marginRight: 8,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  postTime: {
    fontSize: 12,
    color: "#888",
  },
  content: {
    marginBottom: 10,
    fontSize: 15,
    color: "#000",
  },
  postImage: {
    width: 120,
    height: 120,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
  },
  moreIcon: {
    marginLeft: "auto",
    marginTop: 5,
  },
});
