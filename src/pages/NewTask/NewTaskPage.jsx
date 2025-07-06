import { useState } from 'react';
import './NewTaskPage.css';

const completionOptions = [100, 200, 500, 1000, 2000, 5000, 10000];
const COST_PER_COMPLETION = 0.03; // Example cost in TON

const NewTaskPage = () => {
  const [completions, setCompletions] = useState(100);
  const estimatedCost = (completions * COST_PER_COMPLETION).toFixed(4);

  return (
    <div className="new-task-page">
      <div className="new-task-header">
        🚀
        <h2>Create a New Task</h2>
      </div>
      <form className="new-task-form">
        <div className="form-group">
          <label htmlFor="taskName">Task Name</label>
          <input type="text" id="taskName" placeholder="Join our Telegram" />
        </div>
        <div className="form-group">
          <label htmlFor="taskLink">Link to App/Channel/Group</label>
          <input type="text" id="taskLink" placeholder="https://t.me/example" />
        </div>
        <div className="form-group">
          <label>Number of Completions</label>
          <div className="completions-grid">
            {completionOptions.map(option => (
              <button
                key={option}
                type="button"
                className={completions === option ? 'active' : ''}
                onClick={() => setCompletions(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="estimated-cost">
          Estimated Cost: <span>{estimatedCost} TON</span>
        </div>
        <button type="submit" className="submit-btn">Connect Wallet</button>
      </form>
    </div>
  );
};

export default NewTaskPage;
