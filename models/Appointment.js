/**
 * Appointment.js - One booking. Holds its own status life-cycle.
 *
 * Encapsulation: #status can only change through setStatus(), which only accepts
 * a value from STATUSES, so an appointment can never end up with a misspelled status.
 */
class Appointment {
  static STATUSES = ['Pending', 'Confirmed', 'Now Serving', 'Completed', 'Cancelled', 'No-show'];
  /** Once an appointment reaches one of these it is finished and cannot change again. */
  static FINAL_STATUSES = ['Completed', 'Cancelled', 'No-show'];

  #appointmentId;
  #customer;
  #serviceType;
  #dateTime;
  #status;
  #queueNumber;

  /**
   * @param {number} appointmentId
   * @param {Person} customer       the Customer who booked
   * @param {ServiceType} serviceType
   * @param {string} dateTime       e.g. "2026-11-02T09:30"
   * @param {number} queueNumber    issued by QueueManager
   */
  constructor(appointmentId, customer, serviceType, dateTime, queueNumber) {
    if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
      throw new Error('Please choose a valid date and time.');
    }
    this.#appointmentId = appointmentId;
    this.#customer = customer;
    this.#serviceType = serviceType;
    this.#dateTime = dateTime;
    this.#queueNumber = queueNumber;
    this.#status = 'Pending';
  }

  get appointmentId() { return this.#appointmentId; }
  get customer() { return this.#customer; }
  get serviceType() { return this.#serviceType; }
  get dateTime() { return this.#dateTime; }
  get queueNumber() { return this.#queueNumber; }

  /** @returns {string} current status */
  getStatus() {
    return this.#status;
  }

  /**
   * Change the status. Validates the new value and the life-cycle rule.
   * @param {string} newStatus  one of Appointment.STATUSES
   * @throws {Error} if the value is not allowed or the appointment is already finished
   */
  setStatus(newStatus) {
    if (!Appointment.STATUSES.includes(newStatus)) {
      throw new Error(`"${newStatus}" is not a valid status.`);
    }
    if (Appointment.FINAL_STATUSES.includes(this.#status)) {
      throw new Error(`This appointment is already ${this.#status} and cannot be changed.`);
    }
    this.#status = newStatus;
  }

  /** @returns {boolean} true while the customer is still waiting to be called */
  isWaiting() {
    return this.#status === 'Pending' || this.#status === 'Confirmed';
  }

  /** @returns {boolean} true if the appointment is not finished yet (waiting or being served) */
  isActive() {
    return !Appointment.FINAL_STATUSES.includes(this.#status);
  }

  /**
   * Cancel this appointment. Only allowed while the customer is still waiting.
   * @throws {Error} if the customer is already being served or finished
   */
  cancel() {
    if (!this.isWaiting()) {
      throw new Error(`An appointment that is "${this.#status}" cannot be cancelled.`);
    }
    this.#status = 'Cancelled';
  }

  /** @returns {object} a plain summary the View can display */
  toSummary() {
    return {
      appointmentId: this.#appointmentId,
      queueNumber: this.#queueNumber,
      customerName: this.#customer.getName(),
      serviceName: this.#serviceType.serviceName,
      dateTime: this.#dateTime,
      status: this.#status
    };
  }
}
