import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Shield,
  Settings,
  BookOpen,
  GraduationCap,
  Briefcase,
} from "lucide-react";

/**
 * Application modules — these ARE the permissions.
 * Each module has a set of granular actions.
 */
const APP_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    actions: ["view"],
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: ClipboardList,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "users",
    label: "Users",
    icon: Users,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "roles",
    label: "Roles",
    icon: Shield,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "teacher",
    label: "Teacher",
    icon: BookOpen,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "student",
    label: "Student",
    icon: GraduationCap,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "employee",
    label: "Employee",
    icon: Briefcase,
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    actions: ["view", "edit"],
  },
];

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

/**
 * PermissionSelector — uses modules as permissions.
 * selectedPermissions is an array of permission keys like ["dashboard.view", "calendar.view", "calendar.edit"]
 */
export const PermissionSelector = ({ selectedPermissions = [], onChange }) => {
  const togglePermission = (permKey) => {
    const newSelected = selectedPermissions.includes(permKey)
      ? selectedPermissions.filter((k) => k !== permKey)
      : [...selectedPermissions, permKey];
    onChange(newSelected);
  };

  const toggleModule = (moduleKey, actions) => {
    const modulePermKeys = actions.map((a) => `${moduleKey}.${a}`);
    const allSelected = modulePermKeys.every((k) =>
      selectedPermissions.includes(k),
    );

    let newSelected;
    if (allSelected) {
      // Deselect all for this module
      newSelected = selectedPermissions.filter(
        (k) => !modulePermKeys.includes(k),
      );
    } else {
      // Select all for this module
      const existing = new Set(selectedPermissions);
      modulePermKeys.forEach((k) => existing.add(k));
      newSelected = Array.from(existing);
    }
    onChange(newSelected);
  };

  const selectAll = () => {
    const allKeys = APP_MODULES.flatMap((m) =>
      m.actions.map((a) => `${m.key}.${a}`),
    );
    onChange(allKeys);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-200 text-sm">
          Module Permissions
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            Select All
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-slate-300 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {APP_MODULES.map((mod) => {
          const Icon = mod.icon;
          const modulePermKeys = mod.actions.map((a) => `${mod.key}.${a}`);
          const selectedCount = modulePermKeys.filter((k) =>
            selectedPermissions.includes(k),
          ).length;
          const allSelected = selectedCount === modulePermKeys.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <div
              key={mod.key}
              className="border border-slate-600/50 rounded-lg bg-slate-800/40 overflow-hidden"
            >
              {/* Module header */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => toggleModule(mod.key, mod.actions)}
                  className="w-4 h-4 rounded accent-indigo-500"
                />
                <Icon size={15} className="text-indigo-400" />
                <span className="text-sm font-medium text-white flex-1">
                  {mod.label}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedCount}/{modulePermKeys.length}
                </span>
              </div>

              {/* Action checkboxes */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 pl-11">
                {mod.actions.map((action) => {
                  const permKey = `${mod.key}.${action}`;
                  const isChecked = selectedPermissions.includes(permKey);

                  return (
                    <label
                      key={permKey}
                      className="flex items-center gap-1.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(permKey)}
                        className="w-3.5 h-3.5 rounded accent-indigo-500"
                      />
                      <span
                        className={`text-xs transition ${
                          isChecked
                            ? "text-slate-200"
                            : "text-slate-500 group-hover:text-slate-400"
                        }`}
                      >
                        {ACTION_LABELS[action] || action}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
