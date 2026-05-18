const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export interface LoginResponse {
  access_token: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    photo: string;
    group: any;
  };
  device_id?: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  price_in_coins: number;
  quantity: number;
  size: string | null;
  photo: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePayload {
  product_id: number;
  quantity: number;
  student_id: number;
}

export interface StudentPurchase {
  id: number;
  student_id: string;
  product_id: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: ShopProduct;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
  phone_number: string;
  photo: string | null;
  password: string;
  group_id: string | null;
  group_students: Array<{
    id: string;
    group_id: string;
    student_id: string;
    joined_date: string;
      group: {
        id: string;
        name: string;
        teacher_id: string;
        support_teacher_id: string;
        level_id: string;
        room?: Room;
        mainTeacher: {
          id: string;
          first_name: string;
          last_name: string;
          gmail: string;
          phone_number: string;
          photo: string;
        };
        supportTeacher: {
          id: string;
          first_name: string;
          last_name: string;
          gmail: string;
          phone_number: string;
          photo: string;
        };
        level: {
          id: string;
          name: string;
          title: string;
          description: string;
        };
        lessons: Array<{
          id: string;
          group_id: string;
          date: string;
          time: string;
          parity: string;
          unit?: any;
        }>;
      };
  }>;
  attendances: any[];
  student_answers: any[];
  exercise_results: any[];
  vocab_results: any[];
  unit_results: any[];
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  groups_count?: number;
  occupied_seats?: number;
  created_at: string;
}

export interface GroupStudent {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
  phone_number: string;
  photo: string | null;
  password: string;
  group_id: string | null;
}

export interface GroupStudentsResponse {
  groupId: number;
  students: GroupStudent[];
}

export interface UserDevice {
  id: string;
  user_type: string;
  user_id: string;
  student_id: string;
  teacher_id: string | null;
  device_id: string;
  device_info: string;
  ip_address: string;
  jti: string;
  last_active: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  lesson_id: string;
  status: 'present' | 'absent' | 'late';
  score?: number;
  created_at: string;
}

export interface Level {
  id: string;
  name: string;
  title: string;
  description: string;
  units: Array<{
    id: string;
    title: string;
    description: string;
    unit_number: string;
  }>;
  units_count: number;
}

export interface Exercise {
  id: string;
  name: string;
  unit_id: string;
  description: string;
  number: number;
  type: string;
  qText: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  exercise_id: string;
  question_text: string;
  media: any;
  correct_answer: string;
  extra_data: string;
  photo: string | null;
  title: string;
  description: string | null;
  completed_at: string | null;
  answer: any;
  writing_q: any;
  percentage: number;
  ordinary_number: number;
  audio: any;
  video: any;
  options: any;
}

export interface StudentUnitResult {
  id: string;
  student_id: string;
  unit_id: string;
  status: 'completed' | 'in_progress' | 'locked';
  score: number;
  completed_at: string;
  unit: {
    id: string;
    title: string;
    unit_number: string;
  };
}

export interface StudentExerciseResult {
  id: string;
  student_id: string;
  exercise_id: string;
  score: number;
  completed_at: string;
  exercise: Exercise;
}

export interface ExerciseResult {
  id: string;
  student_id: string;
  unit_id: string;
  exercise_id: string;
  percentage: number;
  completed_at: string;
}
export interface UnitResultDetail {
  student_id: number;
  unit_id: number;
  exercises_count: number;
  counted_exercises: number;
  percentage: number;
}

export interface Notification {
  id: number;
  user_id: number | null;
  role: string | null;
  title: string;
  description: string;
  image: string | null;
  link: string;
  is_read: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AttendanceRecord {
  id: string;
  group_id: string;
  student_id: string;
  lesson_id: string;
  date: string;
  is_present: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
  email: string;
  phone_number: string;
  photo: string | null;
  password: string;
  group_id: string | null;

  };
}
export interface AttendancePayload {
  lesson_id: number;
  attendance: Array<{
    student_id: number;
    is_present: boolean;
    reason?: string | null;
  }>;
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gmail: string;
  photo: string | null;
  teacher_type: 'MAIN_TEACHER' | 'SUPPORT_TEACHER';
}
export interface TeacherInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gmail: string;
  photo: string | null;
  teacher_type?: string;
}

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  support_teacher_id: string;
  level_id: string;
  room_id?: string;
  kp?: number;
  monthly_price?: number;
  student_count?: number;
  room?: Room;
  mainTeacher?: TeacherInfo;
  supportTeacher?: TeacherInfo;
  level?: Level;
  lessons?: GroupLesson[];
  created_at?: string;
  updated_at?: string;
}

export interface TeacherGroup {
  id: string;
  name: string;
  teacher_id: string;
  support_teacher_id: string;
  level_id: string;
  room?: Room;
  kp?: number;
  monthly_price?: number;
  student_count?: number;
  created_at: string;
  updated_at: string;
  mainTeacher?: Teacher;
  supportTeacher?: Teacher;
}

export interface TeacherGroupsResponse {
  teacher_id: number;
  teacher_name: string;
  teacher_type: string;
  main_groups: TeacherGroup[];
  support_groups: TeacherGroup[];
  total_groups: number;
}

export interface TeacherLoginResponse {
  access_token: string;
  teacher: Teacher;
}

export interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  photo: string | null;
}

export interface ParentLoginResponse {
  access_token: string;
  parent: Parent;
}

export interface GroupLesson {
  id: string;
  group_id: string;
  unit_id: string | null;
  room_id: string | null;
  date: string;
  time: string;
  start_time: string | null;
  end_time: string | null;
  parity: string;
  unit?: any;
  room?: Room;
}

export interface Payment {
  id: number;
  student_id: string;
  group_id: string;
  amount: number;
  month: number;
  year: number;
  status: 'paid' | 'unpaid' | 'partial';
  paid_at: string | null;
  note: string | null;
  created_by: string | null;
  center_id: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyAttendanceResponse {
  year: number;
  month: number;
  lessons: Array<{
    id: string;
    group_id: string;
    date: string;
    time: string;
    unit?: any;
  }>;
  attendance_map: Record<string, Record<string, {
    id: string;
    is_present: boolean;
    reason: string | null;
  }>>;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(phoneNumber: string, password: string): Promise<LoginResponse> {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const phoneToSend = phoneNumber.startsWith('+') ? phoneNumber : `+${cleanedPhone}`;

    const response = await fetch(`${API_URL}/api/student-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneToSend, password }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Login failed');
    }

    this.setToken(responseData.access_token);

    if (typeof window !== 'undefined') {
      localStorage.setItem('student', JSON.stringify(responseData.student));
      if (responseData.device_id) {
        localStorage.setItem('deviceId', responseData.device_id);
      }
    }

    return responseData;
  }

  async teacherLogin(phoneNumber: string, password: string): Promise<TeacherLoginResponse> {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const phoneToSend = phoneNumber.startsWith('+') ? phoneNumber : `+${cleanedPhone}`;

    const response = await fetch(`${API_URL}/teachers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneToSend, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Teacher login failed');
    }
    return data;
  }

  async getGroup(groupId: string): Promise<any> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch group');
    return response.json();
  }

  async getStudentById(studentId: string): Promise<Student> {
    const response = await fetch(`${API_URL}/students/${studentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch student');
    return response.json();
  }

  async getGroupStudents(groupId: string): Promise<GroupStudentsResponse> {
    const response = await fetch(`${API_URL}/groups/${groupId}/students`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch group students');
    return response.json();
  }

  async getStudentAttendances(studentId: string, month?: string, year?: string): Promise<Attendance[]> {
    let url = `${API_URL}/students/${studentId}/attendances`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch attendances');
    return response.json();
  }

  async getUserDevices(userId: string): Promise<{ data: UserDevice[]; pagination: any }> {
    const response = await fetch(`${API_URL}/api/user-devices?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user devices');
    return response.json();
  }

  async getDashboardStats() {
    const response = await fetch(`${API_URL}/student/dashboard`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  }

  async getStudentProfile() {
    const response = await fetch(`${API_URL}/student/profile`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  async getStudentUnits() {
    const response = await fetch(`${API_URL}/student/units`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch units');
    return response.json();
  }

  async getLevelById(levelId: string): Promise<Level> {
    const response = await fetch(`${API_URL}/levels/${levelId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch level');
    return response.json();
  }

  async getExercisesByUnit(unitId: string): Promise<Exercise[]> {
    const response = await fetch(`${API_URL}/exercises/unit/${unitId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch exercises');
    return response.json();
  }

  async getStudentExerciseResults(studentId: string): Promise<StudentExerciseResult[]> {
    const response = await fetch(`${API_URL}/students/${studentId}/exercise-results`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error('Failed to fetch exercise results');
    }
    return response.json();
  }

  async getTaskById(taskId: string): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  }

  async getExerciseById(exerciseId: string): Promise<Exercise> {
    const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch exercise');
    return response.json();
  }

  async postStudentAnswer(data: {
    student_id: string;
    unit_id: string;
    exercise_id: string;
    task_id: string;
    answer_text: string;
    is_correct: boolean;
    attempt_number: number;
    is_completed: boolean;
  }) {
    const response = await fetch(`${API_URL}/student-answers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to submit answer');
    return response.json();
  }

  async getExerciseResult(exerciseId: string, studentId: string): Promise<ExerciseResult | null> {
    const response = await fetch(`${API_URL}/exercise-results/${exerciseId}/student/${studentId}`, {
      headers: this.getHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch exercise result');
    return response.json();
  }

  async getUnitResult(studentId: string, unitId: string): Promise<UnitResultDetail | null> {
    const response = await fetch(`${API_URL}/unit-results/${studentId}/${unitId}`, {
      headers: this.getHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch unit result');
    return response.json();
  }

  async getStories(): Promise<any[]> {
    const res = await fetch(`${API_URL}/stories`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stories');
    return res.json();
  }

  async getNews(): Promise<any[]> {
    const res = await fetch(`${API_URL}/news`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
  }

  async likeStory(storyId: number, studentId: number): Promise<void> {
    const res = await fetch(`${API_URL}/stories/${storyId}/like`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    if (!res.ok) throw new Error('Failed to like story');
  }

  async unlikeStory(storyId: number, studentId: number): Promise<void> {
    const res = await fetch(`${API_URL}/stories/${storyId}/unlike`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    if (!res.ok) throw new Error('Failed to unlike story');
  }

  async viewStory(storyId: number, viewerId: number): Promise<void> {
    const res = await fetch(`${API_URL}/stories/${storyId}/view/${viewerId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to record view');
  }

  async getLeaderboard(): Promise<any[]> {
    const response = await fetch(`${API_URL}/student-coins/leaderboard`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  }

  async getGroupAttendance(groupId: string, date: string): Promise<AttendanceRecord[]> {
    const url = `${API_URL}/attendances/group?group_id=${encodeURIComponent(groupId)}&date=${encodeURIComponent(date)}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
  }

  async getGroupLessons(groupId: number | string): Promise<GroupLesson[]> {
    const res = await fetch(`${API_URL}/lessons/group/${groupId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
  }

  async postAttendance(payload: AttendancePayload): Promise<any> {
    const response = await fetch(`${API_URL}/attendances/lesson`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to post attendance');
    return response.json();
  }

  async parentLogin(phoneNumber: string, password: string): Promise<ParentLoginResponse> {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const phoneToSend = phoneNumber.startsWith('+') ? phoneNumber : `+${cleanedPhone}`;
    const response = await fetch(`${API_URL}/parents/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneToSend, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Parent login failed');
    return data;
  }

  async getParentChildren(parentId: number): Promise<Student[]> {
    const response = await fetch(`${API_URL}/parents/${parentId}/children`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch children');
    return response.json();
  }

  async linkStudentToParent(parentId: number, studentId: number): Promise<any> {
    const response = await fetch(`${API_URL}/parents/${parentId}/children`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ student_id: studentId }),
    });
    if (!response.ok) throw new Error('Failed to link student');
    return response.json();
  }

  async getTeacherGroups(teacherId: number): Promise<TeacherGroupsResponse> {
    const response = await fetch(`${API_URL}/teachers/${teacherId}/groups`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teacher groups');
    return response.json();
  }

  async getTeacherById(teacherId: number): Promise<Teacher> {
    const response = await fetch(`${API_URL}/teachers/${teacherId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teacher');
    return response.json();
  }

  async getRoomsList(): Promise<Room[]> {
    const response = await fetch(`${API_URL}/rooms`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  }

  async updateStudent(studentId: string, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/students/${studentId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update student');
    return response.json();
  }

  async changePassword(studentId: string, data: { current?: string; new: string }): Promise<any> {
    const response = await fetch(`${API_URL}/students/${studentId}/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ password: data.new }),
    });
    if (!response.ok) throw new Error('Failed to change password');
    return response.json();
  }

  async getStudentPayments(studentId: string): Promise<Payment[]> {
    const response = await fetch(`${API_URL}/payments/students/${studentId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  }

  async getGroupPaymentSummary(groupId: string): Promise<any> {
    const response = await fetch(`${API_URL}/payments/groups/${groupId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch group payments');
    return response.json();
  }

  async getTeacherPaymentSummary(teacherId: number): Promise<any> {
    const response = await fetch(`${API_URL}/payments/teacher-summary/${teacherId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) return null;
    return response.json();
  }

  async getMonthlyAttendanceGrid(groupId: string, year: number, month: number): Promise<MonthlyAttendanceResponse> {
    const response = await fetch(`${API_URL}/attendances/group/${groupId}/monthly?year=${year}&month=${month}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch monthly attendance');
    return response.json();
  }

  async sendAbsenceNotification(data: { student_id: number; lesson_id: number; date: string; group_id: number }): Promise<any> {
    const response = await fetch(`${API_URL}/payments/absence-notification`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send absence notification');
    return response.json();
  }

  async sendSupportMessage(data: { subject: string; message: string }): Promise<any> {
    const response = await fetch(`${API_URL}/support`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }

  async getNotificationsForUser(userId: number): Promise<Notification[]> {
    const response = await fetch(`${API_URL}/notifications/user/${userId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async createNotification(data: { user_id: number; role: string; title: string; description: string }): Promise<any> {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  }

  async deleteAccount(studentId: string): Promise<any> {
    const response = await fetch(`${API_URL}/students/${studentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete account');
    return response.json();
  }
}

export const shopApi = {
  getProducts: async (): Promise<ShopProduct[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop/product`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  purchaseProduct: async (payload: PurchasePayload): Promise<any> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Purchase failed');
    }
    return res.json();
  },

  getStudentPurchases: async (studentId: number): Promise<StudentPurchase[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop/student/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },
};

export const getNotificationImageUrl = (image: string | null): string | null => {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `${API_URL}${image}`;
  return `${API_URL}/uploads/notifications/${image}`;
};

export const getPhotoUrl = (photoUrl: string | null | undefined, folder: string = 'students'): string | undefined => {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}/uploads/${folder}/${photoUrl}`;
};

export const notificationApi = {
  getUserNotifications: async (userId: number): Promise<Notification[]> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/notifications/user/${userId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_read: true }),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
  },

  markMultipleAsRead: async (notificationIds: number[]): Promise<void> => {
    await Promise.all(notificationIds.map(id => notificationApi.markAsRead(id)));
  },
};

export const api = new ApiService();
