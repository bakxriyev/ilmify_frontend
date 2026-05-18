'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Student, Teacher, Parent, LoginResponse, TeacherLoginResponse, ParentLoginResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

type User = Student | Teacher | Parent;

interface AuthContextType {
  user: User | null;
  token: string | null;
  deviceId: string | null;
  role: 'student' | 'teacher' | 'parent' | null;
  login: (phone: string, password: string, role: 'student' | 'teacher' | 'parent') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  checkDevice: () => Promise<boolean>;
  checkCurrentDevice: (userId: string) => Promise<boolean>;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'parent' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = api.getToken();
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') as 'student' | 'teacher' | 'parent' | null : null;
      const storedDeviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : null;

      if (storedToken && storedUser && storedRole) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
        if (storedDeviceId) setDeviceId(storedDeviceId);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string, loginRole: 'student' | 'teacher' | 'parent'): Promise<boolean> => {
    try {
      let response;
      if (loginRole === 'student') {
        response = await api.login(phone, password);
      } else if (loginRole === 'teacher') {
        response = await api.teacherLogin(phone, password);
      } else {
        response = await api.parentLogin(phone, password);
      }

      api.setToken(response.access_token);
      setToken(response.access_token);

      let userData;
      if (loginRole === 'student') {
        userData = (response as LoginResponse).student;
      } else if (loginRole === 'teacher') {
        userData = (response as TeacherLoginResponse).teacher;
      } else {
        userData = (response as ParentLoginResponse).parent;
      }

      setUser(userData);
      setRole(loginRole);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', loginRole);

      if (loginRole === 'student' && 'device_id' in response) {
        const deviceId = (response as LoginResponse).device_id;
        if (deviceId) {
          setDeviceId(deviceId);
          localStorage.setItem('deviceId', deviceId);
        }
      }

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message && error.message.includes('Device not active')) {
        throw new Error('Sizning hisobingiz boshqa qurilmada faollashtirilgan.');
      }
      return false;
    }
  };

  const logout = () => {
    api.removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('deviceId');
    }
    setToken(null);
    setUser(null);
    setRole(null);
    setDeviceId(null);
    router.push('/login');
  };

  const refreshUserData = async () => {
    if (!user?.id || !token || !role) return;

    try {
      if (role === 'student') {
        const data = await api.getStudentById(user.id);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        // Teacher ma'lumotlarini yangilash uchun alohida endpoint kerak bo'lishi mumkin
        // Hozircha hech narsa qilmaymiz
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const checkCurrentDevice = async (userId: string): Promise<boolean> => {
    if (role !== 'student') return true; // teacher uchun device tekshirilmaydi
    try {
      const currentDeviceId = localStorage.getItem('deviceId');
      if (!currentDeviceId) return false;

      const userDevices = await api.getUserDevices(userId);
      const currentDevice = userDevices.data.find((d: any) => d.device_id === currentDeviceId);
      return currentDevice ? currentDevice.is_active : false;
    } catch (error) {
      console.error('Error checking device:', error);
      return false;
    }
  };

  const checkDevice = async (): Promise<boolean> => {
    if (!user?.id || role !== 'student') return true;
    return await checkCurrentDevice(user.id);
  };

  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const isParent = role === 'parent';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      deviceId,
      role,
      login,
      logout,
      isLoading,
      refreshUserData,
      checkDevice,
      checkCurrentDevice,
      isTeacher,
      isStudent,
      isParent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}