/**
 * Customer.js - A member of the public who books appointments.
 * Inheritance: extends Person and calls super() to set up the shared identity fields.
 */

class Customer extends Person {
  #appointments = [];   // private: changed only through bookAppointment / cancelAppointment
  static #nextAppointmentId = 1;

  constructor(id, name, email, phone) {
    super(id, name, email, phone);
  }

  /**
   * R2 + R3: book an appointment and receive a queue number.
   * All the rules live here (Model), not in the Controller.
   * @param {ServiceType} serviceType
   * @param {string} dateTime
   * @returns {Appointment} the new, confirmed appointment
   * @throws {Error} if the service is missing or this customer already has that time booked
   */
  bookAppointment(serviceType, dateTime) {
    if (!serviceType) throw new Error('Please choose a service.');

    const clash = this.#appointments.some(a => a.isActive() && a.dateTime === dateTime);
    if (clash) throw new Error('You already have an appointment at that date and time.');

    const queue = QueueManager.getInstance();           // Singleton: the one shared queue
    const appointment = new Appointment(
      Customer.#nextAppointmentId,
      this,
      serviceType,
      dateTime,
      queue.generateQueueNumber()
    );
    Customer.#nextAppointmentId += 1;

    appointment.setStatus('Confirmed');                 // auto-confirmed in this prototype
    this.#appointments.push(appointment);
    queue.addToQueue(appointment);
    return appointment;
  }

  /**
   * R5: cancel one of this customer's upcoming appointments.
   * @param {number} appointmentId
   * @returns {Appointment} the cancelled appointment
   * @throws {Error} if it is not found or can no longer be cancelled
   */
  cancelAppointment(appointmentId) {
    const appointment = this.#appointments.find(a => a.appointmentId === appointmentId);
    if (!appointment) throw new Error('That appointment could not be found.');
    appointment.cancel();
    return appointment;
  }

  /**
   * R4: current status of every appointment this customer has.
   * @returns {object[]} summaries (see Appointment.toSummary)
   */
  viewStatus() {
    return this.#appointments.map(a => a.toSummary());
  }

  /** @returns {Appointment[]} a copy of this customer's appointments */
  getAppointments() {
    return [...this.#appointments];
  }
}
