import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './TaskList.css';

const fetchTasks = async (userId) => {
  const res = await fetch(`/api/tasks?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
};

const claimTask = async ({ userId, taskId, taskType }) => {
  const res = await fetch(`/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, taskId, taskType }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to claim task');
  }
  return res.json();
};

const TaskItem = ({ task, userId, onClaim }) => {
  const [timer, setTimer] = useState(0);
  const [isClicked, setIsClicked] = useState(false);

  const handleSocialClick = () => {
    if (task.completed) return;
    window.open(task.url, '_blank');
    setIsClicked(true);
    setTimer(10);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const canClaimSocial = isClicked && timer === 0 && !task.completed;

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-info">
        <img src={task.icon} alt="" className="task-icon" />
        <div>
          <h4>{task.name}</h4>
          <p>+ {task.reward} Gems</p>
        </div>
      </div>
      {task.type === 'daily' && (
        <button onClick={() => onClaim(task.id, 'daily')} disabled={task.completed}>
          {task.completed ? 'Claimed' : 'Claim'}
        </button>
      )}
      {task.type === 'social' && (
        <>
          {task.completed ? (
            <button disabled>Completed</button>
          ) : canClaimSocial ? (
            <button onClick={() => onClaim(task.id, 'social')} className="claim-btn">Claim</button>
          ) : (
            <button onClick={handleSocialClick} disabled={isClicked && timer > 0}>
              {isClicked && timer > 0 ? `Wait ${timer}s` : 'Go'}
            </button>
          )}
        </>
      )}
    </li>
  );
};

const TaskList = ({ user }) => {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => fetchTasks(user.id),
    enabled: !!user?.id,
  });

  const claimMutation = useMutation({
    mutationFn: claimTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', user.id]);
      queryClient.invalidateQueries(['user', user.id]);
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const handleClaim = (taskId, taskType) => {
    claimMutation.mutate({ userId: user.id, taskId, taskType });
  };

  if (isLoading) return <p>Loading tasks...</p>;
  if (error) return <p>Error loading tasks: {error.message}</p>;

  const dailyTasks = tasks?.filter(t => t.type === 'daily') || [];
  const socialTasks = tasks?.filter(t => t.type === 'social') || [];

  return (
    <div className="task-container">
      <section className="task-section">
        <h3>Daily Tasks</h3>
        <ul className="task-list">
          {dailyTasks.map(task => (
            <TaskItem key={task.id} task={task} userId={user.id} onClaim={handleClaim} />
          ))}
        </ul>
      </section>
      <section className="task-section">
        <h3>Social Tasks</h3>
        <ul className="task-list">
          {socialTasks.map(task => (
            <TaskItem key={task.id} task={task} userId={user.id} onClaim={handleClaim} />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TaskList;
