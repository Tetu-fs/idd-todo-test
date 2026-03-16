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
  // hold timeout ids for scheduled deletions (numbers in DOM)
  const timers = useRef<Record<string, number | null>>({});

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      Object.values(timers.current).forEach((t) => {
        if (t) window.clearTimeout(t);
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

  // toggle completion flag only; timer scheduling/cancellation is handled
  // by an effect that watches `tasks` to avoid side effects inside updater
  const toggleComplete = (id: string) => {
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  // watch tasks and schedule/cancel timers outside of state updaters
  useEffect(() => {
    const ids = new Set(tasks.map((t) => t.id));

    // schedule timers for newly completed tasks, cancel for tasks uncompleted
    tasks.forEach((t) => {
      if (t.completed) {
        if (!timers.current[t.id]) {
          const timeoutId = window.setTimeout(() => {
            setTasks((s) => s.filter((x) => x.id !== t.id));
            timers.current[t.id] = null;
          }, 5000);
          timers.current[t.id] = timeoutId;
        }
      } else {
        const maybe = timers.current[t.id];
        if (maybe) {
          window.clearTimeout(maybe);
          timers.current[t.id] = null;
        }
      }
    });

    // clear timers for tasks that were removed
    Object.keys(timers.current).forEach((key) => {
      if (!ids.has(key) && timers.current[key]) {
        window.clearTimeout(timers.current[key] as number);
        timers.current[key] = null;
      }
    });
  }, [tasks]);

  return (
    <main className="container">
      <h1>TODO</h1>

      <section className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <input
            type="text"
            aria-label="タスクのタイトル"
            placeholder="タイトルを入力"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit">作成</button>
        </form>
      </section>

      <section>
        {tasks.length === 0 ? (
          <p>タスクはありません</p>
        ) : (
          <>
            {tasks.map((t) => (
              <article key={t.id}>
                <div>
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
                  <button onClick={() => toggleComplete(t.id)}>
                    {t.completed ? "取り消す" : "完了"}
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
