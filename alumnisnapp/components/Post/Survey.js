import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, Alert } from "react-native";
import { Button, Checkbox, RadioButton } from "react-native-paper";
import { authAPI, endpoints, getSurveyData } from "../../configs/API";
import { getValidImageUrl } from "../Post/PostItem";
import moment from "moment";
import "moment/locale/vi";
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from "@react-navigation/native";

moment.locale("vi");

const surveyTypes = {
  1: "Training Program",
  2: "Recruitment Information",
  3: "Income",
  4: "Employment Situation",
};

const Survey = ({ route }) => {
  const { post } = route.params;
  const [survey, setSurvey] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [token, setToken] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const navigation = useNavigation();

useEffect(() => {
  const fetchInitialData = async () => {
    const storedToken = await SecureStore.getItemAsync("access_token");
    console.log("Token:", storedToken);
    setToken(storedToken);

    if (storedToken) {
      const surveyData = await getSurveyData(post.id,storedToken);
      console.log("Survey Data:", surveyData);
      setSurvey(surveyData);

      try {
        const res = await authAPI(storedToken).get(endpoints["resume"](post.id));
        console.log("Resume API response:", res.data);
        if (res.status === 200) {
          setHasCompleted(res.data.has_completed);
          if (res.data.answers) {
            const formatted = res.data.answers.reduce((acc, ans) => {
              acc[ans.question_id] = ans.selected_options;
              return acc;
            }, {});
            setSelectedOptions(formatted);
          }
        }
      } catch (err) {
        console.error("Error fetching draft:", err);
      }
    }
  };

  fetchInitialData();
}, [post.id]);


  const handleCheckboxChange = (questionId, optionId) => {
    setSelectedOptions((prev) => {
      const questionOptions = prev[questionId] || [];
      const updatedOptions = questionOptions.includes(optionId)
        ? questionOptions.filter((id) => id !== optionId)
        : [...questionOptions, optionId];

      return { ...prev, [questionId]: updatedOptions };
    });
  };

  const handleRadioButtonChange = (questionId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }));
  };

  const handleSaveDraft = async () => {
    try {
      const res = await authAPI(token).post(endpoints["draft"](post.id), {
        answers: selectedOptions,
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert("Khảo sát", "Khảo sát được lưu nháp thành công!");
        navigation.navigate("Home");
      } else {
        Alert.alert(
          "Khảo sát",
          "Bạn không có quyền lưu khảo sát này hoặc đã hồi đáp."
        );
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      Alert.alert("Khảo sát", "Xảy ra lỗi trong quá trình lưu nháp.");
    }
  };

  const handleSubmit = async () => {
    const unanswered = survey.questions?.filter(
      (q) => !selectedOptions[q.id] || selectedOptions[q.id].length === 0
    );

    if (unanswered.length > 0) {
      Alert.alert("Khảo sát", "Vui lòng trả lời tất cả các câu hỏi.");
      return;
    }

    try {
      const res = await authAPI(token).post(endpoints["submit"](post.id), {
        answers: selectedOptions,
      });

      if (res.status === 201) {
        Alert.alert("Khảo sát", "Khảo sát được gửi thành công!");
        navigation.navigate("Home");
      } else {
        Alert.alert(
          "Khảo sát",
          "Bạn không có quyền gửi khảo sát này hoặc đã hồi đáp."
        );
      }
    } catch (err) {
      console.error("Error submitting survey:", err);
      Alert.alert("Khảo sát", "Xảy ra lỗi trong quá trình gửi.");
    }
  };

  const renderQuestion = (question) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>{question.question}</Text>
      {question.options?.map((option) => (
        <View key={option.id} style={styles.optionContainer}>
          {question.multi_choice ? (
            <Checkbox
              status={
                selectedOptions[question.id]?.includes(option.id)
                  ? "checked"
                  : "unchecked"
              }
              onPress={() => handleCheckboxChange(question.id, option.id)}
            />
          ) : (
            <RadioButton
              value={option.id}
              status={
                selectedOptions[question.id]?.includes(option.id)
                  ? "checked"
                  : "unchecked"
              }
              onPress={() => handleRadioButtonChange(question.id, option.id)}
            />
          )}
          <Text style={styles.optionText}>{option.option}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {hasCompleted ? (
        <Text style={styles.completedText}>
          Bạn đã hoàn thành khảo sát này.
        </Text>
      ) : (
        <>
          <View style={styles.postContainer}>
            <View style={styles.post}>
              <Image
                source={{
                  uri: getValidImageUrl(post.user.avatar),
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.username}>{post.user.username}</Text>
                <Text style={styles.postTime}>
                  {moment(post.created_date).fromNow()}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {survey?.survey_type && (
                  <Text style={styles.surveyType}>
                    Loại khảo sát: {surveyTypes[survey.survey_type]}
                  </Text>
                )}
                {survey?.end_time && (
                  <Text style={styles.endTime}>
                    Hạn chót: {moment(survey.end_time).format("LLL")}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.content}>{post.content}</Text>
            {post.images?.length > 0 && (
              <View style={styles.imagesContainer}>
                {post.images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: getValidImageUrl(img.image) }}
                    style={styles.postImage}
                  />
                ))}
              </View>
            )}
          </View>

          {survey?.questions ? (
            survey.questions.length > 0 ? (
              survey.questions.map(renderQuestion)
            ) : (
              <Text
                style={{ textAlign: "center", color: "#888", marginTop: 20 }}
              >
                Không có câu hỏi trong khảo sát này.
              </Text>
            )
          ) : (
            <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
              Đang tải câu hỏi...
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSaveDraft}
              style={styles.button}
            >
              Lưu nháp
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
            >
              Gửi
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  questionContainer: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    width: "100%",
    padding: 16,
    borderRadius: 8,
  },
  postContainer: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
  },
  questionText: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionText: {
    marginLeft: 8,
  },
  post: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  postTime: {
    fontSize: 12,
    color: "#888",
  },
  content: {
    fontSize: 14,
    margin: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  surveyType: {
    fontSize: 12,
    fontWeight: "bold",
  },
  endTime: {
    fontSize: 12,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  completedText: {
    fontSize: 18,
    fontWeight: "400",
    fontStyle: "italic",
    color: "#666",
    lineHeight: 24,
    textAlign: "center",
    marginVertical: 24,
  },
});

export default Survey;
