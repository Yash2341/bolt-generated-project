import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../contexts/AppContext';
import './HomePage.css';
import { FaRegCheckCircle, FaArrowRight } from 'react-icons/fa';
import { RiCopperDiamondLine } from 'react-icons/ri';

const claimReward = async (claimData) => {
  const tg = window.Telegram.WebApp;
  const response = await fetch(`/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...claimData, userId: tg.initDataUnsafe?.user?.id }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to claim');
  }
  return response.json();
};

const HomePage = ({ data }) => {
  const { showToast } = useApp();
  const queryClient = useQueryClient();
  const tg = window.Telegram.WebApp;

  const claimMutation = useMutation({
    mutationFn: claimReward,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['initialData', tg.initDataUnsafe?.user?.id]);
      const message = variables.claimType === 'daily_checkin' ? 'Daily reward claimed!' : 'Update reward claimed!';
      showToast(message);
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`);
    },
  });

  const handleClaim = (claimType, taskId = null) => {
    claimMutation.mutate({ claimType, taskId });
  };

  return (
    <div className="home-page">
      <section className="tasks-section">
        <h2>Daily Tasks</h2>
        <p>Complete tasks & claim daily rewards!</p>
        <ul className="task-list">
          <li className="task-item">
            <div className="task-details">
              <div className="task-icon-wrapper"><FaRegCheckCircle /></div>
              <span>Daily Check-In</span>
            </div>
            <button
              className={`task-button ${data.dailyTasks.checkIn.claimed ? 'claimed' : 'claim'}`}
              onClick={() => handleClaim('daily_checkin')}
              disabled={data.dailyTasks.checkIn.claimed}
            >
              {data.dailyTasks.checkIn.claimed ? 'Claimed' : 'Claim'}
            </button>
          </li>
          <li className="task-item">
            <div className="task-details">
              <div className="task-icon-wrapper refresh"><FaArrowRight /></div>
              <span>Check for Updates</span>
            </div>
            <button
              className="task-button update"
              onClick={() => handleClaim('update_check')}
              disabled={data.dailyTasks.updateCheck.claimed}
            >
              {data.dailyTasks.updateCheck.claimed ? <FaRegCheckCircle /> : <FaArrowRight />}
            </button>
          </li>
        </ul>
      </section>

      <section className="milestone-section">
        <h2>Milestone Rewards</h2>
        <ul className="milestone-list">
          {data.milestones.map(milestone => (
            <li key={milestone.id} className="milestone-item">
              <div className="milestone-info">
                <span>{milestone.name}</span>
                <div className="milestone-reward">
                  <RiCopperDiamondLine color="var(--gem-color)" />
                  <span>{new Intl.NumberFormat().format(milestone.reward)} GEM</span>
                </div>
              </div>
              <div className="milestone-progress">
                <div className="progress-bar-background">
                  <div
                    className="progress-bar-foreground"
                    style={{ width: `${(data.user.referral_count / milestone.required) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-text">{Math.min(data.user.referral_count, milestone.required)}/{milestone.required}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default HomePage;
