import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowUpDown, CheckCircle, ArrowRight, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { getGradeDisplay } from "@/lib/utils";
import { Payment, Student } from "@/types";
import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ui/use-toast";

const PaymentsManagement = () => {
  const navigate = useNavigate();
  const { getAllStudents } = useAuth();
  const { getAllPayments, addPayment } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<"all" | "first" | "second" | "third">("all");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchStudentTerm, setSearchStudentTerm] = useState("");
  const [monthsToPay, setMonthsToPay] = useState(1);
  const [filteredPayments, setFilteredPayments] = useState(getAllPayments());
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const { toast } = useToast();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    addPayment(selectedStudent.id, monthsToPay);
    setShowNewPaymentForm(false);
    setSelectedStudent(null);
    setMonthsToPay(1);
    setSearchStudentTerm("");
    setFilteredPayments(getAllPayments());
  };

  const handleSearch = (searchValue: string) => {
    setSearchStudentTerm(searchValue);
    const students = getAllStudents();
    if (searchValue.trim() === "") {
      setSearchResults([]);
      setSelectedStudent(null);
      return;
    }
    
    const results = students.filter(s => 
      s.name.toLowerCase().includes(searchValue.toLowerCase()) || 
      s.code.toLowerCase().includes(searchValue.toLowerCase())
    );
    setSearchResults(results);
  };

  useEffect(() => {
    let filtered = getAllPayments();
    
    if (selectedGrade !== "all") {
      filtered = filtered.filter(payment => payment.grade === selectedGrade);
    }

    if (searchQuery) {
      filtered = filtered.filter(payment => 
        payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortField) {
      filtered = filtered.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortField) {
          case 'studentCode':
          case 'studentName':
            valueA = a[sortField].toLowerCase();
            valueB = b[sortField].toLowerCase();
            break;
          case 'grade':
            valueA = a.grade === "first" ? 1 : a.grade === "second" ? 2 : 3;
            valueB = b.grade === "first" ? 1 : b.grade === "second" ? 2 : 3;
            break;
          case 'paidMonths':
            valueA = a.paidMonths;
            valueB = b.paidMonths;
            break;
          case 'lastPayment':
            valueA = new Date(a.lastPayment).getTime();
            valueB = new Date(b.lastPayment).getTime();
            break;
          default:
            valueA = a[sortField];
            valueB = b[sortField];
        }

        const compareResult = typeof valueA === 'number' 
          ? valueA - valueB
          : String(valueA).localeCompare(String(valueB));
          
        return sortDirection === "asc" ? compareResult : -compareResult;
      });
    }

    setFilteredPayments(filtered);
  }, [searchQuery, selectedGrade, sortField, sortDirection, getAllPayments]);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const updatePayments = () => {
      const payments = getAllPayments();
      let filtered = [...payments];
      
      if (selectedGrade !== "all") {
        filtered = filtered.filter(payment => payment.grade === selectedGrade);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(payment => 
          payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (sortField) {
        filtered = filtered.sort((a, b) => {
          let valueA, valueB;
          
          switch (sortField) {
            case 'studentCode':
            case 'studentName':
              valueA = a[sortField].toLowerCase();
              valueB = b[sortField].toLowerCase();
              break;
            case 'grade':
              valueA = a.grade === "first" ? 1 : a.grade === "second" ? 2 : 3;
              valueB = b.grade === "first" ? 1 : b.grade === "second" ? 2 : 3;
              break;
            case 'paidMonths':
              valueA = a.paidMonths;
              valueB = b.paidMonths;
              break;
            case 'lastPayment':
              valueA = new Date(a.lastPayment).getTime();
              valueB = new Date(b.lastPayment).getTime();
              break;
            default:
              valueA = a[sortField];
              valueB = b[sortField];
          }

          const compareResult = typeof valueA === 'number' 
            ? valueA - valueB
            : String(valueA).localeCompare(String(valueB));
            
          return sortDirection === "asc" ? compareResult : -compareResult;
        });
      }

      setFilteredPayments(filtered);
    };

    // التحديث الأولي
    updatePayments();

    // إعداد التحديث التلقائي كل 30 ثانية
    const intervalId = setInterval(updatePayments, 30000);

    // تنظيف عند إزالة المكون
    return () => clearInterval(intervalId);
  }, [getAllPayments, selectedGrade, searchQuery, sortField, sortDirection]);

  const students = getAllStudents();

  // تحديث وظيفة نسخ الكود
  const copyToClipboard = async (code: string) => {
    if (!code) return;
    
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          description: "تم نسخ الكود بنجاح",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          description: "فشل نسخ الكود",
        });
      }
      document.body.removeChild(textArea);
      return;
    }
  
    try {
      await navigator.clipboard.writeText(code);
      toast({
        description: "تم نسخ الكود بنجاح",
      });
    } catch {
      toast({
        variant: "destructive",
        description: "فشل نسخ الكود",
      });
    }
  };

  // إضافة دالة تنسيق التاريخ
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-physics-gold">إدارة المدفوعات</h1>
            <Button
              onClick={() => setShowNewPaymentForm(true)}
              className="bg-physics-gold hover:bg-physics-gold/90 text-physics-navy w-full md:w-auto flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              دفع شهر جديد
            </Button>
          </div>

          <Card className="mb-6 border border-physics-gold/20 bg-physics-dark">
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
                  <Input
                    type="text"
                    placeholder="بحث عن طالب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-physics-navy/50 border-physics-gold/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <Select 
                  value={selectedGrade} 
                  onValueChange={(value: "all" | "first" | "second" | "third") => setSelectedGrade(value)}
                >
                  <SelectTrigger className="w-[180px] bg-physics-navy border-physics-gold/20 text-white hover:bg-physics-navy/80">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent className="bg-physics-dark border-physics-gold/20">
                    <SelectItem value="all" className="text-white hover:bg-physics-navy/50">جميع الصفوف</SelectItem>
                    <SelectItem value="first" className="text-white hover:bg-physics-navy/50">الصف الأول الثانوي</SelectItem>
                    <SelectItem value="second" className="text-white hover:bg-physics-navy/50">الصف الثاني الثانوي</SelectItem>
                    <SelectItem value="third" className="text-white hover:bg-physics-navy/50">الصف الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="border border-physics-gold/20 bg-physics-dark">
            <div className="p-4 border-b border-physics-gold/20">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <h2 className="text-xl font-semibold text-physics-gold">سجل المدفوعات</h2>
                  <Badge variant="outline" className="bg-physics-navy/20 text-physics-gold border-physics-gold">
                    {filteredPayments.length} طالب
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-md border border-physics-gold/20">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-physics-dark/50">
                    <TableHead className="w-32 py-3 text-physics-gold font-bold text-right">كود الطالب</TableHead>
                    <TableHead className="w-52 py-3 text-physics-gold font-bold text-right">اسم الطالب</TableHead>
                    <TableHead className="w-36 py-3 text-physics-gold font-bold text-right">الصف</TableHead>
                    <TableHead className="w-40 py-3 text-physics-gold font-bold text-center">الأشهر المدفوعة</TableHead>
                    <TableHead className="w-32 py-3 text-physics-gold font-bold text-right">آخر دفع</TableHead>
                    <TableHead className="w-28 py-3 text-physics-gold font-bold text-center">المجموعة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const student = getAllStudents().find(s => s.id === payment.studentId);
                    return (
                      <TableRow 
                        key={payment.id} 
                        className="border-b border-physics-gold/10 hover:bg-physics-navy/30"
                      >
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{payment.studentCode}</span>
                            <button
                              onClick={() => copyToClipboard(payment.studentCode)}
                              className="p-1.5 rounded-md hover:bg-physics-navy/50 transition-colors focus:outline-none focus:ring-2 focus:ring-physics-gold/30"
                            >
                              <Copy className="h-3.5 w-3.5 text-physics-gold" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-white font-medium">{payment.studentName}</TableCell>
                        <TableCell className="py-2.5 px-4 text-white">{getGradeDisplay(payment.grade)}</TableCell>
                        <TableCell className="py-2.5 px-4">
                          <div className="flex justify-center gap-1">
                            {Array.from({ length: payment.paidMonths }).map((_, index) => (
                              <CheckCircle key={index} className="text-physics-gold h-4 w-4" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          {payment.paidMonths > 0 ? (
                            <span className="text-white">{formatDate(payment.lastPayment)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-4 text-center">
                          <Badge 
                            variant="outline" 
                            className="bg-physics-navy/20 text-physics-gold border-physics-gold"
                          >
                            {student?.group || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>

      {/* نموذج دفع شهر جديد */}
      {showNewPaymentForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border border-physics-gold/20 bg-physics-dark">
            <div className="p-6">
              <h2 className="text-xl font-bold text-physics-gold mb-6">دفع شهر جديد</h2>
              
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-white mb-2">بحث عن الطالب</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
                    <Input
                      type="text"
                      placeholder="ابحث بالاسم أو الكود..."
                      value={searchStudentTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pr-10 bg-physics-navy/50 border-physics-gold/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  {searchResults.length > 0 && !selectedStudent && (
                    <div className="mt-2 bg-physics-navy/50 rounded-lg border border-physics-gold/20 divide-y divide-physics-gold/10">
                      {searchResults.map((student) => (
                        <div
                          key={student.id}
                          className="p-2 hover:bg-physics-navy/70 cursor-pointer text-white"
                          onClick={() => {
                            setSelectedStudent(student);
                            setSearchResults([]);
                          }}
                        >
                          <div className="font-bold">{student.name}</div>
                          <div className="text-sm text-physics-gold">
                            {student.code} - {getGradeDisplay(student.grade)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStudent && (
                  <div className="bg-physics-navy/30 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-physics-gold">الطالب:</span>
                      <span className="text-white">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-physics-gold">الصف:</span>
                      <span className="text-white">{getGradeDisplay(selectedStudent.grade)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-physics-gold">الكود:</span>
                      <span className="text-white">{selectedStudent.code}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white mb-2">عدد الأشهر المراد دفعها</label>
                  <input
                    type="number"
                    value={monthsToPay}
                    onChange={(e) => setMonthsToPay(Math.max(1, parseInt(e.target.value)))}
                    min="1"
                    className="inputField bg-physics-navy/50 border-physics-gold/20 text-white"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-physics-gold hover:bg-physics-gold/90 text-physics-navy"
                    disabled={!selectedStudent}
                  >
                    تأكيد الدفع
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1 border-physics-gold/20 text-physics-gold hover:bg-physics-navy/50"
                    onClick={() => {
                      setShowNewPaymentForm(false);
                      setSelectedStudent(null);
                      setMonthsToPay(1);
                      setSearchStudentTerm("");
                      setSearchResults([]);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;