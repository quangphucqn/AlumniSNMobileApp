import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { IconButton, Button, Appbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { authAPI, endpoints } from "../../configs/API";
import { Ionicons } from "@expo/vector-icons";

const surveyTypes = [
  { label: "Training Program", value: 1 },
  { label: "Recruitment Information", value: 2 },
  { label: "Income", value: 3 },
  { label: "Employment Situation", value: 4 },
];

const CreateSurvey = ({ route }) => {
  const [surveyType, setSurveyType] = useState(route.params?.surveyType || 1);
  const [endTime, setEndTime] = useState(route.params?.endTime || new Date());
  const [content, setContent] = useState(route.params?.content || "");
  const [questions, setQuestions] = useState(
    route.params?.questions || [
      {
        question: "",
        options: [{ option: "" }, { option: "" }],
        multi_choice: false,
      },
    ]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigation = useNavigation();

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: [{ option: "" }, { option: "" }],
        multi_choice: false,
      },
    ]);
  };

  const handleAddOption = (index) => {
    const updated = [...questions];
    updated[index].options.push({ option: "" });
    setQuestions(updated);
  };

  const handleQuestionChange = (text, index) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const handleOptionChange = (text, qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].option = text;
    setQuestions(updated);
  };

  const handleMultiChoiceChange = (value, index) => {
    const updated = [...questions];
    updated[index].multi_choice = value;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleDeleteOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      Alert.alert("Lỗi", "Mỗi câu hỏi phải có ít nhất 2 lựa chọn.");
      return;
    }
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setEndTime(selectedDate);
  };

  const handleSubmitSurvey = async () => {
    const isValid =
      surveyType &&
      endTime instanceof Date &&
      content.trim() !== "" &&
      questions.length > 0 &&
      questions.every(
        (q) =>
          q.question.trim() &&
          q.options.length >= 2 &&
          q.options.every((o) => o.option.trim())
      );

    if (!isValid) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ nội dung và câu hỏi hợp lệ.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("access_token");

      const formData = new FormData();
      formData.append("survey_type", surveyType);
      formData.append("end_time", endTime.toISOString());
      formData.append("content", content);
      formData.append("questions", JSON.stringify(questions));

      const res = await authAPI(token).post(endpoints["survey"], formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert("Thành công", "Khảo sát đã được tạo!");
        navigation.navigate("MainApp", { screen: "Home" });
      } else {
        throw new Error("Không thể tạo khảo sát");
      }
    } catch (error) {
      console.error("Survey Error:", error.response?.data || error);
      Alert.alert("Lỗi", "Không thể tạo khảo sát.");
    }
  };

  return (
    <>
      <Appbar.Header style={{ backgroundColor: "#fff" }}>
        <Ionicons name="chevron-back" style={{ marginLeft: 10 }} size={24} color="black" onPress={() => navigation.goBack()}/>
        {/* <Appbar.BackAction onPress={() => navigation.goBack()} /> */}
        <Appbar.Content title="Tạo bài khảo sát" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          placeholder="Nội dung bài khảo sát..."
          multiline
          value={content}
          onChangeText={setContent}
          style={styles.contentInput}
        />

        <Picker
          selectedValue={surveyType}
          onValueChange={(itemValue) => setSurveyType(itemValue)}
          style={{ marginBottom: 16 }}
        >
          {surveyTypes.map((type) => (
            <Picker.Item
              key={type.value}
              label={type.label}
              value={type.value}
            />
          ))}
        </Picker>

        <View style={styles.datePickerContainer}>
          <Text style={{ marginLeft: 15 }}>
            Thời hạn: {endTime.toLocaleDateString()}
          </Text>
          <IconButton
            icon="calendar"
            size={24}
            onPress={() => setShowDatePicker(true)}
          />
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={endTime}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {questions.map((q, qIndex) => (
          <View key={qIndex} style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <TextInput
                placeholder={`Câu hỏi ${qIndex + 1}`}
                value={q.question}
                onChangeText={(text) => handleQuestionChange(text, qIndex)}
                style={styles.questionInput}
              />
              {qIndex !== 0 && (
                <IconButton
                  icon="close"
                  iconColor="red"
                  onPress={() => handleDeleteQuestion(qIndex)}
                />
              )}
            </View>
            {q.options.map((o, oIndex) => (
              <View key={oIndex} style={styles.optionContainer}>
                <TextInput
                  placeholder={`Lựa chọn ${oIndex + 1}`}
                  value={o.option}
                  onChangeText={(text) =>
                    handleOptionChange(text, qIndex, oIndex)
                  }
                  style={styles.optionInput}
                />
                {oIndex > 1 && (
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => handleDeleteOption(qIndex, oIndex)}
                  />
                )}
              </View>
            ))}
            <IconButton
              icon="plus"
              onPress={() => handleAddOption(qIndex)}
              style={styles.addButton}
            />
            <View style={styles.switchContainer}>
              <Text>Cho phép chọn nhiều đáp án</Text>
              <Switch
                value={q.multi_choice}
                onValueChange={(value) =>
                  handleMultiChoiceChange(value, qIndex)
                }
              />
            </View>
          </View>
        ))}

        <IconButton
          icon="plus"
          iconColor="blue"
          size={30}
          onPress={handleAddQuestion}
          style={styles.addButton}
        />

        <Button
          mode="contained"
          onPress={handleSubmitSurvey}
          style={{ marginTop: 50 }}
          buttonColor="#2563eb"
          textColor="#fff"
        >
          Hoàn tất
        </Button>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  contentInput: {
    minHeight: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  questionContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  questionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        marginTop: 15,
        marginBottom: 10,
      },
    }),
  },
  optionInput: {
    flex: 1,
    borderBottomWidth: 1,
    marginRight: 8,
  },
  addButton: {
    alignSelf: "center",
    marginVertical: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
});

export default CreateSurvey;
