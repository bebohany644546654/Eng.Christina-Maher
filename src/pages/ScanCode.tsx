
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ArrowRight, QrCode, UserMinus } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";
import { ManualAttendance } from "@/components/ManualAttendance";
import PhysicsBackground from "@/components/PhysicsBackground";
import { PhoneContact } from "@/components/PhoneContact";

const ScanCode = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"scan" | "absence">("scan");

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
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-physics-gold text-center mb-6">تسجيل الحضور</h1>
          
          {/* Tabs */}
          <div className="flex bg-physics-dark rounded-lg p-1 mb-6">
            <button 
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                activeTab === "scan" 
                  ? "bg-physics-gold text-physics-navy" 
                  : "text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("scan")}
            >
              <QrCode size={20} />
              <span>مسح الكود</span>
            </button>
            <button 
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 ${
                activeTab === "absence" 
                  ? "bg-physics-gold text-physics-navy" 
                  : "text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("absence")}
            >
              <UserMinus size={20} />
              <span>تسجيل غياب</span>
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === "scan" ? (
            <QrScanner />
          ) : (
            <ManualAttendance />
          )}
        </div>
      </main>
    </div>
  );
};

export default ScanCode;
