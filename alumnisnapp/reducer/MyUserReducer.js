const initialState = {
  user: null,
  loading: true,
};

const MyUserReducer = (state, action) => {
  switch (action.type) {
    case 'login':
      return { ...state, user: action.payload, loading: false };
    case 'logout':
      return { ...state, user: null, loading: false };
    case 'setLoading':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export { initialState };
export default MyUserReducer;