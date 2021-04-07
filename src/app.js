import {
  getDataFromApi,
  addTaskToApi,
  completeTaskOnApi,
  removeTaskToApi,
} from './data';
import { POMODORO_BREAK, POMODORO_WORK } from './constans';
import { getNow, addMinutesToDate, getTimeRemainingDate } from './helpers/date';
import { createTimer } from './helpers/timer';

class PomodoroApp {
  constructor(options) {
    let {
      tableTbodySelector,
      taskFormSelector,
      startButtonSelector,
      timerSelector,
      pauseButtonSelector,
    } = options;
    this.data = [];
    this.$tableTbody = document.querySelector(tableTbodySelector);
    this.$taskForm = document.querySelector(taskFormSelector);
    this.$taskFormInput = this.$taskForm.querySelector('input');
    this.$addTaskButton = this.$taskForm.querySelector('button');
    this.$startButton = document.querySelector(startButtonSelector);
    this.$pauseButton = document.querySelector(pauseButtonSelector);
    this.$timerEl = document.querySelector(timerSelector);
    this.currentInterval = null;
    this.currentRemaining = null;
    this.currentTask = null;
    this.breakInterval = null;
  }

  fillTasksTable() {
    getDataFromApi().then((currentTasks) => {
      this.data = currentTasks;
      currentTasks.forEach((task, index) => {
        this.addTaskToTable(task, index + 1);
      });
    });
  }

  addTaskToTable(task, index) {
    const $newTaskEl = document.createElement('tr');
    $newTaskEl.innerHTML = `<th scope="row">${task.id}</th><td>${task.title}
    </td><td><button type="click" class="deleteBtn">
    <i class="fa fa-trash"></i></button></td></div>`;
    $newTaskEl.setAttribute('data-taskId', `task${task.id}`);
    if (task.completed) {
      $newTaskEl.classList.add('completed');
    }
    this.$tableTbody.appendChild($newTaskEl);
    this.$taskFormInput.value = '';
    let delBtnAtt = $newTaskEl.lastChild.firstChild;
    delBtnAtt.addEventListener('click', (e) => {
      $newTaskEl.remove();
      this.deleteTask(task.id);
    });
  }

  handleAddTask() {
    this.$taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { title: this.$taskFormInput.value, completed: false };
      this.addTask(task);
    });
  }

  addTask(task) {
    this.$addTaskButton.textContent = 'adding...';
    this.$addTaskButton.disabled = true;
    this.$taskFormInput.placeholder = 'adding...';
    this.$taskFormInput.value = 'ekleniyor';
    this.$taskFormInput.disabled = true;
    addTaskToApi(task)
      .then((data) => data.json())
      .then((newTask) => {
        this.addTaskToTable(newTask);
        this.$addTaskButton.disabled = false;
        this.$addTaskButton.textContent = 'Add Task';
        this.$taskFormInput.disabled = false;
        this.$taskFormInput.placeholder = 'Task Title';
      });
  }

  deleteTask(id) {
    removeTaskToApi(id)
      .then((id) => id)
      .catch((err) => alert(err));
  }

  handleStart() {
    this.$startButton.addEventListener('click', () => {
      // check if continues to current task or start a new task
      if (this.currentRemaining) {
        this.continueTask();
      } else {
        this.setActiveTask();
      }
    });
  }

  continueTask() {
    const now = getNow();
    const nowTimestamp = now.getTime();
    const remainingDeadline = new Date(nowTimestamp + this.currentRemaining);
    this.initializeTimer(remainingDeadline);
  }

  setActiveTask() {
    this.handlePreviousTask();
    this.currentTask = this.data.find((task) => !task.completed);
    if (this.currentTask) {
      this.startTask();
    } else {
      this.handleEnd();
    }
  }

  handlePreviousTask() {
    const $currentActiveEl = document.querySelector('tr-active');
    if ($currentActiveEl) {
      $currentActiveEl.classList.remove('active');
      $currentActiveEl.classList.add('completed');
    }
  }

  initializeTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'currentInterval',
      deadline,
      timerElContent: `You're working: `,
      onStop: () => {
        const now = getNow();
        const breakDeadline = addMinutesToDate(now, POMODORO_BREAK);
        this.initializeBreakTimer(breakDeadline);
      },
      currentRemaining: 'currentRemaining',
    });
  }

  initializeBreakTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'breakInterval',
      deadline: deadline,
      timerElContent: 'Chill: ',
      onStop: () => {
        completeTaskOnApi(this.currentTask).then(() => {
          this.currentTask.completed = true;
          this.setActiveTask();
        });
      },
    });
  }

  startTask() {
    const $currentActiveEl = document.querySelector(
      `tr[data-taskId = 'task${this.currentTask.id}']`
    );
    $currentActiveEl.classList.add('active');
    const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK);
    this.initializeTimer(newDeadline);
  }

  handleEnd() {
    clearInterval(this.currentInterval);
    clearInterval(this.breakInterval);
    this.$timerEl.innerHTML = 'All tasks are done🎉';
  }

  handlePause() {
    this.$pauseButton.addEventListener('click', () => {
      clearInterval(this.currentInterval);
    });
  }

  init() {
    this.fillTasksTable();
    this.handleAddTask();
    this.handleStart();
    this.handlePause();
  }
}

export default PomodoroApp;
