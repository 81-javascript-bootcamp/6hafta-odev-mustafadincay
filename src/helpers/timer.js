import { getTimeRemainingDate } from './date';

export const createTimer = ({
  context,
  intervalVariable,
  intervalEnd = 1000,
  deadline,
  $timerEl = '$timerEl',
  timerElContent,
  currentRemaining,
  onStop,
}) => {
  context[intervalVariable] = setInterval(() => {
    const remainingTime = getTimeRemainingDate(deadline);
    const { total, minutes, seconds } = remainingTime;
    if (currentRemaining) {
      context[currentRemaining] = total;
    }
    context[$timerEl].innerHTML = `${timerElContent}${minutes}:${seconds}`;

    if (total <= 0) {
      clearInterval(context[intervalVariable]);
      onStop();
    }
  }, intervalEnd);
};
