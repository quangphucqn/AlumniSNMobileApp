import axios from 'axios';
const BASE_URL = 'http://127.0.0.1:8000/';

export const endpoints = {
    login: BASE_URL + 'api/login',
    register: BASE_URL + 'api/register',
    logout: BASE_URL + 'api/logout',
    user: BASE_URL + 'api/user',
    
}
export const authAPI = (accsessToken) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${accsessToken}`
        }
    })
}

export default axios.create({
    'baseURL': BASE_URL
})