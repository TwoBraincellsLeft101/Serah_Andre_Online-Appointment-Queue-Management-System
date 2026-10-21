/**
 * AppView.js - VIEW (MVC)
 *
 * Owns everything to do with the page: finding DOM elements, reading what the user typed,
 * drawing results and showing messages. It holds NO business rules and NO application data.
 *
 * Two kinds of method:
 *   bindXxx(handler)  - tells the page "when this event happens, call the handler the
 *                       Controller gave me" (this is where addEventListener lives).
 *   renderXxx / showXxx - draw something the Controller asked for.
 */

/**
 * Build a DOM element. Text is added as text (never innerHTML), so anything a user types,
 * e.g. "<b>", is shown as plain text and cannot run as code.
 */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  el.append(...children);
  return el;
}

const statusClass = (status) => 's-' + status.toLowerCase().replace(/\s+/g, '-');

const formatDateTime = (dateTime) =>
  new Date(dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

class AppView {
  #toastTimer;

  constructor() {
    const $ = (id) => document.getElementById(id);

    // Forms and inputs
    this.registerForm = $('register-form');
    this.bookForm = $('book-form');
    this.lookupForm = $('lookup-form');
    this.nameInput = $('reg-name');
    this.emailInput = $('reg-email');
    this.phoneInput = $('reg-phone');
    this.bookEmailInput = $('book-email');
    this.serviceSelect = $('book-service');
    this.dateTimeInput = $('book-datetime');
    this.lookupEmailInput = $('lookup-email');
    this.searchInput = $('queue-search');

    // Buttons and output areas
    this.callNextButton = $('call-next-btn');
    this.resetButton = $('reset-data');
    this.serviceList = $('service-list');
    this.myAppointments = $('my-appointments');
    this.servingControls = $('serving-controls');
    this.queueBody = $('queue-body');
    this.toast = $('toast');
    this.staffName = $('staff-name');
    this.board = {
      number: $('now-serving-number'),
      detail: $('now-serving-detail'),
      waiting: $('waiting-count'),
      completed: $('completed-count'),
      last: $('last-number')
    };
  }

  // ----------------------------------------------------------------
  // Binding: connect page events to Controller handlers (callbacks)
  // ----------------------------------------------------------------
  bindRegister(handler) {
    this.registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handler({ name: this.nameInput.value, email: this.emailInput.value, phone: this.phoneInput.value });
    });
  }

  bindBook(handler) {
    this.bookForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handler({
        email: this.bookEmailInput.value,
        serviceId: this.serviceSelect.value,
        dateTime: this.dateTimeInput.value
      });
    });
  }

  bindLookup(handler) {
    this.lookupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handler(this.lookupEmailInput.value);
    });
  }

  /** Cancel buttons are created later, so ONE listener on the container handles them all (event delegation). */
  bindCancel(handler) {
    this.myAppointments.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="cancel"]');
      if (button) handler(Number(button.dataset.id));
    });
  }

  /** Same delegation idea for the Completed / No-show buttons on the staff desk. */
  bindStatusChange(handler) {
    this.servingControls.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-status]');
      if (button) handler(Number(button.dataset.id), button.dataset.status);
    });
  }

  bindCallNext(handler) {
    this.callNextButton.addEventListener('click', () => handler());
  }

  bindSearch(handler) {
    this.searchInput.addEventListener('input', (event) => handler(event.target.value));
  }

  bindReset(handler) {
    this.resetButton.addEventListener('click', () => handler());
  }

  // ----------------------------------------------------------------
  // Rendering: draw what the Controller gives us
  // ----------------------------------------------------------------
  setStaff(name, role) {
    this.staffName.textContent = `${name} (${role})`;
  }

  /** @param {ServiceType[]} services */
  renderServices(services) {
    this.serviceList.replaceChildren(
      ...services.map(s => h('li', {},
        h('span', {}, s.serviceName),
        h('span', { class: 'mins' }, `${s.estimatedDuration} min`)
      ))
    );
    this.serviceSelect.replaceChildren(
      h('option', { value: '' }, 'Choose a service'),
      ...services.map(s => h('option', { value: String(s.serviceId) }, `${s.serviceName} (${s.estimatedDuration} min)`))
    );
  }

  /**
   * @param {Appointment|null} serving  who is being served now
   * @param {{waiting:number, completed:number, lastNumber:number}} stats
   */
  renderBoard(serving, stats) {
    if (serving) {
      this.board.number.textContent = `#${serving.queueNumber}`;
      this.board.number.classList.remove('idle');
      this.board.detail.textContent = `${serving.customer.getName()} · ${serving.serviceType.serviceName}`;
    } else {
      this.board.number.textContent = '–';
      this.board.number.classList.add('idle');
      this.board.detail.textContent = 'Nobody is being served yet.';
    }
    this.board.waiting.textContent = stats.waiting;
    this.board.completed.textContent = stats.completed;
    this.board.last.textContent = stats.lastNumber;
  }

  /**
   * @param {Appointment[]} appointments  rows to show
   * @param {boolean} isFiltered          true when a search is active (changes the empty message)
   */
  renderQueue(appointments, isFiltered = false) {
    if (appointments.length === 0) {
      const text = isFiltered ? 'No appointments match your search.' : 'No appointments booked yet.';
      this.queueBody.replaceChildren(h('tr', {}, h('td', { colspan: '5', class: 'empty' }, text)));
      return;
    }

    this.queueBody.replaceChildren(...appointments.map(a => {
      const status = a.getStatus();
      const rowClass = status === 'Now Serving' ? 'serving' : a.isActive() ? '' : 'finished';
      return h('tr', { class: rowClass },
        h('td', { class: 'num' }, `#${a.queueNumber}`),
        h('td', {}, a.customer.getName()),
        h('td', {}, a.serviceType.serviceName),
        h('td', {}, formatDateTime(a.dateTime)),
        h('td', {}, h('span', { class: `badge ${statusClass(status)}` }, status))
      );
    }));
  }

  /** @param {Appointment|null} serving */
  renderServingControls(serving) {
    if (!serving) {
      this.servingControls.replaceChildren(h('p', { class: 'empty' }, 'No customer is being served. Press "Call next customer".'));
      return;
    }
    const id = String(serving.appointmentId);
    this.servingControls.replaceChildren(
      h('div', { class: 'serving-now' },
        h('p', {}, h('strong', {}, `#${serving.queueNumber} ${serving.customer.getName()}`), ` – ${serving.serviceType.serviceName}`),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn small good', 'data-id': id, 'data-status': 'Completed' }, 'Mark completed'),
          h('button', { type: 'button', class: 'btn small danger', 'data-id': id, 'data-status': 'No-show' }, 'Mark no-show')
        )
      )
    );
  }

  /** @param {Appointment[]} appointments  one customer's appointments */
  renderMyAppointments(appointments) {
    this.myAppointments.replaceChildren(...appointments.map(a => {
      const status = a.getStatus();
      return h('div', { class: 'appt' },
        h('div', { class: 'appt-top' },
          h('span', { class: 'appt-number' }, `Queue #${a.queueNumber}`),
          h('span', { class: `badge ${statusClass(status)}` }, status)
        ),
        h('p', {}, a.serviceType.serviceName),
        h('p', {}, formatDateTime(a.dateTime)),
        a.isWaiting()
          ? h('button', { type: 'button', class: 'btn small danger', 'data-action': 'cancel', 'data-id': String(a.appointmentId) }, 'Cancel appointment')
          : ''
      );
    }));
  }

  /** Replace the "My appointments" area with a plain hint, e.g. "No account found." */
  showMyAppointmentsHint(text) {
    this.myAppointments.replaceChildren(h('p', { class: 'empty' }, text));
  }

  // ----------------------------------------------------------------
  // Messages and form helpers
  // ----------------------------------------------------------------
  /** Short notification at the bottom of the screen. type: "success" | "error" | "info" */
  showMessage(message, type = 'info') {
    this.toast.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.hidden = false;
    clearTimeout(this.#toastTimer);
    // Callback: runs once, 4.5 seconds later, to hide the message again.
    this.#toastTimer = setTimeout(() => { this.toast.hidden = true; }, 4500);
  }

  clearRegisterForm() {
    this.registerForm.reset();
  }

  /** Reset the booking form but keep the customer's email for their next booking. */
  clearBookForm(email) {
    this.bookForm.reset();
    this.bookEmailInput.value = email;
  }

  /** Fill the email boxes (booking + lookup) so the customer does not retype it. */
  setEmail(email) {
    this.bookEmailInput.value = email;
    this.lookupEmailInput.value = email;
  }

  clearAllInputs() {
    this.bookForm.reset();
    this.lookupForm.reset();
    this.searchInput.value = '';
  }

  /** Stop people choosing a date in the past. */
  setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    this.dateTimeInput.min = now.toISOString().slice(0, 16);
  }

  confirm(question) {
    return window.confirm(question);
  }
}
