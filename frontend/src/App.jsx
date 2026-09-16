import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Routes,
  Route
} from 'react-router-dom';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import {
  LayoutDashboard,
  Map,
  BrainCircuit,
  CloudRain,
  Cloud,
  Droplets,
  TriangleAlert,
  Bell,
  BarChart3,
  History,
  FileText,
  LifeBuoy,
  Settings,
  Menu,
  X,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Search,
  ChevronRight,
  Send,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Gauge
} from 'lucide-react';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';


// ===============================
// NAVIGATION
// ===============================

const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Live Map', '/map', Map],
  ['Prediction', '/prediction', BrainCircuit],
  ['Weather', '/weather', CloudRain],
  ['Water Levels', '/water', Droplets],
  ['Risk Areas', '/risk', TriangleAlert],
  ['Alerts', '/alerts', Bell],
  ['Analytics', '/analytics', BarChart3],
  ['Historical Data', '/history', History],
  ['Reports', '/reports', FileText],
  ['Emergency', '/emergency', LifeBuoy],
  ['AI Assistant', '/assistant', MessageCircle],
  ['Settings', '/settings', Settings]
];


// ===============================
// TANZANIA REGIONS
// ===============================

const tanzaniaRegions = [
  { name: 'Arusha', lat: -3.3869, lon: 36.6830 },
  { name: 'Dar es Salaam', lat: -6.7924, lon: 39.2083 },
  { name: 'Dodoma', lat: -6.1630, lon: 35.7516 },
  { name: 'Geita', lat: -2.8719, lon: 32.2093 },
  { name: 'Iringa', lat: -7.7683, lon: 35.6966 },
  { name: 'Kagera', lat: -1.3346, lon: 31.8120 },
  { name: 'Katavi', lat: -6.3627, lon: 31.0682 },
  { name: 'Kigoma', lat: -4.8766, lon: 29.6266 },
  { name: 'Kilimanjaro', lat: -3.3349, lon: 37.3407 },
  { name: 'Lindi', lat: -9.9968, lon: 39.7144 },
  { name: 'Manyara', lat: -4.2148, lon: 35.7502 },
  { name: 'Mara', lat: -1.5017, lon: 33.8018 },
  { name: 'Mbeya', lat: -8.9094, lon: 33.4608 },
  { name: 'Morogoro', lat: -6.8235, lon: 37.6591 },
  { name: 'Mtwara', lat: -10.2692, lon: 40.1839 },
  { name: 'Mwanza', lat: -2.5164, lon: 32.9175 },
  { name: 'Njombe', lat: -9.3333, lon: 34.7667 },
  { name: 'Pwani', lat: -6.7744, lon: 38.9174 },
  { name: 'Rukwa', lat: -7.9667, lon: 31.6167 },
  { name: 'Ruvuma', lat: -10.6833, lon: 35.6500 },
  { name: 'Shinyanga', lat: -3.6619, lon: 33.4230 },
  { name: 'Simiyu', lat: -2.7975, lon: 33.9811 },
  { name: 'Singida', lat: -4.8189, lon: 34.7500 },
  { name: 'Tabora', lat: -5.0167, lon: 32.8000 },
  { name: 'Tanga', lat: -5.0693, lon: 39.0988 },
  { name: 'Zanzibar', lat: -6.1659, lon: 39.2026 }
];

function riskClass(risk) {
  if (risk === 'CRITICAL') return 'critical';
  if (risk === 'HIGH') return 'high';
  if (risk === 'MODERATE') return 'moderate';
  return 'safe';
}

const RISK_COLORS = { critical: '#dc2626', high: '#f97316', moderate: '#eab308', safe: '#22c55e' };

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://atmonet-backend.onrender.com').replace(/\/$/, '');


// ===============================
// REGION FLOOD RISK CONTEXT
// ===============================

const RegionRiskContext = createContext(null);
function useRegionRisk() {
  return useContext(RegionRiskContext);
}

function RegionRiskProvider({ children }) {
  const [risks, setRisks] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  function notifyIfNeeded(regionName, info) {
    if (!info) return;
    if (info.risk === 'HIGH' || info.risk === 'CRITICAL') {
      if (!notifiedRef.current.has(regionName)) {
        notifiedRef.current.add(regionName);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`AtmoNet: ${info.risk} risk in ${regionName}`, {
            body: `Predicted rainfall tomorrow: ${info.predicted_rainfall_tomorrow_mm}mm. ${info.recommendation}`
          });
        }
      }
    } else {
      notifiedRef.current.delete(regionName);
    }
  }

  async function loadAll() {
    setLoading(true);
    setLoadedCount(0);
    const results = {};

    for (const region of tanzaniaRegions) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region: region.name, water_level: 4.0, humidity: 75 })
        });
        const data = await res.json();
        results[region.name] = data;
        notifyIfNeeded(region.name, data);
      } catch (err) {
        results[region.name] = null;
      }
      setLoadedCount((c) => c + 1);
      setRisks({ ...results });
    }

    setLoading(false);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <RegionRiskContext.Provider value={{ risks, loading, loadedCount, total: tanzaniaRegions.length, lastUpdated, refresh: loadAll }}>
      {children}
    </RegionRiskContext.Provider>
  );
}


// ===============================
// REGION CURRENT WEATHER CONTEXT — fetched directly from
// Open-Meteo for all 26 regions in parallel. Used by the
// parameter-switching map on the Live Map page.
// ===============================

const PARAMETERS = [
  { key: 'temperature_2m', label: 'Temperature', icon: Thermometer },
  { key: 'precipitation', label: 'Precipitation', icon: CloudRain },
  { key: 'wind_speed_10m', label: 'Wind Speed', icon: Wind },
  { key: 'wind_gusts_10m', label: 'Wind Gusts', icon: Wind },
  { key: 'relative_humidity_2m', label: 'Humidity', icon: Droplets },
  { key: 'surface_pressure', label: 'Air Pressure', icon: Gauge }
];

function getColorForValue(value, allValues) {
  if (value == null || allValues.length === 0) return '#94a3b8';
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  if (max === min) return '#38bdf8';
  const t = (value - min) / (max - min);
  const r = Math.round(56 + (220 - 56) * t);
  const g = Math.round(189 - 120 * t);
  const b = Math.round(248 - 200 * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const RegionWeatherContext = createContext(null);
function useRegionWeather() {
  return useContext(RegionWeatherContext);
}

function RegionWeatherProvider({ children }) {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const results = {};
    await Promise.all(tanzaniaRegions.map(async (region) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,surface_pressure,weather_code&timezone=Africa%2FDar_es_Salaam`;
        const res = await fetch(url);
        const json = await res.json();
        results[region.name] = json.current;
      } catch (err) {
        results[region.name] = null;
      }
    }));
    setWeatherData(results);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RegionWeatherContext.Provider value={{ weatherData, loading, refresh: loadAll }}>
      {children}
    </RegionWeatherContext.Provider>
  );
}


// ===============================
// LIVE WEATHER + 7-DAY FORECAST
// ===============================

const CITIES = {
  Mbeya: { lat: -8.9094, lon: 33.4608 },
  'Dar es Salaam': { lat: -6.7924, lon: 39.2083 },
  Dodoma: { lat: -6.1630, lon: 35.7516 },
  Arusha: { lat: -3.3869, lon: 36.6830 },
  Mwanza: { lat: -2.5164, lon: 32.9175 }
};

function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Unknown';
}

const WeatherContext = createContext(null);
function useWeather() {
  return useContext(WeatherContext);
}

function WeatherProvider({ children }) {
  const [city, setCity] = useState('Mbeya');
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchWeather(selectedCity) {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = CITIES[selectedCity];
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&forecast_days=7&timezone=Africa%2FDar_es_Salaam`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather request failed');
      const json = await res.json();
      setData({
        temperature: json.current.temperature_2m,
        humidity: json.current.relative_humidity_2m,
        precipitation: json.current.precipitation,
        windSpeed: json.current.wind_speed_10m,
        weatherCode: json.current.weather_code,
        description: describeWeatherCode(json.current.weather_code),
        updatedAt: json.current.time
      });
      setForecast(
        json.daily.time.map((date, i) => ({
          date,
          tempMax: json.daily.temperature_2m_max[i],
          tempMin: json.daily.temperature_2m_min[i],
          precipitation: json.daily.precipitation_sum[i],
          code: json.daily.weather_code[i],
          description: describeWeatherCode(json.daily.weather_code[i])
        }))
      );
    } catch (e) {
      setError('Could not load live weather right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather(city);
    const interval = setInterval(() => fetchWeather(city), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  return (
    <WeatherContext.Provider value={{ city, setCity, cities: Object.keys(CITIES), data, forecast, loading, error, refresh: () => fetchWeather(city) }}>
      {children}
    </WeatherContext.Provider>
  );
}


// ===============================
// "DATABASE" LAYER (localStorage)
// ===============================

const USERS_KEY = 'floodguard_users';
const SESSION_KEY = 'floodguard_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function registerUser({ name, email, password }) {
  const users = getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const newUser = { name, email, password, createdAt: Date.now() };
  users.push(newUser);
  saveUsers(users);
  return { ok: true, user: newUser };
}

function loginUser({ email, password }) {
  const users = getUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!found) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return { ok: true, user: found };
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}


// ===============================
// THEME
// ===============================

function getStoredTheme() {
  return localStorage.getItem('floodguard_theme') || 'dark';
}

function ThemeToggle({ theme, setTheme }) {
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('floodguard_theme', next);
  }
  return (
    <button className="iconbtn theme-toggle" onClick={toggle} title="Toggle theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}


// ===============================
// ANIMATED SKY
// ===============================

function AnimatedSky() {
  return (
    <div className="sky">
      <span className="cloud c1">☁</span>
      <span className="cloud c2">☁</span>
      <span className="cloud c3">☁</span>
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} className="rain" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.2}s` }} />
      ))}
    </div>
  );
}


// ===============================
// AUTH PAGE
// ===============================

function AuthPage({ onLogin, theme, setTheme }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
      }
      const result = registerUser({ name, email, password });
      if (!result.ok) { setError(result.error); return; }
      saveSession(result.user);
      onLogin(result.user);
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    const result = loginUser({ email, password });
    if (!result.ok) { setError(result.error); return; }
    saveSession(result.user);
    onLogin(result.user);
  }

  return (
    <div className={`login theme-${theme}`}>
      <div className="theme-toggle-corner">
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <AnimatedSky />

      <div className="login-card">
        <div className="brand big">
          <Cloud />
          ATMO<span>NET</span>
        </div>

        <p className="eyebrow">WEATHER &amp; FLOOD INTELLIGENCE</p>

        <h1>
          Track the sky.
          <br />
          <span>Predict floods earlier.</span>
        </h1>

        <p className="muted">Monitor rainfall, water levels and environmental risk in one intelligent platform.</p>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => { setMode('signup'); setError(''); }}>Create Account</button>
        </div>

        {mode === 'signup' && (
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        )}

        <input placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="auth-error">{error}</p>}

        <button className="primary full" onClick={handleSubmit}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
          <ChevronRight size={18} />
        </button>

        <small>{mode === 'signup' ? 'Already have an account? Switch to Sign In.' : 'Demo access • Your data is saved locally'}</small>
      </div>
    </div>
  );
}


// ===============================
// SIDEBAR
// ===============================

function Sidebar({ open, setOpen, onLogout }) {
  const loc = useLocation();
  const navg = useNavigate();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <Cloud />
        ATMO<span>NET</span>
      </div>

      <button className="close" onClick={() => setOpen(false)}><X /></button>

      <div className="side-label">MONITORING SYSTEM</div>

      {nav.map(([name, path, Icon]) => (
        <button key={path} className={`nav ${loc.pathname === path ? 'active' : ''}`} onClick={() => { navg(path); setOpen(false); }}>
          <Icon size={18} />
          <span>{name}</span>
        </button>
      ))}

      <div className="side-bottom">
        <div className="system"><span className="dot" />Systems operational</div>
        <button className="nav" onClick={onLogout}>
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}


// ===============================
// HEADER
// ===============================

function Header({ setOpen, user, theme, setTheme, onLogout }) {
  const navg = useNavigate();
  const { risks } = useRegionRisk();
  const activeCount = Object.values(risks).filter((r) => r && (r.risk === 'HIGH' || r.risk === 'CRITICAL')).length;

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'AN';

  return (
    <header>
      <button className="hamb" onClick={() => setOpen(true)}><Menu /></button>

      <div className="search">
        <Search size={17} />
        <input placeholder="Search location, alert or report..." />
      </div>

      <div className="head-actions">
        <span className="live"><i /> LIVE</span>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="iconbtn" onClick={() => navg('/alerts')}>
          <Bell size={19} />
          {activeCount > 0 && <b>{activeCount}</b>}
        </button>
        <div className="avatar">{initials}</div>
        <button className="iconbtn" onClick={onLogout} title="Sign out">
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}


// ===============================
// ALERT BANNER
// ===============================

function AlertBanner() {
  const { risks, loading } = useRegionRisk();
  const [dismissed, setDismissed] = useState(false);
  const navg = useNavigate();

  const activeCount = Object.values(risks).filter((r) => r && (r.risk === 'HIGH' || r.risk === 'CRITICAL')).length;

  if (loading || activeCount === 0 || dismissed) return null;

  return (
    <div className="alert-banner">
      <TriangleAlert size={18} />
      <span>{activeCount} region{activeCount > 1 ? 's' : ''} currently at HIGH or CRITICAL flood risk.</span>
      <button className="ghost small" onClick={() => navg('/alerts')}>View</button>
      <button className="banner-close" onClick={() => setDismissed(true)}><X size={16} /></button>
    </div>
  );
}


// ===============================
// STAT CARD
// ===============================

function Stat({ icon: Icon, label, value, sub, type }) {
  return (
    <div className="stat compact">
      <div className={`stat-icon ${type}`}><Icon size={18} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}


// ===============================
// LIVE WEATHER MINI PANEL
// ===============================

function WeatherPanel() {
  const { city, setCity, cities, data, loading, error, refresh } = useWeather();

  return (
    <section className="panel compact weather-panel">
      <div className="panel-head">
        <div>
          <h2>Live weather</h2>
          <span className="muted">Source: Open-Meteo (real-time)</span>
        </div>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && <p className="muted">Loading live conditions...</p>}
      {error && <p className="muted">{error}</p>}

      {!loading && !error && data && (
        <div className="weather-live-grid">
          <div className="weather-live-item"><Thermometer size={16} /><span>{data.temperature}°C</span></div>
          <div className="weather-live-item"><Droplets size={16} /><span>{data.humidity}% humidity</span></div>
          <div className="weather-live-item"><CloudRain size={16} /><span>{data.precipitation} mm</span></div>
          <div className="weather-live-item"><Wind size={16} /><span>{data.windSpeed} km/h</span></div>
          <div className="weather-live-desc">{data.description}</div>
        </div>
      )}

      <button className="ghost small" onClick={refresh}>Refresh</button>
    </section>
  );
}


// ===============================
// 7-DAY FORECAST PANEL
// ===============================

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function ForecastPanel() {
  const { forecast, city } = useWeather();

  if (!forecast || forecast.length === 0) {
    return (
      <section className="panel compact forecast-panel">
        <div className="panel-head"><div><h2>7-day forecast</h2><span className="muted">{city} • Open-Meteo</span></div></div>
        <p className="muted">Loading forecast...</p>
      </section>
    );
  }

  return (
    <section className="panel compact forecast-panel">
      <div className="panel-head"><div><h2>7-day forecast</h2><span className="muted">{city} • Open-Meteo (real data)</span></div></div>
      <div className="forecast-row">
        {forecast.map((day) => (
          <div className="forecast-day" key={day.date}>
            <span className="forecast-label">{formatDayLabel(day.date)}</span>
            <span className="forecast-desc">{day.description}</span>
            <span className="forecast-temp">{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</span>
            <span className="forecast-rain">{day.precipitation} mm</span>
          </div>
        ))}
      </div>
    </section>
  );
}


// ===============================
// SHARED LEAFLET RISK MAP (used only by Dashboard now)
// ===============================

function RiskMap({ height, onSelect }) {
  const { risks } = useRegionRisk();

  return (
    <MapContainer center={[-6.5, 35]} zoom={5.3} scrollWheelZoom={true} style={{ height, width: '100%', borderRadius: '16px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {tanzaniaRegions.map((region) => {
        const info = risks[region.name];
        const color = info ? RISK_COLORS[riskClass(info.risk)] : '#94a3b8';
        return (
          <CircleMarker
            key={region.name}
            center={[region.lat, region.lon]}
            radius={12}
            pathOptions={{ fillColor: color, color: '#0f172a', weight: 1, fillOpacity: 0.85 }}
            eventHandlers={onSelect ? { click: () => info && onSelect(info) } : undefined}
          >
            <Popup>
              <b>{region.name}</b><br />
              {info ? (
                <>Risk: {info.risk} ({info.probability}%)<br />Rain tomorrow: {info.predicted_rainfall_tomorrow_mm}mm</>
              ) : 'Loading...'}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}


// ===============================
// DASHBOARD
// ===============================

function Dashboard() {
  const { data, loading } = useWeather();
  const { risks, loading: risksLoading } = useRegionRisk();
  const navg = useNavigate();

  const rainfallValue = data ? `${data.precipitation} mm` : '...';
  const tempValue = data ? `${data.temperature}°C` : '...';

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const highRiskCount = Object.values(risks).filter((r) => r && (r.risk === 'HIGH' || r.risk === 'CRITICAL')).length;
  const loadedRegions = Object.values(risks).filter((r) => r).length;
  const mbeyaRisk = risks['Mbeya'];

  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">{dateLabel.toUpperCase()} • {timeLabel}</p>
          <h1>Flood monitoring center</h1>
          <p className="muted">Real-time environmental intelligence for safer communities.</p>
        </div>
        <button className="primary" onClick={() => navg('/alerts')}>
          <Bell size={17} />
          View active alerts
        </button>
      </div>

      <div className="stats compact-grid">
        <Stat icon={CloudRain} label="Rainfall (live)" value={rainfallValue} sub={loading ? 'Updating...' : 'Open-Meteo, now'} type="blue" />
        <Stat icon={Thermometer} label="Temperature (live)" value={tempValue} sub={loading ? 'Updating...' : 'Open-Meteo, now'} type="cyan" />
        <Stat icon={TriangleAlert} label="Flood probability (Mbeya)" value={mbeyaRisk ? `${mbeyaRisk.probability}%` : '...'} sub={mbeyaRisk ? `${mbeyaRisk.risk}, model output` : (risksLoading ? 'Running model...' : 'Unavailable')} type="red" />
        <Stat icon={Map} label="Regions monitored" value={`${loadedRegions}/${tanzaniaRegions.length}`} sub={`${highRiskCount} at elevated risk`} type="green" />
      </div>

      <div className="grid2 compact-grid">
        <section className="panel compact map-preview">
          <div className="panel-head">
            <div>
              <h2>Live risk overview</h2>
              <span className="muted">Current regional flood conditions</span>
            </div>
            <button className="ghost small" onClick={() => navg('/map')}>Open map<ChevronRight size={14} /></button>
          </div>
          <RiskMap height="280px" />
        </section>

        <WeatherPanel />
      </div>

      <div className="grid2 compact-grid">
        <ForecastPanel />
      </div>

      <div className="grid2 compact-grid">
        <section className="panel compact alerts">
          <div className="panel-head">
            <div>
              <h2>Priority alerts</h2>
              <span className="muted">{risksLoading ? 'Scanning regions...' : `${highRiskCount} active`}</span>
            </div>
            <button className="ghost small" onClick={() => navg('/alerts')}>View all<ChevronRight size={14} /></button>
          </div>

          {Object.entries(risks)
            .filter(([, r]) => r && (r.risk === 'HIGH' || r.risk === 'CRITICAL'))
            .slice(0, 4)
            .map(([name, r]) => (
              <div className="alert-row compact" key={name}>
                <div className={`alert-icon ${r.risk === 'CRITICAL' ? 'critical' : 'high'}`}><TriangleAlert size={15} /></div>
                <div>
                  <strong>{r.risk} flood risk — {name}</strong>
                  <small>Predicted rainfall tomorrow: {r.predicted_rainfall_tomorrow_mm}mm</small>
                </div>
                <ChevronRight size={15} />
              </div>
            ))}

          {!risksLoading && highRiskCount === 0 && <p className="muted">No high or critical risk regions right now.</p>}
        </section>

        <section className="panel compact">
          <div className="panel-head">
            <div><h2>Regions summary</h2><span className="muted">Live model output</span></div>
          </div>
          <div className="risk-list">
            {['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((level) => {
              const count = Object.values(risks).filter((r) => r && r.risk === level).length;
              return (
                <div className="riskitem" key={level}>
                  <span>{level}</span>
                  <b>{count} regions</b>
                  <div><i style={{ width: `${(count / (loadedRegions || 1)) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}


// ===============================
// GENERIC PAGE WRAPPER
// ===============================

function Generic({ title, eyebrow, children }) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">{eyebrow || 'ATMONET INTELLIGENCE'}</p>
          <h1>{title}</h1>
          <p className="muted">Environmental intelligence and early-warning operations.</p>
        </div>
      </div>
      {children}
    </>
  );
}


// ===============================
// PREDICTION
// ===============================

function Prediction() {
  const [p, setP] = useState(0);
  const [loading, setLoading] = useState(false);
  const [riskInfo, setRiskInfo] = useState(null);
  const [region, setRegion] = useState('Mbeya');
  const [errorMsg, setErrorMsg] = useState(null);

  async function runPrediction() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, water_level: 4.8, humidity: 80 })
      });
      if (!res.ok) throw new Error('Prediction request failed');
      const data = await res.json();
      setP(data.probability);
      setRiskInfo(data);
    } catch (err) {
      setErrorMsg('Could not reach the prediction service. Make sure the backend and ml_service are running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Generic title="Flood prediction" eyebrow="AI RISK ENGINE">
      <div className="grid2 compact-grid">
        <section className="panel compact">
          <h2>Run prediction</h2>
          <p className="muted">Select a region — the trained model will fetch real recent weather data and predict tomorrow's flood risk.</p>

          <label style={{ display: 'block', marginBottom: '12px' }}>
            Region
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: '100%', marginTop: '4px' }}>
              {tanzaniaRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </label>

          <button className="primary" onClick={runPrediction} disabled={loading}>
            <BrainCircuit size={18} />
            {loading ? 'Analyzing...' : 'Analyze flood risk'}
          </button>

          {errorMsg && <p className="auth-error" style={{ marginTop: '10px' }}>{errorMsg}</p>}
        </section>

        <section className="panel compact prediction">
          <span className="muted">PREDICTED RISK</span>
          <div className="score">{p}<small>%</small></div>
          <div className="riskbar"><i style={{ width: `${p}%` }} /></div>
          <h2 className="danger">{riskInfo ? `${riskInfo.risk} FLOOD RISK` : 'Select a region and analyze'}</h2>
          <p className="muted">
            {riskInfo
              ? `Predicted rainfall for ${riskInfo.region} tomorrow (${riskInfo.forecast_date}): ${riskInfo.predicted_rainfall_tomorrow_mm}mm.`
              : 'Click "Analyze flood risk" to get a real prediction from the trained model.'}
          </p>
          {riskInfo && <div className="recommend">⚠ {riskInfo.recommendation}</div>}
        </section>
      </div>
    </Generic>
  );
}


// ===============================
// LIVE MAP PAGE — with parameter switcher (Flood Risk,
// Temperature, Precipitation, Wind, Humidity, Pressure)
// ===============================

function MapPage() {
  const { risks, loading, loadedCount, total, refresh } = useRegionRisk();
  const { weatherData, loading: weatherLoading, refresh: refreshWeather } = useRegionWeather();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mode, setMode] = useState('risk');

  const activeParam = PARAMETERS.find((p) => p.key === mode);

  const allValues = mode !== 'risk'
    ? Object.values(weatherData).filter(Boolean).map((d) => d[mode]).filter((v) => v != null)
    : [];

  function getMarkerColor(region) {
    if (mode === 'risk') {
      const info = risks[region.name];
      return info ? RISK_COLORS[riskClass(info.risk)] : '#94a3b8';
    }
    const d = weatherData[region.name];
    const value = d ? d[mode] : null;
    return getColorForValue(value, allValues);
  }

  return (
    <Generic title="Live flood map" eyebrow="GEOSPATIAL MONITORING — TANZANIA (26 REGIONS)">
      <section className="panel compact">
        <div className="panel-head">
          <div>
            <h2>Tanzania flood risk map</h2>
            <span className="muted">
              {mode === 'risk'
                ? (loading ? `Loading predictions... (${loadedCount}/${total})` : 'Live flood risk — click a marker for details')
                : (weatherLoading ? 'Loading live weather...' : `Live ${activeParam.label.toLowerCase()} — click a marker for details`)}
            </span>
          </div>
          <button className="ghost small" onClick={mode === 'risk' ? refresh : refreshWeather} disabled={mode === 'risk' ? loading : weatherLoading}>
            Refresh
          </button>
        </div>

        <div className="param-sidebar-row">
          <button className={`param-chip ${mode === 'risk' ? 'active' : ''}`} onClick={() => setMode('risk')}>
            <TriangleAlert size={16} />
            Flood Risk
          </button>
          {PARAMETERS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.key} className={`param-chip ${mode === p.key ? 'active' : ''}`} onClick={() => setMode(p.key)}>
                <Icon size={16} />
                {p.label}
              </button>
            );
          })}
        </div>

        <MapContainer center={[-6.5, 35]} zoom={5.3} scrollWheelZoom={true} style={{ height: '480px', width: '100%', borderRadius: '16px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {tanzaniaRegions.map((region) => {
            const color = getMarkerColor(region);
            const info = risks[region.name];
            const d = weatherData[region.name];
            return (
              <CircleMarker
                key={region.name}
                center={[region.lat, region.lon]}
                radius={12}
                pathOptions={{ fillColor: color, color: '#0f172a', weight: 1, fillOpacity: 0.85 }}
                eventHandlers={{ click: () => info && setSelectedRegion(info) }}
              >
                <Popup>
                  <b>{region.name}</b><br />
                  {info ? (
                    <>Risk: {info.risk} ({info.probability}%)<br /></>
                  ) : null}
                  {d ? (
                    <>
                      Temp: {d.temperature_2m}°C, Humidity: {d.relative_humidity_2m}%<br />
                      Rain: {d.precipitation}mm, Wind: {d.wind_speed_10m}km/h
                    </>
                  ) : 'Loading weather...'}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {selectedRegion && (
          <div className="panel compact" style={{ marginTop: '12px' }}>
            <h2>{selectedRegion.region}</h2>
            <p className="muted">Risk: <b>{selectedRegion.risk}</b> ({selectedRegion.probability}%) — Predicted rainfall tomorrow: {selectedRegion.predicted_rainfall_tomorrow_mm}mm</p>
            <p className="muted">{selectedRegion.recommendation}</p>
          </div>
        )}
      </section>
    </Generic>
  );
}


// ===============================
// WEATHER PAGE
// ===============================

function WeatherPage() {
  return (
    <Generic title="Weather" eyebrow="LIVE CONDITIONS — OPEN-METEO">
      <div className="grid2 compact-grid">
        <WeatherPanel />
        <ForecastPanel />
      </div>
    </Generic>
  );
}


// ===============================
// WATER LEVELS
// ===============================

function WaterLevelsPage() {
  const [region, setRegion] = useState('Mbeya');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory(selected) {
    setLoading(true);
    try {
      const found = tanzaniaRegions.find((r) => r.name === selected);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${found.lat}&longitude=${found.lon}&daily=precipitation_sum&past_days=30&forecast_days=0&timezone=Africa%2FDar_es_Salaam`;
      const res = await fetch(url);
      const json = await res.json();
      setHistory(json.daily.time.map((t, i) => ({ t: t.slice(5), v: json.daily.precipitation_sum[i] })));
    } catch (err) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHistory(region); }, [region]);

  const avg = history.length ? (history.reduce((s, d) => s + d.v, 0) / history.length).toFixed(1) : '...';

  return (
    <Generic title="Water levels" eyebrow="RAINFALL PROXY — NO PUBLIC RIVER GAUGE API AVAILABLE">
      <section className="panel compact">
        <div className="panel-head">
          <div><h2>30-day rainfall trend</h2><span className="muted">Used as a proxy for rising water levels</span></div>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {tanzaniaRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <p className="muted">{loading ? 'Loading...' : `Average daily rainfall (last 30 days): ${avg}mm`}</p>
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Generic>
  );
}


// ===============================
// RISK AREAS
// ===============================

function RiskAreasPage() {
  const { risks, loading, lastUpdated, refresh } = useRegionRisk();
  const ranked = tanzaniaRegions
    .map((r) => ({ ...r, info: risks[r.name] }))
    .filter((r) => r.info)
    .sort((a, b) => b.info.probability - a.info.probability);

  return (
    <Generic title="Risk areas" eyebrow="ALL 26 REGIONS — LIVE MODEL OUTPUT">
      <section className="panel compact">
        <div className="panel-head">
          <div><h2>Regions ranked by flood risk</h2><span className="muted">{loading ? 'Updating...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span></div>
          <button className="ghost small" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        <div className="risk-list">
          {ranked.map((r) => (
            <div className="riskitem" key={r.name}>
              <span>{r.name}</span>
              <b>{r.info.risk}</b>
              <div><i style={{ width: `${r.info.probability}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    </Generic>
  );
}


// ===============================
// ALERTS
// ===============================

function AlertsPage() {
  const { risks, loading, lastUpdated, refresh } = useRegionRisk();
  const activeAlerts = tanzaniaRegions
    .map((r) => ({ ...r, info: risks[r.name] }))
    .filter((r) => r.info && (r.info.risk === 'HIGH' || r.info.risk === 'CRITICAL'))
    .sort((a, b) => b.info.probability - a.info.probability);

  return (
    <Generic title="Alerts" eyebrow="LIVE MODEL-GENERATED ALERTS">
      <section className="panel compact alerts">
        <div className="panel-head">
          <div><h2>Active alerts</h2><span className="muted">{loading ? 'Checking regions...' : `${activeAlerts.length} active${lastUpdated ? ' • updated ' + lastUpdated.toLocaleTimeString() : ''}`}</span></div>
          <button className="ghost small" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {activeAlerts.length === 0 && !loading && <p className="muted">No high or critical risk regions right now.</p>}
        {activeAlerts.map((a) => (
          <div className="alert-row compact" key={a.name}>
            <div className={`alert-icon ${a.info.risk === 'CRITICAL' ? 'critical' : 'high'}`}><TriangleAlert size={15} /></div>
            <div>
              <strong>{a.info.risk} flood risk — {a.name}</strong>
              <small>Predicted rainfall tomorrow: {a.info.predicted_rainfall_tomorrow_mm}mm</small>
            </div>
            <ChevronRight size={15} />
          </div>
        ))}
      </section>
    </Generic>
  );
}


// ===============================
// ANALYTICS
// ===============================

function Analytics() {
  const { forecast, city } = useWeather();
  const { risks } = useRegionRisk();

  const rainfallHistory = (forecast || []).map((d) => ({ t: formatDayLabel(d.date), v: d.precipitation }));
  const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  Object.values(risks).forEach((r) => { if (r) counts[r.risk] = (counts[r.risk] || 0) + 1; });
  const totalCounted = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <Generic title="Analytics" eyebrow="ENVIRONMENTAL DATA">
      <div className="grid2 compact-grid">
        <section className="panel compact">
          <h2>Rainfall forecast — {city}</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rainfallHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="v" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel compact">
          <h2>Risk distribution (26 regions)</h2>
          <div className="risk-list">
            {[['Critical', counts.CRITICAL], ['High', counts.HIGH], ['Moderate', counts.MODERATE], ['Low', counts.LOW]].map((x) => (
              <div className="riskitem" key={x[0]}>
                <span>{x[0]}</span>
                <b>{x[1]} regions</b>
                <div><i style={{ width: `${(x[1] / totalCounted) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Generic>
  );
}


// ===============================
// HISTORICAL DATA
// ===============================

function HistoricalDataPage() {
  const [region, setRegion] = useState('Mbeya');
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadYear(selected) {
    setLoading(true);
    try {
      const found = tanzaniaRegions.find((r) => r.name === selected);
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${found.lat}&longitude=${found.lon}&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=precipitation_sum&timezone=Africa%2FDar_es_Salaam`;
      const res = await fetch(url);
      const json = await res.json();
      const byMonth = {};
      json.daily.time.forEach((t, i) => {
        const key = t.slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + json.daily.precipitation_sum[i];
      });
      setMonthly(Object.entries(byMonth).map(([month, total]) => ({ t: month.slice(5), v: Math.round(total) })));
    } catch (err) {
      setMonthly([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadYear(region); }, [region]);

  return (
    <Generic title="Historical data" eyebrow="PAST 12 MONTHS — OPEN-METEO ARCHIVE">
      <section className="panel compact">
        <div className="panel-head">
          <div><h2>Monthly rainfall totals</h2><span className="muted">{loading ? 'Loading...' : `${region}, last 12 months`}</span></div>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {tanzaniaRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="v" fill="#22c55e" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Generic>
  );
}


// ===============================
// REPORTS
// ===============================

function ReportsPage() {
  const { risks, loading, lastUpdated, refresh } = useRegionRisk();
  const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  let totalRainfall = 0, counted = 0;

  Object.values(risks).forEach((r) => {
    if (r) { counts[r.risk] = (counts[r.risk] || 0) + 1; totalRainfall += r.predicted_rainfall_tomorrow_mm; counted += 1; }
  });

  const avgRainfall = counted ? (totalRainfall / counted).toFixed(2) : '...';

  return (
    <Generic title="Reports" eyebrow="NATIONAL SUMMARY — LIVE MODEL DATA">
      <section className="panel compact">
        <div className="panel-head">
          <div><h2>Tanzania flood risk summary</h2><span className="muted">{loading ? 'Compiling...' : lastUpdated ? `Generated ${lastUpdated.toLocaleString()}` : ''}</span></div>
          <button className="ghost small" onClick={refresh} disabled={loading}>Regenerate</button>
        </div>

        <div className="stats compact-grid" style={{ marginBottom: '16px' }}>
          <Stat icon={TriangleAlert} label="Critical" value={counts.CRITICAL} sub="regions" type="red" />
          <Stat icon={TriangleAlert} label="High" value={counts.HIGH} sub="regions" type="red" />
          <Stat icon={CloudRain} label="Avg predicted rainfall" value={`${avgRainfall}mm`} sub="tomorrow, nationwide" type="blue" />
          <Stat icon={Map} label="Regions covered" value={counted} sub={`of ${tanzaniaRegions.length}`} type="green" />
        </div>

        <div className="risk-list">
          {[['Critical', counts.CRITICAL], ['High', counts.HIGH], ['Moderate', counts.MODERATE], ['Low', counts.LOW]].map((x) => (
            <div className="riskitem" key={x[0]}>
              <span>{x[0]}</span>
              <b>{x[1]} regions</b>
              <div><i style={{ width: `${(x[1] / (counted || 1)) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    </Generic>
  );
}


// ===============================
// EMERGENCY
// ===============================

function EmergencyPage() {
  return (
    <Generic title="Emergency" eyebrow="SAFETY GUIDANCE">
      <section className="panel compact">
        <h2>What to do during a flood warning</h2>
        <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
          <li>Move to higher ground immediately if your area shows HIGH or CRITICAL risk.</li>
          <li>Avoid walking or driving through flood water.</li>
          <li>Keep your phone charged and monitor official TMA updates.</li>
          <li>Prepare an emergency kit: water, food, torch, first aid, documents.</li>
          <li>If trapped by rising water, move to the highest level and call for help.</li>
        </ul>
        <h2 style={{ marginTop: '20px' }}>Emergency contacts</h2>
        <p className="muted">Tanzania Police Emergency: 112 / 999<br />Tanzania Red Cross Society: contact your nearest regional office</p>
      </section>
    </Generic>
  );
}


// ===============================
// SETTINGS
// ===============================

function SettingsPage({ user }) {
  const [defaultRegion, setDefaultRegion] = useState(localStorage.getItem('floodguard_default_region') || 'Mbeya');

  function saveDefault(r) {
    setDefaultRegion(r);
    localStorage.setItem('floodguard_default_region', r);
  }

  return (
    <Generic title="Settings" eyebrow="ACCOUNT & PREFERENCES">
      <section className="panel compact">
        <h2>Account</h2>
        <p className="muted">Name: {user?.name || '—'}<br />Email: {user?.email || '—'}</p>
        <h2 style={{ marginTop: '20px' }}>Default region</h2>
        <p className="muted">Used as the starting region on the Prediction page.</p>
        <select value={defaultRegion} onChange={(e) => saveDefault(e.target.value)}>
          {tanzaniaRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
      </section>
    </Generic>
  );
}


// ===============================
// AI ASSISTANT
// ===============================

function Assistant() {
  const [msgs, setMsgs] = useState([{ r: 'ai', t: 'Hello. I\u2019m AtmoNet AI. Ask me about flood risk, rainfall, water levels or safety actions.' }]);
  const [q, setQ] = useState('');

  function send() {
    if (!q.trim()) return;
    const x = q;
    setQ('');
    setMsgs((m) => [...m, { r: 'you', t: x }, { r: 'ai', t: 'Based on the current demo conditions, flood probability is 87% (HIGH). Rainfall is 82 mm and water level is 4.8 m. Please follow official emergency guidance.' }]);
  }

  return (
    <Generic title="AtmoNet AI" eyebrow="INTELLIGENT ASSISTANT">
      <section className="panel compact chat">
        <div className="messages">
          {msgs.map((m, i) => (
            <div className={`msg ${m.r}`} key={i}>
              <div>{m.r === 'ai' ? <BrainCircuit size={17} /> : <div className="avatar sm">DF</div>}</div>
              <p>{m.t}</p>
            </div>
          ))}
        </div>
        <div className="chatbox">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask: What is the current flood risk?" />
          <button className="primary" onClick={send}>Send</button>
        </div>
      </section>
    </Generic>
  );
}


// ===============================
// FLOATING WEATHER CHATBOT
// ===============================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const OFF_TOPIC_RESPONSES = [
  `I can only answer weather-related questions (rainfall, temperature, humidity, wind, or general conditions). Could you ask about one of those?`,
  `That's outside what I can help with — I'm focused on weather only. Try asking about rainfall, temperature or humidity.`,
  `Sorry, I only handle weather questions here. Ask me about rain, temperature, humidity or wind instead.`
];

function getWeatherBotReply(question, weather, city, forecast) {
  const q = question.toLowerCase();
  if (!weather) return `I'm still loading live weather data for ${city}, give me a moment and ask again.`;

  if (['forecast', 'tomorrow', 'utabiri', 'kesho', 'week', 'wiki'].some((k) => q.includes(k))) {
    if (forecast && forecast.length > 1) {
      const tomorrow = forecast[1];
      return `Tomorrow in ${city}: ${tomorrow.description}, around ${Math.round(tomorrow.tempMax)}°/${Math.round(tomorrow.tempMin)}°C, with ${tomorrow.precipitation} mm expected precipitation.`;
    }
    return `Forecast data for ${city} is still loading, try again shortly.`;
  }
  if (['rain', 'rainfall', 'mvua', 'precipitation'].some((k) => q.includes(k))) {
    return pick([`Right now in ${city}, precipitation is ${weather.precipitation} mm.`, `Current live reading for ${city}: ${weather.precipitation} mm of precipitation (${weather.description}).`]);
  }
  if (['temperature', 'temp', 'joto', 'hot', 'cold'].some((k) => q.includes(k))) {
    return pick([`The current live temperature in ${city} is ${weather.temperature}°C.`, `It's about ${weather.temperature}°C in ${city} right now (${weather.description}).`]);
  }
  if (['humidity', 'unyevu'].some((k) => q.includes(k))) {
    return pick([`Humidity in ${city} is currently ${weather.humidity}%.`, `Live humidity reading for ${city}: ${weather.humidity}%.`]);
  }
  if (['wind', 'upepo'].some((k) => q.includes(k))) {
    return pick([`Wind speed in ${city} right now is ${weather.windSpeed} km/h.`, `Current wind conditions in ${city}: ${weather.windSpeed} km/h.`]);
  }
  if (['condition', 'hali ya hewa', 'today'].some((k) => q.includes(k))) {
    return pick([`Current conditions in ${city}: ${weather.description}, ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.precipitation} mm precipitation.`, `${city} right now: ${weather.description} with ${weather.temperature}°C and ${weather.windSpeed} km/h wind.`]);
  }
  if (['hello', 'hi', 'habari', 'mambo', 'hey'].some((k) => q.includes(k))) {
    return pick([`Hello! I can answer real-time weather questions for ${city} — rainfall, temperature, humidity, wind or the 7-day forecast. What would you like to know?`, `Hi there! Ask me about the current weather or upcoming forecast in ${city}.`]);
  }
  return pick(OFF_TOPIC_RESPONSES);
}

function FloatingWeatherBot() {
  const { data: weather, city, forecast } = useWeather();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ r: 'ai', t: 'Hi! Ask me about the current weather — rainfall, temperature, humidity, wind or the 7-day forecast.' }]);
  const [q, setQ] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  function send() {
    if (!q.trim()) return;
    const question = q;
    setQ('');
    setMsgs((m) => [...m, { r: 'you', t: question }]);
    setTimeout(() => {
      const reply = getWeatherBotReply(question, weather, city, forecast);
      setMsgs((m) => [...m, { r: 'ai', t: reply }]);
    }, 400);
  }

  return (
    <div className="weatherbot-wrapper">
      {open && (
        <div className="weatherbot-panel">
          <div className="weatherbot-header">
            <div className="weatherbot-title"><CloudRain size={18} /><span>Weather Bot • {city}</span></div>
            <button className="weatherbot-close" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="weatherbot-messages">
            {msgs.map((m, i) => <div className={`weatherbot-msg ${m.r}`} key={i}><p>{m.t}</p></div>)}
            <div ref={endRef} />
          </div>
          <div className="weatherbot-input">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about rain, temperature..." />
            <button onClick={send}><Send size={16} /></button>
          </div>
        </div>
      )}
      <button className="weatherbot-fab" onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <CloudRain size={22} />}</button>
    </div>
  );
}


// ===============================
// MAIN APP
// ===============================

function App() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!user) {
    return <AuthPage onLogin={(u) => setUser(u)} theme={theme} setTheme={setTheme} />;
  }

  return (
    <WeatherProvider>
      <RegionRiskProvider>
        <RegionWeatherProvider>

          <BrowserRouter>
            <div className={`app theme-${theme}`}>

              <Sidebar open={open} setOpen={setOpen} onLogout={handleLogout} />

              <main>
                <Header setOpen={setOpen} user={user} theme={theme} setTheme={setTheme} onLogout={handleLogout} />
                <AlertBanner />

                <div className="content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/prediction" element={<Prediction />} />
                    <Route path="/weather" element={<WeatherPage />} />
                    <Route path="/water" element={<WaterLevelsPage />} />
                    <Route path="/risk" element={<RiskAreasPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/history" element={<HistoricalDataPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/emergency" element={<EmergencyPage />} />
                    <Route path="/assistant" element={<Assistant />} />
                    <Route path="/settings" element={<SettingsPage user={user} />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </div>

              </main>

              <FloatingWeatherBot />

            </div>
          </BrowserRouter>

        </RegionWeatherProvider>
      </RegionRiskProvider>
    </WeatherProvider>
  );
}

export default App;