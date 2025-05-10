import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ArrowRight, Calendar, Check, X, Filter } from "lucide-react";
import { Student, Attendance } from "@/types";
import { formatDate } from "@/lib/utils";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AttendanceRecord = () => {
  const navigate = useNavigate();
  const { currentUser, getAllStudents } = useAuth();
  const { getStudentAttendance, getStudentLessonCount, deleteAttendance } = useData();
  const [studentId, setStudentId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentGroup, setStudentGroup] = useState("");
  const [lessonCount, setLessonCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  useEffect(() => {
    if (!currentUser) return;
    
    if (currentUser.role === "parent") {
      const students = getAllStudents();
      const parentPhone = currentUser.phone;
      const studentData = students.find(s => s.parentPhone === parentPhone);
      
      if (studentData) {
        setStudentId(studentData.id);
        setStudentName(studentData.name);
        setStudentCode(studentData.code);
        setStudentGroup(studentData.group);
        const records = getStudentAttendance(studentData.id);
        setAttendanceRecords(records);
        setLessonCount(getStudentLessonCount(studentData.id));
      }
    } else if (currentUser.role === "student") {
      setStudentId(currentUser.id);
      setStudentName(currentUser.name);
      setStudentCode(currentUser.code);
      setStudentGroup(currentUser.group);
      const records = getStudentAttendance(currentUser.id);
      setAttendanceRecords(records);
      setLessonCount(getStudentLessonCount(currentUser.id));
    }
  }, [currentUser, getAllStudents, getStudentAttendance, getStudentLessonCount]);

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm("هل أنت متأكد من حذف سجل الحضور هذا؟")) {
      deleteAttendance(recordId, studentName);
      const updatedRecords = attendanceRecords.filter(record => record.id !== recordId);
      setAttendanceRecords(updatedRecords);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (filter === "all") return true;
    return record.status === filter;
  });

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhysicsBackground />
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80"
          >
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-physics-gold">سجل الحضور</h1>
            
            <div className="bg-physics-dark p-4 rounded-lg mt-4">
              <div className="flex flex-wrap gap-4 text-white">
                <div className="flex-1">
                  <p className="text-physics-gold text-sm">الطالب</p>
                  <p>{studentName}</p>
                </div>
                <div>
                  <p className="text-physics-gold text-sm">الكود</p>
                  <p>{studentCode}</p>
                </div>
                <div>
                  <p className="text-physics-gold text-sm">المجموعة</p>
                  <p>{studentGroup}</p>
                </div>
                <div>
                  <p className="text-physics-gold text-sm">الحصة الحالية</p>
                  <p>الحصة {lessonCount + 1 > 8 ? 8 : lessonCount + 1}</p>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="mt-4 flex items-center gap-2 bg-physics-navy/90 rounded-lg p-2.5 border border-physics-navy shadow-lg w-fit">
              <Filter className="text-physics-gold" size={20} />
              <select
                className="bg-transparent text-white border-none outline-none hover:text-physics-gold transition-colors"
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "present" | "absent")}
              >
                <option value="all">جميع السجلات</option>
                <option value="present">الحضور فقط</option>
                <option value="absent">الغياب فقط</option>
              </select>
            </div>
          </div>
          
          {filteredRecords.length === 0 ? (
            <div className="bg-physics-dark rounded-lg p-6 text-center">
              <p className="text-white text-lg">لا توجد سجلات حضور متاحة</p>
            </div>
          ) : (
            <div className="bg-physics-dark rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-physics-navy/50 text-physics-gold hover:bg-physics-navy/50">
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">رقم الحصة</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">خيارات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="border-t border-physics-navy hover:bg-physics-navy/30">
                      <TableCell className="text-white">{formatDate(record.date)}</TableCell>
                      <TableCell className="text-white">{record.time || "غير متاح"}</TableCell>
                      <TableCell className="text-white">الحصة {record.lessonNumber || 1}</TableCell>
                      <TableCell className="text-center">
                        {record.status === "present" ? (
                          <div className="inline-flex items-center text-green-400 gap-1">
                            <Check size={18} />
                            <span>حاضر</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center text-red-400 gap-1">
                            <X size={18} />
                            <span>غائب</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 text-red-400 hover:text-red-500 rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                          title="حذف"
                        >
                          <X size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AttendanceRecord;
