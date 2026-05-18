"use client";

import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "../layout/profileDropdown";
import { NotificationsDropdown } from "../NotificationDropdown";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { ChatPanel } from "@/components/chat/ChatPanel";

interface HeaderProps {
  title?: string;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/lessons": "Lessons",
  "/dashboard/marks": "Marks",
  "/dashboard/ranking": "Ranking",
  "/dashboard/extra-lesson": "Extra",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

function shortName(full: string): string {
  const parts = full.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

export function Header({ title }: HeaderProps) {
  const { user, logout, isTeacher, isStudent, isParent } = useAuth();
  const pathname = usePathname();

  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const pageTitle = title ?? PAGE_TITLES[pathname] ?? "Dashboard";

  // Student bo‘lsa, ma'lumotlarni yangilab turish
  useEffect(() => {
    if (!user?.id || isTeacher) return; // Teacher bo‘lsa, student ma'lumotlarini yuklama
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getStudentById(user.id.toString());
        setStudentData(data);
      } catch (err) {
        console.error("Error fetching student data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
    const interval = setInterval(fetchStudentData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, isTeacher]);

  // Ko‘rsatiladigan foydalanuvchi ma'lumotlari
  const displayData = isStudent ? (studentData || user) : user;
  const fullName = displayData
    ? `${displayData.first_name ?? ""} ${displayData.last_name ?? ""}`.trim()
    : "";

  // Rasm manzili
  const avatarSrc = (() => {
    if (!displayData?.photo || imageError) return "/user.png";
    if (displayData.photo.startsWith('http')) return displayData.photo;
    if (isStudent) {
      return `http://localhost:4000/uploads/students/${displayData.photo}`;
    } else if (isParent) {
      return `http://localhost:4000/uploads/parents/${displayData.photo}`;
    } else {
      return `http://localhost:4000/uploads/teachers/${displayData.photo}`;
    }
  })();

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">{pageTitle}</h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <NotificationsDropdown />
              <ChatPanel>
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </ChatPanel>
            </div>

            <ProfileDropdown
              userData={displayData}
              isLoading={isLoading}
              fullName={fullName}
              avatarSrc={avatarSrc}
              onLogout={logout}
              userRole={isStudent ? 'student' : isParent ? 'parent' : 'teacher'}
            />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm px-3 py-2.5">
        <div className="grid grid-cols-3 items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ProfileDropdown
              userData={displayData}
              isLoading={isLoading}
              fullName={fullName}
              avatarSrc={avatarSrc}
              onLogout={logout}
              userRole={isStudent ? 'student' : isParent ? 'parent' : 'teacher'}
            />
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] text-gray-400 leading-none">Welcome back</p>
              <p className="text-xs font-bold text-gray-900 leading-tight truncate">
                {isLoading ? "..." : shortName(fullName) || (isStudent ? "Student" : isParent ? "Parent" : "Teacher")}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <h1 className="text-base font-bold text-gray-900 whitespace-nowrap">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center justify-end gap-0.5">
            <NotificationsDropdown />
            <ChatPanel>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageSquare className="h-4.5 w-4.5 text-gray-600" />
              </Button>
            </ChatPanel>
          </div>
        </div>
      </header>
    </>
  );
}