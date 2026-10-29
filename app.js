/**
 * N.K Transports - Interactive Web Application Engine
 * Features: Live GPS Car Tracker, Dynamic Booking Engine & WhatsApp Dispatcher
 * Hotline: +91 8438142815
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Modules
  initLiveTracking();
  initBookingEngine();
  initFleetFiltering();
  initMobileMenu();
  initFaqAccordion();
});

/* ==========================================================================
   1. Live Car GPS Tracking Simulator (Leaflet.js)
   ========================================================================== */
let map;
let activeVehicleId = 'NK-7891';
const vehicleMarkers = {};
let routePolylines = {};
let trackingInterval;

// Simulated Fleet Vehicles with GPS Routes
const FLEET_TRACKING_DATA = {
  'NK-7891': {
    id: 'NK-7891',
    model: 'Toyota Innova Crysta',
    category: 'Premium SUV',
    driver: 'Murugan K.',
    phone: '8438142815',
    status: 'In-Transit',
    route: 'Chennai → Bangalore (NH 48)',
    currentLocation: 'Near Vellore Toll Plaza',
    speed: 72,
    eta: '2h 15m',
    distanceLeft: '138 km',
    fuel: '82%',
    passengers: '4 Guests',
    waypoints: [
      [13.0827, 80.2707], // Chennai
      [13.0012, 79.9922], // Sriperumbudur
      [12.9249, 79.3338], // Ranipet
      [12.9165, 79.1325], // Vellore
      [12.7842, 78.7186], // Ambur
      [12.6734, 78.4312], // Vaniyambadi
      [12.5284, 78.2138], // Krishnagiri
      [12.7409, 77.8253], // Hosur
      [12.9716, 77.5946]  // Bangalore
    ],
    currentIndex: 3,
    progress: 0.35
  },
  'NK-5542': {
    id: 'NK-5542',
    model: 'Maruti Suzuki Dzire',
    category: 'Sedan Prime',
    driver: 'Senthil Raj',
    phone: '8438142815',
    status: 'On Hill Climb',
    route: 'Coimbatore → Ooty',
    currentLocation: 'Burliyar Ghat Road',
    speed: 38,
    eta: '45 mins',
    distanceLeft: '28 km',
    fuel: '74%',
    passengers: '2 Guests',
    waypoints: [
      [11.0168, 76.9558], // Coimbatore
      [11.2000, 76.9400], // Karamadai
      [11.3000, 76.9400], // Mettupalayam
      [11.3320, 76.8850], // Burliyar
      [11.3530, 76.7959], // Coonoor
      [11.4102, 76.6950]  // Ooty
    ],
    currentIndex: 2,
    progress: 0.6
  },
  'NK-9018': {
    id: 'NK-9018',
    model: 'Force Tempo Traveller (17S)',
    category: 'Group Luxury',
    driver: 'Ramesh V.',
    phone: '8438142815',
    status: 'In-Transit',
    route: 'Madurai → Kodaikanal',
    currentLocation: 'Batlagundu Junction',
    speed: 55,
    eta: '1h 20m',
    distanceLeft: '52 km',
    fuel: '90%',
    passengers: '14 Guests (Family Tour)',
    waypoints: [
      [9.9252, 78.1198],  // Madurai
      [10.0200, 77.9800], // Vadipatti
      [10.1600, 77.7600], // Batlagundu
      [10.2100, 77.6200], // Machur
      [10.2381, 77.4892]  // Kodaikanal
    ],
    currentIndex: 2,
    progress: 0.45
  },
  'NK-3321': {
    id: 'NK-3321',
    model: 'Toyota Fortuner 4x4',
    category: 'VIP Luxury',
    driver: 'Praveen Kumar',
    phone: '8438142815',
    status: 'Airport Drop',
    route: 'Anna Nagar → Chennai Airport (MAA)',
    currentLocation: 'Kathipara Flyover, Guindy',
    speed: 60,
    eta: '18 mins',
    distanceLeft: '7.5 km',
    fuel: '65%',
    passengers: '3 Guests',
    waypoints: [
      [13.0878, 80.2144], // Anna Nagar
      [13.0450, 80.2200], // Vadapalani
      [13.0067, 80.2025], // Guindy / Kathipara
      [12.9941, 80.1709]  // MAA Airport
    ],
    currentIndex: 2,
    progress: 0.7
  }
};

function initLiveTracking() {
  const mapElement = document.getElementById('trackingMap');
  if (!mapElement) return;

  // Center on South India
  map = L.map('trackingMap', {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false
  }).setView([12.5, 78.5], 7);

  // CartoDB Dark Matter High-Contrast Night Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  // Add custom markers and route lines for each vehicle
  Object.keys(FLEET_TRACKING_DATA).forEach(vehicleId => {
    const car = FLEET_TRACKING_DATA[vehicleId];
    
    // Polyline for full route
    const polyline = L.polyline(car.waypoints, {
      color: '#10b981',
      weight: 3.5,
      opacity: 0.7,
      dashArray: '6, 8'
    }).addTo(map);
    routePolylines[vehicleId] = polyline;

    // Start coordinates based on current waypoint
    const currentCoords = car.waypoints[car.currentIndex];

    // Custom HTML marker for car
    const customIcon = L.divIcon({
      className: 'car-marker-container',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="radar-ring"></div>
          <div class="car-marker-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="car-marker-label">${car.id}</div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const marker = L.marker(currentCoords, { icon: customIcon }).addTo(map);
    
    // Popup on marker click
    marker.bindPopup(`
      <div class="p-2 text-left font-sans">
        <div class="flex items-center justify-between gap-2 border-b border-emerald-900/50 pb-2 mb-2">
          <span class="font-bold text-emerald-400 text-sm">${car.id}</span>
          <span class="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">${car.status}</span>
        </div>
        <p class="text-xs text-white font-semibold">${car.model}</p>
        <p class="text-xs text-gray-400">Driver: ${car.driver}</p>
        <p class="text-xs text-gray-400">Route: ${car.route}</p>
        <div class="mt-2 pt-2 border-t border-emerald-950/80 flex items-center justify-between text-xs">
          <span class="text-emerald-400 font-bold">${car.speed} km/h</span>
          <span class="text-gray-300">ETA: ${car.eta}</span>
        </div>
        <a href="tel:${car.phone}" class="mt-3 block text-center bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-1.5 rounded transition">
          📞 Call Driver (${car.phone})
        </a>
      </div>
    `);

    marker.on('click', () => {
      selectVehicle(vehicleId);
    });

    vehicleMarkers[vehicleId] = marker;
  });

  // Focus on default vehicle
  selectVehicle(activeVehicleId);

  // Setup Vehicle Switcher buttons
  const vehicleButtons = document.querySelectorAll('.tracking-car-btn');
  vehicleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const vid = btn.dataset.vehicleId;
      if (vid && FLEET_TRACKING_DATA[vid]) {
        selectVehicle(vid);
      }
    });
  });

  // Setup Tracking Code Search form
  const trackingForm = document.getElementById('trackingSearchForm');
  if (trackingForm) {
    trackingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('trackingCodeInput');
      const query = input.value.trim().toUpperCase();
      
      const matched = Object.keys(FLEET_TRACKING_DATA).find(vid => 
        vid === query || vid.replace('NK-', '') === query || query.includes(vid.replace('NK-', ''))
      );

      if (matched) {
        selectVehicle(matched);
        showToast(`Vehicle found! Zooming in to ${matched} (${FLEET_TRACKING_DATA[matched].model})`, 'success');
      } else {
        showToast(`Tracking code "${query}" not found in active trips. Try sample code NK-7891 or NK-5542`, 'warning');
      }
    });
  }

  // Start animated vehicle simulator
  startLiveMovementLoop();
}

function selectVehicle(vehicleId) {
  activeVehicleId = vehicleId;
  const car = FLEET_TRACKING_DATA[vehicleId];
  if (!car || !map) return;

  // Pan and zoom map
  const marker = vehicleMarkers[vehicleId];
  if (marker) {
    const latlng = marker.getLatLng();
    map.flyTo(latlng, 10, { duration: 1.5 });
    setTimeout(() => {
      marker.openPopup();
    }, 1600);
  }

  // Update active vehicle button styles
  document.querySelectorAll('.tracking-car-btn').forEach(btn => {
    if (btn.dataset.vehicleId === vehicleId) {
      btn.classList.add('border-emerald-400', 'bg-emerald-950/60', 'text-emerald-300');
      btn.classList.remove('border-emerald-900/40', 'bg-black/40', 'text-gray-400');
    } else {
      btn.classList.remove('border-emerald-400', 'bg-emerald-950/60', 'text-emerald-300');
      btn.classList.add('border-emerald-900/40', 'bg-black/40', 'text-gray-400');
    }
  });

  // Update telemetry HUD
  updateTelemetryUI(car);
}

function updateTelemetryUI(car) {
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setText('hudCarId', car.id);
  setText('hudCarModel', car.model);
  setText('hudCategory', car.category);
  setText('hudDriver', car.driver);
  setText('hudPhone', car.phone);
  setText('hudRoute', car.route);
  setText('hudLocation', car.currentLocation);
  setText('hudSpeed', `${car.speed} km/h`);
  setText('hudEta', car.eta);
  setText('hudDistance', car.distanceLeft);
  setText('hudFuel', car.fuel);
  setText('hudStatus', car.status);
  setText('hudPassengers', car.passengers);

  const phoneLink = document.getElementById('hudPhoneCallBtn');
  if (phoneLink) {
    phoneLink.href = `tel:${car.phone}`;
  }
}

function startLiveMovementLoop() {
  if (trackingInterval) clearInterval(trackingInterval);

  trackingInterval = setInterval(() => {
    Object.keys(FLEET_TRACKING_DATA).forEach(vid => {
      const car = FLEET_TRACKING_DATA[vid];
      const waypoints = car.waypoints;
      
      // Interpolate progress towards next waypoint
      car.progress += 0.04;
      if (car.progress >= 1) {
        car.progress = 0;
        car.currentIndex = (car.currentIndex + 1) % (waypoints.length - 1);
      }

      const p1 = waypoints[car.currentIndex];
      const p2 = waypoints[car.currentIndex + 1];

      const currentLat = p1[0] + (p2[0] - p1[0]) * car.progress;
      const currentLng = p1[1] + (p2[1] - p1[1]) * car.progress;

      // Random natural speed fluctuation
      const speedFluctuation = Math.floor(Math.random() * 5) - 2;
      car.speed = Math.max(30, Math.min(88, car.speed + speedFluctuation));

      // Move Leaflet marker
      if (vehicleMarkers[vid]) {
        vehicleMarkers[vid].setLatLng([currentLat, currentLng]);
      }

      // If active, update HUD
      if (vid === activeVehicleId) {
        const speedEl = document.getElementById('hudSpeed');
        if (speedEl) speedEl.innerText = `${car.speed} km/h`;
      }
    });
  }, 1800);
}

/* ==========================================================================
   2. Booking Engine & Instant Fare Calculator
   ========================================================================== */
const VEHICLE_PRICING = {
  sedan: {
    name: 'Sedan Prime (Swift Dzire / Etios)',
    perKm: 13,
    driverBattaPerDay: 400,
    minKmPerDay: 250,
    baseFareLocal: 1800, // 8 hrs / 80 km
    capacity: '4 + 1 Passengers',
    luggage: '2 Medium Bags'
  },
  ertiga: {
    name: 'SUV Standard (Maruti Ertiga)',
    perKm: 16,
    driverBattaPerDay: 500,
    minKmPerDay: 250,
    baseFareLocal: 2300,
    capacity: '6 + 1 Passengers',
    luggage: '3 Bags'
  },
  innova: {
    name: 'Premium SUV (Toyota Innova Crysta)',
    perKm: 19,
    driverBattaPerDay: 600,
    minKmPerDay: 300,
    baseFareLocal: 2900,
    capacity: '7 + 1 Passengers (Captain Seats)',
    luggage: '4 Large Bags'
  },
  fortuner: {
    name: 'VIP Luxury (Toyota Fortuner 4x4)',
    perKm: 32,
    driverBattaPerDay: 800,
    minKmPerDay: 300,
    baseFareLocal: 5200,
    capacity: '6 + 1 Passengers',
    luggage: '4 Bags'
  },
  tempo: {
    name: 'Group Traveller (12/17 Seater AC)',
    perKm: 24,
    driverBattaPerDay: 700,
    minKmPerDay: 300,
    baseFareLocal: 4200,
    capacity: '12-17 Pushback Seats',
    luggage: '10+ Bags'
  }
};

// Distance matrix between key cities in South India (approx in km)
const DISTANCE_MATRIX = {
  'chennai-bangalore': 350,
  'bangalore-chennai': 350,
  'chennai-coimbatore': 510,
  'coimbatore-chennai': 510,
  'chennai-madurai': 460,
  'madurai-chennai': 460,
  'chennai-tirupati': 135,
  'tirupati-chennai': 135,
  'chennai-pondicherry': 150,
  'pondicherry-chennai': 150,
  'coimbatore-ooty': 86,
  'ooty-coimbatore': 86,
  'bangalore-mysore': 145,
  'mysore-bangalore': 145,
  'bangalore-coorg': 250,
  'madurai-kodaikanal': 120,
  'kodaikanal-madurai': 120,
  'chennai-salem': 345,
  'salem-chennai': 345,
  'coimbatore-salem': 165
};

function initBookingEngine() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const tripTypeInputs = document.querySelectorAll('input[name="tripType"]');
  const pickupCity = document.getElementById('pickupCity');
  const dropCity = document.getElementById('dropCity');
  const vehicleType = document.getElementById('vehicleType');
  const tripDuration = document.getElementById('tripDuration');
  const dropCityContainer = document.getElementById('dropCityContainer');

  // Trip type toggle (One-way, Round-trip, Local rental, Airport)
  tripTypeInputs.forEach(input => {
    input.addEventListener('change', () => {
      const val = input.value;
      if (val === 'local') {
        if (dropCityContainer) dropCityContainer.style.display = 'none';
      } else {
        if (dropCityContainer) dropCityContainer.style.display = 'block';
      }
      calculateFare();
    });
  });

  // Calculate fare on any input change
  [pickupCity, dropCity, vehicleType, tripDuration].forEach(el => {
    if (el) el.addEventListener('change', calculateFare);
  });

  // Initial calculation
  calculateFare();

  // Form submission: Launch WhatsApp or Confirmation Modal
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBooking();
  });

  const whatsappDirectBtn = document.getElementById('btnBookViaWhatsApp');
  if (whatsappDirectBtn) {
    whatsappDirectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendWhatsAppBooking();
    });
  }
}

function calculateFare() {
  const tripTypeEl = document.querySelector('input[name="tripType"]:checked');
  const tripType = tripTypeEl ? tripTypeEl.value : 'oneway';
  const pickup = document.getElementById('pickupCity') ? document.getElementById('pickupCity').value.trim().toLowerCase() : 'chennai';
  const drop = document.getElementById('dropCity') ? document.getElementById('dropCity').value.trim().toLowerCase() : 'bangalore';
  const vehicleKey = document.getElementById('vehicleType') ? document.getElementById('vehicleType').value : 'innova';
  const durationDays = parseInt(document.getElementById('tripDuration') ? document.getElementById('tripDuration').value : '1') || 1;

  const vehicle = VEHICLE_PRICING[vehicleKey] || VEHICLE_PRICING['innova'];

  let estimatedKm = 250;
  let baseFare = 0;
  let driverAllowance = 0;
  let tollEstimate = 450;
  let totalEstimate = 0;

  if (tripType === 'local') {
    estimatedKm = 80 * durationDays;
    baseFare = vehicle.baseFareLocal * durationDays;
    driverAllowance = 300 * durationDays;
    tollEstimate = 100;
  } else {
    // Check known matrix or default distance
    const routeKey = `${pickup}-${drop}`;
    if (DISTANCE_MATRIX[routeKey]) {
      estimatedKm = DISTANCE_MATRIX[routeKey];
    } else {
      estimatedKm = 280; // Reasonable average default
    }

    if (tripType === 'roundtrip') {
      estimatedKm = estimatedKm * 2;
      const minKmRequired = vehicle.minKmPerDay * durationDays;
      if (estimatedKm < minKmRequired) {
        estimatedKm = minKmRequired;
      }
    }

    baseFare = estimatedKm * vehicle.perKm;
    driverAllowance = vehicle.driverBattaPerDay * durationDays;
  }

  totalEstimate = Math.round(baseFare + driverAllowance + tollEstimate);

  // Update UI Elements
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setText('fareEstKm', `${estimatedKm} km`);
  setText('fareRatePerKm', `₹${vehicle.perKm}/km`);
  setText('fareBaseAmount', `₹${baseFare.toLocaleString('en-IN')}`);
  setText('fareDriverAllowance', `₹${driverAllowance.toLocaleString('en-IN')}`);
  setText('fareTollEstimate', `₹${tollEstimate.toLocaleString('en-IN')}`);
  setText('fareTotalEstimate', `₹${totalEstimate.toLocaleString('en-IN')}`);
  setText('fareSelectedVehicle', vehicle.name);

  return {
    tripType,
    pickup,
    drop,
    vehicle,
    estimatedKm,
    baseFare,
    driverAllowance,
    tollEstimate,
    totalEstimate,
    durationDays
  };
}

function submitBooking() {
  const fareData = calculateFare();
  const name = document.getElementById('custName') ? document.getElementById('custName').value.trim() : 'Customer';
  const phone = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : '';
  const date = document.getElementById('travelDate') ? document.getElementById('travelDate').value : 'Tomorrow';
  const time = document.getElementById('pickupTime') ? document.getElementById('pickupTime').value : '06:00 AM';
  const notes = document.getElementById('tripNotes') ? document.getElementById('tripNotes').value.trim() : '';

  if (!phone || phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number for booking confirmation', 'warning');
    if (document.getElementById('custPhone')) {
      document.getElementById('custPhone').focus();
    }
    return;
  }

  // Generate Booking Reference
  const bookingRef = 'NK-' + Math.floor(100000 + Math.random() * 900000);

  // Populate Modal
  const modal = document.getElementById('bookingConfirmationModal');
  if (modal) {
    document.getElementById('modalBookingRef').innerText = bookingRef;
    document.getElementById('modalCustName').innerText = name;
    document.getElementById('modalCustPhone').innerText = phone;
    document.getElementById('modalVehicle').innerText = fareData.vehicle.name;
    document.getElementById('modalRoute').innerText = fareData.tripType === 'local' 
      ? `Local Package (${fareData.pickup})` 
      : `${fareData.pickup.toUpperCase()} → ${fareData.drop.toUpperCase()} (${fareData.tripType.toUpperCase()})`;
    document.getElementById('modalDateTime').innerText = `${date} at ${time}`;
    document.getElementById('modalEstFare').innerText = `₹${fareData.totalEstimate.toLocaleString('en-IN')}`;

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Trigger WhatsApp button inside modal
    const modalWaBtn = document.getElementById('modalWhatsAppBtn');
    if (modalWaBtn) {
      modalWaBtn.onclick = () => {
        sendWhatsAppBooking(bookingRef);
      };
    }
  } else {
    sendWhatsAppBooking(bookingRef);
  }
}

function sendWhatsAppBooking(bookingRef) {
  const fareData = calculateFare();
  const name = document.getElementById('custName') ? document.getElementById('custName').value.trim() : 'Guest';
  const phone = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : '';
  const date = document.getElementById('travelDate') ? document.getElementById('travelDate').value : 'Immediate / Soon';
  const time = document.getElementById('pickupTime') ? document.getElementById('pickupTime').value : '';
  const notes = document.getElementById('tripNotes') ? document.getElementById('tripNotes').value.trim() : '';
  
  const ref = bookingRef || 'NK-' + Math.floor(100000 + Math.random() * 900000);

  const message = `🚕 *NEW CAB BOOKING - N.K TRANSPORTS*
--------------------------------
📋 *Booking Ref:* ${ref}
👤 *Name:* ${name}
📱 *Phone:* ${phone || 'Provided via WhatsApp'}
📍 *Pickup:* ${fareData.pickup.toUpperCase()}
🏁 *Destination:* ${fareData.tripType === 'local' ? 'Local Rental' : fareData.drop.toUpperCase()}
🔄 *Trip Type:* ${fareData.tripType.toUpperCase()}
🚘 *Vehicle:* ${fareData.vehicle.name}
📅 *Date & Time:* ${date} ${time ? 'at ' + time : ''}
🛣️ *Estimated Distance:* ${fareData.estimatedKm} km
💰 *Estimated Fare:* ₹${fareData.totalEstimate.toLocaleString('en-IN')}
${notes ? `📝 *Notes:* ${notes}\n` : ''}--------------------------------
_Please confirm availability and dispatch driver details._`;

  const encodedUrl = `https://wa.me/918438142815?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank');
}

/* ==========================================================================
   3. Fleet Filtering & "Book This Car" Actions
   ========================================================================== */
function initFleetFiltering() {
  const filterBtns = document.querySelectorAll('.fleet-filter-btn');
  const carCards = document.querySelectorAll('.fleet-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.filter;

      // Active state button
      filterBtns.forEach(b => {
        b.classList.remove('bg-emerald-500', 'text-black', 'border-emerald-400');
        b.classList.add('bg-black/60', 'text-gray-400', 'border-emerald-900/40');
      });
      btn.classList.add('bg-emerald-500', 'text-black', 'border-emerald-400');
      btn.classList.remove('bg-black/60', 'text-gray-400', 'border-emerald-900/40');

      // Filter cards
      carCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // "Book This Vehicle" quick buttons
  document.querySelectorAll('.book-vehicle-quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const vtype = btn.dataset.vehicleType;
      const select = document.getElementById('vehicleType');
      if (select && vtype) {
        select.value = vtype;
        calculateFare();
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
        showToast(`Selected ${VEHICLE_PRICING[vtype]?.name || vtype} in booking form!`, 'info');
      }
    });
  });
}

/* ==========================================================================
   4. Mobile Navigation & Interactive Modals
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('closeMobileMenuBtn');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  }

  // Close mobile menu when clicking nav links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.add('hidden');
    });
  });

  // Modal close handlers
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('bookingConfirmationModal');
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }
}

/* ==========================================================================
   5. Interactive FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-toggle');

  faqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      
      const isOpen = !content.classList.contains('hidden');

      // Close all other accordions
      document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');

      if (!isOpen) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

/* ==========================================================================
   Toast Notification Utility
   ========================================================================== */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-sm';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const borderCol = type === 'success' ? 'border-emerald-400' : type === 'warning' ? 'border-yellow-400' : 'border-emerald-500';
  const textCol = type === 'success' ? 'text-emerald-300' : type === 'warning' ? 'text-yellow-300' : 'text-gray-200';

  toast.className = `p-4 rounded-xl bg-gray-950/95 border ${borderCol} shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-x-full`;
  toast.innerHTML = `
    <div class="mt-0.5">
      <svg class="w-5 h-5 ${textCol}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>
    <div class="flex-1 text-xs sm:text-sm font-medium ${textCol}">${message}</div>
  `;

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 50);

  // Animate out
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 400);
  }, 4200);
}
