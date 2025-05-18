// API.js

import axios from "axios";


const BASE_URL = "http://172.20.10.2:8000";
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
  posts: "/posts/",
  "post-detail": (postId) => `/post/${postId}/`,
  myPosts: "/posts/my-posts/",
  comments: (postId) => `/post/${postId}/comments/`,
  "lock-unlock-comment": (postId) => `/post/${postId}/lock-unlock-comment/`,

  // Comment endpoints
  "comment-detail": (commentId) => `/comment/${commentId}/`,
  replyComment: "/comments/{id}/reply/",
  reacts: (postId) => `/post/${postId}/reacts/`,
  react: (postId) => `/post/${postId}/react/`,
  // Survey endpoints
  surveys: "/surveys/",
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
  chatDetail: (id) => `/chat/${id}/`,
  getMessages: (id) => `/chat/${id}/get_messages/`,
  sendMessage: (id) => `/chat/${id}/send_message/`,
  markAsRead: (id) => `/chat/${id}/mark_as_read/`,
};

// Tạo instance axios với token
export const authAPI = (accessToken) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const getListUsers = async (accessToken, q = "", page = 1, role = "") => {
  try {
      const res = await authAPI(accessToken).get(endpoints.user, {
          params: {
              ...(q ? { q } : {}),
              page,
              ...(role !== undefined && role !== "" ? { role } : {}),
          },
      });
      return res.data;
  } catch (error) {
      console.error("Error fetching users:", error);
      return [];
  }
};
export const getPostComments = async (postId) => {
    try {
        const res = await axios.get(BASE_URL + endpoints.comments(postId));
        return res.data;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
};

export const getPostReacts = async (postId) => {
    try {
        const res = await axios.get(BASE_URL + endpoints.reacts(postId));
        return res.data;
    } catch (error) {
        console.error("Error fetching reacts:", error);
        return [];
    }
};

export const getSurveyData = async (surveyId) => {
    try {
        const res = await axios.get(BASE_URL + endpoints["survey-detail"](surveyId));
        return res.data;
    } catch (error) {
        console.error("Error fetching reacts:", error);
        return [];
    }
};
// API functions
export const api = {
  // Auth APIs
  login: (formData) => {
    return axios.post(BASE_URL + endpoints.login, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    });
  },
  register: (userData) => axios.post(endpoints.register, userData),
  logout: (accessToken) => authAPI(accessToken).post(endpoints.logout),
  getCurrentUser: (accessToken) =>
    authAPI(accessToken).get(endpoints.currentUser),

  // Post APIs
  getPosts: (accessToken, params) =>
    authAPI(accessToken).get(endpoints.posts, { params }),
  getMyPosts: (accessToken) => authAPI(accessToken).get(endpoints.myPosts),
  createPost: (accessToken, formData) =>
    authAPI(accessToken).post(endpoints.posts, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  updatePost: (accessToken, id, data) =>
    authAPI(accessToken).patch(`${endpoints.posts}/${id}/`, data),
  deletePost: (accessToken, id) =>
    authAPI(accessToken).delete(`${endpoints.posts}/${id}/`),
  lockUnlockComments: (accessToken, id) =>
    authAPI(accessToken).patch(`${endpoints.posts}/${id}/lock-unlock-comment/`),

  // Comment APIs
  createComment: (accessToken, postId, data) =>
    authAPI(accessToken).post(`${endpoints.posts}/${postId}/comment/`, data),
  updateComment: (accessToken, id, data) =>
    authAPI(accessToken).patch(`${endpoints.comments}/${id}/`, data),
  deleteComment: (accessToken, id) =>
    authAPI(accessToken).delete(`${endpoints.comments}/${id}/`),
  replyComment: (accessToken, id, data) =>
    authAPI(accessToken).post(`${endpoints.comments}/${id}/reply/`, data),

  // Survey APIs
  getSurveys: (accessToken) => authAPI(accessToken).get(endpoints.surveys),
  createSurvey: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.surveys, data),
  updateSurvey: (accessToken, id, data) =>
    authAPI(accessToken).patch(`${endpoints.surveys}/${id}/`, data),
  saveDraft: (accessToken, id, data) =>
    authAPI(accessToken).post(`${endpoints.surveys}/${id}/draft/`, data),
  submitSurvey: (accessToken, id, data) =>
    authAPI(accessToken).post(`${endpoints.surveys}/${id}/submit/`, data),
  resumeSurvey: (accessToken, id) =>
    authAPI(accessToken).get(`${endpoints.surveys}/${id}/resume/`),

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
  getChatRooms: (accessToken,q,page=1) => authAPI(accessToken).get(endpoints.chats, {
    params: { ...(q ? { q } : {}), page },
  }),
  createChatRoom: (accessToken, data) =>
    authAPI(accessToken).post(endpoints.chats, data),
  sendMessage: (accessToken, roomId, data) =>
    authAPI(accessToken).post(
      `${endpoints.chats}${roomId}/send_message/`,
      data
    ),
  getChatRoomDetail: (accessToken, roomId) =>
    authAPI(accessToken).get(`${endpoints.chats}${roomId}/`),
  getMessages: (accessToken, roomId, before_id = null) =>
    authAPI(accessToken).get(`${endpoints.chats}${roomId}/messages/`, {
      params: before_id ? { before_id } : {},
    }),
  markAsRead: (accessToken, roomId) =>
    authAPI(accessToken).post(`${endpoints.chats}${roomId}/mark_as_read/`),
  getLastMessages: (accessToken, roomId) =>
    authAPI(accessToken).get(`${endpoints.chats}${roomId}/last_messages/`),


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
