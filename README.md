# AppointEase – Online Appointment & Queue Management System

**ITDI110 – Object-Oriented Programming & Software Development**
**Checkpoint 2 – Core OOP Development & MVC**
Group: Serah Morris & Andre Banvuhavuha

Customers register, book an appointment for a service and receive a queue number.
Staff run the live queue: call the next customer and mark them Completed or No-show.

---

## How to run

The app is plain HTML, CSS and JavaScript (no install, no build step). Any of these work:

- **Easiest:** open the folder in VS Code, right-click `index.html` and choose **Open with Live Server**
  (install the *Live Server* extension by Ritwick Dey once). The page opens at `http://127.0.0.1:5500`.
- **Or** simply double-click `index.html` to open it in your browser.
- **Or** run `python -m http.server 8080` in the project folder and open `http://localhost:8080`.

The scripts are loaded with ordinary `<script>` tags in dependency order (Model, then View, then Controller,
then `app.js`), the same way as the Week 5 and Week 6 labs, so it does not matter how the page is opened.

**Data lives in memory in this checkpoint.** Registered customers and appointments last while the page
is open. Refreshing the page – or saving a file while Live Server is running, which auto-reloads the
page – clears them. Saving data as JSON is planned for Checkpoint 3.

Quick demo: create an account → book an appointment → press **Call next customer** → mark
the customer completed → look up the customer's email under *My appointments*.

## How to run the class check (optional)

Requires Node.js 18+. From the project folder:

```bash
node tests/sanity-check.mjs
```

It confirms the Singleton, inheritance, queue numbering, status rules and encapsulation (27 checks).

---

## Project structure (MVC)

```
appointease/
├── index.html                     VIEW        page structure, forms, tables
├── css/style.css                  VIEW        styling
├── views/AppView.js               VIEW        class: finds DOM elements, binds events, draws results, shows messages
├── controllers/AppController.js   CONTROLLER  class: handles each action -> Model method -> tells the View what to show
├── js/app.js                      start-up    creates Model + View + Controller and connects them
├── models/                        MODEL       data + business rules
│   ├── Person.js                  base class (private #id, #name, #email, #phone)
│   ├── Customer.js                extends Person   bookAppointment, cancelAppointment, viewStatus
│   ├── Staff.js                   extends Person   callNextCustomer, updateAppointmentStatus, viewQueue
│   ├── Appointment.js             private status life-cycle, setStatus(), cancel(), toSummary()
│   ├── ServiceType.js             services offered
│   ├── QueueManager.js            SINGLETON - the one shared queue (also search + stats)
│   └── CustomerRegistry.js        registered customers, one account per email
├── tests/sanity-check.mjs         checks the class design
└── docs/CHECKPOINT2_WALKTHROUGH.md   how a click travels through the code (read this before the demo)
```

The structure follows the Week 5 MVC lab: a Model, a `View` class and a `Controller` class that is given both
(`new AppController(registry, queue, staff, services, view)`), started from `app.js`.

## Requirements covered (from Checkpoint 1)

| Req | Feature | Where |
|-----|---------|-------|
| R1 | Register with name, email, phone | `CustomerRegistry.register()` |
| R2 | Book a service at a date/time | `Customer.bookAppointment()` |
| R3 | Automatic unique queue number | `QueueManager.generateQueueNumber()` |
| R4 | View appointment status | `Customer.viewStatus()`, "My appointments" |
| R5 | Cancel an upcoming appointment | `Customer.cancelAppointment()` |
| R6 | Staff call next / update status | `Staff.callNextCustomer()`, `updateAppointmentStatus()` |
| R7 | Live queue list | Now-serving board + Live queue table (with search) |
| R8 | Input validation | Basic required-field checks now; Regular Expressions in Checkpoint 3 |

## OOP concepts demonstrated

- **Classes, objects, constructors, parameters, return values** – every file in `models/`.
- **Encapsulation** – private `#` fields in every class; `Appointment.#status` only changes through `setStatus()`; `QueueManager.#queueList` is only reachable through its methods, and `getQueueList()` returns a copy.
- **Inheritance** – `Customer extends Person` and `Staff extends Person`, both calling `super()`.
- **Design pattern: Singleton** – `QueueManager.getInstance()` gives the booking screen and the staff desk the same queue, so queue numbers never repeat and "Now Serving" is always in sync.
- **MVC** – the Model holds data and rules, `AppView` does all the DOM work, `AppController` only coordinates: it calls Model methods and tells the View what to draw.
- **Events and callbacks** – `AppView` registers `submit`, `click` and `input` listeners with `addEventListener`; each one calls a handler method on the Controller (named handlers with `.bind(this)` and arrow callbacks). Cancel and status buttons use event delegation, and the message hides itself with a `setTimeout` callback.

## Next (Checkpoint 3)

Regular Expression validation, JSON save/load (`JSON.stringify` / `JSON.parse`), error handling,
unit tests, branching and merging, expanded documentation.
