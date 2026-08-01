import React, { useEffect, useMemo, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/tasks";

const FILTERS = [
  { key: "all", label: "all" },
  { key: "pending", label: "pending" },
  { key: "in-progress", label: "in progress" },
  { key: "completed", label: "completed" },
];

const STATUS_CYCLE = {
  pending: "in-progress",
  "in-progress": "completed",
  completed: "pending",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function apiRequest(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new Error(body.message || "Request failed");
  }
  return body;
}

function QuickAdd({ onCreate }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({ title: trimmed, priority });
      setTitle("");
      setPriority("medium");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-add">
      <div className="quick-add-row">
        <span className="prompt-glyph">&gt;</span>
        <input
          type="text"
          placeholder="add a task, press enter to save"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="quick-add-footer">
        <div className="priority-picker">
          {["low", "medium", "high"].map((level) => (
            <button
              key={level}
              type="button"
              className="priority-chip"
              data-level={level}
              data-active={priority === level}
              onClick={() => setPriority(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="submit-btn"
          disabled={!title.trim() || submitting}
          onClick={submit}
        >
          {submitting ? "adding…" : "add task"}
        </button>
      </div>
    </div>
  );
}

function EditForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description, priority });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
      />
      <textarea
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="edit-form-footer">
        <div className="priority-picker">
          {["low", "medium", "high"].map((level) => (
            <button
              key={level}
              type="button"
              className="priority-chip"
              data-level={level}
              data-active={priority === level}
              onClick={() => setPriority(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="edit-actions">
          <button type="button" className="text-btn" onClick={onCancel}>
            cancel
          </button>
          <button
            type="button"
            className="submit-btn"
            disabled={!title.trim() || saving}
            onClick={save}
          >
            {saving ? "saving…" : "save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onCycleStatus, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="task-card">
        <EditForm
          task={task}
          onCancel={() => setEditing(false)}
          onSave={async (updates) => {
            await onUpdate(task._id, updates);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="task-card">
      <button
        type="button"
        className="status-ring"
        data-status={task.status}
        title={`Status: ${task.status} — click to change`}
        onClick={() => onCycleStatus(task)}
      />
      <div className="task-body">
        <div className="task-title-row">
          <p className="task-title" data-done={task.status === "completed"}>
            {task.title}
          </p>
        </div>
        {task.description ? <p className="task-desc">{task.description}</p> : null}
        <div className="task-meta">
          <span className="priority-pill" data-level={task.priority}>
            <span className="swatch" />
            {task.priority}
          </span>
          <span className="task-time">{timeAgo(task.createdAt)}</span>
        </div>
      </div>
      <div className="task-actions">
        <button type="button" className="icon-btn" title="Edit" onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className="icon-btn danger"
          title="Delete"
          onClick={() => onDelete(task._id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const body = await apiRequest(API_BASE);
      setTasks(body.data);
    } catch (err) {
      setError(err.message || "Could not reach the task server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreate = async ({ title, priority }) => {
    try {
      const body = await apiRequest(API_BASE, {
        method: "POST",
        body: JSON.stringify({ title, priority }),
      });
      setTasks((prev) => [body.data, ...prev]);
    } catch (err) {
      setError(err.message || "Could not add the task.");
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const body = await apiRequest(`${API_BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setTasks((prev) => prev.map((t) => (t._id === id ? body.data : t)));
    } catch (err) {
      setError(err.message || "Could not update the task.");
    }
  };

  const handleCycleStatus = (task) => {
    handleUpdate(task._id, { status: STATUS_CYCLE[task.status] });
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`${API_BASE}/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message || "Could not delete the task.");
    }
  };

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { pending: 0, "in-progress": 0, completed: 0 }
    );
  }, [tasks]);

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">node · express · mongodb</p>
        <div className="title-row">
          <h1 className="title">
            tasks<span className="title-cursor">_</span>
          </h1>
        </div>
        <div className="stats-line">
          <span>
            <strong>{counts.pending}</strong> pending
          </span>
          <span className="dot-sep">·</span>
          <span>
            <strong>{counts["in-progress"]}</strong> in progress
          </span>
          <span className="dot-sep">·</span>
          <span>
            <strong>{counts.completed}</strong> done
          </span>
        </div>
      </header>

      {error ? <div className="banner error">{error}</div> : null}

      <QuickAdd onCreate={handleCreate} />

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="filter-tab"
            data-active={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <p>loading tasks…</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="glyph">·</div>
          <p>
            {filter === "all"
              ? "No tasks yet. Add one above to get started."
              : `No ${filter.replace("-", " ")} tasks.`}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onCycleStatus={handleCycleStatus}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <p className="footer-note">click the ring to cycle status · pending → in progress → done</p>
    </div>
  );
}
