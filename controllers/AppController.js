/**
 * AppController.js - CONTROLLER (MVC)
 *
 * The coordinator. It never touches the page (the View does that) and holds no business
 * rules (the Model does that). Every user action follows the same flow:
 *
 *   View event -> Controller handler -> Model method -> Controller gets result -> View shows it
 *
 * If the Model refuses something it throws an Error; the handler catches it and asks the
 * View to show the message.
 */
class AppController {
  #viewedEmail = '';   // whose appointments are shown in "My appointments"
  #searchText = '';    // what is typed in the queue search box

  /**
   * @param {CustomerRegistry} registry   Model: all customers
   * @param {QueueManager} queue          Model: the Singleton queue
   * @param {Staff} staff                 Model: the staff member using the desk
   * @param {ServiceType[]} services      Model: services on offer
   * @param {AppView} view                View
   */
  constructor(registry, queue, staff, services, view) {
    this.registry = registry;
    this.queue = queue;
    this.staff = staff;
    this.services = services;
    this.view = view;

    // Register callbacks. Both styles are used on purpose:
    //  - a named handler made with .bind(this) so "this" still means the Controller
    //  - a short arrow function that calls the handler
    this.view.bindRegister(this.handleRegister.bind(this));
    this.view.bindBook((data) => this.handleBook(data));
    this.view.bindLookup((email) => this.handleLookup(email));
    this.view.bindCancel((appointmentId) => this.handleCancel(appointmentId));
    this.view.bindCallNext(() => this.handleCallNext());
    this.view.bindStatusChange((appointmentId, status) => this.handleUpdateStatus(appointmentId, status));
    this.view.bindSearch((text) => this.handleSearch(text));
    this.view.bindReset(() => this.handleReset());

    // First draw of the page
    this.view.setStaff(this.staff.getName(), this.staff.role);
    this.view.renderServices(this.services);
    this.view.setMinDateTime();
    this.refreshView();
  }

  // ---------------- handlers (one per user action) ----------------

  /** R1 – register a new customer. */
  handleRegister(data) {
    try {
      const customer = this.registry.register(data.name, data.email, data.phone);
      const { email } = customer.getContact();

      this.#viewedEmail = email;
      this.view.clearRegisterForm();
      this.view.setEmail(email);
      this.refreshView();
      this.view.showMessage(`Welcome, ${customer.getName()}! Your account is ready. You can book an appointment now.`, 'success');
    } catch (error) {
      this.view.showMessage(error.message, 'error');
    }
  }

  /** R2 + R3 – book an appointment and receive a queue number. */
  handleBook(data) {
    try {
      const customer = this.registry.findByEmail(data.email);
      if (!customer) throw new Error('No account found for that email. Please create an account first.');

      const service = this.services.find(s => String(s.serviceId) === data.serviceId);
      const appointment = customer.bookAppointment(service, data.dateTime);   // Model applies the rules

      const { email } = customer.getContact();
      this.#viewedEmail = email;
      this.view.clearBookForm(email);
      this.view.setEmail(email);
      this.refreshView();
      this.view.showMessage(`Booked! Your queue number is #${appointment.queueNumber}.`, 'success');
    } catch (error) {
      this.view.showMessage(error.message, 'error');
    }
  }

  /** R4 – show a customer's appointments and their status. */
  handleLookup(email) {
    this.#viewedEmail = String(email).trim().toLowerCase();
    this.refreshView();
    if (!this.registry.findByEmail(this.#viewedEmail)) {
      this.view.showMessage('No account found for that email.', 'error');
    }
  }

  /** R5 – cancel an upcoming appointment. */
  handleCancel(appointmentId) {
    try {
      const customer = this.registry.findByEmail(this.#viewedEmail);
      if (!customer) throw new Error('Look up your account first.');
      const appointment = customer.cancelAppointment(appointmentId);

      this.refreshView();
      this.view.showMessage(`Queue #${appointment.queueNumber} was cancelled.`, 'success');
    } catch (error) {
      this.view.showMessage(error.message, 'error');
    }
  }

  /** R6 – staff calls the next customer. */
  handleCallNext() {
    try {
      const next = this.staff.callNextCustomer();
      this.refreshView();
      if (next) this.view.showMessage(`Now serving #${next.queueNumber} – ${next.customer.getName()}.`, 'success');
      else this.view.showMessage('Nobody is waiting in the queue.', 'info');
    } catch (error) {
      this.view.showMessage(error.message, 'error');
    }
  }

  /** R6 – staff marks the current customer Completed or No-show. */
  handleUpdateStatus(appointmentId, newStatus) {
    try {
      const appointment = this.queue.getQueueList().find(a => a.appointmentId === appointmentId);
      if (!appointment) throw new Error('That appointment could not be found.');

      this.staff.updateAppointmentStatus(appointment, newStatus);
      this.refreshView();
      this.view.showMessage(`Queue #${appointment.queueNumber} marked ${newStatus}.`, 'success');
    } catch (error) {
      this.view.showMessage(error.message, 'error');
    }
  }

  /** Search the live queue as the user types. */
  handleSearch(text) {
    this.#searchText = text;
    this.refreshView();
  }

  /** Demo helper – clear everything. */
  handleReset() {
    if (!this.view.confirm('Clear all customers and appointments?')) return;
    this.registry.clear();
    this.queue.reset();
    this.#viewedEmail = '';
    this.#searchText = '';
    this.view.clearAllInputs();
    this.refreshView();
    this.view.showMessage('Demo data cleared.', 'info');
  }

  // ---------------- redraw ----------------

  /** Ask the Model for the current data and tell the View to draw it. */
  refreshView() {
    const serving = this.queue.getNowServing();

    this.view.renderBoard(serving, this.queue.getStats());
    this.view.renderServingControls(serving);
    this.view.renderQueue(this.queue.search(this.#searchText), this.#searchText.trim() !== '');
    this.#refreshMyAppointments();
  }

  #refreshMyAppointments() {
    if (!this.#viewedEmail) {
      this.view.showMyAppointmentsHint('Enter your email to see your appointments and queue numbers.');
      return;
    }
    const customer = this.registry.findByEmail(this.#viewedEmail);
    if (!customer) {
      this.view.showMyAppointmentsHint('No account found for that email.');
      return;
    }
    const appointments = customer.getAppointments();
    if (appointments.length === 0) {
      this.view.showMyAppointmentsHint(`Hello ${customer.getName()}. You have no appointments yet.`);
      return;
    }
    this.view.renderMyAppointments(appointments);
  }
}
