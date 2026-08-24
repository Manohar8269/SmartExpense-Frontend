export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};