import React, { useRef, useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Camera, X, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsQR from "jsqr";
import { useIsMobile } from "@/hooks/use-mobile";

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const { getStudentByCode } = useAuth();
  const { addAttendance } = useData();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // التحقق من نوع الجهاز
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  const requestCameraPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (result.state === 'denied') {
          setPermissionDenied(true);
          toast({
            variant: "destructive",
            title: "تم رفض الوصول للكاميرا",
            description: "يجب السماح للتطبيق باستخدام الكاميرا لتتمكن من المسح"
          });
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error("Error checking camera permission:", err);
      return true; // Continue anyway since some browsers don't support permissions API
    }
  };
  
  const startScanner = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    try {
      const constraints = {
        video: {
          facingMode: isMobile ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        setPermissionDenied(false);
        scanCode();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPermissionDenied(true);
      toast({
        variant: "destructive",
        title: "فشل الوصول للكاميرا",
        description: "يرجى التأكد من السماح للتطبيق باستخدام الكاميرا"
      });
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setScanning(false);
    }
  };

  const scanCode = () => {
    if (!scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          // QR code found
          processScannedCode(code.data);
          return;
        }
      }
    }
    
    // Continue scanning if no code was found
    if (scanning) {
      requestAnimationFrame(scanCode);
    }
  };

  const processScannedCode = async (code: string) => {
    setScannedCode(code);
    stopScanner();
    
    const student = getStudentByCode(code);
    if (student) {
      await addAttendance(student.id, student.name, "present");
      
      // Play presence sound effect
      const audio = new Audio("/sounds/presence-recorded.wav");
      audio.play().catch(e => console.error("Sound play failed:", e));
      
      toast({
        title: "تم تسجيل الحضور",
        description: `تم تسجيل حضور الطالب ${student.name}`
      });
      setScannedCode("");
    } else {
      // Play error sound effect
      const audio = new Audio("/sounds/error-sound.wav");
      audio.play().catch(e => console.error("Sound play failed:", e));
      
      toast({
        variant: "destructive",
        title: "كود غير صالح",
        description: "لم يتم العثور على طالب بهذا الكود"
      });
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedCode) {
      const student = getStudentByCode(scannedCode);
      if (student) {
        await addAttendance(student.id, student.name, "present");
        
        // Play presence sound effect
        const audio = new Audio("/sounds/presence-recorded.wav");
        audio.play().catch(e => console.error("Sound play failed:", e));
        
        toast({
          title: "تم تسجيل الحضور",
          description: `تم تسجيل حضور الطالب ${student.name}`
        });
        setScannedCode("");
      } else {
        // Play error sound effect
        const audio = new Audio("/sounds/error-sound.wav");
        audio.play().catch(e => console.error("Sound play failed:", e));
        
        toast({
          variant: "destructive",
          title: "كود غير صالح",
          description: "لم يتم العثور على طالب بهذا الكود"
        });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-physics-dark p-4 rounded-lg shadow-lg flex flex-col items-center">
        
        {/* Scanner section: either button or video preview */}
        {!scanning ? (
          <button 
            onClick={startScanner}
            // Disable button if permission is definitively denied (for non-Android where we can't prompt to settings)
            disabled={permissionDenied && !isAndroid} 
            className="w-full flex items-center justify-center gap-2 bg-physics-gold text-physics-navy py-3 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <Camera size={20} />
            <span>مسح الكود بالكاميرا</span>
          </button>
        ) : (
          <div className="relative w-full max-w-xs mb-4">
            <video 
              ref={videoRef} 
              className="w-full aspect-[4/3] rounded-lg border-2 border-physics-gold shadow-md"
              playsInline
              muted
              autoPlay
            ></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <button 
              onClick={stopScanner}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
              title="إيقاف المسح"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Permission Denied Message */}
        {permissionDenied && (
          <div className="my-4 text-center text-red-400 p-3 bg-red-900/30 rounded-lg w-full">
            <p className="font-semibold">تم رفض إذن الكاميرا.</p>
            {isMobile ? (
              isAndroid ? (
                <p className="text-sm">يرجى تمكين الإذن من إعدادات التطبيق أو المتصفح.</p>
              ) : (
                <p className="text-sm">يرجى تمكين الإذن من إعدادات المتصفح ثم إعادة تحميل الصفحة.</p>
              )
            ) : (
              <p className="text-sm">يرجى تمكين إذن الكاميرا في إعدادات المتصفح الخاص بك.</p>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-physics-gold hover:underline text-sm"
            >
              إعادة تحميل الصفحة للمحاولة مرة أخرى
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="my-4 w-full flex items-center gap-2">
          <div className="h-px bg-physics-gold/20 flex-1"></div>
          <span className="text-white text-xs">أو</span>
          <div className="h-px bg-physics-gold/20 flex-1"></div>
        </div>

        {/* Form for manual entry - always visible */}
        <form onSubmit={handleManualEntry} className="w-full">
          <label htmlFor="studentCodeManual" className="block text-sm font-medium text-physics-gold mb-1">
            أدخل الكود يدويًا:
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              name="studentCodeManual"
              id="studentCodeManual"
              value={scannedCode} 
              onChange={(e) => setScannedCode(e.target.value)} 
              className="flex-grow p-2.5 bg-physics-navy/50 border border-physics-gold/30 text-white rounded-lg focus:ring-physics-gold focus:border-physics-gold transition-colors shadow-sm"
              placeholder="أدخل كود الطالب"
            />
            <button 
              type="submit"
              disabled={!scannedCode}
              className="bg-green-500 text-white py-2.5 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تسجيل حضور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
