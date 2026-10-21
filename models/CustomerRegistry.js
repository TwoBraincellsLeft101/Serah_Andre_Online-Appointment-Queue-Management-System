/**
 * CustomerRegistry.js - Keeps every registered Customer for the session.
 * Rule enforced here (Model, not Controller): each email can register only once.
 */

class CustomerRegistry {
  #customers = [];
  #nextId = 1;

  /**
   * R1: register a new customer.
   * @returns {Customer}
   * @throws {Error} if a field is empty or the email is already registered
   */
  register(name, email, phone) {
    const customer = new Customer(this.#nextId, name, email, phone); // validates the fields
    if (this.findByEmail(customer.getContact().email)) {
      throw new Error('An account with that email already exists. Use "Look up" to see your appointments.');
    }
    this.#nextId += 1;
    this.#customers.push(customer);
    return customer;
  }

  /** @returns {Customer|undefined} the customer with this email (not case-sensitive) */
  findByEmail(email) {
    const wanted = String(email ?? '').trim().toLowerCase();
    return this.#customers.find(c => c.getContact().email === wanted);
  }

  /** Remove everyone (demo reset). */
  clear() {
    this.#customers = [];
    this.#nextId = 1;
  }
}
