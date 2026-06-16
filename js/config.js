// ══════════════════════════════════════════════
// ProTutor - Configuration & State
// ══════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────
var cur = 1, hist = [];
var TOTAL = 4;
var currentMode = '';
var locPinned = false;
var locLat = '', locLng = '', locAddr = '', locLink = '';
var genderPrefVal = '';
var submitted = false;

var STEPS  = ['','Step 1 of 4','Step 2 of 4','Step 3 of 4','Step 4 of 4'];
var SNAMES = ['','Details','Preferences','Schedule','Confirm'];

// ── Country data ──────────────────────────────────────────────
var countries = [
  {g:"— India —",list:[{n:"India",c:"IN",d:"+91",f:"🇮🇳"}]},
  {g:"Gulf & Middle East",list:[
    {n:"United Arab Emirates",c:"AE",d:"+971",f:"🇦🇪"},{n:"Saudi Arabia",c:"SA",d:"+966",f:"🇸🇦"},
    {n:"Qatar",c:"QA",d:"+974",f:"🇶🇦"},{n:"Kuwait",c:"KW",d:"+965",f:"🇰🇼"},
    {n:"Bahrain",c:"BH",d:"+973",f:"🇧🇭"},{n:"Oman",c:"OM",d:"+968",f:"🇴🇲"},
    {n:"Israel",c:"IL",d:"+972",f:"🇮🇱"},{n:"Jordan",c:"JO",d:"+962",f:"🇯🇴"},
    {n:"Lebanon",c:"LB",d:"+961",f:"🇱🇧"},{n:"Iraq",c:"IQ",d:"+964",f:"🇮🇶"},
    {n:"Yemen",c:"YE",d:"+967",f:"🇾🇪"}
  ]},
  {g:"North America",list:[
    {n:"United States",c:"US",d:"+1",f:"🇺🇸"},{n:"Canada",c:"CA",d:"+1",f:"🇨🇦"},
    {n:"Mexico",c:"MX",d:"+52",f:"🇲🇽"}
  ]},
  {g:"UK & Ireland",list:[
    {n:"United Kingdom",c:"GB",d:"+44",f:"🇬🇧"},{n:"Ireland",c:"IE",d:"+353",f:"🇮🇪"}
  ]},
  {g:"Europe",list:[
    {n:"Germany",c:"DE",d:"+49",f:"🇩🇪"},{n:"France",c:"FR",d:"+33",f:"🇫🇷"},
    {n:"Netherlands",c:"NL",d:"+31",f:"🇳🇱"},{n:"Switzerland",c:"CH",d:"+41",f:"🇨🇭"},
    {n:"Italy",c:"IT",d:"+39",f:"🇮🇹"},{n:"Spain",c:"ES",d:"+34",f:"🇪🇸"},
    {n:"Portugal",c:"PT",d:"+351",f:"🇵🇹"},{n:"Sweden",c:"SE",d:"+46",f:"🇸🇪"},
    {n:"Norway",c:"NO",d:"+47",f:"🇳🇴"},{n:"Denmark",c:"DK",d:"+45",f:"🇩🇰"},
    {n:"Finland",c:"FI",d:"+358",f:"🇫🇮"},{n:"Belgium",c:"BE",d:"+32",f:"🇧🇪"},
    {n:"Austria",c:"AT",d:"+43",f:"🇦🇹"},{n:"Poland",c:"PL",d:"+48",f:"🇵🇱"},
    {n:"Czech Republic",c:"CZ",d:"+420",f:"🇨🇿"},{n:"Greece",c:"GR",d:"+30",f:"🇬🇷"},
    {n:"Luxembourg",c:"LU",d:"+352",f:"🇱🇺"},{n:"Cyprus",c:"CY",d:"+357",f:"🇨🇾"},
    {n:"Malta",c:"MT",d:"+356",f:"🇲🇹"}
  ]},
  {g:"Asia Pacific",list:[
    {n:"Singapore",c:"SG",d:"+65",f:"🇸🇬"},{n:"Australia",c:"AU",d:"+61",f:"🇦🇺"},
    {n:"New Zealand",c:"NZ",d:"+64",f:"🇳🇿"},{n:"Japan",c:"JP",d:"+81",f:"🇯🇵"},
    {n:"Hong Kong",c:"HK",d:"+852",f:"🇭🇰"},{n:"Malaysia",c:"MY",d:"+60",f:"🇲🇾"},
    {n:"Maldives",c:"MV",d:"+960",f:"🇲🇻"},{n:"Sri Lanka",c:"LK",d:"+94",f:"🇱🇰"},
    {n:"Nepal",c:"NP",d:"+977",f:"🇳🇵"},{n:"Bangladesh",c:"BD",d:"+880",f:"🇧🇩"},
    {n:"Thailand",c:"TH",d:"+66",f:"🇹🇭"},{n:"Indonesia",c:"ID",d:"+62",f:"🇮🇩"},
    {n:"Philippines",c:"PH",d:"+63",f:"🇵🇭"},{n:"Vietnam",c:"VN",d:"+84",f:"🇻🇳"},
    {n:"South Korea",c:"KR",d:"+82",f:"🇰🇷"},{n:"China",c:"CN",d:"+86",f:"🇨🇳"},
    {n:"Taiwan",c:"TW",d:"+886",f:"🇹🇼"},{n:"Cambodia",c:"KH",d:"+855",f:"🇰🇭"},
    {n:"Brunei",c:"BN",d:"+673",f:"🇧🇳"},{n:"Pakistan",c:"PK",d:"+92",f:"🇵🇰"}
  ]},
  {g:"Africa",list:[
    {n:"South Africa",c:"ZA",d:"+27",f:"🇿🇦"},{n:"Kenya",c:"KE",d:"+254",f:"🇰🇪"},
    {n:"Nigeria",c:"NG",d:"+234",f:"🇳🇬"},{n:"Tanzania",c:"TZ",d:"+255",f:"🇹🇿"},
    {n:"Uganda",c:"UG",d:"+256",f:"🇺🇬"},{n:"Ghana",c:"GH",d:"+233",f:"🇬🇭"},
    {n:"Mauritius",c:"MU",d:"+230",f:"🇲🇺"},{n:"Mozambique",c:"MZ",d:"+258",f:"🇲🇿"},
    {n:"Egypt",c:"EG",d:"+20",f:"🇪🇬"},{n:"Morocco",c:"MA",d:"+212",f:"🇲🇦"}
  ]},
  {g:"South America & Caribbean",list:[
    {n:"Brazil",c:"BR",d:"+55",f:"🇧🇷"},{n:"Argentina",c:"AR",d:"+54",f:"🇦🇷"},
    {n:"Trinidad & Tobago",c:"TT",d:"+1868",f:"🇹🇹"},{n:"Guyana",c:"GY",d:"+592",f:"🇬🇾"},
    {n:"Suriname",c:"SR",d:"+597",f:"🇸🇷"},{n:"Jamaica",c:"JM",d:"+1876",f:"🇯🇲"}
  ]},
  {g:"Central Asia",list:[
    {n:"Kazakhstan",c:"KZ",d:"+7",f:"🇰🇿"},{n:"Uzbekistan",c:"UZ",d:"+998",f:"🇺🇿"},
    {n:"Azerbaijan",c:"AZ",d:"+994",f:"🇦🇿"},{n:"Georgia",c:"GE",d:"+995",f:"🇬🇪"}
  ]},
  {g:"Russia & Eastern Europe",list:[
    {n:"Russia",c:"RU",d:"+7",f:"🇷🇺"},{n:"Ukraine",c:"UA",d:"+380",f:"🇺🇦"}
  ]}
];
