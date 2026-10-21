/**
 * Person.js - Base class for everyone in the system (Customer and Staff extend it).
 *
 * Demonstrates: constructor, private fields (#), getters, controlled setter.
 * The identity fields are private, so no other code can change them directly.
 */
class Person {
  #id;
  #name;
  #email;
  #phone;

  /**
   * @param {number} id     unique id
   * @param {string} name   full name (required)
   * @param {string} email  email address (required)
   * @param {string} phone  phone number (required)
   * @throws {Error} if name, email or phone is empty
   */
  constructor(id, name, email, phone) {
    this.#id = id;
    this.#name = Person.#required(name, 'Name');
    this.#email = Person.#required(email, 'Email').toLowerCase();
    this.#phone = Person.#required(phone, 'Phone number');
  }

  /** Private helper: trims a value and refuses empty input. */
  static #required(value, label) {
    const clean = String(value ?? '').trim();
    if (clean === '') throw new Error(`${label} is required.`);
    return clean;
  }

  get id() {
    return this.#id;
  }

  /** @returns {string} the person's name */
  getName() {
    return this.#name;
  }

  /** @returns {{email: string, phone: string}} a copy of the contact details */
  getContact() {
    return { email: this.#email, phone: this.#phone };
  }

  /**
   * Controlled way to change contact details (no direct assignment possible).
   * Both values are checked before anything is stored.
   * @param {string} email
   * @param {string} phone
   */
  setContact(email, phone) {
    const newEmail = Person.#required(email, 'Email').toLowerCase();
    const newPhone = Person.#required(phone, 'Phone number');
    this.#email = newEmail;
    this.#phone = newPhone;
  }

  toString() {
    return `${this.#name} (${this.#email})`;
  }
}
