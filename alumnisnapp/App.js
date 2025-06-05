import "react-native-reanimated";
import "react-native-gesture-handler";
import React, { useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { IconButton } from "react-native-paper";
import WelcomeScreen from "./components/Welcome";
import LoginScreen from "./components/User/Login";
import RegisterScreen from "./components/User/Register";
import ProfileScreen from "./components/User/Profile";
import HomeScreen from "./components/Home/Home";
import ChangePasswordScreen from "./components/User/ChangePassword";
import ChatScreen from "./components/Chat/ChatRoom";
import CreatePostScreen from "./components/Post/Post";
import EditProfileScreen from "./components/User/EditProfile";
import VerifyUserScreen from "./components/Admin/VerifyUser";
import { ActivityIndicator, View } from "react-native";
import MyUserProvider from "./components/MyUserProvider";
import { MyUserContext } from "./configs/Context";
import ManagementScreen from "./components/Admin/ManagementScreen";
import CreateTeacherScreen from "./components/Admin/CreateTeacher";
import SetTimeTeacherScreen from "./components/Admin/SetTimeTeacher";
import GroupsScreen from "./components/Group/Groups";
import GroupDetailScreen from "./components/Group/GroupDetail";
import CreateGroupScreen from "./components/Group/CreateGroup";
import AddUserScreen from "./components/Group/AddUser";
import ManageUsersScreen from "./components/Admin/ManageUser";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CreateSurveyScreen from "./components/Admin/CreateSurvey";
import UpdatePostScreen from "./components/Post/UpdatePost";
import PostDetailScreen from "./components/Post/PostDetailScreen";
import SurveyScreen from "./components/Post/Survey";
import UpdateSurveyScreen from "./components/Post/UpdateSurvey";
import ChatRoomDetailScreen from "./components/Chat/ChatRoomDetail";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStackNavigator = () => {
  const navigation = useNavigation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Trang chủ",
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconButton
                icon="newspaper-variant-multiple-outline"
                size={24}
                onPress={() => navigation.navigate("Profile")}
                color="black"
              />
              <IconButton
                icon="pencil-plus"
                size={24}
                onPress={() => navigation.navigate("CreatePostScreen")}
                color="black"
              />
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const { state } = useContext(MyUserContext);
  const user = state.user;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "CreatePost") {
            iconName = focused ? "create" : "create-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Management") {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#888",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Tin nhắn" }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: "Đăng bài" }}
      />
      {user && user.role === 0 && (
        <Tab.Screen
          name="Management"
          component={ManagementScreen}
          options={{ title: "Quản lý" }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { state } = useContext(MyUserContext);
  if (state.loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#222" />
      </View>
    );
  }
  if (!state.user) {
    // Chưa đăng nhập
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Welcome"
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }
  // Đã đăng nhập
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="MainApp"
    >
      <Stack.Screen name="MainApp" component={MainTabs} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="VerifyUser" component={VerifyUserScreen} />
      <Stack.Screen name="CreateTeacher" component={CreateTeacherScreen} />
      <Stack.Screen name="SetTimeTeacher" component={SetTimeTeacherScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="CreateSurvey" component={CreateSurveyScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="ChatRoomDetail" component={ChatRoomDetailScreen} />
      <Stack.Screen
        name="PostDetailScreen"
        component={PostDetailScreen}
        options={{
          title: "Bài viết",
          headerTitleAlign: "center",
          headerShown: true,
        }}
      />
      <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
      <Stack.Screen
        name="UpdatePostScreen"
        component={UpdatePostScreen}
        options={{
          title: "Chỉnh sửa bài viết",
          headerTitleAlign: "center",
          headerShown: true,
        }}
      />
      <Stack.Screen name="SurveyScreen" component={SurveyScreen} options={{
          title: "Bài khảo sát",
          headerTitleAlign: "center",
          headerShown: true,
        }}/>
      <Stack.Screen name="CreateSurveyScreen" component={CreateSurveyScreen} />
      <Stack.Screen name="UpdateSurveyScreen" component={UpdateSurveyScreen} options={{
          title: "Chỉnh sửa bài khảo sát",
          headerTitleAlign: "center",
          headerShown: true,
        }}/>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MyUserProvider>
        <NavigationContainer>
          <AppContent />
          <StatusBar style="auto" />
        </NavigationContainer>
      </MyUserProvider>
    </GestureHandlerRootView>
  );
}
