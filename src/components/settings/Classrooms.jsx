import { useEffect, useMemo, useState } from "react";
import {
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from "../../api/classroomsApi";
import { getTeachers } from "../../api/classroomsApi";
import { sectionsApi } from "../../api/sectionsApi";
import { roomsApi } from "../../api/roomsApi";
import Button from "../common/Button";
import { Plus, Edit, Trash2, LayoutGrid, List, Map } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import toast from "react-hot-toast";
import { useSettings } from "../../context/SettingsContext";

const getDefaultClassForm = () => ({
  name: "",
  total_capacity: 0,
  number_of_sections: 0,
});

const getDefaultSectionForm = () => ({
  class_id: "",
  section_name: "",
  total_students: 0,
  monitor_name: "",
  block_id: "",
  floor_number: "",
  room_id: "",
  class_teacher_id: "",
});

const FLOOR_PLAN_DARK = {
  cardBackground: "#1E293B",
  cardBorder: "#334155",
  blockAccents: ["#6366F1", "#22D3EE", "#F59E0B", "#10B981"],
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
};

const getBlockAccent = (index) =>
  FLOOR_PLAN_DARK.blockAccents[index % FLOOR_PLAN_DARK.blockAccents.length];

const Classrooms = () => {
  const { settings } = useSettings();
  const school = settings?.school_profile || {};
  const blocks = useMemo(
    () => (Array.isArray(school.blocks) ? school.blocks : []),
    [school.blocks],
  );
  const floorCount = Math.max(1, parseInt(school.total_floors || 1, 10) || 1);
  const defaultFloors = useMemo(
    () => Array.from({ length: floorCount }, (_, index) => index + 1),
    [floorCount],
  );

  const [activeTab, setActiveTab] = useState("classes");
  const [classrooms, setClassrooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showClassModal, setShowClassModal] = useState(false);
  const [classMode, setClassMode] = useState("create");
  const [selectedClass, setSelectedClass] = useState(null);
  const [classForm, setClassForm] = useState(getDefaultClassForm());

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionMode, setSectionMode] = useState("create");
  const [selectedSection, setSelectedSection] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(getDefaultSectionForm());
  const [draggingSectionId, setDraggingSectionId] = useState(null);
  const [sectionView, setSectionView] = useState("list");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, sectionRes, roomRes, teacherRes] = await Promise.all([
        getClassrooms(),
        sectionsApi.getSections(),
        roomsApi.getRooms(),
        getTeachers().catch((err) => {
          console.error("Error loading teachers:", err);
          return { data: [] };
        }),
      ]);

      setClassrooms(classRes?.data?.data || classRes?.data || []);
      setSections(sectionRes?.data?.data || sectionRes?.data || []);
      setRooms(roomRes?.data?.data || roomRes?.data || []);
      setTeachers(teacherRes?.data?.data || teacherRes?.data || []);
    } catch (err) {
      console.error("Error loading classroom settings:", err);
      toast.error("Failed to load classroom settings");
    } finally {
      setLoading(false);
    }
  };

  const openCreateClass = () => {
    setClassMode("create");
    setSelectedClass(null);
    setClassForm(getDefaultClassForm());
    setShowClassModal(true);
  };

  const openEditClass = (classroom) => {
    setClassMode("edit");
    setSelectedClass(classroom);
    setClassForm({
      name: classroom.name || "",
      total_capacity: classroom.total_capacity || 0,
      number_of_sections: classroom.number_of_sections || 0,
    });
    setShowClassModal(true);
  };

  const saveClass = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (classMode === "edit" && selectedClass) {
        await updateClassroom(selectedClass.id, classForm);
        toast.success("Class updated");
      } else {
        await createClassroom(classForm);
        toast.success("Class created");
      }
      setShowClassModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save class");
    } finally {
      setLoading(false);
    }
  };

  const deleteClassItem = async (classroom) => {
    if (!window.confirm("Delete this class?")) return;
    setLoading(true);
    try {
      await deleteClassroom(classroom.id);
      toast.success("Class deleted");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const openCreateSection = () => {
    setSectionMode("create");
    setSelectedSection(null);
    setSectionForm(getDefaultSectionForm());
    setShowSectionModal(true);
  };

  const openEditSection = (section) => {
    setSectionMode("edit");
    setSelectedSection(section);
    setSectionForm({
      class_id: section.class_id || "",
      section_name: section.section_name || "",
      total_students: section.total_students || 0,
      monitor_name: section.monitor_name || "",
      block_id: section.block_id || "",
      floor_number: section.floor_number || "",
      room_id: section.room_id || "",
      class_teacher_id: section.class_teacher_id || "",
    });
    setShowSectionModal(true);
  };

  const saveSection = async (event) => {
    event.preventDefault();
    const payload = {
      section_name: String(sectionForm.section_name || "").trim(),
      class_id: Number(sectionForm.class_id || 0),
      total_students: Number(sectionForm.total_students || 0),
      monitor_name: sectionForm.monitor_name
        ? String(sectionForm.monitor_name).trim()
        : null,
      block_id: sectionForm.block_id ? Number(sectionForm.block_id) : null,
      floor_number: sectionForm.floor_number
        ? Number(sectionForm.floor_number)
        : null,
      room_id: sectionForm.room_id ? Number(sectionForm.room_id) : null,
      class_teacher_id: sectionForm.class_teacher_id || null,
    };

    if (!payload.section_name) {
      toast.error("Section name is required");
      return;
    }
    if (!payload.class_id) {
      toast.error("Class selection is required");
      return;
    }

    setLoading(true);
    try {
      if (sectionMode === "edit" && selectedSection) {
        await sectionsApi.updateSection(selectedSection.id, payload);
        toast.success("Section updated");
      } else {
        await sectionsApi.createSection(payload);
        toast.success("Section created");
      }
      setShowSectionModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save section");
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (section) => {
    if (!window.confirm("Delete this section?")) return;
    setLoading(true);
    try {
      await sectionsApi.deleteSection(section.id);
      toast.success("Section deleted");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedBlock = useMemo(
    () =>
      blocks.find((block) => block.id === Number(sectionForm.block_id)) || null,
    [blocks, sectionForm.block_id],
  );

  const sectionFloorOptions = useMemo(() => {
    if (
      selectedBlock &&
      Array.isArray(selectedBlock.floors) &&
      selectedBlock.floors.length > 0
    ) {
      return [...selectedBlock.floors].sort((a, b) => a - b);
    }
    return defaultFloors;
  }, [selectedBlock, defaultFloors]);

  const sectionRoomOptions = useMemo(
    () =>
      rooms.filter(
        (room) =>
          String(room.block_id || "") === String(sectionForm.block_id) &&
          String(room.floor_number || "") === String(sectionForm.floor_number),
      ),
    [rooms, sectionForm.block_id, sectionForm.floor_number],
  );

  const sectionsByRoom = useMemo(
    () =>
      sections.reduce((acc, section) => {
        if (section.room_id) {
          acc[section.room_id] = [...(acc[section.room_id] || []), section];
        }
        return acc;
      }, {}),
    [sections],
  );

  const roomsByBlockFloor = useMemo(() => {
    const grouping = {};

    blocks.forEach((block) => {
      const blockFloors =
        Array.isArray(block.floors) && block.floors.length
          ? [...block.floors].sort((a, b) => a - b)
          : defaultFloors;

      grouping[block.id] = {
        floors: blockFloors,
        roomsByFloor: blockFloors.reduce((acc, floor) => {
          acc[floor] = [];
          return acc;
        }, {}),
      };
    });

    rooms.forEach((room) => {
      const blockGroup = room.block_id ? grouping[room.block_id] : null;
      if (
        blockGroup &&
        room.floor_number &&
        blockGroup.roomsByFloor[room.floor_number]
      ) {
        blockGroup.roomsByFloor[room.floor_number].push(room);
      }
    });

    return grouping;
  }, [blocks, rooms, defaultFloors]);

  const moveSectionToRoom = async (section, room) => {
    if (!section || !room) return;
    setLoading(true);
    try {
      await sectionsApi.updateSection(section.id, {
        room_id: room.id,
        block_id: room.block_id,
        floor_number: room.floor_number,
      });
      toast.success(`${section.section_name} moved to ${room.room_number}`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to move section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
      }}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              Classroom Settings
            </h2>
            <p className="text-xs text-slate-400">
              Manage class definitions and section assignments.
            </p>
          </div>

          <div className="ml-4">
            <button
              type="button"
              onClick={
                activeTab === "classes" ? openCreateClass : openCreateSection
              }
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold bg-linear-to-r from-indigo-600 to-emerald-500 text-white shadow-xl transform hover:scale-105 transition-transform ring-1 ring-indigo-400/30"
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">
                {activeTab === "classes" ? "New Class" : "New Section"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap lg:flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === "classes" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Classes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === "sections" ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Sections
          </button>
        </div>
      </div>

      {activeTab === "classes" && (
        <div className="overflow-hidden rounded-lg border border-slate-700/60">
          {classrooms.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              {loading
                ? "Loading classes..."
                : "No classes yet. Add one to start."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Class name</th>
                  <th className="px-4 py-3 text-left">Total students</th>
                  <th className="px-4 py-3 text-left">Sections</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {classrooms.map((classroom) => (
                  <tr key={classroom.id}>
                    <td className="px-4 py-3 font-medium text-white">
                      {classroom.name}
                    </td>
                    <td className="px-4 py-3">
                      {classroom.total_capacity ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {classroom.number_of_sections ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditClass(classroom)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-200 rounded text-xs"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteClassItem(classroom)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "sections" && (
        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/40 p-4 shadow-inner">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  Sections
                </h2>
                <p className="text-xs text-slate-400">
                  {sectionView === "list"
                    ? "List View"
                    : sectionView === "grid"
                      ? "Grid View"
                      : "Floor View"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSectionView("list")}
                    className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${sectionView === "list" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
                  >
                    <List size={14} /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionView("grid")}
                    className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${sectionView === "grid" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
                  >
                    <LayoutGrid size={14} /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionView("floor")}
                    className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${sectionView === "floor" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
                  >
                    <Map size={14} /> Floor View
                  </button>
                </div>
                <button
                  onClick={openCreateSection}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  <Plus size={14} /> Create
                </button>
              </div>
            </div>

            {sectionView === "list" && (
              <div className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950">
                {sections.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    {loading
                      ? "Loading sections..."
                      : "No sections yet. Add one to begin."}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/60 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">Section</th>
                        <th className="px-4 py-3 text-left">Class</th>
                        <th className="px-4 py-3 text-left">Class Teacher</th>
                        <th className="px-4 py-3 text-left">Block</th>
                        <th className="px-4 py-3 text-left">Floor</th>
                        <th className="px-4 py-3 text-left">Room</th>
                        <th className="px-4 py-3 text-right">Students</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {sections.map((section) => (
                        <tr key={section.id}>
                          <td className="px-4 py-3 font-medium text-white">
                            {section.section_name}
                          </td>
                          <td className="px-4 py-3">
                            {section.class?.class_name || "No class"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {section.class_teacher_name || "Not assigned"}
                          </td>
                          <td className="px-4 py-3">
                            {blocks.find((b) => b.id === section.block_id)
                              ?.block_name || "Unassigned"}
                          </td>
                          <td className="px-4 py-3">
                            {section.floor_number
                              ? `Floor ${section.floor_number}`
                              : "No floor"}
                          </td>
                          <td className="px-4 py-3">
                            {rooms.find((r) => r.id === section.room_id)
                              ?.room_number || "No room"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {section.total_students ?? 0}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => openEditSection(section)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-200 rounded text-xs"
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button
                              onClick={() => deleteSection(section)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {sectionView === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.length === 0 ? (
                  <div className="p-6 text-center col-span-full text-slate-400">
                    {loading
                      ? "Loading sections..."
                      : "No sections yet. Add one to begin."}
                  </div>
                ) : (
                  sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-white">
                            {section.section_name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {section.class?.class_name || "No class"} ·{" "}
                            {blocks.find((b) => b.id === section.block_id)
                              ?.block_name || "Unassigned"}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                          {section.total_students ?? 0}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        Room:{" "}
                        {rooms.find((r) => r.id === section.room_id)
                          ?.room_number || "No room"}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        Class Teacher:{" "}
                        <span className="text-indigo-300 font-medium">
                          {section.class_teacher_name || "Not assigned"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => openEditSection(section)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-200 rounded text-xs"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => deleteSection(section)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {sectionView === "floor" && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
                <div className="text-sm text-slate-300 mb-4">
                  Use the inline floor plan to assign sections by block, floor,
                  and room. Drag a section into a room card to update its
                  assignment.
                </div>

                {blocks.length === 0 ? (
                  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-slate-300">
                    No blocks configured yet.
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className="rounded-3xl p-4"
                        style={{
                          background: FLOOR_PLAN_DARK.cardBackground,
                          border: `1px solid ${FLOOR_PLAN_DARK.cardBorder}`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Block
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {block.block_name}
                            </div>
                          </div>
                          <span
                            className="rounded-full px-2 py-1 text-xs"
                            style={{
                              background: getBlockAccent(index),
                              color: FLOOR_PLAN_DARK.textPrimary,
                            }}
                          >
                            {Array.isArray(block.floors) &&
                            block.floors.length > 0
                              ? block.floors.length
                              : defaultFloors.length}{" "}
                            floors
                          </span>
                        </div>

                        <div className="grid gap-3">
                          {roomsByBlockFloor[block.id].floors.map((floor) => (
                            <div
                              key={`${block.id}-${floor}`}
                              className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-white">
                                  Floor {floor}
                                </div>
                                <span className="text-xs text-slate-400">
                                  Drop sections into rooms
                                </span>
                              </div>
                              <div className="grid gap-3 xl:grid-cols-2">
                                {(
                                  roomsByBlockFloor[block.id].roomsByFloor[
                                    floor
                                  ] || []
                                ).length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/70 p-4 text-sm text-slate-400">
                                    No rooms configured on this floor.
                                  </div>
                                ) : (
                                  (
                                    roomsByBlockFloor[block.id].roomsByFloor[
                                      floor
                                    ] || []
                                  ).map((room) => (
                                    <div
                                      key={room.id}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const sectionId =
                                          e.dataTransfer.getData("section/id");
                                        const section = sections.find(
                                          (item) =>
                                            String(item.id) ===
                                            String(sectionId),
                                        );
                                        if (section)
                                          moveSectionToRoom(section, room);
                                      }}
                                      className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-4 min-h-45"
                                    >
                                      <div className="flex items-center justify-between gap-3 mb-4">
                                        <div>
                                          <div className="text-base font-semibold text-white">
                                            {room.room_number || "Room"}
                                          </div>
                                          <div className="text-[11px] text-slate-400 mt-1">
                                            Capacity {room.total_capacity ?? 0}
                                          </div>
                                        </div>
                                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                                          {sectionsByRoom[room.id]?.length ?? 0}{" "}
                                          sections
                                        </span>
                                      </div>
                                      <div className="space-y-3">
                                        {(sectionsByRoom[room.id] || []).map(
                                          (section) => (
                                            <div
                                              key={section.id}
                                              draggable
                                              onDragStart={(e) => {
                                                setDraggingSectionId(
                                                  section.id,
                                                );
                                                e.dataTransfer.setData(
                                                  "section/id",
                                                  String(section.id),
                                                );
                                              }}
                                              onDragEnd={() =>
                                                setDraggingSectionId(null)
                                              }
                                              className={`rounded-2xl border border-slate-700/50 bg-slate-950 p-3 text-sm text-white cursor-grab ${draggingSectionId === section.id ? "ring-2 ring-emerald-500 bg-emerald-600/25" : ""}`}
                                            >
                                              <div className="font-semibold">
                                                {section.section_name}
                                              </div>
                                              <div className="text-[11px] text-slate-400 mt-1">
                                                {section.class?.class_name ||
                                                  "No class"}
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right-side placeholder removed per design — only left Sections panel is shown */}
        </div>
      )}

      <SettingsModal
        open={showClassModal}
        onClose={() => setShowClassModal(false)}
        title={classMode === "edit" ? "Edit Class" : "Create Class"}
        width="max-w-md"
      >
        <form onSubmit={saveClass} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Class name
            </label>
            <input
              required
              value={classForm.name}
              onChange={(e) =>
                setClassForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Total students
              </label>
              <input
                required
                type="number"
                min="0"
                value={classForm.total_capacity}
                onChange={(e) =>
                  setClassForm((prev) => ({
                    ...prev,
                    total_capacity: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Number of sections
              </label>
              <input
                required
                type="number"
                min="0"
                value={classForm.number_of_sections}
                onChange={(e) =>
                  setClassForm((prev) => ({
                    ...prev,
                    number_of_sections: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              {classMode === "edit" ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </SettingsModal>

      <SettingsModal
        open={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title={sectionMode === "edit" ? "Edit Section" : "Create Section"}
        subtitle="Assign a section to class, block, floor, and room."
        width="max-w-lg"
      >
        <form onSubmit={saveSection} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Class</label>
            <select
              required
              value={sectionForm.class_id}
              onChange={(e) =>
                setSectionForm((prev) => ({
                  ...prev,
                  class_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded"
            >
              <option value="">Select a class</option>
              {classrooms.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Section name
            </label>
            <input
              required
              value={sectionForm.section_name}
              onChange={(e) =>
                setSectionForm((prev) => ({
                  ...prev,
                  section_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Total students
              </label>
              <input
                type="number"
                min="0"
                value={sectionForm.total_students}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    total_students: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Class Teacher
              </label>
              <select
                value={sectionForm.class_teacher_id}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    class_teacher_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.employee_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Monitor</label>
            <input
              value={sectionForm.monitor_name}
              onChange={(e) =>
                setSectionForm((prev) => ({
                  ...prev,
                  monitor_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-slate-800 text-white rounded"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Block</label>
              <select
                value={sectionForm.block_id}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    block_id: e.target.value,
                    floor_number: "",
                    room_id: "",
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              >
                <option value="">Select block</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Floor</label>
              <select
                value={sectionForm.floor_number}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    floor_number: e.target.value,
                    room_id: "",
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
                disabled={!sectionForm.block_id}
              >
                <option value="">Select floor</option>
                {sectionFloorOptions.map((floor) => (
                  <option key={floor} value={floor}>{`Floor ${floor}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Room</label>
              <select
                value={sectionForm.room_id}
                onChange={(e) =>
                  setSectionForm((prev) => ({
                    ...prev,
                    room_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
                disabled={!sectionForm.block_id || !sectionForm.floor_number}
              >
                <option value="">Select room</option>
                {sectionRoomOptions.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_number || `Room ${room.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              {sectionMode === "edit" ? "Save Section" : "Create Section"}
            </Button>
          </div>
        </form>
      </SettingsModal>
    </div>
  );
};

export default Classrooms;
