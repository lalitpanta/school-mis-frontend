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
  Blocks,
} from "lucide-react";
import { AVAILABLE_MODULES } from "../../utils/constants";

/**
 * Application modules — these ARE the permissions.
 * Each module has a set of granular actions.
 */
const SETTINGS_MODULES = new Set([
  "school",
  "academic",
  "calendarSettings",
  "notices",
  "integrations",
  "devices",
  "backup",
  "activityLog",
  "activeSessions",
  "security",
  "departments",
  "classrooms",
  "courses",
  "rooms",
  "students",
  "theme",
  "profile",
]);

const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  attendance: ClipboardList,
  users: Users,
  roles: Shield,
  teacher: BookOpen,
  student: GraduationCap,
  employee: Briefcase,
  settings: Settings,
};

const SETTINGS_CONFIG_MODULES = new Set([
  "settings",
  "school",
  "academic",
  "calendarSettings",
  "theme",
  "profile",
  "security",
  "integrations",
  "devices",
  "backup",
  "activityLog",
  "activeSessions",
]);

const APP_MODULES = AVAILABLE_MODULES.map(({ key, label }) => {
  const permissionKey = SETTINGS_MODULES.has(key) ? `settings.${key}` : key;
  const Icon = MODULE_ICONS[key] || Blocks;

  return {
    key: permissionKey,
    label,
    icon: Icon,
    actions:
      key === "dashboard"
        ? ["view"]
        : SETTINGS_CONFIG_MODULES.has(key)
          ? ["view", "edit"]
          : ["view", "create", "edit", "delete"],
  };
});

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
        <h3 className="font-medium text-primary text-sm">
          Module Permissions
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-accent hover:text-accent transition"
          >
            Select All
          </button>
          <span className="text-muted">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted hover:text-muted transition"
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
              className="border border-default rounded-lg bg-subtle overflow-hidden"
            >
              {/* Module header */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-subtle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => toggleModule(mod.key, mod.actions)}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <Icon size={15} className="text-accent" />
                <span className="text-sm font-medium text-primary flex-1">
                  {mod.label}
                </span>
                <span className="text-xs text-muted">
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
                        className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                      />
                      <span
                        className={`text-xs transition ${
                          isChecked
                            ? "text-primary"
                            : "text-muted group-hover:text-muted"
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
