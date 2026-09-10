import React from 'react';
import { 
  Upload, FileText, Star, BarChart3, 
  FolderHeart, Tag, HelpCircle, ChevronRight, 
  Download, MousePointer2 
} from 'lucide-react';

const recentUploads = [
  { name: 'Math Quiz.pdf', time: '2 hours ago', icon: FileText, color: 'text-blue-500' },
  { name: 'Presentation.ppt', time: 'Yesterday', icon: FileText, color: 'text-orange-500' },
];

const featured = [
  { title: "Teacher's Choice: Best Math Activities", link: "View Collection →" },
  { title: "New: Interactive Science Experiments", link: "Explore →" },
  { title: "Popular: Reading Comprehension", link: "See Resources →" },
];

const stats = [
  { label: 'Resources Uploaded', value: '67' },
  { label: 'Total Downloads', value: '1,245' },
];

const tags = [
  { name: 'Differentiated', count: 45 },
  { name: 'Visual Learners', count: 32 },
  { name: 'Hands-on', count: 28 },
  { name: 'Homework', count: 58 },
  { name: 'Assessment', count: 23 },
  { name: 'Group Work', count: 34 },
  { name: 'Independent', count: 45 },
];

const requests = [
  { title: 'Looking for: Multiplication flash cards', sub: '3 teachers need this' },
  { title: 'Needed: Science lab safety posters', sub: '2 teachers need this' },
];

const TeacherResourcesRight = () => {
  return (
    <div className="space-y-6">
      {/* Quick Upload */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-blue-600" /> Quick Upload
        </h3>
        <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 text-center hover:border-blue-200 transition-colors cursor-pointer group">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-xs font-medium text-gray-600">Drag files here or click to browse</p>
          <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, PPT, JPG, PNG</p>
        </div>
        <button className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl mt-4 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all text-xs">
          Upload New Resource
        </button>

        {/* Recent Uploads */}
        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Recent Uploads</p>
          {recentUploads.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
              <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${file.color}`}>
                <file.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{file.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Resources */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
          <Star className="w-4 h-4 text-yellow-500" /> Featured Resources
        </h3>
        <div className="space-y-4">
          {featured.map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{item.title}</p>
              <p className="text-[10px] font-bold text-blue-500 mt-1 hover:underline">{item.link}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Statistics */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
          <BarChart3 className="w-4 h-4 text-blue-600" /> My Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center mb-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Average Rating</p>
          <p className="text-sm font-bold text-green-600 flex items-center justify-center gap-1">
            ⭐ 4.6 / 5.0
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center mt-2">
           <p className="text-[9px] text-gray-400 font-bold uppercase">Most Popular</p>
           <p className="text-[10px] font-bold text-orange-600">Addition Worksheet Pack</p>
        </div>
        <button className="w-full text-xs font-bold text-blue-600 hover:underline mt-4 text-center">
          View Full Analytics →
        </button>
      </div>

      {/* Quick Collections */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
          <FolderHeart className="w-4 h-4 text-pink-500" /> Quick Collections
        </h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center p-3 rounded-2xl bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all">
            Current Unit Resources
          </button>
          <button className="w-full flex items-center justify-center p-3 rounded-2xl bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all gap-2">
            ⭐ Favorites
          </button>
        </div>
        <button className="w-full text-xs font-bold text-blue-600 hover:underline mt-4 text-center">
          View All Collections →
        </button>
      </div>

      {/* Popular Tags */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
          <Tag className="w-4 h-4 text-purple-500" /> Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-3 py-1.5 rounded-xl bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-200 cursor-pointer hover:border-blue-200 transition-all">
              {tag.name} <span className="text-gray-400 ml-1">({tag.count})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Resource Requests */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600" /> Resource Requests
        </h3>
        <div className="space-y-4">
          {requests.map((req, i) => (
            <div key={i} className="bg-orange-50 border border-orange-100 p-3 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-800">{req.title}</p>
              <p className="text-[9px] text-gray-500 mt-1">{req.sub}</p>
            </div>
          ))}
        </div>
        <button className="w-full bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 px-4 rounded-2xl mt-4 hover:bg-blue-50 transition-all text-xs">
          + Request a Resource
        </button>
      </div>
    </div>
  );
};

export default TeacherResourcesRight;
