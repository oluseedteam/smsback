import { useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  Star, 
  Upload, 
  Download,
  Lock,
  MessageSquare,
  Users,
  Timer
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const HomeworkDetail = () => {
  const navigate = useNavigate();
  const [timerActive, setTimerActive] = useState(false);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8 pb-12 px-2 sm:px-4 lg:px-0"
    >
      {/* Breadcrumbs & Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Homework
        </button>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400">
           My Homework <span className="opacity-40">/</span> <span className="text-gray-600 truncate max-w-[150px] sm:max-w-none">Math Practice Sheet</span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-white rounded-[24px] sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-orange-100 border-l-8 border-l-orange-400 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
        
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 bg-orange-50 rounded-2xl shadow-inner w-fit">
               <span className="text-2xl sm:text-3xl font-black text-orange-400">12<br/>34</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-lg sm:text-2xl xl:text-3xl font-black text-gray-800 tracking-tight leading-tight uppercase">Math Practice Sheet - Addition Problems</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                 <span className="bg-orange-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap">Mathematics</span>
                 <span className="text-[10px] sm:text-xs text-gray-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                   🧑‍🏫 <span className="hidden sm:inline">Assigned by </span>Mrs. Anderson
                 </span>
                 <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-orange-100 text-[9px] sm:text-xs font-black">
                    <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-pulse" /> <span className="hidden sm:inline">Due: </span>Tomorrow (Oct 26) <span className="hidden sm:inline">at 3:00 PM</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 self-start xl:self-center">
            <span className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-500 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest border border-gray-200 shadow-sm">
              Not Started
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column CONTENT */}
        <motion.div variants={itemVariants} className="flex-1 space-y-6 sm:space-y-8 min-w-0">
          
          {/* What You Need to Do */}
          <motion.section variants={itemVariants} className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📝</span>
                <h2 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-tight">What You Need to Do:</h2>
             </div>
             <p className="text-xs sm:text-base text-gray-500 leading-relaxed font-bold">
                Complete pages 24 and 25 in your Math workbook. Remember to show all your work! Use a pencil so you can erase mistakes. Check your answers when you're done.
             </p>
          </motion.section>

          {/* What You'll Learn */}
          <motion.section variants={itemVariants} className="bg-white/60 rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-50 backdrop-blur-sm">
             <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🎯</span>
                <h2 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-tight">What You'll Learn:</h2>
             </div>
             <ul className="space-y-3 sm:space-y-4">
               {[
                 "Adding numbers up to 1000",
                 "Showing your work step by step",
                 "Checking your math"
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-600 group">
                   <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0 group-hover:scale-125 transition-transform" />
                   {item}
                 </li>
               ))}
             </ul>
          </motion.section>

          {/* Materials You Need */}
          <motion.section variants={itemVariants} className="space-y-3 sm:space-y-4">
             <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl">📦</span>
                <h2 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-tight">Materials You Need:</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-3">
               {[
                 { text: "Math workbook", emoji: "📚" },
                 { text: "Pencil and eraser", emoji: "✏️" },
                 { text: "Scratch paper (optional)", emoji: "📄" }
               ].map((item, i) => (
                 <div key={i} className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow cursor-default group">
                    <span className="p-2 sm:p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-700">{item.text}</span>
                 </div>
               ))}
             </div>
          </motion.section>

          {/* Helpful Files */}
          <motion.section variants={itemVariants} className="space-y-3 sm:space-y-4">
             <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl">📥</span>
                <h2 className="text-base sm:text-xl font-black text-gray-800 uppercase tracking-tight">Helpful Files:</h2>
             </div>
             <div className="space-y-3">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-blue-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] sm:text-xs">PDF</div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Practice_Worksheet.pdf</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">2 pages</p>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
                
                <div className="bg-gray-50/30 p-4 sm:p-5 rounded-2xl border border-dashed border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-70">
                   <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-200 text-gray-500 rounded-xl font-black text-[10px] sm:text-xs uppercase">PDF</div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-500">Answer_Key.pdf</p>
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400">For checking after completion</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto bg-gray-200 text-gray-500 px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3" /> <span className="whitespace-nowrap">Available after you submit</span>
                  </div>
                </div>
             </div>
          </motion.section>

          {/* Submit Your Work */}
          <motion.section variants={itemVariants} className="bg-blue-50/40 rounded-[32px] p-5 sm:p-10 border-2 border-dashed border-blue-200 space-y-6 sm:space-y-8">
             <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl">📤</span>
                <h2 className="text-base sm:text-xl font-black text-blue-800 uppercase tracking-tight">Submit Your Work:</h2>
             </div>
             <p className="text-[11px] sm:text-sm text-blue-600 font-bold max-w-lg leading-relaxed">
                Take a photo of your completed work or have an adult help you scan it.
             </p>
             
             {/* Upload Area */}
             <div className="bg-white border-2 border-dashed border-blue-200 rounded-[24px] sm:rounded-3xl p-6 sm:p-12 text-center space-y-4 group hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
                  </div>
                  <p className="text-sm sm:text-lg font-black text-gray-800 tracking-tight">Drag and drop your work here</p>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">or click to choose a file</p>
                  <p className="text-[9px] sm:text-[11px] font-medium text-gray-400 mt-6 bg-gray-50 py-1.5 px-4 rounded-full inline-block">Photos (.jpg, .png) or PDF files • Maximum 10 MB per file</p>
                </div>
             </div>

             {/* Questions Box */}
             <div className="space-y-3">
               <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black text-blue-800 uppercase tracking-widest pl-1">
                 <MessageSquare className="w-3.5 h-3.5" /> Do You Have Any Questions?
               </label>
               <textarea 
                  rows="4" 
                  placeholder="Type anything here you'd like your teacher to know..." 
                  className="w-full bg-white rounded-2xl p-4 border border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-medium outline-none transition-all placeholder:text-gray-300 shadow-sm"
               ></textarea>
             </div>

             {/* Checkboxes */}
             <div className="space-y-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all" />
                  <span className="text-xs sm:text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors">I did my best work 🌟</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all" />
                  <span className="text-xs sm:text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors">I checked my answers ✓</span>
                </label>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="flex-1 bg-gray-200 text-gray-400 py-4 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest cursor-not-allowed transition-all opacity-80">
                   Submit Homework
                </button>
                <button className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-100 active:scale-95">
                   Save as Draft
                </button>
             </div>

             <button className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100 active:scale-[0.98]">
               ❓ I Need Help
             </button>
          </motion.section>

        </motion.div>

        {/* Right Sidebar */}
        <div className="lg:w-80 w-full space-y-6">
           
           {/* Tips For Assignment */}
           <div className="bg-yellow-50 rounded-3xl p-6 sm:p-8 shadow-sm border border-yellow-100 relative group overflow-hidden">
              <div className="absolute -left-6 -top-6 w-20 h-20 bg-yellow-200/50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                   <span className="text-2xl">💡</span>
                   <h3 className="font-black text-gray-800 uppercase tracking-tight leading-tight">Tips for This<br className="hidden sm:inline"/>Assignment</h3>
                </div>
                <div className="space-y-4">
                  {[
                    "Remember to line up your numbers",
                    "Start with the ones place",
                    "Check your work by adding in a different order"
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-3 text-[11px] sm:text-xs font-bold text-gray-500 leading-relaxed">
                       <span className="text-yellow-600 shrink-0 font-black">•</span>
                       {tip}
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Time Tracker */}
           <div className="bg-blue-50/50 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                 <Timer className="w-3.5 h-3.5" /> Time Tracker
              </div>
              <h2 className="text-4xl font-black text-blue-900 tracking-tighter">00:00</h2>
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg
                  ${timerActive ? 'bg-red-500 text-white shadow-red-100' : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'}`}
              >
                {timerActive ? 'Stop Timer' : 'Start Timer'}
              </button>
              <p className="text-[10px] font-bold text-gray-400">Track how long you work on this homework!</p>
           </div>

           {/* Stuck on a Problem? Card */}
           <div className="bg-green-50 rounded-3xl p-6 sm:p-8 border border-green-100 shadow-sm text-center">
              <h3 className="text-sm font-black text-gray-800 mb-4 uppercase tracking-tight flex items-center justify-center gap-2">
                🤔 Stuck on a problem?
              </h3>
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl animate-bounce">
                🐸
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-md">
                   <MessageSquare className="w-4 h-4" /> Ask Teacher
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-md">
                   <Users className="w-4 h-4" /> Ask Parent
                </button>
              </div>
           </div>

           {/* Gold Star Preview */}
           <div className="bg-yellow-400 rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-white" /> Gold Star Preview
                </h3>
                <Star className="w-16 h-16 fill-white text-white mx-auto drop-shadow-xl animate-spin-slow" />
                <p className="text-xs font-black leading-tight">Earn a gold star for completing this homework!</p>
                <div className="bg-white/20 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                   You have 24 stars this month
                </div>
              </div>
           </div>

        </div>
      </div>
    </motion.div>
  );
};

export default HomeworkDetail;
