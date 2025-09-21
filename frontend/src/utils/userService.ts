// User service to manage userId, userName, and hostId in localStorage
export const userService = {
  // Generate unique user ID
  generateUserId: (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Save user data to localStorage
  saveUser: (userId: string, userName: string, isHost: boolean = false) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    
    // If user is host, save hostId as well
    if (isHost) {
      localStorage.setItem("hostId", userId);
    }
  },

  // Get current user data from localStorage
  getUser: () => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const hostId = localStorage.getItem("hostId");
    
    return {
      userId,
      userName,
      hostId,
      isHost: userId === hostId
    };
  },

  // Clear all user data
  clearUser: () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("hostId");
  }
};