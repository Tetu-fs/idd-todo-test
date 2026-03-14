import { useEffect, useRef, useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  // hold timeout ids for scheduled deletions
  const timers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      Object.values(timers.current).forEach((t) => {
        if (t) clearTimeout(t as unknown as number);
      });
    };
  }, []);

  const addTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const t: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((s) => [t, ...s]);
    setTitle("");
  };

  const toggleComplete = (id: string) => {
    setTasks((current) => {
      const next = current.map((t) => {
        if (t.id !== id) return t;
        // toggling
        const becomingCompleted = !t.completed;
        if (becomingCompleted) {
          // schedule deletion in 5s
          const timeout = setTimeout(() => {
            setTasks((s) => s.filter((x) => x.id !== id));
            timers.current[id] = null;
          }, 5000);
          timers.current[id] = timeout;
        } else {
          // cancel scheduled deletion
          const maybe = timers.current[id];
          if (maybe) {
            clearTimeout(maybe as unknown as number);
            timers.current[id] = null;
          }
        }
        return { ...t, completed: becomingCompleted };
      });
      return next;
    });
  };

  return (
    <main className="container" style={{ maxWidth: 700, margin: "3rem auto" }}>
      <h1>TODO</h1>

      <section className="card">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="タイトルを入力"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            style={{ flex: 1 }}
          />
          <button onClick={addTask}>作成</button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        {tasks.length === 0 ? (
          <p>タスクはありません</p>
        ) : (
          <ul>
            {tasks.map((t) => (
              <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                <div style={{ flex: 1 }}>
                  <div>
                    {t.completed ? (
                      <del>{t.title}</del>
                    ) : (
                      <span>{t.title}</span>
                    )}
                  </div>
                  <small>作成: {new Date(t.createdAt).toLocaleString()}</small>
                </div>
                <div>
                  <button onClick={() => toggleComplete(t.id)}>{t.completed ? "取り消す" : "完了"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
