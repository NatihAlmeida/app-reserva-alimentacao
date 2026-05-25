/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';

export const AuthContext = createContext();

const STORAGE_KEYS = {
  users: 'authUsers',
  session: 'authSession',
};

const readJson = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const isRemovedDemoAccount = (candidate) =>
  (candidate.email === `admin${'@'}cantina.com` && candidate.password === `admin${'123'}`) ||
  (candidate.email === `aluno${'@'}escola.com` && candidate.password === `aluno${'123'}`);

const getStoredUsers = () => {
  const users = readJson(STORAGE_KEYS.users, []);
  const sanitizedUsers = users.filter((candidate) => !isRemovedDemoAccount(candidate));

  if (sanitizedUsers.length !== users.length) {
    saveUsers(sanitizedUsers);
  }

  return sanitizedUsers;
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
};

const toPublicUser = (userData) => {
  if (!userData) return null;
  const publicUser = { ...userData };
  delete publicUser.password;
  return publicUser;
};

const persistSession = (userData) => {
  const publicUser = toPublicUser(userData);
  const session = {
    token: `local-jwt-ready-${Date.now()}`,
    refreshToken: `local-refresh-${Date.now()}`,
    user: publicUser,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  return publicUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const session = readJson(STORAGE_KEYS.session, null);
    if (!session?.user || (session.expiresAt && new Date(session.expiresAt) < new Date())) {
      localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    }
    return session.user;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password, requestedRole = 'student') => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const foundUser = users.find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        candidate.password === password &&
        candidate.role === requestedRole
    );

    setLoading(false);
    if (!foundUser) {
      return { success: false, message: 'E-mail, senha ou tipo de acesso inválido.' };
    }

    if (foundUser.blocked && foundUser.role === 'student') {
      return {
        success: false,
        message: 'Sua conta está temporariamente bloqueada. Procure a cantina.',
      };
    }

    const publicUser = persistSession(foundUser);
    setUser(publicUser);
    return { success: true, user: publicUser };
  };

  const registerStudent = async ({ name, email, password }) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();

    if (users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) {
      setLoading(false);
      return { success: false, message: 'Já existe uma conta com este e-mail.' };
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
      profilePicture: '',
      absences: 0,
      blocked: false,
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    const publicUser = persistSession(newUser);
    setUser(publicUser);
    setLoading(false);
    return { success: true, user: publicUser };
  };

  const createAdminAccess = ({ name, email, password }) => {
    const users = getStoredUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'E-mail já cadastrado.' };
    }

    saveUsers([
      ...users,
      {
        id: Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'admin',
        profilePicture: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    return { success: true, message: 'Acesso administrativo criado.' };
  };

  const updateProfile = (profileData) => {
    if (!user) return false;

    const users = getStoredUsers();
    const updatedUsers = users.map((candidate) =>
      candidate.id === user.id ? { ...candidate, ...profileData } : candidate
    );
    const updatedUser = updatedUsers.find((candidate) => candidate.id === user.id);
    const publicUser = persistSession(updatedUser);

    saveUsers(updatedUsers);
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

    saveUsers(
      users.map((candidate) =>
        candidate.id === user.id ? { ...candidate, password: newPassword } : candidate
      )
    );

    return { success: true, message: 'Senha alterada com sucesso.' };
  };

  const requestPasswordReset = async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = getStoredUsers();
    return users.some((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase());
  };

  const registerAbsence = (studentId) => {
    const users = getStoredUsers();
    let updatedStudent = null;

    const updatedUsers = users.map((candidate) => {
      if (candidate.id !== studentId || candidate.role !== 'student') return candidate;
      const absences = (candidate.absences || 0) + 1;
      updatedStudent = { ...candidate, absences, blocked: absences >= 3 };
      return updatedStudent;
    });

    saveUsers(updatedUsers);
    if (user?.id === studentId && updatedStudent) {
      const publicUser = persistSession(updatedStudent);
      setUser(publicUser);
    }

    return updatedStudent ? toPublicUser(updatedStudent) : null;
  };

  const unblockStudent = (studentId) => {
    const users = getStoredUsers();
    saveUsers(
      users.map((candidate) =>
        candidate.id === studentId ? { ...candidate, absences: 0, blocked: false } : candidate
      )
    );
  };

  const getStudents = () =>
    getStoredUsers()
      .filter((candidate) => candidate.role === 'student')
      .map(toPublicUser);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    updateProfile,
    changePassword,
    requestPasswordReset,
    registerStudent,
    createAdminAccess,
    registerAbsence,
    unblockStudent,
    getStudents,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
