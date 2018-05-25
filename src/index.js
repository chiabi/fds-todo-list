import axios from 'axios';

const todoAPI = axios.create({
  baseURL: process.env.API_URL
});
const templates = {
  loginForm: document.querySelector('#login-form').content,
  todoContent: document.querySelector('#todo-content').content,
  todoItem: document.querySelector('#todo-item').content,
  loading: document.querySelector('#loading').content,
}
const rootEl = document.querySelector('.root');

function render(fragment) {
  rootEl.textContent = '';
  rootEl.appendChild(fragment);
}

function deepCopyTemplate(templateNode) {
  return document.importNode(templateNode, true);
}

// 로그인
function login(token) {
  localStorage.setItem('token', token);

  todoAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
}

// 로그아웃
function logout() {
  localStorage.removeItem('token');

  delete todoAPI.defaults.headers['Authorization'];
}

// 로딩
async function loadingPage(parentEl) {
  const fragment = deepCopyTemplate(templates.loading);
  const parentElChildrenCopy = parentEl.cloneNode(true);
  parentEl.textContent = '';
  parentEl.appendChild(fragment);
  return parentElChildrenCopy;
}

// login, sign up 템플릿 같이 쓰려고 만든 함수
async function usersPage(postURL, title, moveToBtnText, pageFunc) {
  loadingPage(rootEl);
  const fragment = deepCopyTemplate(templates.loginForm);
  fragment.querySelector('.login-form__title').textContent= title;
  fragment.querySelector('.login-form__register-btn').textContent = moveToBtnText;
  fragment.querySelector('.login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value,
    };
    const backupChildren = loadingPage(document.querySelector('.login-form__submit-btn'));
    const res = await todoAPI.post(postURL, payload);
    login(res.data.token);
    todoContentPage();
  });
  fragment.querySelector('.login-form__register-btn').addEventListener('click', e => {
    e.preventDefault();
    pageFunc();
  });
  render(fragment);
}

// 로그인 페이지
async function loginPage() {
  usersPage('/users/login', 'Login', 'Sign up', signUpPage);
}

// 계정 등록 페이지
async function signUpPage() {
  usersPage('/users/register', 'Sign up', 'Login', loginPage);
}

// 리스트 페이지
async function todoContentPage() {
  const fragment = deepCopyTemplate(templates.todoContent);
  const res = await todoAPI.get('/todos');
  
  // 리스트 생성
  if(res.data == '') {
    fragment.querySelector('.todo-content').classList.add('todo-content--empty');
  } else {
    fragment.querySelector('.todo-content').classList.remove('todo-content--empty');
    res.data.forEach(todo => {
      todoContentItem(fragment, todo);
    });
  }

  // 추가 버튼
  fragment.querySelector('.todo-form').addEventListener('submit', e => {
    e.preventDefault();
    addTodoList(e.target);
  });

  // 완료 전체 삭제 버튼
  fragment.querySelector('.todo-content__complete-delete-btn').addEventListener('click', e => {
    e.preventDefault();
    deleteAllCompleteItems();
  });

  // 전체 삭제 버튼
  fragment.querySelector('.todo-content__delete-btn').addEventListener('click', e => {
    e.preventDefault();
    deleteAllItems();
  });

  // 로그아웃 
  fragment.querySelector('.todo-content__logout-btn').addEventListener('click', e => {
    logout();
    loginPage();
  })
  render(fragment);
}

// 리스트 추가
async function addTodoList(eTarget) {
  const payload = {
    body: eTarget.elements.body.value,
    complete: false
  };
  const res = await todoAPI.post('/todos', payload);
  todoContentPage();
}

// 완료 아이템 모두 삭제
async function deleteAllCompleteItems() {
  const res = await todoAPI.get('/todos?complete_ne=false');
  res.data.forEach(async completeTodo => {
    await todoAPI.delete(`/todos/${completeTodo.id}`);
    todoContentPage();
  });
}

// 아이템 모두 삭제
async function deleteAllItems() {
  const res = await todoAPI.get('/todos');
  res.data.forEach(async todo => {
    await todoAPI.delete(`/todos/${todo.id}`);
    todoContentPage();
  });
}

// 할일 각각 아이템
async function todoContentItem(parentNode, resTodo) {
  const itemFragment = deepCopyTemplate(templates.todoItem);
  const itemEl = itemFragment.querySelector('.todo-item');
  itemFragment.querySelector('.todo-item__body').textContent = resTodo.body;
  
  // 완료
  itemFragment.querySelector('.todo-item__complete-btn').addEventListener('click', async e => {
    e.preventDefault();
    const res = await todoAPI.patch(`/todos/${resTodo.id}`, {complete: true});
    todoContentPage();
  });
  
  // 삭제
  itemFragment.querySelector('.todo-item__delete-btn').addEventListener('click', async e => {
    e.preventDefault();
    const res = await todoAPI.delete(`/todos/${resTodo.id}`);
    todoContentPage();
  });

  if (resTodo.complete) {
    itemEl.classList.add('todo-item--complete');
    parentNode.querySelector('.todo-complete-list').appendChild(itemFragment);
  } else {
    parentNode.querySelector('.todo-list').appendChild(itemFragment);
  }
}

if(localStorage.getItem('token')) {
  login(localStorage.getItem('token'));
  todoContentPage();
} else {
  loginPage();
}