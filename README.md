# ProTutor - Client Intake Form

Client-facing tuition request form for ProTutor. Built as a static site, deployed on Vercel.

## Project Structure

```
protutor-form/
├── index.html              # Main HTML (all 4 pages)
├── css/
│   └── styles.css          # All styles (form, subscription, FAQ)
├── js/
│   ├── config.js           # State variables, constants, country data
│   ├── ui.js               # Navigation, progress, toast, mode toggle
│   ├── gps.js              # GPS location detection (Places API)
│   ├── validation.js       # Form validation, gender preference
│   ├── sheet.js            # Google Sheet integration (auto-save + submit)
│   ├── schedule.js         # Schedule recommendation engine
│   ├── fee-engine.js       # Fee calculation, buildPage3, quote toggle
│   ├── subscription.js     # Plan toggle, FAQ accordion, tracking
│   └── app.js              # Initialization
└── README.md
```

## JS Load Order (important)

Scripts must load in this exact order due to dependencies:

1. `config.js` - Global state used by all other files
2. `ui.js` - Navigation functions used by validation and sheet
3. `gps.js` - GPS functions (standalone)
4. `validation.js` - Uses toast() from ui.js
5. `sheet.js` - Uses validation state, SHEET_URL
6. `schedule.js` - Uses DOM queries (standalone)
7. `fee-engine.js` - Uses config constants, buildPage3 called by goTo()
8. `subscription.js` - Plan toggle and FAQ (standalone)
9. `app.js` - Init calls (must be last)

## APIs Used

- **Google Maps JavaScript API** - GPS geocoding
- **Google Places API (New)** - Nearby search for address
- **Google Apps Script** - Sheet integration

## Deployment

1. Push to GitHub repo `Protutor-Home-Tuitions/client_form`
2. Vercel auto-deploys from GitHub
3. Live at `findtutor.protutor.in`

## Google Sheet Columns (28)

Date, Time, Parent Name, Mobile, Student Name, Class, Board, Subjects,
Class Mode, Country, Country Code, Online City, Home City, Home Area,
Latitude, Longitude, Location Address, Maps Link, Days per Week,
Hours per Session, Tutor Gender Pref, Additional Info, Quote Accepted,
Hourly Fee, Monthly Estimate, My Quote, Request ID, Subscription Action
