import axios from 'axios';

const todoAPI = axios.create({
  baseURL: process.env.API_URL
});
const templates = {
  loginForm: document.querySelector('#login-form').content,
  todoContent: document.querySelector('#todo-content').content,
  todoItem: document.querySelector('#todo-item').content,
}
const rootEl = document.querySelector('.root');

function render(fragment) {
  rootEl.textContent = '';
  rootEl.appendChild(fragment);
}

function deepCopyTemplate(templateNode) {
  return document.importNode(templateNode, true);
}

function login(token) {
  localStorage.setItem('token', token);

  todoAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
}
// 로그인
async function loginPage() {
  const fragment = deepCopyTemplate(templates.loginForm);
  fragment.querySelector('.login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    };
    const res = await todoAPI.post('/users/login', payload);
    login(res.data.token);
    todoContentPage();
  });
  render(fragment);
}

// 리스트 페이지
async function todoContentPage() {
  const fragment = deepCopyTemplate(templates.todoContent);
  const res = await todoAPI.get('/todos');
  res.data.forEach(todo => {
    const itemFragment = deepCopyTemplate(templates.todoItem);
    itemFragment.querySelector('.todo-item__body').textContent = todo.body;
    fragment.querySelector('.todo-list').appendChild(itemFragment);
  });
  fragment.querySelector('.todo-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      body: e.target.elements.body.value
    };
    const res = await todoAPI.post('/todos', payload);
    todoContentPage();
  });
  render(fragment);
}


if(localStorage.getItem('token')) {
  login(localStorage.getItem('token'));
  todoContentPage();
} else {
  loginPage();
}