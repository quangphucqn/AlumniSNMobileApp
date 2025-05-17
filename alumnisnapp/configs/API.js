// API.js

import axios from "axios";

const CLIENT_ID = "bnuIbu1IttTtWIHvfwJth0gWNTBFcrnNqmDcKZsP";
const CLIENT_SECRET =
  "pbkdf2_sha256$1000000$K546kUGlBKo5cpNUXkmBG4$xIxXPNCxe0WgoA9Koer5sIHU5K1D5ZuuHFxBOodVNHQsS1e7ALiQPnUE5xueDXxoL6GT7h14vr90DOzF8MZyS2LHSXirHB2z4YMJwQ0VTaN7aiYbiwy1oyuoy0DBeuPGWV3RC3qn5LWz2TSkRMIS/FpGqjZQcPmRpoRw0oY7xmc=";

const BASE_URL = "http://192.168.0.39:8000";
// Định nghĩa các endpoints
export const endpoints = {
  // User endpoints
  login: "/o/token/",
  register: "/register/",
  user: "/user/",
  currentUser: "/user/current_user/",
  changePassword: "/user/change_password/",
  updateAvatar: "/user/update_avatar/",
  updateCover: "/user/update_cover/",
  userVerify: "/user",
  unverifiedUsers: "/user/list_unverified_users/",
  createTeacher: "/user/create_teacher/",
  setPasswordResetTime: "/user",
  getTeachersExpiredPassword: "/user/teachers_expired_password_reset/",
  // Post endpoints
  post: "/post/",
  "post-detail": (postId) => `/post/${postId}/`,
  "my-posts": "/post/my-posts",
  comments: (postId) => `/post/${postId}/comment/`,
  "lock-unlock-comment": (postId) => `/post/${postId}/lock-unlock-comment/`,

  // Comment endpoints
  "comment-detail": (commentId) => `/comment/${commentId}/`,
  replyComment: (commentId) => `/comment/${commentId}/reply/`,
  reacts: (postId) => `/post/${postId}/reacts/`,
  react: (postId) => `/post/${postId}/react/`,
  // Survey endpoints
  survey: "/survey/",
  "survey-detail": (surveyId) => `/survey/${surveyId}/`,
  draft: (surveyId) => `/survey/${surveyId}/draft/`,
  submit: (surveyId) => `/survey/${surveyId}/submit/`,
  resume: (surveyId) => `/survey/${surveyId}/resume/`,

  // Group endpoints
  groups: "/groups/",

  // Event endpoints
  events: "/events/",
  eventDetail: "/events/{id}/",

  // Chat endpoints
  chats: "/chat/",
  chatDetail: "/chat/{id}/",
  getMessages: "/chat/{id}/get_messages/",
  sendMessage: "/chat/{id}/send_message/",
};

// Tạo instance axios với token
export const authAPI = (accessToken) => {
  console.log("Token in authAPI:", accessToken);
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
export const getPostComments = async (postId, token) => {
  try {
    const res = await authAPI(token).get(endpoints.comments(postId));
    return res.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

export const getPostReacts = async (postId, accessToken) => {
  try {
    const res = await authAPI(accessToken).get(endpoints.reacts(postId));
    return res.data;
  } catch (error) {
    console.error("Error fetching reacts:", error);
    return [];
  }
};
export const getSurveyData = async (postId,accessToken) => {
  try {
    const res = await authAPI(accessToken).get(`/survey/${postId}/`);
    console.log("Survey API response:", res);
    return res.data;
  } catch (error) {
    console.error("Survey fetch error:", error.response?.data || error.message);
    throw error;
  }
};




// API functions
export const api = {
  // Auth APIs
  login: (formData) => {
    return axios.post(BASE_URL + endpoints.login, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });
  },
  register: (userData) => axios.post(endpoints.register, userData),
  logout: (accessToken) => authAPI(accessToken).post(endpoints.logout),
  getCurrentUser: (accessToken) =>
    authAPI(accessToken).get(endpoints.currentUser),

  // Post APIs
  // Comment APIs
  // Survey APIs

  // Group APIs
  getGroups: (accessToken, q, page = 1) =>
    authAPI(accessToken).get(endpoints.groups, {
      params: { ...(q ? { q } : {}), page },
    }),
  createGroup: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.groups, data),
  getGroupDetail: (accessToken, id, page = 1, q) =>
    authAPI(accessToken).get(`${endpoints.groups}${id}/`, {
      params: { page, q },
    }),
  updateGroup: (accessToken, id, data) =>
    authAPI(accessToken).patch(`${endpoints.groups}/${id}/`, data),
  deleteGroup: (accessToken, id) =>
    authAPI(accessToken).delete(`${endpoints.groups}${id}/`),
  addUsers: (accessToken, id, data) =>
    authAPI(accessToken).post(`${endpoints.groups}${id}/add_users/`, data),
  removeUsers: (accessToken, id, data) =>
    authAPI(accessToken).post(`${endpoints.groups}${id}/remove_users/`, data),

  // Event APIs
  getEvents: (accessToken) => authAPI(accessToken).get(endpoints.events),
  createEvent: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.events, data),
  updateEvent: (accessToken, id, data) =>
    authAPI(accessToken).patch(`${endpoints.events}/${id}/`, data),
  deleteEvent: (accessToken, id) =>
    authAPI(accessToken).delete(`${endpoints.events}/${id}/`),

  // Chat APIs
  getChatRooms: (accessToken) => authAPI(accessToken).get(endpoints.chats),
  createChatRoom: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.chats, data),
  getMessages: (accessToken, roomId) =>
    authAPI(accessToken).get(`${endpoints.chats}/${roomId}/get_messages/`),
  sendMessage: (accessToken, roomId, data) =>
    authAPI(accessToken).post(
      `${endpoints.chats}/${roomId}/send_message/`,
      data
    ),

  // User APIs
  userList: (accessToken, q, page = 1, role) =>
    authAPI(accessToken).get(endpoints.user, {
      params: {
        ...(q ? { q } : {}),
        page,
        ...(role !== undefined && role !== "" ? { role } : {}),
      },
    }),
  deleteUser: (accessToken, id) =>
    authAPI(accessToken).delete(`${endpoints.user}${id}/`),
  changePassword: (accessToken, data) =>
    authAPI(accessToken).patch(endpoints.changePassword, data),
  updateAvatar: (accessToken, data) =>
    authAPI(accessToken).patch(endpoints.updateAvatar, data),
  updateCover: (accessToken, data) =>
    authAPI(accessToken).patch(endpoints.updateCover, data),
  verifyUser: (accessToken, id) =>
    authAPI(accessToken).patch(`${endpoints.userVerify}/${id}/verify_user/`),
  getUnverifiedUsers: (accessToken, q, page = 1) =>
    authAPI(accessToken).get(endpoints.unverifiedUsers, {
      params: { ...(q ? { q } : {}), page },
    }),
  setPasswordResetTime: (accessToken, id) =>
    authAPI(accessToken).patch(
      `${endpoints.setPasswordResetTime}/${id}/set_password_reset_time/`
    ),
  createTeacher: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.createTeacher, data),
  getTeachersExpiredPassword: (accessToken, q, page = 1) =>
    authAPI(accessToken).get(endpoints.getTeachersExpiredPassword, {
      params: { ...(q ? { q } : {}), page },
    }),
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data.message || "An error occurred",
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      status: 0,
      message: "No response from server",
    };
  } else {
    return {
      status: 0,
      message: error.message,
    };
  }
};

export default axios.create({
  baseURL: BASE_URL,
});
