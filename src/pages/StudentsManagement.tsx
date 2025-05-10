import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowRight, UserPlus, Search, Edit, Trash2, Copy, Phone } from "lucide-react";
import { Student } from "@/types";
import { getGradeDisplay } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const StudentsManagement = () => {
  const { getAllStudents, createStudent, deleteStudent, updateStudent } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"all" | "first" | "second" | "third">("all");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [group, setGroup] = useState("");
  const [grade, setGrade] = useState<"first" | "second" | "third">("first");

  useEffect(() => {
    // Load students when component mounts
    setStudents(getAllStudents());
  }, [getAllStudents]);

  const filteredStudents = students.filter(student => {
    // Apply grade filter first
    if (selectedGradeFilter !== "all" && student.grade !== selectedGradeFilter) {
      return false;
    }

    // Then apply search filter
    return student.name.includes(searchQuery) || 
           student.phone.includes(searchQuery) ||
           student.code.includes(searchQuery);
  });

  const copyToClipboard = async (text: string, type: "code" | "password") => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${type === "code" ? "كود" : "كلمة مرور"} الطالب بنجاح`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        variant: "destructive",
        title: "خطأ في النسخ",
        description: `حدث خطأ أثناء نسخ ${type === "code" ? "الكود" : "كلمة المرور"}`,
      });
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    createStudent(name, phone, parentPhone, group, grade);
    setStudents(getAllStudents()); // Refresh list
    setName("");
    setPhone("");
    setParentPhone("");
    setGroup("");
    setGrade("first");
    setShowAddForm(false);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setPhone(student.phone);
    setParentPhone(student.parentPhone);
    setGroup(student.group || "");
    setGrade(student.grade);
    setShowEditForm(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(
      editingStudent.id,
      name,
      phone,
      "",
      parentPhone,
      group,
      grade
    );

    setStudents(getAllStudents()); // Refresh list
    setShowEditForm(false);
    setEditingStudent(null);

    toast({
      title: "تم تحديث بيانات الطالب",
      description: `تم تحديث بيانات الطالب ${name} بنجاح`,
    });
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب ${studentName}؟`)) {
      deleteStudent(studentId);
      setStudents(getAllStudents()); // Refresh list

      toast({
        title: "تم حذف الطالب",
        description: `تم حذف الطالب ${studentName} بنجاح`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col">
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-physics-gold">إدارة الطلاب</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-white/80">عدد الطلاب: {filteredStudents.length}</p>
                <div className="w-px h-4 bg-white/20" />
                <p className="text-white/80">
                  {selectedGradeFilter === "all" 
                    ? "جميع الصفوف" 
                    : selectedGradeFilter === "first" 
                      ? "الصف الأول الثانوي"
                      : selectedGradeFilter === "second"
                        ? "الصف الثاني الثانوي"
                        : "الصف الثالث الثانوي"
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="goldBtn flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span>إضافة طالب</span>
            </button>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <select
                className="inputField"
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value as "all" | "first" | "second" | "third")}
              >
                <option value="all">جميع الصفوف</option>
                <option value="first">الصف الأول الثانوي</option>
                <option value="second">الصف الثاني الثانوي</option>
                <option value="third">الصف الثالث الثانوي</option>
              </select>
            </div>
            
            <div className="relative w-full md:w-2/3">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
              <input
                type="text"
                className="inputField pr-12"
                placeholder="ابحث عن طالب بالاسم أو رقم الهاتف أو الكود"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Students List */}
          <div className="bg-physics-dark/80 rounded-lg overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white text-lg">لا يوجد طلاب مسجلين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-physics-navy text-physics-gold">
                      <th className="text-right py-4 px-4">معلومات الطالب</th>
                      <th className="text-right py-4 px-4">معلومات الاتصال</th>
                      <th className="text-right py-4 px-4">معلومات الفصل</th>
                      <th className="text-right py-4 px-4">بيانات الحساب</th>
                      <th className="text-center py-4 px-4">خيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-physics-navy/30">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-physics-navy/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <p className="text-xl text-white font-bold">{student.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-physics-gold">الكود: <span className="font-mono">{student.code}</span></p>
                              <button
                                onClick={() => copyToClipboard(student.code, "code")}
                                className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="نسخ الكود"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-[0.95rem]">
                            <div className="flex items-center gap-2">
                              <span className="text-physics-gold">هاتف الطالب:</span>
                              <span className="text-white font-mono">{student.phone}</span>
                              <a
                                href={`tel:${student.phone}`}
                                className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="اتصال"
                              >
                                <Phone size={16} />
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-physics-gold">هاتف ولي الأمر:</span>
                              <span className="text-white font-mono">{student.parentPhone}</span>
                              <a
                                href={`tel:${student.parentPhone}`}
                                className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="اتصال"
                              >
                                <Phone size={16} />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-[0.95rem]">
                            <div className="flex items-center gap-2">
                              <span className="text-physics-gold">الصف:</span>
                              <span className="text-white">{getGradeDisplay(student.grade)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-physics-gold">المجموعة:</span>
                              <span className="text-white">{student.group || "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-[0.95rem]">
                            <div className="flex items-center gap-2">
                              <span className="text-physics-gold">كلمة المرور:</span>
                              <span className="text-white font-mono">{student.password}</span>
                              <button
                                onClick={() => copyToClipboard(student.password, "password")}
                                className="p-1 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                                title="نسخ كلمة المرور"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleEditClick(student)}
                              className="p-2 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                              title="تعديل"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="p-2 text-red-400 hover:text-red-500 rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Forms */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">إضافة طالب جديد</h2>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-white mb-1">اسم الطالب</label>
                <input
                  type="text"
                  className="inputField"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">هاتف الطالب</label>
                  <input
                    type="text"
                    className="inputField"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">هاتف ولي الأمر</label>
                  <input
                    type="text"
                    className="inputField"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">المجموعة</label>
                  <input
                    type="text"
                    className="inputField"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">الصف الدراسي</label>
                  <select
                    className="inputField"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as "first" | "second" | "third")}
                    required
                  >
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="goldBtn flex-1">
                  إضافة الطالب
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Student Modal */}
      {showEditForm && editingStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">تعديل بيانات الطالب</h2>
            
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-white mb-1">اسم الطالب</label>
                <input
                  type="text"
                  className="inputField"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">هاتف الطالب</label>
                  <input
                    type="text"
                    className="inputField"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">هاتف ولي الأمر</label>
                  <input
                    type="text"
                    className="inputField"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">المجموعة</label>
                  <input
                    type="text"
                    className="inputField"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">الصف الدراسي</label>
                  <select
                    className="inputField"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as "first" | "second" | "third")}
                    required
                  >
                    <option value="first">الصف الأول الثانوي</option>
                    <option value="second">الصف الثاني الثانوي</option>
                    <option value="third">الصف الثالث الثانوي</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="goldBtn flex-1">
                  حفظ التغييرات
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={() => setShowEditForm(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;
