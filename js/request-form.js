(function () {
  "use strict";

  const form = document.getElementById("request-form");
  if (!form) return;

  const msgEl = document.getElementById("request-form-message");
  const submitBtn = form.querySelector('[type="submit"]');
  const email =
    (window.SITE_CONFIG && window.SITE_CONFIG.contactEmail) ||
    "pira.mida61ros@gmail.com";

  function showMessage(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.hidden = !text;
    msgEl.classList.remove("auth-msg-error", "auth-msg-success");
    if (text) msgEl.classList.add(type === "success" ? "auth-msg-success" : "auth-msg-error");
  }

  function setLoading(loading) {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Отправка…" : "Отправить заявку";
    }
  }

  function validate() {
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const userEmail = form.email.value.trim();

    if (!name || name.length < 2) {
      showMessage("Укажите имя (минимум 2 символа).", "error");
      return false;
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      showMessage("Укажите корректный номер телефона.", "error");
      return false;
    }
    if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      showMessage("Введите корректный email.", "error");
      return false;
    }
    if (!form.consent.checked) {
      showMessage("Подтвердите согласие на обработку данных.", "error");
      return false;
    }
    return true;
  }

  async function sendViaPhp(data) {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => body.append(key, value));

    const res = await fetch("send-request.php", {
      method: "POST",
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Ошибка отправки");
    }
    return json;
  }

  async function sendViaFormSubmit(data) {
    const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(email), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email || "не указан",
        project: data.project || "не указан",
        message: data.message || "—",
        _subject: "Новая заявка с сайта Пирамида",
        _template: "table",
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || "Ошибка отправки");
    }
    return json;
  }

  function prefillFromSession() {
    try {
      const raw = localStorage.getItem("piramida_session");
      if (!raw) return;
      const session = JSON.parse(raw);
      if (session.name && !form.name.value) form.name.value = session.name;
      if (session.email && !form.email.value) form.email.value = session.email;
    } catch {
      /* ignore */
    }
  }

  prefillFromSession();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("", "error");
    if (!validate()) return;

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      project: form.project.value.trim(),
      message: form.message.value.trim(),
    };

    setLoading(true);

    try {
      try {
        await sendViaPhp(data);
      } catch {
        await sendViaFormSubmit(data);
      }
      form.reset();
      prefillFromSession();
      showMessage("Заявка отправлена! Мы свяжемся с вами в ближайшее время.", "success");
      window.location.href = "thanks.html";
    } catch (err) {
      showMessage(
        err.message || "Не удалось отправить. Позвоните: +7 (928) 229-65-45",
        "error"
      );
    } finally {
      setLoading(false);
    }
  });
})();
