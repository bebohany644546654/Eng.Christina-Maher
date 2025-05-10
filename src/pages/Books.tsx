import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext"; // Note: Role of some functions from useData might change
import { Logo } from "@/components/Logo";
import { PhoneContact } from "@/components/PhoneContact";
import { ArrowRight, FilePlus, Calendar, FileText, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Firebase imports
import { storage, db } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

const Books = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  // Assuming deleteBook and updateBook from useData will be replaced or adapted for Firestore later.
  // getAllBooks and saveResource are being replaced by direct Firebase interactions here.
  const { deleteBook, updateBook } = useData(); 
  const { toast } = useToast();
  
  // States for managing books
  const [books, setBooks] = useState<any[]>([]); // Will be populated from Firestore
  const [selectedGrade, setSelectedGrade] = useState<"all" | "first" | "second" | "third">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [grade, setGrade] = useState<"first" | "second" | "third">("first");
  
  // States for edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editGrade, setEditGrade] = useState<"first" | "second" | "third">("first");
  const [isLoading, setIsLoading] = useState(false);

  // Add upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);

  // useEffect to fetch books from Firestore
  useEffect(() => {
    setIsLoading(true);
    const booksCollectionRef = collection(db, "books"); // Collection name "books"
    const q = query(booksCollectionRef, orderBy("createdAt", "desc")); // Order by creation date

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const booksData = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setBooks(booksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching books: ", error);
      toast({
        variant: "destructive",
        title: "خطأ في جلب البيانات",
        description: "لم نتمكن من تحميل قائمة الكتب.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [toast]);

  const filteredBooks = books.filter(book => {
    // For students, only show books matching their grade
    if (currentUser?.role === "student" && currentUser?.grade) {
      return book.grade === currentUser.grade && 
             book.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // For admin and other roles, show books based on selected grade filter
    return (selectedGrade === "all" || book.grade === selectedGrade) &&
           book.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const validateFile = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('عذراً، صيغة الملف غير مدعومة. يرجى رفع ملفات PDF أو مستندات Office شائعة.');
    }

    if (file.size > maxSize) {
      throw new Error('عذراً، حجم الملف كبير جداً. الحد الأقصى المسموح به هو 50 ميجابايت.');
    }
    return true;
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      toast({ variant: "destructive", title: "خطأ في الإدخال", description: "الرجاء إدخال عنوان الملف واختيار ملف للرفع." });
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    setUploadProgress(0);

    try {
      validateFile(file); // Validate the file first

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `books/${fileName}`); // Store in 'books' folder in Storage

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Firebase Storage upload error:", error);
          toast({
            variant: "destructive",
            title: "خطأ أثناء رفع الملف",
            description: error.message || "فشل رفع الملف إلى Firebase Storage.",
          });
          setIsLoading(false);
          setUploadProgress(0);
        },
        async () => {
          // Upload completed successfully, now get the download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save metadata to Firestore
            const booksCollectionRef = collection(db, "books");
            await addDoc(booksCollectionRef, {
              title: title.trim(),
              grade: grade,
              fileURL: downloadURL,
              fileName: fileName, // Original name might be useful: file.name
              fileType: file.type,
              fileSize: file.size,
              createdAt: serverTimestamp(),
              uploaderId: currentUser?.uid || "unknown", // Store who uploaded it
            });

            toast({
              title: "تم بنجاح!",
              description: "تم رفع الملف وحفظ بيانات الكتاب بنجاح.",
            });

            // Reset form
            setTitle("");
            setFile(null);
            setGrade("first");
            setShowAddForm(false);

          } catch (firestoreError: any) {
            console.error("Firestore saving error:", firestoreError);
            toast({
              variant: "destructive",
              title: "خطأ في حفظ البيانات",
              description: firestoreError.message || "فشل حفظ بيانات الملف في Firestore.",
            });
          } finally {
            setIsLoading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (validationError: any) {
      console.error("File validation or initial setup error:", validationError);
      toast({
        variant: "destructive",
        title: "خطأ في التحقق من الملف",
        description: validationError.message,
      });
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!editFile && !editTitle) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "الرجاء إدخال عنوان الملف واختيار ملف للرفع",
        });
        return;
      }

      await saveResource(
        editTitle.trim(),
        "", // no description needed
        editFile,
        null, // no URL needed
        editGrade,
        "book"
      );

      // Delete old book
      deleteBook(editId);
      
      // Refresh books list
      setBooks(getAllBooks());
      setShowEditForm(false);

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الكتاب/الملف بنجاح",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الكتاب/الملف",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBook = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الكتاب/الملف؟")) {
      deleteBook(id);
      setBooks(getAllBooks());
    }
  };

  const openEditForm = (book: any) => {
    setEditId(book.id);
    setEditTitle(book.title);
    setEditGrade(book.grade);
    setShowEditForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to open/download book from Firebase Storage URL
  const openBook = (book: any) => {
    if (book.fileURL) {
      window.open(book.fileURL, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "رابط الملف غير متوفر لهذا الكتاب.",
      });
    }
  };

  // Update the Add Book Modal to show upload progress
  const renderUploadProgress = () => {
    if (!isLoading || uploadProgress === 0) return null;
    
    return (
      <div className="mt-4">
        <div className="w-full bg-physics-navy rounded-full h-2">
          <div 
            className="bg-physics-gold h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-300 mt-1 text-center">
          {uploadProgress}% تم الرفع
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-physics-navy flex flex-col relative">
      <PhoneContact />
      
      {/* Header */}
      <header className="bg-physics-dark py-4 px-6 flex items-center justify-between">
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
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-physics-gold">الكتب والملفات</h1>
            {currentUser?.role === "admin" && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="goldBtn flex items-center gap-2"
              >
                <FilePlus size={18} />
                <span>إضافة كتاب/ملف</span>
              </button>
            )}
          </div>
          
          {/* Filter and search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {currentUser?.role !== "student" && (
              <div className="w-full md:w-1/3">
                <select
                  className="inputField"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as "all" | "first" | "second" | "third")}
                >
                  <option value="all">جميع الصفوف</option>
                  <option value="first">الصف الأول الثانوي</option>
                  <option value="second">الصف الثاني الثانوي</option>
                  <option value="third">الصف الثالث الثانوي</option>
                </select>
              </div>
            )}
            
            <div className="relative w-full md:w-2/3">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-physics-gold" size={20} />
              <input
                type="text"
                className="inputField pr-12"
                placeholder="ابحث عن كتاب أو ملف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Books Grid */}
          <div className="grid gap-4">
            {filteredBooks.length === 0 ? (
              <div className="bg-physics-dark rounded-lg p-6 text-center">
                <p className="text-white text-lg">لا توجد كتب أو ملفات متاحة</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-physics-dark rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-physics-navy/30 rounded-lg">
                        <FileText size={24} className="text-physics-gold" />
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => openBook(book)}>
                        <h3 className="text-lg font-medium text-white">{book.title}</h3>
                        <div className="flex items-center text-sm text-gray-300 mt-1">
                          <Calendar size={14} className="ml-1" />
                          <span>{formatDate(book.uploadDate)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {book.grade === "first" && "الصف الأول الثانوي"}
                            {book.grade === "second" && "الصف الثاني الثانوي"}
                            {book.grade === "third" && "الصف الثالث الثانوي"}
                          </span>
                        </div>
                      </div>
                      
                      {currentUser?.role === "admin" && (
                        <div className="flex">
                          <button 
                            onClick={() => openEditForm(book)}
                            className="p-2 text-physics-gold hover:text-white"
                          >
                            <Edit size={18} />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteBook(book.id)}
                            className="p-2 text-red-500 hover:text-white"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Add Book Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">إضافة كتاب/ملف جديد</h2>
            
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-white mb-1">عنوان الكتاب/الملف</label>
                <input
                  type="text"
                  className="inputField"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white mb-1">الملف</label>
                <input
                  type="file"
                  className="inputField"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf"
                  required
                />
                <p className="text-sm text-gray-300 mt-1">
                  يمكنك رفع ملفات PDF فقط
                </p>
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
              
              {renderUploadProgress()}

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="goldBtn flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري الإضافة..." : "إضافة الكتاب/الملف"}
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={() => setShowAddForm(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Book Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-physics-dark rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-physics-gold mb-6">تعديل الكتاب/الملف</h2>
            
            <form onSubmit={handleEditBook} className="space-y-4">
              <div>
                <label className="block text-white mb-1">عنوان الكتاب/الملف</label>
                <input
                  type="text"
                  className="inputField"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white mb-1">الملف</label>
                <input
                  type="file"
                  className="inputField"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  accept=".pdf"
                />
                <p className="text-sm text-gray-300 mt-1">اختر ملفاً جديداً فقط إذا كنت تريد تغيير الملف الحالي</p>
              </div>
              
              <div>
                <label className="block text-white mb-1">الصف الدراسي</label>
                <select
                  className="inputField"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value as "first" | "second" | "third")}
                  required
                >
                  <option value="first">الصف الأول الثانوي</option>
                  <option value="second">الصف الثاني الثانوي</option>
                  <option value="third">الصف الثالث الثانوي</option>
                </select>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  className="goldBtn flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
                <button 
                  type="button" 
                  className="bg-physics-navy text-white py-2 px-4 rounded-lg flex-1"
                  onClick={() => setShowEditForm(false)}
                  disabled={isLoading}
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

export default Books;

// Ensure no trailing characters or lines beyond this point unless they are valid code.
