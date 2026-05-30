(function () {
  "use strict";

  const USERS_KEY = "piramida_users";
  const SESSION_KEY = "piramida_session";

  function getUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      if (!session || (!session.email && !session.name)) return null;
      return session;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ email: user.email, name: user.name })
    );
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const data = enc.encode(salt + password);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function randomSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  function showMessage(el, message, type) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
    el.classList.remove("auth-msg-error", "auth-msg-success");
    if (message) el.classList.add(type === "success" ? "auth-msg-success" : "auth-msg-error");
  }

  function updateHeaderAuth() {
    const guest = document.getElementById("auth-guest");
    const user = document.getElementById("auth-user");
    if (!guest || !user) return;

    const session = getSession();
    if (session) {
      guest.hidden = true;
      user.hidden = false;
    } else {
      localStorage.removeItem(SESSION_KEY);
      guest.hidden = false;
      user.hidden = true;
    }
  }

  function requireAuth() {
    if (!getSession()) {
      const next = encodeURIComponent(
        window.location.pathname.split("/").pop() || "cabinet.html"
      );
      window.location.href = "login.html?next=" + next;
      return false;
    }
    return true;
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && /^[a-z0-9._-]+\.html$/i.test(decodeURIComponent(next))) {
      window.location.href = decodeURIComponent(next);
    } else {
      window.location.href = "cabinet.html";
    }
  }

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "index.html";
    });
  });

  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    if (getSession()) {
      redirectAfterLogin();
      return;
    }

    const msg = document.getElementById("auth-message");
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage(msg, "", "error");

      const email = normalizeEmail(formLogin.email.value);
      const password = formLogin.password.value;

      if (!email || !password) {
        showMessage(msg, "Заполните email и пароль.", "error");
        return;
      }

      const user = getUsers().find((u) => u.email === email);
      if (!user) {
        showMessage(msg, "Аккаунт не найден. Зарегистрируйтесь.", "error");
        return;
      }

      const hash = await hashPassword(password, user.salt);
      if (hash !== user.passwordHash) {
        showMessage(msg, "Неверный пароль.", "error");
        return;
      }

      setSession(user);
      redirectAfterLogin();
    });
  }

  const formRegister = document.getElementById("form-register");
  if (formRegister) {
    if (getSession()) {
      window.location.href = "cabinet.html";
      return;
    }

    const msg = document.getElementById("auth-message");
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage(msg, "", "error");

      const name = formRegister.name.value.trim();
      const email = normalizeEmail(formRegister.email.value);
      const password = formRegister.password.value;
      const password2 = formRegister.passwordConfirm.value;

      if (!name || name.length < 2) {
        showMessage(msg, "Укажите имя (минимум 2 символа).", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(msg, "Введите корректный email.", "error");
        return;
      }
      if (password.length < 6) {
        showMessage(msg, "Пароль — минимум 6 символов.", "error");
        return;
      }
      if (password !== password2) {
        showMessage(msg, "Пароли не совпадают.", "error");
        return;
      }

      const users = getUsers();
      if (users.some((u) => u.email === email)) {
        showMessage(msg, "Этот email уже занят. Войдите в аккаунт.", "error");
        return;
      }

      const salt = randomSalt();
      const passwordHash = await hashPassword(password, salt);
      const user = {
        name,
        email,
        salt,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      saveUsers(users);
      setSession(user);
      window.location.href = "cabinet.html";
    });
  }

  const cabinetName = document.getElementById("cabinet-name");
  const cabinetEmail = document.getElementById("cabinet-email");
  if (cabinetName || cabinetEmail) {
    if (!requireAuth()) return;
    const session = getSession();
    if (cabinetName) cabinetName.textContent = session.name;
    if (cabinetEmail) cabinetEmail.textContent = session.email;
  }

  updateHeaderAuth();
})();
