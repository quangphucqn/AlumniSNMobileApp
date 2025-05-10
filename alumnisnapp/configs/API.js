// API.js

import axios from 'axios';

const BASE_URL = 'http://192.168.1.19:8000/';

const CLIENT_ID = 'rWEssaZoNvTosQ3TPJL5KbfLE9IqROWtc3SjiHkb';
const CLIENT_SECRET = 'u3hCX7ohbh1L8pUthVKLuygb8F0WFdyvYqvrHjornAMuUiYfH4M2h036hfQIsMNy5r8Om6RKh9XDmQQoVhKkCUxUOlNioX6tF9DYku4ucQZvCDhpU1FYXq6Fqcfiv6aO';


// Định nghĩa các endpoints
export const endpoints = {
    // User endpoints
    login: BASE_URL + 'o/token/',
    register: BASE_URL + 'register/',
    currentUser: BASE_URL + 'user/current_user/',
    changePassword: BASE_URL + 'user/change_password/',
    updateAvatar: BASE_URL + 'user/update_avatar/',
    updateCover: BASE_URL + 'user/update_cover/',
    verifyUser: BASE_URL + 'user/{id}/verify_user/',
    unverifiedUsers: BASE_URL + 'user/list_unverified_users/',
    createTeacher: BASE_URL + 'user/create_teacher/',
    setPasswordResetTime: BASE_URL + 'user/{id}/set_password_reset_time/',
    
    // Post endpoints
    posts: BASE_URL + 'posts/',
    postDetail: BASE_URL + 'posts/{id}/',
    myPosts: BASE_URL + 'posts/my-posts/',
    postComment: BASE_URL + 'posts/{id}/comment/',
    lockUnlockComment: BASE_URL + 'posts/{id}/lock-unlock-comment/',
    
    // Comment endpoints
    commentDetail: BASE_URL + 'comments/{id}/',
    replyComment: BASE_URL + 'comments/{id}/reply/',
    
    // Survey endpoints
    surveys: BASE_URL + 'surveys/',
    surveyDetail: BASE_URL + 'surveys/{id}/',
    surveyDraft: BASE_URL + 'surveys/{id}/draft/',
    surveyResume: BASE_URL + 'surveys/{id}/resume/',
    surveySubmit: BASE_URL + 'surveys/{id}/submit/',
    
    // Group endpoints
    groups: BASE_URL + 'groups/',
    groupDetail: BASE_URL + 'groups/{id}/',
    addUsersToGroup: BASE_URL + 'groups/{id}/add_users/',
    removeUsersFromGroup: BASE_URL + 'groups/{id}/remove_users/',
    
    // Event endpoints
    events: BASE_URL + 'events/',
    eventDetail: BASE_URL + 'events/{id}/',
    
    // Chat endpoints
    chats: BASE_URL + 'chat/',
    chatDetail: BASE_URL + 'chat/{id}/',
    getMessages: BASE_URL + 'chat/{id}/get_messages/',
    sendMessage: BASE_URL + 'chat/{id}/send_message/',
};

// Tạo instance axios với token
export const authAPI = (accessToken) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
};

// API functions
export const api = {
    // Auth APIs
    login: (data) => {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        formData.append('grant_type', data.grant_type);
        formData.append('client_id', CLIENT_ID);
        formData.append('client_secret', CLIENT_SECRET);
        
        return axios.post(endpoints.login, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            }
        });
    },
    register: (userData) => axios.post(endpoints.register, userData),
    logout: (accessToken) => authAPI(accessToken).post(endpoints.logout),
    getCurrentUser: (accessToken) => authAPI(accessToken).get(endpoints.currentUser),
    
    // Post APIs
    getPosts: (accessToken, params) => authAPI(accessToken).get(endpoints.posts, { params }),
    getMyPosts: (accessToken) => authAPI(accessToken).get(endpoints.myPosts),
    createPost: (accessToken, formData) => authAPI(accessToken).post(endpoints.posts, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    updatePost: (accessToken, id, data) => authAPI(accessToken).patch(`${endpoints.posts}/${id}/`, data),
    deletePost: (accessToken, id) => authAPI(accessToken).delete(`${endpoints.posts}/${id}/`),
    lockUnlockComments: (accessToken, id) => authAPI(accessToken).patch(`${endpoints.posts}/${id}/lock-unlock-comment/`),
    
    // Comment APIs
    createComment: (accessToken, postId, data) => authAPI(accessToken).post(`${endpoints.posts}/${postId}/comment/`, data),
    updateComment: (accessToken, id, data) => authAPI(accessToken).patch(`${endpoints.comments}/${id}/`, data),
    deleteComment: (accessToken, id) => authAPI(accessToken).delete(`${endpoints.comments}/${id}/`),
    replyComment: (accessToken, id, data) => authAPI(accessToken).post(`${endpoints.comments}/${id}/reply/`, data),
    
    // Survey APIs
    getSurveys: (accessToken) => authAPI(accessToken).get(endpoints.surveys),
    createSurvey: (accessToken, data) => authAPI(accessToken).post(endpoints.surveys, data),
    updateSurvey: (accessToken, id, data) => authAPI(accessToken).patch(`${endpoints.surveys}/${id}/`, data),
    saveDraft: (accessToken, id, data) => authAPI(accessToken).post(`${endpoints.surveys}/${id}/draft/`, data),
    submitSurvey: (accessToken, id, data) => authAPI(accessToken).post(`${endpoints.surveys}/${id}/submit/`, data),
    resumeSurvey: (accessToken, id) => authAPI(accessToken).get(`${endpoints.surveys}/${id}/resume/`),
    
    // Group APIs
    getGroups: (accessToken, params) => authAPI(accessToken).get(endpoints.groups, { params }),
    createGroup: (accessToken, data) => authAPI(accessToken).post(endpoints.groups, data),
    updateGroup: (accessToken, id, data) => authAPI(accessToken).patch(`${endpoints.groups}/${id}/`, data),
    deleteGroup: (accessToken, id) => authAPI(accessToken).delete(`${endpoints.groups}/${id}/`),
    addUsers: (accessToken, id, data) => authAPI(accessToken).post(`${endpoints.groups}/${id}/add_users/`, data),
    removeUsers: (accessToken, id, data) => authAPI(accessToken).post(`${endpoints.groups}/${id}/remove_users/`, data),
    
    // Event APIs
    getEvents: (accessToken) => authAPI(accessToken).get(endpoints.events),
    createEvent: (accessToken, data) => authAPI(accessToken).post(endpoints.events, data),
    updateEvent: (accessToken, id, data) => authAPI(accessToken).patch(`${endpoints.events}/${id}/`, data),
    deleteEvent: (accessToken, id) => authAPI(accessToken).delete(`${endpoints.events}/${id}/`),
    
    // Chat APIs
    getChatRooms: (accessToken) => authAPI(accessToken).get(endpoints.chats),
    createChatRoom: (accessToken, data) => authAPI(accessToken).post(endpoints.chats, data),
    getMessages: (accessToken, roomId) => authAPI(accessToken).get(`${endpoints.chats}/${roomId}/get_messages/`),
    sendMessage: (accessToken, roomId, data) => authAPI(accessToken).post(`${endpoints.chats}/${roomId}/send_message/`, data),

    // User APIs
    changePassword: (accessToken, data) => authAPI(accessToken).patch(endpoints.changePassword, data),
};

// Error handling helper
export const handleApiError = (error) => {
    if (error.response) {
        return {
            status: error.response.status,
            message: error.response.data.message || 'An error occurred',
            data: error.response.data,
        };
    } else if (error.request) {
        return {
            status: 0,
            message: 'No response from server',
        };
    } else {
        return {
            status: 0,
            message: error.message,
        };
    }
};

export default axios.create({
    baseURL: BASE_URL
});