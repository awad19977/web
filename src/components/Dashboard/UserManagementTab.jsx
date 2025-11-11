"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_KEYS,
  FEATURE_LIST,
} from "@/constants/featureFlags";
import { useUserManagement } from "@/hooks/useUserManagement";
import useUser from "@/utils/useUser";
import {
  KeyRound,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

const cardBaseClasses =
  "rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white dark:bg-[#121212] p-5 shadow-sm shadow-gray-200/50 dark:shadow-none transition hover:shadow-md";

const feedbackStyles = {
  success:
    "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  error:
    "border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
};

function FeatureToggleButton({
  feature,
  enabled,
  onToggle,
  disabled,
  compact = false,
}) {
  const activeStyles =
    "border-emerald-400/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-400/10 dark:text-emerald-200";
  const inactiveStyles =
    "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-300 dark:hover:border-gray-600";

  const className = [
    "w-full rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
    compact ? "min-h-[52px]" : "min-h-[64px]",
    enabled ? activeStyles : inactiveStyles,
    disabled ? "cursor-not-allowed opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const statusClasses = enabled
    ? "text-emerald-600 dark:text-emerald-200"
    : "text-gray-500 dark:text-gray-400";

  return (
    <button
      type="button"
      className={className}
      onClick={() => onToggle(!enabled)}
      disabled={disabled}
      aria-pressed={enabled}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {feature.label}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${statusClasses}`}>
          {enabled ? "On" : "Off"}
        </span>
      </div>
      {!compact && feature.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {feature.description}
        </p>
      )}
    </button>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "neutral", disabled }) {
  const toneStyles = {
    neutral:
      "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
    primary:
      "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10",
    danger:
      "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10",
  };

  const className = [
    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
    toneStyles[tone] ?? toneStyles.neutral,
    disabled ? "cursor-not-allowed opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ModalShell({ title, description, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-xl dark:border-gray-800/70 dark:bg-[#121212]">
          <div className="flex items-start justify-between border-b border-gray-200/70 px-6 py-4 dark:border-gray-800/70">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
          <div className="px-6 py-5">
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 sm:pr-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSubmit,
  submitting,
  currentUserId,
}) {
  const isEdit = mode === "edit";
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [features, setFeatures] = useState(() => ({
    ...DEFAULT_FEATURE_FLAGS,
    ...(user?.features ?? {}),
  }));
  const [error, setError] = useState("");

  const enabledCount = useMemo(
    () =>
      FEATURE_LIST.reduce(
        (count, feature) => (features?.[feature.key] ? count + 1 : count),
        0,
      ),
    [features],
  );

  const handleToggleFeature = (featureKey, nextEnabled) => {
    setFeatures((prev) => ({
      ...prev,
      [featureKey]: nextEnabled,
    }));
  };

  const isSelf = user?.id === currentUserId;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (!isEdit && password.trim().length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        features,
      });
    } catch (submitError) {
      setError(submitError?.message ?? "Unable to save user");
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit User" : "Invite New User"}
      description={
        isEdit
          ? "Update profile details and fine-tune access for this account."
          : "Create a new account and assign the correct feature access from the start."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-100"
              placeholder="Ada Lovelace"
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-100"
              placeholder="team@example.com"
            />
          </label>
        </div>

        {!isEdit && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Temporary Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-100"
              placeholder="At least 8 characters"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Passwords can be changed later by the user; share this temporary value securely.
            </span>
          </label>
        )}

        <div className="rounded-xl border border-gray-200/70 bg-gray-50/60 p-4 dark:border-gray-800/60 dark:bg-[#181818]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Feature Access
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle the features this user can access. Enabled: {enabledCount}
              </p>
            </div>
            {isSelf && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your account
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {FEATURE_LIST.map((feature) => {
              const disabled =
                (isSelf && feature.key === FEATURE_KEYS.USERS && features[feature.key]) ||
                submitting;
              return (
                <FeatureToggleButton
                  key={feature.key}
                  feature={feature}
                  enabled={Boolean(features[feature.key])}
                  onToggle={(next) => handleToggleFeature(feature.key, next)}
                  disabled={disabled}
                />
              );
            })}
          </div>
          {isSelf && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
              You cannot remove your own user-management access while signed in.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create user"
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose, onSubmit, submitting }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password.trim() !== confirm.trim()) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await onSubmit({ password: password.trim() });
    } catch (submitError) {
      setError(submitError?.message ?? "Unable to reset password");
    }
  };

  return (
    <ModalShell
      title={`Reset password for ${user.name || user.email}`}
      description="Generate a new password and share it securely with the user."
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-100"
              autoFocus
              placeholder="At least 8 characters"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm password
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-[#161616] dark:text-gray-100"
              placeholder="Repeat the password"
            />
          </label>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          The user will be prompted to sign in with this new password. Encourage them to change it after logging in.
        </p>

        {error && (
          <div className="rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmDeleteModal({ user, onClose, onConfirm, submitting }) {
  return (
    <ModalShell
      title={`Remove ${user.name || user.email}?`}
      description="Deleting a user revokes all access immediately. Purchase and activity history linked to this user will remain."
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. Consider disabling access instead if you might need to restore this account later.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Delete user"
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function UserManagementTab() {
  const { user: currentUser } = useUser();
  const {
    users,
    usersLoading,
    usersError,
    updatePermission,
    updatePermissionLoading,
    createUser,
    createUserLoading,
    updateUser,
    updateUserLoading,
    deleteUser,
    deleteUserLoading,
    resetPassword,
    resetPasswordLoading,
  } = useUserManagement();

  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const handlePermissionToggle = (user, feature, nextEnabled) => {
    updatePermission(
      { userId: user.id, featureKey: feature.key, enabled: nextEnabled },
      {
        onSuccess: () => {
          setFeedback({
            type: "success",
            message: `${feature.label} ${nextEnabled ? "enabled" : "disabled"} for ${
              user.name || user.email
            }`,
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: error?.message ?? "Unable to update permission",
          });
        },
      },
    );
  };

  const handleCreateSubmit = async ({ name, email, password, features }) => {
    const result = await createUser({ name, email, password, features });
    setFeedback({
      type: "success",
      message: `Invited ${result.user.name || result.user.email}`,
    });
    setCreateOpen(false);
  };

  const handleEditSubmit = async ({ name, email, features }) => {
    if (!editingUser) return;
    const result = await updateUser({ userId: editingUser.id, data: { name, email, features } });
    setFeedback({
      type: "success",
      message: `Updated ${result.user.name || result.user.email}`,
    });
    setEditingUser(null);
  };

  const handleResetSubmit = async ({ password }) => {
    if (!resettingUser) return;
    await resetPassword({ userId: resettingUser.id, password });
    setFeedback({
      type: "success",
      message: `Password reset for ${resettingUser.name || resettingUser.email}`,
    });
    setResettingUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
    setFeedback({
      type: "success",
      message: `Removed ${deletingUser.name || deletingUser.email}`,
    });
    setDeletingUser(null);
  };

  const isLoadingAnyMutation =
    createUserLoading || updateUserLoading || deleteUserLoading || resetPasswordLoading;

  const renderSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`${cardBaseClasses} animate-pulse border-dashed bg-gray-50 dark:bg-[#161616]`}
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="h-12 rounded-xl bg-gray-200/70 dark:bg-gray-800" />
            <div className="h-12 rounded-xl bg-gray-200/70 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-700 dark:bg-[#121212]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        <UserPlus className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          No teammates yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Invite your first collaborator to start delegating dashboard access.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <UserPlus className="h-4 w-4" />
        Invite user
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Team & Access Control
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Invite teammates, manage feature access, reset credentials, and keep your workspace secure.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite user
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${feedbackStyles[feedback.type]}`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase tracking-wide"
          >
            Dismiss
          </button>
        </div>
      )}

      {usersLoading && renderSkeleton()}

      {usersError && !usersLoading && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-6 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          Unable to load users right now. Refresh the page or check your permissions.
        </div>
      )}

      {!usersLoading && !usersError && users.length === 0 && renderEmptyState()}

      {!usersLoading && !usersError && users.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => {
            const initials = (user.name || user.email || "?")
              .split(" ")
              .map((part) => part.charAt(0).toUpperCase())
              .slice(0, 2)
              .join("");
            const isSelf = currentUser?.id === user.id;
            const enabledCount = FEATURE_LIST.reduce(
              (count, feature) => (user.features?.[feature.key] ? count + 1 : count),
              0,
            );
            const isAdmin = Boolean(user.features?.[FEATURE_KEYS.USERS]);

            return (
              <article key={user.id} className={cardBaseClasses}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/90 to-emerald-600 text-lg font-semibold text-white shadow-sm dark:from-emerald-500 dark:to-emerald-600">
                      {initials || "?"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {user.name || user.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                            Admin
                          </span>
                        )}
                        {user.emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                            Pending verify
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {enabledCount} of {FEATURE_LIST.length} features enabled
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      onClick={() => setEditingUser(user)}
                      disabled={updateUserLoading || isLoadingAnyMutation}
                    />
                    <ActionButton
                      icon={KeyRound}
                      label="Reset password"
                      tone="primary"
                      onClick={() => setResettingUser(user)}
                      disabled={resetPasswordLoading || isLoadingAnyMutation}
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Remove"
                      tone="danger"
                      onClick={() => setDeletingUser(user)}
                      disabled={isSelf || deleteUserLoading || isLoadingAnyMutation}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Feature access
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FEATURE_LIST.map((feature) => {
                      const allowed = Boolean(user.features?.[feature.key]);
                      const disablingOwnAdmin =
                        isSelf && feature.key === FEATURE_KEYS.USERS && allowed;
                      return (
                        <FeatureToggleButton
                          key={feature.key}
                          feature={feature}
                          enabled={allowed}
                          onToggle={(next) => handlePermissionToggle(user, feature, next)}
                          disabled={updatePermissionLoading || disablingOwnAdmin}
                          compact
                        />
                      );
                    })}
                  </div>
                  {isSelf && (
                    <p className="text-xs text-amber-600 dark:text-amber-300">
                      Signed-in admins cannot remove their own management access.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {createOpen && (
        <UserFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          submitting={createUserLoading}
          currentUserId={currentUser?.id}
        />
      )}

      {editingUser && (
        <UserFormModal
          mode="edit"
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditSubmit}
          submitting={updateUserLoading}
          currentUserId={currentUser?.id}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSubmit={handleResetSubmit}
          submitting={resetPasswordLoading}
        />
      )}

      {deletingUser && (
        <ConfirmDeleteModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteConfirm}
          submitting={deleteUserLoading}
        />
      )}
    </div>
  );
}
