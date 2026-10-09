import { useEffect, useMemo, useRef, useState } from "react";
import { roomsApi } from "../../api/roomsApi";
import Button from "../common/Button";
import { Plus, Edit, Trash2, LayoutGrid, List, Map } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";
import RecordTableToolbar from "../common/RecordTableToolbar";
import CsvImportControls from "../common/CsvImportControls";
import CsvExportButton from "../common/CsvExportButton";
import { downloadRecordCsv, parseRecordCsv } from "../../utils/recordCsv";

const ROOM_TYPES = [
  "Classroom",
  "Computer Lab",
  "Science Lab",
  "Library",
  "Staff Room",
  "Office",
];

const FLOOR_PLAN_DARK = {
  cardBackground: "var(--accent-soft)",
  cardBorder: "var(--accent)",
  blockAccents: ["var(--accent)", "var(--accent)", "var(--danger)", "var(--success-text)"],
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--accent)",
  textMuted: "var(--accent)",
};

const getBlockAccent = (index) =>
  FLOOR_PLAN_DARK.blockAccents[index % FLOOR_PLAN_DARK.blockAccents.length];

const getDefaultForm = (floorCount) => ({
  room_number: "",
  block_id: null,
  floor_number: null,
  room_type: "Classroom",
  total_capacity: 0,
});

const Rooms = () => {
  const layoutRef = useRef(null);
  const { settings } = useSettings();
  const school = settings?.school_profile || {};
  const floorCount = useMemo(
    () => Math.max(1, parseInt(school?.total_floors || 1, 10) || 1),
    [school?.total_floors],
  );
  const blocks = useMemo(() => school?.blocks || [], [school?.blocks]);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState([
    "room_number", "block", "floor", "type", "capacity",
  ]);
  const [form, setForm] = useState(getDefaultForm(floorCount));
  const [editingRoom, setEditingRoom] = useState(null);
  const isEditingRoom = showModal && editingRoom !== null;
  const editPanelStyle = useSettingsInlinePanelLayout(isEditingRoom, layoutRef);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === form.block_id) || null,
    [blocks, form.block_id],
  );

  const blockOptions = useMemo(() => blocks, [blocks]);

  const floorOptions = useMemo(() => {
    if (
      selectedBlock &&
      Array.isArray(selectedBlock.floors) &&
      selectedBlock.floors.length > 0
    ) {
      return [...selectedBlock.floors].sort((a, b) => a - b);
    }
    return Array.from({ length: floorCount }, (_, index) => index + 1);
  }, [selectedBlock, floorCount]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const text = `${room.room_number || ""} ${room.room_type || ""} ${
          blocks.find((block) => String(block.id) === String(room.block_id))
            ?.block_name || ""
        }`.toLowerCase();
        return (
          text.includes(searchTerm.toLowerCase()) &&
          (typeFilter === "all" || room.room_type === typeFilter) &&
          (assignmentFilter === "all" ||
            (assignmentFilter === "assigned"
              ? Boolean(room.floor_number)
              : !room.floor_number))
        );
      }),
    [rooms, blocks, searchTerm, typeFilter, assignmentFilter],
  );
  const unassignedRooms = useMemo(
    () => filteredRooms.filter((room) => !room.floor_number),
    [filteredRooms],
  );

  const roomsByFloor = useMemo(() => {
    return floorOptions.reduce((acc, floor) => {
      acc[floor] = filteredRooms.filter((room) => room.floor_number === floor);
      return acc;
    }, {});
  }, [filteredRooms, floorOptions]);

  const roomsByBlockFloor = useMemo(() => {
    const grouping = {};

    blocks.forEach((block) => {
      const blockFloors =
        Array.isArray(block.floors) && block.floors.length
          ? [...block.floors].sort((a, b) => a - b)
          : Array.from({ length: floorCount }, (_, index) => index + 1);

      grouping[block.id] = {
        floors: blockFloors,
        roomsByFloor: blockFloors.reduce((acc, floor) => {
          acc[floor] = [];
          return acc;
        }, {}),
        unassigned: [],
      };
    });

    filteredRooms.forEach((room) => {
      const group = room.block_id ? grouping[room.block_id] : null;
      if (group) {
        if (room.floor_number && group.roomsByFloor[room.floor_number]) {
          group.roomsByFloor[room.floor_number].push(room);
        } else {
          group.unassigned.push(room);
        }
      }
    });

    return grouping;
  }, [blocks, filteredRooms, floorCount]);

  const roomColumns = [
    { key: "room_number", label: "Room number" },
    { key: "block", label: "Block" },
    { key: "floor", label: "Floor" },
    { key: "type", label: "Type" },
    { key: "capacity", label: "Capacity" },
  ];
  const toggleRoomColumn = (key) =>
    setVisibleColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  const importRoomsCsv = async (file) => {
    try {
      const rows = parseRecordCsv(await file.text());
      let imported = 0;
      const failures = [];
      const seenRoomNumbers = new Set(rooms.map((room) => String(room.room_number).toLowerCase()));
      for (const row of rows) {
        const values = row.values;
        const roomNumber = values.room_number?.trim();
        if (!roomNumber) {
          failures.push(`Row ${row.rowNumber}: room_number is required.`);
          continue;
        }
        if (seenRoomNumbers.has(roomNumber.toLowerCase())) {
          failures.push(`Row ${row.rowNumber}: room ${roomNumber} already exists.`);
          continue;
        }
        const block = values.block_id
          ? blocks.find((item) => String(item.id) === values.block_id)
          : null;
        if (values.block_id && !block) {
          failures.push(`Row ${row.rowNumber}: block_id does not exist.`);
          continue;
        }
        const floor = values.floor_number ? Number(values.floor_number) : null;
        const capacity = Number(values.total_capacity || 0);
        const validFloors =
          block && Array.isArray(block.floors) && block.floors.length
            ? block.floors
            : Array.from({ length: floorCount }, (_, index) => index + 1);
        if ((floor !== null && (!Number.isInteger(floor) || !validFloors.includes(floor))) || !Number.isFinite(capacity) || capacity < 0) {
          failures.push(`Row ${row.rowNumber}: floor_number or total_capacity is invalid.`);
          continue;
        }
        try {
          await roomsApi.createRoom({
            room_number: roomNumber,
            block_id: block?.id || null,
            floor_number: floor,
            room_type: values.room_type || "Classroom",
            total_capacity: capacity,
          });
          seenRoomNumbers.add(roomNumber.toLowerCase());
          imported += 1;
        } catch (err) {
          failures.push(`Row ${row.rowNumber}: ${err.response?.data?.message || err.message || "creation failed"}`);
        }
      }
      if (imported) await loadRooms();
      if (failures.length) toast.error(`${imported} rooms imported; ${failures.length} row(s) failed. ${failures[0]}`);
      else toast.success(`${imported} rooms imported.`);
    } catch (err) {
      toast.error(err.message || "Could not read this CSV file.");
    }
  };
  const exportRoomsCsv = () =>
    downloadRecordCsv(
      "rooms.csv",
      [
        { label: "room_number", value: (room) => room.room_number },
        { label: "block_id", value: (room) => room.block_id },
        { label: "floor_number", value: (room) => room.floor_number },
        { label: "room_type", value: (room) => room.room_type },
        { label: "total_capacity", value: (room) => room.total_capacity },
      ],
      filteredRooms,
    );

  const viewLabel = {
    list: "List View",
    grid: "Grid View",
    floor: "Floor View",
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!showModal) {
      setForm(getDefaultForm(floorCount));
      setEditingRoom(null);
    }
  }, [showModal, floorCount]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await roomsApi.getRooms();
      setRooms(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRoom(null);
    setForm({
      ...getDefaultForm(floorCount),
      block_id: null,
      floor_number: null,
    });
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      room_number: room.room_number || "",
      block_id: room.block_id || null,
      floor_number: room.floor_number ?? null,
      room_type: room.room_type || "Classroom",
      total_capacity: room.total_capacity || 0,
    });
    setShowModal(true);
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const payload = {
        room_number: String(form.room_number || "").trim(),
        block_id: form.block_id || null,
        floor_number: form.floor_number || null,
        room_type: String(form.room_type || "Classroom").trim(),
        total_capacity: Number(form.total_capacity || 0),
      };

      if (!payload.room_number) {
        toast.error("Room number is required");
        return;
      }

      if (editingRoom) {
        await roomsApi.updateRoom(editingRoom.id, payload);
        toast.success("Room updated successfully");
      } else {
        await roomsApi.createRoom(payload);
        toast.success("Room created successfully");
      }

      setShowModal(false);
      await loadRooms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (room) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      setLoading(true);
      await roomsApi.deleteRoom(room.id);
      toast.success("Room deleted");
      await loadRooms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={layoutRef}
      data-settings-screen="rooms"
      className={`entity-admin-page relative min-w-0 rounded-2xl p-4 ${isEditingRoom ? "is-editing flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible max-md:h-auto max-md:min-h-0" : "flex h-full min-h-0 w-full flex-col"}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className={`w-full min-w-0 ${isEditingRoom ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2
            className="text-[28px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Rooms
          </h2>
          <p className="mt-1 text-sm text-muted">{viewLabel[viewMode]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CsvImportControls onImport={importRoomsCsv} entityLabel="rooms" disabled={loading} />
          <div className="flex items-center bg-subtle border border-default rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "list" ? "bg-accent text-primary" : "text-muted"}`}
            >
              <List size={14} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "grid" ? "bg-accent text-primary" : "text-muted"}`}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("floor")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "floor" ? "bg-accent text-primary" : "text-muted"}`}
            >
              <Map size={14} /> Floor View
            </button>
          </div>
          <button
            onClick={openCreate}
            className="settings-admin-create-button bg-accent text-primary transition hover:bg-accent"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      <RecordTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search rooms..."
        columns={roomColumns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleRoomColumn}
        filterContent={
          <>
            <label className="grid gap-1 text-sm text-slate-300">Room type
              <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All room types</option>{ROOM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-300">Floor assignment
              <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)}>
                <option value="all">All rooms</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option>
              </select>
            </label>
          </>
        }
        views={[
          { label: "All rooms", onSelect: () => { setTypeFilter("all"); setAssignmentFilter("all"); } },
          ...ROOM_TYPES.map((type) => ({ label: `${type} rooms`, onSelect: () => setTypeFilter(type) })),
          { label: "Unassigned rooms", onSelect: () => setAssignmentFilter("unassigned") },
        ]}
        recordCount={filteredRooms.length}
        rightContent={<CsvExportButton onExport={exportRoomsCsv} entityLabel="rooms" disabled={!rooms.length} />}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
      {viewMode === "list" && (
        <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default ${isEditingRoom ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
          {filteredRooms.length === 0 ? (
            <div className="p-6 text-center text-muted">
              {loading
                ? "Loading rooms..."
                : "No rooms yet. Create a room to get started."}
            </div>
          ) : (
            <table className="w-full min-w-0 table-fixed text-sm">
              <thead className="bg-subtle border-b">
                <tr>
                  <th className={`px-4 py-3 text-left ${!visibleColumns.includes("room_number") ? "hidden" : ""}`}>Room Number</th>
                  <th className={`px-4 py-3 text-left ${!visibleColumns.includes("block") ? "hidden" : ""}`}>Block</th>
                  <th className={`px-4 py-3 text-left ${!visibleColumns.includes("floor") ? "hidden" : ""}`}>Floor</th>
                  <th className={`px-4 py-3 text-left ${!visibleColumns.includes("type") ? "hidden" : ""}`}>Type</th>
                  <th className={`px-4 py-3 text-right ${!visibleColumns.includes("capacity") ? "hidden" : ""}`}>Capacity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td className={`px-4 py-3 font-medium text-primary ${!visibleColumns.includes("room_number") ? "hidden" : ""}`}>
                      {room.room_number || "—"}
                    </td>
                    <td className={`px-4 py-3 ${!visibleColumns.includes("block") ? "hidden" : ""}`}>
                      {blocks.find((block) => block.id === room.block_id)
                        ?.block_name || "Unassigned"}
                    </td>
                    <td className={`px-4 py-3 ${!visibleColumns.includes("floor") ? "hidden" : ""}`}>
                      {room.floor_number
                        ? `Floor ${room.floor_number}`
                        : "Unassigned"}
                    </td>
                    <td className={`px-4 py-3 ${!visibleColumns.includes("type") ? "hidden" : ""}`}>{room.room_type || "—"}</td>
                    <td className={`px-4 py-3 text-right ${!visibleColumns.includes("capacity") ? "hidden" : ""}`}>
                      {room.total_capacity ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(room)}
                        className="rounded p-2 text-accent transition hover:bg-accent-soft hover:text-accent"
                        title={`Edit room ${room.room_number || ""}`}
                        aria-label={`Edit room ${room.room_number || ""}`}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => deleteRoom(room)}
                        className="rounded p-2 text-danger transition hover:bg-danger-soft hover:text-danger"
                        title={`Delete room ${room.room_number || ""}`}
                        aria-label={`Delete room ${room.room_number || ""}`}
                      >
                        <Trash2 size={15} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewMode === "grid" && (
        <div className={`entity-admin-list h-full min-w-0 ${isEditingRoom ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"} grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
          {filteredRooms.length === 0 ? (
            <div className="p-6 text-center col-span-full text-muted">
              {loading
                ? "Loading rooms..."
                : "No rooms yet. Create a room to get started."}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-default bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-primary">
                      {room.room_number || "Room"}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {blocks.find((block) => block.id === room.block_id)
                        ?.block_name || "Unassigned"}{" "}
                      ·{" "}
                      {room.floor_number
                        ? `Floor ${room.floor_number}`
                        : "Unassigned"}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent-soft text-accent">
                    {room.room_type || "Classroom"}
                  </span>
                </div>
                <div className="mt-3 text-sm text-muted">
                  Capacity: {room.total_capacity ?? 0}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(room)}
                    className="rounded p-2 text-accent transition hover:bg-accent-soft hover:text-accent"
                    title={`Edit room ${room.room_number || ""}`}
                    aria-label={`Edit room ${room.room_number || ""}`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteRoom(room)}
                    className="rounded p-2 text-danger transition hover:bg-danger-soft hover:text-danger"
                    title={`Delete room ${room.room_number || ""}`}
                    aria-label={`Delete room ${room.room_number || ""}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === "floor" && (
        <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default bg-surface p-4 ${isEditingRoom ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
          <div className="text-sm text-muted mb-4">
            Use the inline floor plan to assign rooms by block and floor. Drag a
            room into a floor card to update its location, or drop it into
            Unassigned to clear it.
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-2xl border border-default bg-surface p-6 text-muted">
              No blocks configured yet. Create room assignments in List or Grid
              view until School Profile blocks are available.
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
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">
                        Block
                      </div>
                      <div className="text-lg font-semibold text-primary">
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
                      {Array.isArray(block.floors) && block.floors.length > 0
                        ? block.floors.length
                        : floorCount}{" "}
                      floors
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {roomsByBlockFloor[block.id].floors.map((floor) => (
                      <div
                        key={`${block.id}-${floor}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const roomId = e.dataTransfer.getData("text/plain");
                          if (!roomId) return;
                          try {
                            setLoading(true);
                            await roomsApi.updateRoom(roomId, {
                              block_id: block.id,
                              floor_number: floor,
                            });
                            await loadRooms();
                            toast.success(
                              `Assigned room to ${block.block_name} floor ${floor}`,
                            );
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to assign room");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="rounded-2xl border border-default bg-subtle p-4 min-h-40"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-primary">
                            Floor {floor}
                          </div>
                          <span className="text-xs text-muted">
                            Drop rooms here
                          </span>
                        </div>
                        <div className="space-y-3">
                          {(
                            roomsByBlockFloor[block.id].roomsByFloor[floor] ||
                            []
                          ).map((room) => (
                            <div
                              key={room.id}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData(
                                  "text/plain",
                                  String(room.id),
                                )
                              }
                              className="rounded-2xl border border-default bg-surface p-3 text-sm text-primary cursor-grab"
                            >
                              <div className="font-semibold">
                                {room.room_number || "Room"}
                              </div>
                              <div className="text-[11px] text-muted mt-1">
                                {room.room_type || "Classroom"}
                              </div>
                              <div className="text-[11px] text-muted">
                                Capacity: {room.total_capacity ?? 0}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const roomId = e.dataTransfer.getData("text/plain");
                        if (!roomId) return;
                        try {
                          setLoading(true);
                          await roomsApi.updateRoom(roomId, {
                            block_id: block.id,
                            floor_number: null,
                          });
                          await loadRooms();
                          toast.success(
                            `Assigned room to ${block.block_name} without a floor`,
                          );
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to assign room");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="rounded-2xl border border-default bg-subtle p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-primary">
                          Unassigned Floor
                        </div>
                        <span className="text-xs text-muted">
                          Drop here
                        </span>
                      </div>
                      <div className="space-y-3">
                        {roomsByBlockFloor[block.id].unassigned.map((room) => (
                          <div
                            key={room.id}
                            draggable
                            onDragStart={(e) =>
                              e.dataTransfer.setData(
                                "text/plain",
                                String(room.id),
                              )
                            }
                            className="rounded-2xl border border-default bg-surface p-3 text-sm text-primary cursor-grab"
                          >
                            <div className="font-semibold">
                              {room.room_number || "Room"}
                            </div>
                            <div className="text-[11px] text-muted mt-1">
                              {room.room_type || "Classroom"}
                            </div>
                            <div className="text-[11px] text-muted">
                              Capacity: {room.total_capacity ?? 0}
                            </div>
                          </div>
                        ))}
                        {roomsByBlockFloor[block.id].unassigned.length ===
                          0 && (
                          <div className="rounded-2xl border border-default bg-surface p-4 text-sm text-muted">
                            No unassigned rooms in this block.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      </div>
      </div>
      <SettingsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? "Edit Room" : "Create Room"}
        subtitle={
          editingRoom
            ? "Update the room settings."
            : "Add a new physical room to the school."
        }
        width="max-w-lg"
        inlinePanel={isEditingRoom}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-default shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header min-h-11 items-center px-5 py-2"
        inlinePanelBodyClassName="entity-edit-body px-5 py-4"
      >
        <form onSubmit={saveRoom} className="space-y-4 p-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-muted mb-1">
                Room Number
              </label>
              <input
                required
                value={form.room_number}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    room_number: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-subtle text-primary rounded"
                placeholder={
                  floorOptions.length ? `${floorOptions[0]}01` : "101"
                }
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">
                Block <span className="text-danger">*</span>
              </label>
              <select
                required
                value={form.block_id ?? ""}
                onChange={(event) => {
                  const blockId = event.target.value
                    ? Number(event.target.value)
                    : null;
                  setForm((prev) => ({
                    ...prev,
                    block_id: blockId,
                    floor_number: null,
                  }));
                }}
                className="w-full px-3 py-2 bg-subtle text-primary rounded"
              >
                <option value="">-- Select a Block --</option>
                {blockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name} ({block.floors?.length || 0} floors)
                  </option>
                ))}
              </select>
              {blockOptions.length === 0 && (
                <p className="text-xs text-warning mt-1">
                  Create blocks in School Profile first
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-muted mb-1">
                Floor <span className="text-danger">*</span>
              </label>
              {form.block_id ? (
                <select
                  required
                  value={form.floor_number ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      floor_number: value ? Number(value) : null,
                    }));
                  }}
                  className="w-full px-3 py-2 bg-subtle text-primary rounded"
                >
                  <option value="">-- Select a Floor --</option>
                  {floorOptions.map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-subtle text-muted rounded">
                  Select a block first
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">
                Room Type
              </label>
              <select
                value={form.room_type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    room_type: event.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-subtle text-primary rounded"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-muted mb-1">
                Maximum Capacity
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.total_capacity}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    total_capacity: Number(value || 0),
                  }));
                }}
                className="w-full px-3 py-2 bg-subtle text-primary rounded"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {editingRoom ? "Update Room" : "Create Room"}
            </Button>
          </div>
        </form>
      </SettingsModal>
    </div>
  );
};

export default Rooms;
