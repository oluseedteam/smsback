import React, { useState, useEffect } from "react";
import { getClasses, createClass, updateClass, deleteClass } from "../../../services/classService";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "../../../services/subjectService";
import { getAcademicSections, createAcademicSection, updateAcademicSection, deleteAcademicSection } from "../../../services/academicSectionService";
import { getResources, createResource, deleteResource } from "../../../services/resourceService";
import { getUsers } from "../../../services/userService";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  FileText,
  Link as LinkIcon,
  Upload,
  Globe,
  Users,
  CheckCircle2,
  School,
  X,
  Search,
} from "lucide-react";
import PopupModal from "../../../components/PopupModal";

const NIGERIAN_GRADE_LEVELS = [
  "Creche",
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
];

export default function AcademicManagementPage() {
  const [activeTab, setActiveTab] = useState("sections"); // "sections" | "classes" | "subjects" | "library"
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("");

  // Modals & Editing state
  const [editingSection, setEditingSection] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  // Forms state
  const [newSection, setNewSection] = useState({ name: "", description: "", ordering: 0, status: "active" });
  const [newClass, setNewClass] = useState({
    name: "",
    grade_level: "",
    academic_section_id: "",
    arm: "",
    room: "",
    academic_year: "",
    teacher_id: "",
    subject_ids: [],
  });
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    academic_section_id: "",
    description: "",
    class_ids: [],
  });
  const [newResource, setNewResource] = useState({ title: "", type: "pdf", url: "", school_class_id: "" });

  const [submitting, setSubmitting] = useState(false);

  // Popup state
  const [popup, setPopup] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, clsRes, subRes, resRes, tchRes] = await Promise.all([
        getAcademicSections(),
        getClasses(),
        getSubjects(),
        getResources(),
        getUsers("teacher"),
      ]);
      setSections(Array.isArray(secRes) ? secRes : (secRes?.data || []));
      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []));
      setSubjects(Array.isArray(subRes) ? subRes : (subRes?.data || []));
      setResources(Array.isArray(resRes) ? resRes : (resRes?.data || []));
      setTeachers(Array.isArray(tchRes) ? tchRes : (tchRes?.data || []));
    } catch (_err) {
      console.error("Failed to load academic data:", _err);
    } finally {
      setLoading(false);
    }
  };

  // Section Handlers
  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSection) {
        await updateAcademicSection(editingSection.id, newSection);
        setPopup({ isOpen: true, type: "success", title: "Updated!", message: "Section updated successfully." });
      } else {
        await createAcademicSection(newSection);
        setPopup({ isOpen: true, type: "success", title: "Created!", message: "Academic section created successfully." });
      }
      setNewSection({ name: "", description: "", ordering: 0, status: "active" });
      setEditingSection(null);
      fetchData();
    } catch (_err) {
      setPopup({ isOpen: true, type: "error", title: "Error", message: _err.message || "Failed to save section" });
    } finally {
      setSubmitting(false);
    }
  };

  // Class Handlers
  const handleSaveClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...newClass };
      if (!payload.academic_section_id) delete payload.academic_section_id;
      if (!payload.teacher_id) delete payload.teacher_id;

      if (editingClass) {
        await updateClass(editingClass.id, payload);
        setPopup({ isOpen: true, type: "success", title: "Updated!", message: "Class updated successfully." });
      } else {
        await createClass(payload);
        setPopup({ isOpen: true, type: "success", title: "Created!", message: "Class created successfully." });
      }
      setNewClass({
        name: "",
        grade_level: "",
        academic_section_id: "",
        arm: "",
        room: "",
        academic_year: "",
        teacher_id: "",
        subject_ids: [],
      });
      setEditingClass(null);
      fetchData();
    } catch (_err) {
      setPopup({ isOpen: true, type: "error", title: "Error", message: _err.message || "Failed to save class" });
    } finally {
      setSubmitting(false);
    }
  };

  // Subject Handlers
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...newSubject };
      if (!payload.code) {
        payload.code = payload.name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() + "101";
      }
      if (!payload.academic_section_id) delete payload.academic_section_id;

      if (editingSubject) {
        await updateSubject(editingSubject.id, payload);
        setPopup({ isOpen: true, type: "success", title: "Updated!", message: "Subject updated successfully." });
      } else {
        await createSubject(payload);
        setPopup({ isOpen: true, type: "success", title: "Created!", message: "Subject created successfully." });
      }
      setNewSubject({ name: "", code: "", academic_section_id: "", description: "", class_ids: [] });
      setEditingSubject(null);
      fetchData();
    } catch (_err) {
      setPopup({ isOpen: true, type: "error", title: "Error", message: _err.message || "Failed to save subject" });
    } finally {
      setSubmitting(false);
    }
  };

  // Resource Handler
  const handleCreateResource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createResource(newResource);
      setNewResource({ title: "", type: "pdf", url: "", school_class_id: "" });
      fetchData();
      setPopup({ isOpen: true, type: "success", title: "Uploaded!", message: "Library resource added successfully." });
    } catch (_err) {
      setPopup({ isOpen: true, type: "error", title: "Error", message: _err.message || "Failed to upload resource" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (type, id) => {
    setDeleteTarget({ type, id });
    setPopup({
      isOpen: true,
      type: "confirm",
      title: "Confirm Delete",
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
    });
  };

  const handleDeleteConfirm = async () => {
    setPopup({ ...popup, isOpen: false });
    const { type, id } = deleteTarget;
    if (!id) return;
    try {
      if (type === "section") {
        await deleteAcademicSection(id);
      } else if (type === "class") {
        await deleteClass(id);
      } else if (type === "subject") {
        await deleteSubject(id);
      } else {
        await deleteResource(id);
      }
      fetchData();
      setPopup({ isOpen: true, type: "success", title: "Deleted!", message: `${type} deleted successfully.` });
    } catch (_err) {
      setPopup({ isOpen: true, type: "error", title: "Error", message: _err.message || "Failed to delete" });
    }
    setDeleteTarget({ type: null, id: null });
  };

  // Filtered lists
  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.grade_level?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSec = !selectedSectionFilter || String(c.academic_section_id) === String(selectedSectionFilter);
    return matchesSearch && matchesSec;
  });

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSec = !selectedSectionFilter || String(s.academic_section_id) === String(selectedSectionFilter);
    return matchesSearch && matchesSec;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-blue-900">
            <School className="w-8 h-8 text-blue-600" /> Academic & Curriculum Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure Academic Sections, Classrooms & Arms, Subjects, Teacher Assignments, and Digital Library.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-2xl">
          {[
            { id: "sections", label: "Sections", icon: Layers, count: sections.length },
            { id: "classes", label: "Classes & Arms", icon: GraduationCap, count: classes.length },
            { id: "subjects", label: "Subjects", icon: BookOpen, count: subjects.length },
            { id: "library", label: "Library", icon: FileText, count: resources.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm("");
                  setSelectedSectionFilter("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  active
                    ? "bg-white text-blue-900 shadow-sm shadow-blue-900/5 font-black"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    active ? "bg-blue-50 text-blue-700 font-black" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* TAB 1: ACADEMIC SECTIONS */}
          {activeTab === "sections" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add/Edit Section Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    {editingSection ? "Edit Section" : "Add Academic Section"}
                  </h3>
                  {editingSection && (
                    <button
                      onClick={() => {
                        setEditingSection(null);
                        setNewSection({ name: "", description: "", ordering: 0, status: "active" });
                      }}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveSection} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Section Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. Nursery, Primary, Junior Secondary"
                      value={newSection.name}
                      onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Early childhood education foundation"
                      value={newSection.description}
                      onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Ordering Order
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newSection.ordering}
                        onChange={(e) => setNewSection({ ...newSection, ordering: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Status
                      </label>
                      <select
                        value={newSection.status}
                        onChange={(e) => setNewSection({ ...newSection, status: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none bg-white font-bold"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingSection ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {editingSection ? "Update Section" : "Save Section"}
                  </button>
                </form>
              </div>

              {/* Sections List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            Order #{sec.ordering}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sec.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {sec.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{sec.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                          {sec.description || "No description provided."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-900">{sec.classes_count || 0} Classes</span>
                          <span>•</span>
                          <span className="font-bold text-indigo-900">{sec.subjects_count || 0} Subjects</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSection(sec);
                              setNewSection({
                                name: sec.name,
                                description: sec.description || "",
                                ordering: sec.ordering || 0,
                                status: sec.status || "active",
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest("section", sec.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLASSES & ARMS */}
          {activeTab === "classes" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add / Edit Class Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    {editingClass ? "Edit Class" : "Create New Class"}
                  </h3>
                  {editingClass && (
                    <button
                      onClick={() => {
                        setEditingClass(null);
                        setNewClass({
                          name: "",
                          grade_level: "",
                          academic_section_id: "",
                          arm: "",
                          room: "",
                          academic_year: "",
                          teacher_id: "",
                          subject_ids: [],
                        });
                      }}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveClass} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Class Display Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. JSS 1 Gold, SS 3 Science"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Grade Level *
                      </label>
                      <select
                        required
                        value={newClass.grade_level}
                        onChange={(e) => setNewClass({ ...newClass, grade_level: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white font-medium"
                      >
                        <option value="">Select Level</option>
                        {NIGERIAN_GRADE_LEVELS.map((gl) => (
                          <option key={gl} value={gl}>
                            {gl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Arm / Sub-Class
                      </label>
                      <input
                        placeholder="e.g. Gold, A, B"
                        value={newClass.arm}
                        onChange={(e) => setNewClass({ ...newClass, arm: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Academic Section
                      </label>
                      <select
                        value={newClass.academic_section_id}
                        onChange={(e) => setNewClass({ ...newClass, academic_section_id: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white font-medium"
                      >
                        <option value="">No Section</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Class Teacher
                      </label>
                      <select
                        value={newClass.teacher_id}
                        onChange={(e) => setNewClass({ ...newClass, teacher_id: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white font-medium"
                      >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} ({t.employee_id || "Teacher"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Classroom / Room Number
                    </label>
                    <input
                      placeholder="e.g. Block B, Room 14"
                      value={newClass.room}
                      onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingClass ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {editingClass ? "Update Class" : "Save Class"}
                  </button>
                </form>
              </div>

              {/* Classes List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search & Section Filter */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-gray-100">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search classes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none bg-white font-medium"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {cls.grade_level} {cls.arm ? `• ${cls.arm}` : ""}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                            {cls.students_count || cls.students?.length || 0} Students
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Section: <span className="font-bold text-gray-700">{cls.academic_section?.name || "Global"}</span>
                        </p>
                        <div className="bg-gray-50/80 rounded-xl p-2.5 text-xs text-gray-600 mb-3 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">
                            Class Teacher: <strong className="text-gray-900">{cls.teacher?.full_name || "Unassigned"}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>{cls.subjects?.length || 0} Subjects Assigned</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingClass(cls);
                              setNewClass({
                                name: cls.name,
                                grade_level: cls.grade_level,
                                academic_section_id: cls.academic_section_id || "",
                                arm: cls.arm || "",
                                room: cls.room || "",
                                academic_year: cls.academic_year || "",
                                teacher_id: cls.teacher_id || "",
                                subject_ids: (cls.subjects || []).map((s) => s.id),
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest("class", cls.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add / Edit Subject Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    {editingSubject ? "Edit Subject" : "Create New Subject"}
                  </h3>
                  {editingSubject && (
                    <button
                      onClick={() => {
                        setEditingSubject(null);
                        setNewSubject({ name: "", code: "", academic_section_id: "", description: "", class_ids: [] });
                      }}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveSubject} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Subject Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. Mathematics, English Language, Physics"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Subject Code
                      </label>
                      <input
                        placeholder="e.g. MTH101"
                        value={newSubject.code}
                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                        Section
                      </label>
                      <select
                        value={newSubject.academic_section_id}
                        onChange={(e) => setNewSubject({ ...newSubject, academic_section_id: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white font-medium"
                      >
                        <option value="">All Sections</option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Description / Curriculum Scope
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. General secondary core curriculum"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none resize-none"
                    />
                  </div>

                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingSubject ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {editingSubject ? "Update Subject" : "Save Subject"}
                  </button>
                </form>
              </div>

              {/* Subjects List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-gray-100">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none bg-white font-medium"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                            {sub.code}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {sub.academic_section?.name || "General"}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{sub.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {sub.description || "Core curriculum subject."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>{sub.classes?.length || 0} Classes Taking Subject</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSubject(sub);
                              setNewSubject({
                                name: sub.name,
                                code: sub.code,
                                academic_section_id: sub.academic_section_id || "",
                                description: sub.description || "",
                                class_ids: (sub.classes || []).map((c) => c.id),
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest("subject", sub.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIGITAL LIBRARY RESOURCES */}
          {activeTab === "library" && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-800 uppercase tracking-widest text-sm">Library & E-Resources</h2>
                    <p className="text-xs text-gray-400 font-normal">Publish textbooks, class slides, and past papers</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  {resources.length} active resources
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">
                {/* Upload Form */}
                <div className="lg:col-span-2 border-r border-gray-50 p-8 space-y-6 bg-gray-50/20">
                  <form onSubmit={handleCreateResource} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Resource Title *
                      </label>
                      <input
                        required
                        placeholder="e.g. Secondary Physics Textbook Vol 1"
                        value={newResource.title}
                        onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type</label>
                        <select
                          value={newResource.type}
                          onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold bg-white outline-none"
                        >
                          <option value="pdf">PDF File</option>
                          <option value="link">URL Link</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          Target Class
                        </label>
                        <select
                          value={newResource.school_class_id}
                          onChange={(e) => setNewResource({ ...newResource, school_class_id: e.target.value })}
                          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold bg-white outline-none capitalize"
                        >
                          <option value="">Everyone (Global)</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Resource URL / Link *
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          required
                          placeholder="https://..."
                          value={newResource.url}
                          onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                          className="w-full border border-gray-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      disabled={submitting}
                      type="submit"
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Publish Resource
                    </button>
                  </form>
                </div>

                {/* Resource List */}
                <div className="lg:col-span-3 overflow-y-auto p-6 space-y-3">
                  {resources.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-40 gap-4 py-16">
                      <Globe className="w-12 h-12" />
                      <p className="font-black text-xs uppercase tracking-widest">Library is empty</p>
                    </div>
                  ) : (
                    resources.map((r) => (
                      <div
                        key={r.id}
                        className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 uppercase text-[10px]">
                            {r.type}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{r.title}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Users className="w-3 h-3" /> {r.school_class?.name || "Global"}
                              </span>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Open Resource Link ↗
                              </a>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRequest("resource", r.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <PopupModal
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        onConfirm={popup.type === "confirm" ? handleDeleteConfirm : undefined}
      />
    </div>
  );
}
