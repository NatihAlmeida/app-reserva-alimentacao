import { createContext, useState } from 'react';

export const AuthContext = createContext();

const defaultUsers = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@cantina.com',
    password: 'admin123',
    role: 'admin',
    profilePicture: '',
  },
  {
    id: 2,
    name: 'João Silva',
    email: 'aluno@escola.com',
    password: 'aluno123',
    role: 'student',
    profilePicture: '',
  },
];

const getStoredUsers = () => {
  const stored = localStorage.getItem('authUsers');
  if (stored) return JSON.parse(stored);

  localStorage.setItem('authUsers', JSON.stringify(defaultUsers));
  return defaultUsers;
};

const toPublicUser = (userData) => {
  const publicUser = { ...userData };
  delete publicUser.password;
  return publicUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading] = useState(false);

  const login = async (email, password) => {
    const users = getStoredUsers();
    const foundUser = users.find(
      (candidate) => candidate.email === email && candidate.password === password
    );

    if (!foundUser) return false;

    const publicUser = toPublicUser(foundUser);
    localStorage.setItem('user', JSON.stringify(publicUser));
    setUser(publicUser);
    return true;
  };

  const updateProfile = (profileData) => {
    if (!user) return false;

    const users = getStoredUsers();
    const updatedUsers = users.map((candidate) =>
      candidate.id === user.id ? { ...candidate, ...profileData } : candidate
    );
    const updatedUser = updatedUsers.find((candidate) => candidate.id === user.id);
    const publicUser = toPublicUser(updatedUser);

    localStorage.setItem('authUsers', JSON.stringify(updatedUsers));
    localStorage.setItem('user', JSON.stringify(publicUser));
    setUser(publicUser);
    return true;
  };

  const changePassword = (currentPassword, newPassword) => {
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const users = getStoredUsers();
    const currentUser = users.find((candidate) => candidate.id === user.id);

    if (!currentUser || currentUser.password !== currentPassword) {
      return { success: false, message: 'Senha atual incorreta.' };
    }

    const updatedUsers = users.map((candidate) =>
      candidate.id === user.id ? { ...candidate, password: newPassword } : candidate
    );
    localStorage.setItem('authUsers', JSON.stringify(updatedUsers));

    return { success: true, message: 'Senha alterada com sucesso.' };
  };

  const requestPasswordReset = async (email) => {
    const users = getStoredUsers();
    return users.some((candidate) => candidate.email === email);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateProfile,
        changePassword,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
