/**
 * QueueManager.js - SINGLETON design pattern.
 *
 * Problem: the booking screen and the staff dashboard must use the exact same queue.
 * If each created its own queue object, queue numbers could repeat and "Now Serving"
 * would fall out of sync. Solution: only ONE QueueManager can ever exist.
 * Everyone gets it through QueueManager.getInstance().
 */

class QueueManager {
  static #instance = null;     // the one and only instance (private static)

  #queueList = [];             // every Appointment issued today (private)
  #currentQueueNumber = 0;     // last queue number issued (private)

  constructor() {
    if (QueueManager.#instance) {
      throw new Error('QueueManager is a Singleton. Use QueueManager.getInstance().');
    }
    QueueManager.#instance = this;
  }

  /** @returns {QueueManager} the single shared instance (created on first use) */
  static getInstance() {
    if (!QueueManager.#instance) new QueueManager();
    return QueueManager.#instance;
  }

  /** @returns {number} the next sequential queue number (1, 2, 3 ...) */
  generateQueueNumber() {
    this.#currentQueueNumber += 1;
    return this.#currentQueueNumber;
  }

  /**
   * Put a booked appointment into the live queue.
   * @param {Appointment} appointment
   * @returns {Appointment}
   */
  addToQueue(appointment) {
    if (!(appointment instanceof Appointment)) throw new Error('Only appointments can join the queue.');
    if (this.#queueList.includes(appointment)) throw new Error('That appointment is already in the queue.');
    this.#queueList.push(appointment);
    return appointment;
  }

  /**
   * Call the next waiting customer.
   * Whoever was "Now Serving" is marked Completed first, then the next waiting
   * customer (lowest queue number) becomes "Now Serving".
   * @returns {Appointment|null} the appointment now being served, or null if nobody is waiting
   */
  callNext() {
    const current = this.getNowServing();
    if (current) current.setStatus('Completed');

    const next = this.#queueList.find(a => a.isWaiting());
    if (!next) return null;
    next.setStatus('Now Serving');
    return next;
  }

  /** @returns {Appointment[]} a COPY of the queue, so outside code cannot edit the real one */
  getQueueList() {
    return [...this.#queueList];
  }

  /** @returns {Appointment[]} customers still waiting, in queue-number order */
  getWaitingList() {
    return this.#queueList.filter(a => a.isWaiting());
  }

  /** @returns {Appointment|null} the appointment currently being served */
  getNowServing() {
    return this.#queueList.find(a => a.getStatus() === 'Now Serving') ?? null;
  }

  /**
   * Search the queue by queue number, customer name, service name or status.
   * @param {string} text  what the user typed (not case-sensitive); empty returns everything
   * @returns {Appointment[]}
   */
  search(text) {
    const q = String(text ?? '').trim().toLowerCase().replace(/^#/, '');
    if (q === '') return this.getQueueList();
    return this.#queueList.filter(a =>
      String(a.queueNumber) === q ||
      a.customer.getName().toLowerCase().includes(q) ||
      a.serviceType.serviceName.toLowerCase().includes(q) ||
      a.getStatus().toLowerCase().includes(q)
    );
  }

  /** @returns {{waiting:number, completed:number, lastNumber:number}} numbers for the summary board */
  getStats() {
    return {
      waiting: this.getWaitingList().length,
      completed: this.#queueList.filter(a => a.getStatus() === 'Completed').length,
      lastNumber: this.#currentQueueNumber
    };
  }

  /** Empty the queue and restart numbering at 1 (used by the demo "Reset" button and tests). */
  reset() {
    this.#queueList = [];
    this.#currentQueueNumber = 0;
  }
}
