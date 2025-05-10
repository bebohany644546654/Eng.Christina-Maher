import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import PhysicsBackground from "./components/PhysicsBackground";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentsManagement from "./pages/StudentsManagement";
import ParentsManagement from "./pages/ParentsManagement";
import ScanCode from "./pages/ScanCode";
// import Videos from "./pages/Videos"; // Commented out as the file was deleted
import Books from "./pages/Books";
import StudentCode from "./pages/StudentCode";
import AttendanceRecord from "./pages/AttendanceRecord";
import Grades from "./pages/Grades";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";
import AttendanceRecordList from "./pages/AttendanceRecordList";
import AttendanceListByGrade from "./pages/AttendanceListByGrade";
import GradesManagement from "./pages/GradesManagement";
import GradesByGrade from "./pages/GradesByGrade";
import StudentGrades from "./pages/StudentGrades";
import PaymentsManagement from "./pages/PaymentsManagement";
import SystemReset from "./pages/SystemReset";
import { useEffect } from "react";
import "./App.css";

// استيراد خط Tajawal للنص العربي
import "@fontsource/tajawal/400.css"; 
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";

// تهيئة عميل الاستعلام مع إعدادات إعادة المحاولة
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  useEffect(() => {
    // التأكد من تحميل الخط
    document.fonts.ready.then(() => {
      console.log('Fonts loaded successfully');
    }).catch(error => {
      console.error('Font loading error:', error);
    });

    // طلب الأذونات بشكل متسلسل
    const requestPermissions = async () => {
      try {
        // طلب إذن الإشعارات
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          console.log("Notification permission:", permission);
        }

        // طلب أذونات الوسائط
        if (navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error("Permissions error:", error);
      }
    };

    requestPermissions();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <NotificationsProvider />
            <BrowserRouter>
              <div className="relative min-h-screen font-tajawal">
                <PhysicsBackground />
                <div className="relative z-10">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<RequireAuth children={<Dashboard />} />} />
                    
                    {/* Admin Routes */}
                    <Route path="/students" element={<RequireAuth allowedRoles={["admin"]} children={<StudentsManagement />} />} />
                    <Route path="/parents" element={<RequireAuth allowedRoles={["admin"]} children={<ParentsManagement />} />} />
                    <Route path="/scan-code" element={<RequireAuth allowedRoles={["admin"]} children={<ScanCode />} />} />
                    <Route path="/attendance-list" element={<RequireAuth allowedRoles={["admin"]} children={<AttendanceRecordList />} />} />
                    <Route path="/attendance-list/:grade" element={<RequireAuth allowedRoles={["admin"]} children={<AttendanceListByGrade />} />} />
                    <Route path="/grades-management" element={<RequireAuth allowedRoles={["admin"]} children={<GradesManagement />} />} />
                    <Route path="/grades-management/:grade" element={<RequireAuth allowedRoles={["admin"]} children={<GradesByGrade />} />} />
                    <Route path="/payments" element={<RequireAuth allowedRoles={["admin"]} children={<PaymentsManagement />} />} />
                    <Route path="/system-reset" element={<RequireAuth allowedRoles={["admin"]} children={<SystemReset />} />} />

                    {/* Student Routes */}
                    <Route path="/student-code" element={<RequireAuth allowedRoles={["student"]} children={<StudentCode />} />} />
                    <Route path="/student-grades" element={<RequireAuth allowedRoles={["student"]} children={<StudentGrades />} />} />
                    
                    {/* All Users Routes */}
                    {/* <Route path="/videos" element={<RequireAuth allowedRoles={["admin", "student"]} children={<Videos />} />} /> */}
                    <Route path="/books" element={<RequireAuth allowedRoles={["admin", "student"]} children={<Books />} />} />
                    
                    {/* Parent & Student Routes */}
                    <Route path="/attendance-record" element={<RequireAuth allowedRoles={["parent", "student"]} children={<AttendanceRecord />} />} />
                    <Route path="/grades" element={<RequireAuth allowedRoles={["parent", "student"]} children={<Grades />} />} />
                    
                    {/* Auth error routes */}
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
