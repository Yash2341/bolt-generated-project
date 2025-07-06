import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../contexts/AppContext';
import './EarnPage.css';
import { FaArrowRight, FaCheck } from 'react-icons/fa';
import { RiCopperDiamondLine } from 'react-icons/ri';

const claimSocialTask = async (claimData) => {
  const tg = window.Telegram.WebApp;
  const response = await fetch(`/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...claimData, userId: tg.initDataUnsafe?.user?.id, claimType: 'social' }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to claim');
  }
  return response.json();
};

const SocialTaskItem = ({ task, onClaim }) => {
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
          onClaim(task.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <li className={`social-task-item ${task.completed ? 'completed' : ''}`}>
      <div className="social-task-icon"><FaArrowRight /></div>
      <div className="social-task-info">
        <h4>{task.name}</h4>
        <div className="social-task-reward">
          <RiCopperDiamondLine color="var(--gem-color)" />
          <span>{task.reward} GEM</span>
        </div>
      </div>
      <button onClick={handleSocialClick} disabled={task.completed || isClicked}>
        {task.completed ? 'Claimed' : isClicked ? `${timer}s` : <FaArrowRight />}
      </button>
    </li>
  );
};

const EarnPage = ({ data }) => {
  const { showToast } = useApp();
  const queryClient = useQueryClient();
  const tg = window.Telegram.WebApp;

  const claimMutation = useMutation({
    mutationFn: claimSocialTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['initialData', tg.initDataUnsafe?.user?.id]);
      showToast('Task reward claimed!');
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`);
    },
  });

  const handleClaim = (taskId) => {
    claimMutation.mutate({ taskId });
  };

  const uncompletedTasks = data.socialTasks.filter(t => !t.completed);
  const completedTasks = data.socialTasks.filter(t => t.completed);

  return (
    <div className="earn-page">
      <section>
        <h2>Social Tasks</h2>
        <p>Complete social tasks and get rewards.</p>
        <ul className="social-task-list">
          {uncompletedTasks.map(task => (
            <SocialTaskItem key={task.id} task={task} onClaim={handleClaim} />
          ))}
        </ul>
      </section>

      {completedTasks.length > 0 && (
        <section className="completed-tasks-section">
          <h2>Completed Tasks</h2>
          <p>You've already earned rewards from these tasks.</p>
          <ul className="social-task-list">
            {completedTasks.map(task => (
              <li key={task.id} className="social-task-item completed">
                <div className="social-task-icon completed-icon"><FaCheck /></div>
                <div className="social-task-info">
                  <h4>{task.name}</h4>
                  <div className="social-task-reward">
                    <RiCopperDiamondLine color="var(--gem-color)" />
                    <span>{task.reward} GEM</span>
                  </div>
                </div>
                <button className="claimed-btn" disabled>Claimed</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EarnPage;
