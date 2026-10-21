// Checkpoint 2 sanity check - confirms the class design behaves as documented.
// Run from the project folder:  node tests/sanity-check.mjs
import fs from 'node:fs';
import vm from 'node:vm';

// The model files are plain browser scripts (no import/export), so load them the same way
// index.html does: in order, into one shared scope, then pick out the classes we need.
const order = ['Person', 'ServiceType', 'Appointment', 'QueueManager', 'Customer', 'Staff', 'CustomerRegistry'];
const source = order.map(name => fs.readFileSync(new URL(`../models/${name}.js`, import.meta.url), 'utf8')).join('\n');
const { Person, ServiceType, QueueManager, Customer, Staff, CustomerRegistry } =
  vm.runInNewContext(`${source}\n({ ${order.join(', ')} })`);

let failures = 0;
function check(name, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${name}`);
  if (!condition) failures += 1;
}
function throws(fn) {
  try { fn(); return false; } catch { return true; }
}

const queue = QueueManager.getInstance();
const registry = new CustomerRegistry();
const staff = new Staff(100, 'Alex Rivera', 'alex@appointease.test', '5550100', 'Front Desk');
const service = new ServiceType(1, 'General Consultation', 15);

// Singleton
check('Singleton: getInstance() twice returns the same object', QueueManager.getInstance() === queue);
check('Singleton: "new QueueManager()" is refused', throws(() => new QueueManager()));

// Inheritance
const serah = registry.register('Serah Morris', 'serah@example.com', '5551111');
const andre = registry.register('Andre B', 'andre@example.com', '5552222');
check('Inheritance: Customer is a Person', serah instanceof Customer && serah instanceof Person);
check('Inheritance: Staff is a Person', staff instanceof Staff && staff instanceof Person);

// Queue numbers
const a1 = serah.bookAppointment(service, '2030-01-01T09:00');
const a2 = andre.bookAppointment(service, '2030-01-01T09:15');
check('Two customers get sequential queue numbers #1 and #2', a1.queueNumber === 1 && a2.queueNumber === 2);
check('New appointments are Confirmed', a1.getStatus() === 'Confirmed');

// Business rules
check('Same customer cannot double-book the same time', throws(() => serah.bookAppointment(service, '2030-01-01T09:00')));
check('A refused booking does not use up a queue number', serah.bookAppointment(service, '2030-01-02T09:00').queueNumber === 3);
check('Duplicate email is refused', throws(() => registry.register('Other', 'SERAH@example.com', '5553333')));
check('Empty name is refused', throws(() => registry.register('  ', 'x@example.com', '5554444')));

// Staff actions
const served = staff.callNextCustomer();
check('Call next -> #1 becomes Now Serving', served === a1 && a1.getStatus() === 'Now Serving');
check('Staff can only use Completed / No-show', throws(() => staff.updateAppointmentStatus(a1, 'Pending')));
staff.updateAppointmentStatus(a1, 'No-show');
check('Staff can mark the current customer No-show', a1.getStatus() === 'No-show');
check('A finished appointment cannot change again', throws(() => a1.setStatus('Confirmed')));

// Cancel
serah.cancelAppointment(3);
check('Cancelling sets the status to Cancelled', serah.getAppointments()[1].getStatus() === 'Cancelled');
check('A cancelled appointment leaves the waiting list', queue.getWaitingList().every(a => a.queueNumber !== 3));
check('Waiting list now only has #2', queue.getWaitingList().length === 1 && queue.getWaitingList()[0] === a2);

// Search + stats (Model)
check('Search by name finds the customer', queue.search('andre').length === 1 && queue.search('andre')[0] === a2);
check('Search by queue number works ("#2")', queue.search('#2').length === 1 && queue.search('2')[0] === a2);
check('Search by status works', queue.search('no-show').length === 1);
check('Empty search returns the whole queue', queue.search('').length === 3);
check('Search with no match returns nothing', queue.search('zzz').length === 0);
check('Stats: 1 waiting, 0 completed, last number 3', (() => {
  const st = queue.getStats(); return st.waiting === 1 && st.completed === 0 && st.lastNumber === 3;
})());

// Encapsulation
check('Encapsulation: status is not a public property', a2.status === undefined && a2['#status'] === undefined);
check('Encapsulation: invalid status value is refused', throws(() => a2.setStatus('Banana')));
check('Encapsulation: editing the returned queue copy does not change the real queue', (() => {
  const copy = queue.getQueueList(); copy.length = 0; return queue.getQueueList().length === 3;
})());
check('Encapsulation: getContact() returns a copy', (() => {
  const c = serah.getContact(); c.email = 'hacked'; return serah.getContact().email === 'serah@example.com';
})());

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
