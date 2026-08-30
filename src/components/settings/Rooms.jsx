import { useEffect, useMemo, useState } from "react";
import { roomsApi } from "../../api/roomsApi";
import Button from "../common/Button";
import { Plus, Edit, Trash2, LayoutGrid, List, Map } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";

const ROOM_TYPES = [
  "Classroom",
  "Computer Lab",
  "Science Lab",
  "Library",
  "Staff Room",
  "Office",
];

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

const getDefaultForm = (floorCount) => ({
  room_number: "",
  block_id: null,
  floor_number: null,
  room_type: "Classroom",
  total_capacity: 0,
});

const Rooms = () => {
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
  const [form, setForm] = useState(getDefaultForm(floorCount));
  const [editingRoom, setEditingRoom] = useState(null);

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

  const unassignedRooms = useMemo(
    () => rooms.filter((room) => !room.floor_number),
    [rooms],
  );

  const roomsByFloor = useMemo(() => {
    return floorOptions.reduce((acc, floor) => {
      acc[floor] = rooms.filter((room) => room.floor_number === floor);
      return acc;
    }, {});
  }, [rooms, floorOptions]);

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

    rooms.forEach((room) => {
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
  }, [blocks, rooms, floorCount]);

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
      className="rounded-2xl p-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-1)" }}
          >
            Rooms
          </h2>
          <p className="text-xs text-slate-400">{viewLabel[viewMode]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "list" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
            >
              <List size={14} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "grid" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("floor")}
              className={`px-3 py-2 text-xs inline-flex items-center gap-2 ${viewMode === "floor" ? "bg-indigo-600/40 text-white" : "text-slate-300"}`}
            >
              <Map size={14} /> Floor View
            </button>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="overflow-hidden rounded-lg border border-slate-700/60">
          {rooms.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              {loading
                ? "Loading rooms..."
                : "No rooms yet. Create a room to get started."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Room Number</th>
                  <th className="px-4 py-3 text-left">Block</th>
                  <th className="px-4 py-3 text-left">Floor</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Capacity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-4 py-3 font-medium text-white">
                      {room.room_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {blocks.find((block) => block.id === room.block_id)
                        ?.block_name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      {room.floor_number
                        ? `Floor ${room.floor_number}`
                        : "Unassigned"}
                    </td>
                    <td className="px-4 py-3">{room.room_type || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {room.total_capacity ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEdit(room)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-200 rounded"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        onClick={() => deleteRoom(room)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded"
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

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.length === 0 ? (
            <div className="p-6 text-center col-span-full text-slate-400">
              {loading
                ? "Loading rooms..."
                : "No rooms yet. Create a room to get started."}
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">
                      {room.room_number || "Room"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {blocks.find((block) => block.id === room.block_id)
                        ?.block_name || "Unassigned"}{" "}
                      ·{" "}
                      {room.floor_number
                        ? `Floor ${room.floor_number}`
                        : "Unassigned"}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                    {room.room_type || "Classroom"}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  Capacity: {room.total_capacity ?? 0}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(room)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-200 rounded text-xs"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => deleteRoom(room)}
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

      {viewMode === "floor" && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
          <div className="text-sm text-slate-300 mb-4">
            Use the inline floor plan to assign rooms by block and floor. Drag a
            room into a floor card to update its location, or drop it into
            Unassigned to clear it.
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-slate-300">
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
                        className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 min-h-40"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white">
                            Floor {floor}
                          </div>
                          <span className="text-xs text-slate-400">
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
                              className="rounded-2xl border border-slate-700/50 bg-slate-950 p-3 text-sm text-white cursor-grab"
                            >
                              <div className="font-semibold">
                                {room.room_number || "Room"}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {room.room_type || "Classroom"}
                              </div>
                              <div className="text-[11px] text-slate-400">
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
                      className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">
                          Unassigned Floor
                        </div>
                        <span className="text-xs text-slate-400">
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
                            className="rounded-2xl border border-slate-700/50 bg-slate-950 p-3 text-sm text-white cursor-grab"
                          >
                            <div className="font-semibold">
                              {room.room_number || "Room"}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {room.room_type || "Classroom"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Capacity: {room.total_capacity ?? 0}
                            </div>
                          </div>
                        ))}
                        {roomsByBlockFloor[block.id].unassigned.length ===
                          0 && (
                          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 p-4 text-sm text-slate-400">
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
      >
        <form onSubmit={saveRoom} className="p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
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
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
                placeholder={
                  floorOptions.length ? `${floorOptions[0]}01` : "101"
                }
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Block <span className="text-red-400">*</span>
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
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
              >
                <option value="">-- Select a Block --</option>
                {blockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name} ({block.floors?.length || 0} floors)
                  </option>
                ))}
              </select>
              {blockOptions.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Create blocks in School Profile first
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Floor <span className="text-red-400">*</span>
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
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded"
                >
                  <option value="">-- Select a Floor --</option>
                  {floorOptions.map((floor) => (
                    <option key={floor} value={floor}>
                      Floor {floor}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-slate-700/50 text-slate-400 rounded">
                  Select a block first
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
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
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
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
              <label className="block text-sm text-slate-300 mb-1">
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
                className="w-full px-3 py-2 bg-slate-800 text-white rounded"
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
