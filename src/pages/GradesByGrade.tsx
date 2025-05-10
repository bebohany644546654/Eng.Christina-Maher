import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Student, Grade } from "@/types";
import { getGradeDisplay, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const GradesByGrade = () => {
  const navigate = useNavigate();
  const { grade = "first" } = useParams<{ grade: "first" | "second" | "third" }>();
  const { getAllStudents } = useAuth();
  const { getGradesByGradeLevel, addGrade, deleteGrade, updateGrade, getStudentLessonCount } = useData();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeRecords, setGradeRecords] = useState<Grade[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "code">("name");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [examName, setExamName] = useState("");
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(100);
  const [lessonNumber, setLessonNumber] = useState(1);
  const [group, setGroup] = useState("");

  // Add new state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string>("");

  // Modify useEffect for better synchronization
  useEffect(() => {
    try {
      const allStudents = getAllStudents();
      const gradeStudents = allStudents.filter(student => student.grade === grade);
      setStudents(gradeStudents);
      
      const grades = getGradesByGradeLevel(grade);
      setGradeRecords(grades);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "خطأ في المزامنة",
        description: "حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة",
      });
    }
  }, [getAllStudents, getGradesByGradeLevel, grade]);

  useEffect(() => {
    if (!searchStudentTerm.trim()) {
      setFilteredStudents([]);
      return;
    }
    
    const searchVal = searchStudentTerm.toLowerCase();
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchVal) ||
      student.code.toLowerCase().includes(searchVal) ||
      (student.group || "").toLowerCase().includes(searchVal)
    );
    setFilteredStudents(filtered);
  }, [searchStudentTerm, students]);

  // Add new effect to update lesson number when student is selected
  useEffect(() => {
    if (selectedStudent && !isEditMode) {
      const currentLesson = getStudentLessonCount(selectedStudent.id);
      // تحديث رقم الحصة تلقائياً بناءً على سجل الحضور
      const nextLesson = currentLesson + 1 > 8 ? 8 : currentLesson + 1;
      setLessonNumber(nextLesson);
    }
  }, [selectedStudent, getStudentLessonCount, isEditMode]);

  const getGradeTitle = () => {
    switch (grade) {
      case "first": 
        return "الصف الأول الثانوي";
      case "second": 
        return "الصف الثاني الثانوي";
      case "third": 
        return "الصف الثالث الثانوي";
      default: 
        return "";
    }
  };

  const handleSearch = (value: string) => {
    setSearchStudentTerm(value);
    
    if (value.trim() === "") {
      setSearchResults([]);
      setSelectedStudent(null);
      return;
    }
  
    const results = students.filter(s => 
      s.name.toLowerCase().includes(value.toLowerCase()) || 
      s.code.toLowerCase().includes(value.toLowerCase())
    );
    
    setSearchResults(results);
  };

  const refreshData = useCallback(() => {
    try {
      const grades = getGradesByGradeLevel(grade);
      setGradeRecords(grades);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        variant: "destructive",
        title: "خطأ في التحديث",
        description: "فشل تحديث البيانات. يرجى المحاولة مرة أخرى",
      });
    }
  }, [getGradesByGradeLevel, grade]);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // تحسين التحقق من اختيار الطالب
      if (!selectedStudent || !selectedStudentId || !selectedStudent.id) {
        toast({
          variant: "destructive",
          title: "خطأ في البيانات",
          description: "الرجاء اختيار طالب من القائمة",
        });
        return;
      }

      // تحسين التحقق من عنوان الاختبار
      const trimmedExamName = examName.trim();
      if (!trimmedExamName) {
        toast({
          variant: "destructive",
          title: "خطأ في البيانات",
          description: "الرجاء إدخال عنوان الاختبار",
        });
        return;
      }

      // تحسين التحقق من الدرجات
      if (isNaN(score) || isNaN(totalScore)) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "الرجاء إدخال أرقام صحيحة للدرجات",
        });
        return;
      }

      if (score < 0) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "الدرجة المحصلة يجب أن تكون أكبر من أو تساوي صفر",
        });
        return;
      }

      if (score > totalScore) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "الدرجة المحصلة لا يمكن أن تكون أكبر من الدرجة الكلية",
        });
        return;
      }

      if (totalScore <= 0) {
        toast({
          variant: "destructive",
          title: "خطأ في الدرجات",
          description: "الدرجة الكلية يجب أن تكون أكبر من صفر",
        });
        return;
      }

      // التأكد من صحة رقم الحصة
      if (lessonNumber < 1 || lessonNumber > 8) {
        toast({
          variant: "destructive",
          title: "خطأ في رقم الحصة",
          description: "رقم الحصة يجب أن يكون بين 1 و 8",
        });
        return;
      }
      
      const gradeGroup = group.trim() || selectedStudent.group || "A";
      
      // محاولة إضافة الدرجة
      await addGrade(
        selectedStudent.id, 
        selectedStudent.name, 
        trimmedExamName,
        Number(score),
        Number(totalScore),
        Number(lessonNumber),
        gradeGroup
      );

      // Refresh data after adding grade
      refreshData();
      handleCloseForm();
      
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة الدرجة بنجاح",
      });

    } catch (error) {
      console.error('Error adding grade:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة الدرجة. يرجى المحاولة مرة أخرى",
      });
    }
  };

  const handleEditGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !editingGradeId) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ في تحديد الدرجة",
      });
      return;
    }
  
    try {
      // Calculate performance indicator
      const percentage = (score / totalScore) * 100;
      let performanceIndicator: "excellent" | "good" | "average" | "poor" = "average";
      
      if (percentage >= 85) performanceIndicator = "excellent";
      else if (percentage >= 70) performanceIndicator = "good";
      else if (percentage >= 50) performanceIndicator = "average";
      else performanceIndicator = "poor";

      await updateGrade(editingGradeId, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        examName,
        score,
        totalScore,
        lessonNumber,
        group: group.trim() || selectedStudent.group || "A",
        performanceIndicator
      });
      
      // Refresh data after updating grade
      refreshData();
      handleCloseForm();

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تعديل درجة ${examName} للطالب ${selectedStudent.name}`,
      });
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({
        variant: "destructive",
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تعديل الدرجة. يرجى المحاولة مرة أخرى",
      });
    }
  };

  const handleOpenEditForm = (grade: Grade) => {
    setIsEditMode(true);
    setEditingGradeId(grade.id);
    setSelectedStudent(students.find(s => s.id === grade.studentId) || null);
    setSelectedStudentId(grade.studentId);
    setSearchStudentTerm(grade.studentName);
    setExamName(grade.examName);
    setScore(grade.score);
    setTotalScore(grade.totalScore);
    setLessonNumber(grade.lessonNumber);
    setGroup(grade.group || "");
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setIsEditMode(false);
    setEditingGradeId("");
    setSelectedStudent(null);
    setSelectedStudentId("");
    setSearchStudentTerm("");
    setExamName("");
    setScore(0);
    setTotalScore(100);
    setLessonNumber(1);
    setGroup("");
  };

  const handleDeleteGrade = async (gradeId: string, studentName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف درجة الطالب ${studentName}؟`)) {
      return;
    }
  
    try {
      await deleteGrade(gradeId);
      // Refresh data after deleting grade
      refreshData();

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف درجة الطالب ${studentName}`,
      });
    } catch (error) {
      console.error('Error deleting grade:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الدرجة. يرجى المحاولة مرة أخرى",
      });
    }
  };

  const filteredGrades = gradeRecords.filter(g => {
    const student = students.find(s => s.id === g.studentId);
    if (!student) return false;

    // If we have a search term, filter by student name or exam name or code based on searchType
    if (searchTerm) {
      if (searchType === "name") {
        return student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               g.examName.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return student.code.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/grades-management")}
            className="flex items-center gap-2 text-physics-gold hover:opacity-80"
          >
            <ArrowRight size={20} />
            <span>العودة لقائمة الصفوف</span>
          </button>
        </div>
        <Logo />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-physics-gold">سجل الدرجات</h1>
              <p className="text-white mt-1">{getGradeTitle()}</p>
            </div>
            
            <button 
              onClick={() => setShowAddForm(true)}
              className="goldBtn flex items-center gap-2"
            >
              <Plus size={18} />
              إضافة درجة
            </button>
          </div>
          
          {/* Search with Type Selector */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
              <select
                className="inputField"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "name" | "code")}
              >
                <option value="name">بحث بالاسم</option>
                <option value="code">بحث بالكود</option>
              </select>
            </div>
            
            <div className="relative w-full md:w-3/4">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
              <input
                type="text"
                className="inputField pr-12"
                placeholder={searchType === "name" ? "ابحث عن طالب بالاسم أو عنوان الاختبار" : "ابحث عن طالب بالكود"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {filteredGrades.length === 0 ? (
            <div className="bg-physics-dark rounded-lg p-6 text-center">
              <p className="text-white text-lg">لا توجد درجات مسجلة</p>
            </div>
          ) : (
            <div className="bg-physics-dark rounded-lg overflow-hidden">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b-2 border-physics-gold/20">
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">الكود</TableHead>
                    <TableHead className="text-right">الاختبار</TableHead>
                    <TableHead className="text-center">الدرجة</TableHead>
                    <TableHead className="text-center">من</TableHead>
                    <TableHead className="text-right">رقم الحصة</TableHead>
                    <TableHead className="text-right">المجموعة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-center">خيارات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const student = students.find(s => s.id === grade.studentId);
                    
                    return (
                      <TableRow key={grade.id} className="border-b border-physics-navy/30 hover:bg-physics-navy/30">
                        <TableCell className="text-white py-4">{grade.studentName}</TableCell>
                        <TableCell className="text-white">{student?.code || ""}</TableCell>
                        <TableCell className="text-white">{grade.examName}</TableCell>
                        <TableCell className="text-center text-white">{grade.score}</TableCell>
                        <TableCell className="text-center text-white">{grade.totalScore}</TableCell>
                        <TableCell className="text-white">الحصة {grade.lessonNumber || 1}</TableCell>
                        <TableCell className="text-white">{grade.group || "A"}</TableCell>
                        <TableCell className="text-white">{formatDate(grade.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditForm(grade)}
                              className="p-1.5 text-physics-gold hover:text-white rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grade.id, grade.studentName)}
                              className="p-1.5 text-red-400 hover:text-red-500 rounded-lg bg-physics-navy/20 hover:bg-physics-navy/40 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      
      {/* Add Grade Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">
              {isEditMode ? "تعديل الدرجة" : "إضافة درجة جديدة"}
            </h2>
            
            <form onSubmit={isEditMode ? handleEditGrade : handleAddGrade} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-white mb-1">بحث عن الطالب</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
                  <input
                    type="text"
                    className="inputField pr-12"
                    placeholder="ابحث عن الطالب بالاسم أو الكود..."
                    value={searchStudentTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                
                {searchResults.length > 0 && !selectedStudent && (
                  <div className="mt-2 bg-physics-navy/50 rounded-lg border border-physics-gold/20 max-h-48 overflow-y-auto">
                    {searchResults.map((student) => (
                      <div
                        key={student.id}
                        className="p-3 hover:bg-physics-navy/70 cursor-pointer border-b border-physics-gold/10 last:border-0"
                        onClick={() => {
                          setSelectedStudent(student);
                          setSearchResults([]);
                          setSearchStudentTerm(student.name);
                          setSelectedStudentId(student.id);
                          setGroup(student.group || "");
                        }}
                      >
                        <div className="font-bold text-white">{student.name}</div>
                        <div className="text-sm text-physics-gold flex items-center gap-2">
                          <span>كود: {student.code}</span>
                          <span>•</span>
                          <span>{getGradeDisplay(student.grade)}</span>
                          {student.group && (
                            <>
                              <span>•</span>
                              <span>مجموعة {student.group}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-white mb-1">عنوان الاختبار</label>
                <input
                  type="text"
                  className="inputField"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">رقم الحصة</label>
                  <select
                    className="inputField"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                    required
                  >
                    <option value={1}>الحصة الأولى</option>
                    <option value={2}>الحصة الثانية</option>
                    <option value={3}>الحصة الثالثة</option>
                    <option value={4}>الحصة الرابعة</option>
                    <option value={5}>الحصة الخامسة</option>
                    <option value={6}>الحصة السادسة</option>
                    <option value={7}>الحصة السابعة</option>
                    <option value={8}>الحصة الثامنة</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white mb-1">المجموعة</label>
                  <input
                    type="text"
                    className="inputField"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="أدخل المجموعة"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">الدرجة المحصلة</label>
                  <input
                    type="number"
                    className="inputField"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white mb-1">الدرجة الكلية</label>
                  <input
                    type="number"
                    className="inputField"
                    value={totalScore}
                    onChange={(e) => setTotalScore(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="goldBtn flex-1" disabled={!selectedStudentId}>
                  {isEditMode ? "حفظ التعديلات" : "إضافة الدرجة"}
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={handleCloseForm}
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

export default GradesByGrade;
