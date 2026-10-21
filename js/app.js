/**
 * app.js - starts the application (like the lab's app.js).
 * Loaded last by index.html, after all the classes it uses.
 *
 * Creates the Model objects, the View and the Controller, and connects them:
 *     const controller = new AppController(model..., view);
 * From here on the Controller reacts to the user's actions.
 */

// MODEL
const registry = new CustomerRegistry();
const queue = QueueManager.getInstance();      // Singleton: the one shared queue
const staff = new Staff(100, 'Alex Rivera', 'alex@appointease.test', '5550100', 'Front Desk');
const services = [
  new ServiceType(1, 'General Consultation', 15),
  new ServiceType(2, 'Specialist Appointment', 30),
  new ServiceType(3, 'Document Collection', 10),
  new ServiceType(4, 'Account Inquiry', 20)
];

// VIEW + CONTROLLER
const view = new AppView();
const controller = new AppController(registry, queue, staff, services, view);

// Handy for the browser console while demonstrating / debugging: window.appointease.queue ...
window.appointease = { controller };
