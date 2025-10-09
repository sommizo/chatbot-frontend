const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

class AuthService {
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        console.log('[DEBUG_LOG] Login response data:', data);
        console.log('[DEBUG_LOG] UserId from response:', data.userId);
        sessionStorage.setItem('authToken', data.token);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('userId', data.userId);
        console.log('[DEBUG_LOG] UserId stored in sessionStorage:', sessionStorage.getItem('userId'));
        return { success: true, data };
      } else {
        return { success: false, message: data.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async validateToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
  }

  getToken() {
    return sessionStorage.getItem('authToken');
  }

  getUsername() {
    return sessionStorage.getItem('username');
  }

  getUserId() {
    return sessionStorage.getItem('userId');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();