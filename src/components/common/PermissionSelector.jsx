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
const ACTION_ORDER = ["view", "create", "edit", "delete"];

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
    <div className="permission-selector space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">
          Module Permissions
        </h3>
        <div className="flex items-center gap-2 rounded-lg border border-default bg-surface px-3 py-1.5">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-accent transition hover:opacity-80"
          >
            Select All
          </button>
          <span aria-hidden="true" className="h-4 border-l border-default" />
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-muted transition hover:text-primary"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {APP_MODULES.map((mod) => {
          const Icon = mod.icon;
          const actions = ACTION_ORDER.filter((action) =>
            mod.actions.includes(action),
          );
          const modulePermKeys = actions.map((a) => `${mod.key}.${a}`);
          const selectedCount = modulePermKeys.filter((k) =>
            selectedPermissions.includes(k),
          ).length;
          const allSelected = selectedCount === modulePermKeys.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <div
              key={mod.key}
              className="permission-module-card overflow-hidden rounded-xl border border-default bg-surface transition-colors hover:border-accent/60"
            >
              <div className="flex flex-col items-center gap-2 border-b border-default bg-subtle px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Icon size={17} aria-hidden="true" className="shrink-0 text-accent" />
                  <span className="text-sm font-semibold text-primary">
                    {mod.label}
                  </span>
                </div>
                <label className="permission-module-select inline-flex cursor-pointer items-center gap-2 rounded-lg border border-default bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/60 hover:text-primary">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={() => toggleModule(mod.key, actions)}
                    aria-label={`Select all ${mod.label} permissions`}
                    className="permission-checkbox h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                  />
                  <span>Select module</span>
                  <span className="rounded-full bg-selected px-1.5 py-0.5 text-[11px] text-muted">
                    {selectedCount}/{modulePermKeys.length}
                  </span>
                </label>
              </div>

              <div
                className="permission-action-list grid gap-2 p-3"
                style={{
                  gridTemplateColumns:
                    actions.length === 1
                      ? "minmax(120px, 160px)"
                      : `repeat(${actions.length}, minmax(0, 1fr))`,
                }}
              >
                {actions.map((action) => {
                  const permKey = `${mod.key}.${action}`;
                  const isChecked = selectedPermissions.includes(permKey);

                  return (
                    <label
                      key={permKey}
                      className={`permission-action-option flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-2 transition-colors ${
                        isChecked
                          ? "border-accent/60 bg-selected text-primary"
                          : "border-default bg-surface text-muted hover:border-accent/50 hover:bg-selected hover:text-primary"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(permKey)}
                        aria-label={`${ACTION_LABELS[action]} ${mod.label}`}
                        className="permission-checkbox h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                      />
                      <span className="truncate text-xs font-medium">
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
