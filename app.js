const currencies = {
  HUF: ["Węgry", "Węgierski forint", "hu"],
  EUR: ["Strefa euro", "Euro", "eu"],
  CZK: ["Czechy", "Korona czeska", "cz"],
  GBP: ["Wielka Brytania", "Funt brytyjski", "gb"],
  USD: ["Stany Zjednoczone", "Dolar amerykański", "us"],
  CHF: ["Szwajcaria", "Frank szwajcarski", "ch"],
  SEK: ["Szwecja", "Korona szwedzka", "se"],
  NOK: ["Norwegia", "Korona norweska", "no"],
  DKK: ["Dania", "Korona duńska", "dk"],
  PLN: ["Polska", "Polski złoty", "pl"],
  RON: ["Rumunia", "Lej rumuński", "ro"],
  BGN: ["Bułgaria", "Lew bułgarski", "bg"],
  RSD: ["Serbia", "Dinar serbski", "rs"],
  TRY: ["Turcja", "Lira turecka", "tr"],
  ISK: ["Islandia", "Korona islandzka", "is"],
  JPY: ["Japonia", "Jen", "jp"],
  CAD: ["Kanada", "Dolar kanadyjski", "ca"],
  AUD: ["Australia", "Dolar australijski", "au"],
  BRL: ["Brazylia", "Real brazylijski", "br"],
  CNY: ["Chiny", "Juan chiński", "cn"],
  HKD: ["Hongkong", "Dolar hongkoński", "hk"],
  IDR: ["Indonezja", "Rupia indonezyjska", "id"],
  INR: ["Indie", "Rupia indyjska", "in"],
  KRW: ["Korea Południowa", "Won południowokoreański", "kr"],
  MXN: ["Meksyk", "Peso meksykańskie", "mx"],
  MYR: ["Malezja", "Ringgit malezyjski", "my"],
  NZD: ["Nowa Zelandia", "Dolar nowozelandzki", "nz"],
  SGD: ["Singapur", "Dolar singapurski", "sg"],
  THB: ["Tajlandia", "Baht tajlandzki", "th"],
  ZAR: ["Republika Południowej Afryki", "Rand południowoafrykański", "za"],
};

const countryCurrencies = {
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR", FR: "EUR", GR: "EUR",
  IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR", LV: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR",
  SK: "EUR", HR: "EUR", HU: "HUF", CZ: "CZK", GB: "GBP", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  PL: "PLN", US: "USD", RO: "RON", BG: "BGN", RS: "RSD", TR: "TRY", IS: "ISK", JP: "JPY", CA: "CAD", AU: "AUD",
  BR: "BRL", CN: "CNY", HK: "HKD", ID: "IDR", IN: "INR", KR: "KRW", MX: "MXN", MY: "MYR", NZ: "NZD", SG: "SGD",
  TH: "THB", ZA: "ZAR",
};

const state = { rates: {}, selectedCurrency: null, isLoading: false, locationReady: false };
const history = JSON.parse(localStorage.getItem("price-history") || "[]");
const amountInput = document.querySelector("#amount");
const currencySelect = document.querySelector("#currency");
const currencyFlag = document.querySelector("#currency-flag");
const convertedPrice = document.querySelector("#converted-price");
const rateNote = document.querySelector("#rate-note");
const rateStatus = document.querySelector("#rate-status");
const locationLabel = document.querySelector("#location-label");
const updatedAt = document.querySelector("#updated-at");
let locationRequestInProgress = false;
currencyFlag.hidden = true;

const locationPlaceholder = document.createElement("option");
locationPlaceholder.value = "";
locationPlaceholder.textContent = "Ustalanie lokalizacji…";
locationPlaceholder.disabled = true;
locationPlaceholder.selected = true;
currencySelect.append(locationPlaceholder);
Object.entries(currencies).forEach(([code, name]) => {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = `${code} · ${name[0]}`;
  option.title = name[1];
  currencySelect.append(option);
});
currencySelect.disabled = true;

function updateCurrencyFlag() {
  const code = state.selectedCurrency;
  const countryCode = currencies[code]?.[2];
  if (!countryCode) {
    currencyFlag.hidden = true;
    return;
  }
  currencyFlag.src = `https://flagcdn.com/w40/${countryCode}.png`;
  currencyFlag.alt = `Flaga: ${currencies[code][0]}`;
  currencyFlag.hidden = false;
}

function formatPrice(value) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(value);
}

function renderConversion() {
  const amount = Number.parseFloat(amountInput.value);
  const rate = state.rates[state.selectedCurrency];
  if (!Number.isFinite(amount) || amount < 0 || !rate) {
    convertedPrice.textContent = "— zł";
    return;
  }
  convertedPrice.textContent = formatPrice(amount * rate);
  rateNote.textContent = `1 ${state.selectedCurrency} = ${rate.toLocaleString("pl-PL", { maximumFractionDigits: 4 })} PLN`;
}

function renderHistory() {
  const list = document.querySelector("#history-list");
  if (!history.length) {
    list.innerHTML = '<p class="empty-state">Twoje ostatnie przeliczenia pojawią się tutaj.</p>';
    return;
  }
  list.innerHTML = history.map((item) => `
    <button class="history-entry" type="button" data-history-amount="${item.amount}" data-history-currency="${item.currency}">
      <span><strong>${item.amount} ${item.currency}</strong><br><small>${item.name}</small></span>
      <strong>${formatPrice(item.converted)}</strong>
    </button>
  `).join("");
  list.querySelectorAll("[data-history-amount]").forEach((entry) => {
    entry.addEventListener("click", () => {
      amountInput.value = entry.dataset.historyAmount;
      state.selectedCurrency = entry.dataset.historyCurrency;
      currencySelect.value = state.selectedCurrency;
      renderConversion();
    });
  });
}

function saveHistory() {
  const amount = Number.parseFloat(amountInput.value);
  const rate = state.rates[state.selectedCurrency];
  if (!Number.isFinite(amount) || amount < 0 || !rate) return;
  const item = { amount, currency: state.selectedCurrency, converted: amount * rate, name: currencies[state.selectedCurrency][1] };
  history.unshift(item);
  history.splice(5);
  localStorage.setItem("price-history", JSON.stringify(history));
  renderHistory();
}

function setRateError(message) {
  rateStatus.className = "status-dot error";
  rateNote.textContent = message;
  convertedPrice.textContent = "— zł";
}

function setLocationStatus(message) {
  locationLabel.textContent = message;
  document.querySelector("#location-button").setAttribute("aria-label", message);
}

async function detectCurrencyFromGps() {
  if (!window.isSecureContext) {
    setLocationStatus("GPS wymaga HTTPS · otwórz bezpieczny adres");
    console.error("Geolocation requires a secure context. Use HTTPS or localhost.");
    return;
  }
  if (!navigator.geolocation) {
    setLocationStatus("GPS nie jest dostępny w tej przeglądarce");
    return;
  }
  if (locationRequestInProgress) return;
  locationRequestInProgress = true;
  setLocationStatus("Pobieram lokalizację GPS…");
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=pl`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const place = await response.json();
      const countryCode = place.countryCode?.toUpperCase();
      const currency = countryCurrencies[countryCode];
      if (!currency) {
        setLocationStatus(`${place.countryName || "Nieobsługiwany kraj"} · wybierz walutę ręcznie`);
        currencySelect.disabled = false;
        return;
      }
      state.selectedCurrency = currency;
      state.locationReady = true;
      currencySelect.value = currency;
      currencySelect.disabled = false;
      updateCurrencyFlag();
      locationLabel.textContent = `${place.countryName || currencies[currency][0]} · GPS`;
      renderConversion();
    } catch (error) {
      setLocationStatus("Nie udało się rozpoznać kraju · dotknij, aby ponowić");
      console.error("Nie udało się rozpoznać kraju z GPS:", error);
    } finally {
      locationRequestInProgress = false;
    }
  }, (error) => {
    const messages = {
      1: "Włącz lokalizację dla Safari i kliknij tutaj ponownie",
      2: "Nie można ustalić pozycji · dotknij, aby ponowić",
      3: "GPS działa zbyt długo · dotknij, aby ponowić",
    };
    const message = messages[error.code] || "GPS niedostępny · dotknij, aby ponowić";
    setLocationStatus(message);
    console.error("Nie udało się pobrać lokalizacji GPS:", error);
    locationRequestInProgress = false;
  }, { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 });
}

async function loadRates() {
  state.isLoading = true;
  rateStatus.className = "status-dot";
  rateNote.textContent = "Pobieram aktualny kurs…";
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=PLN");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.rates = Object.fromEntries(Object.entries(data.rates).map(([code, value]) => [code, 1 / value]));
    state.rates.PLN = 1;
    rateStatus.className = "status-dot ready";
    updatedAt.textContent = `Kursy zaktualizowane: ${new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
    renderConversion();
  } catch (error) {
    setRateError("Nie udało się pobrać kursu. Sprawdź połączenie i spróbuj ponownie.");
    console.error("Nie udało się pobrać kursów walut:", error);
  } finally {
    state.isLoading = false;
  }
}

currencySelect.addEventListener("change", (event) => {
  state.selectedCurrency = event.target.value;
  currencySelect.disabled = false;
  updateCurrencyFlag();
  renderConversion();
});
amountInput.addEventListener("input", renderConversion);
amountInput.addEventListener("change", saveHistory);
document.querySelectorAll("[data-amount]").forEach((button) => {
  button.addEventListener("click", () => {
    amountInput.value = button.dataset.amount;
    renderConversion();
  });
});
document.querySelector("#refresh-rates").addEventListener("click", loadRates);
document.querySelector("#location-button").addEventListener("click", detectCurrencyFromGps);
document.querySelector("#clear-history").addEventListener("click", () => {
  history.length = 0;
  localStorage.removeItem("price-history");
  renderHistory();
});
document.querySelector("#theme-toggle").addEventListener("click", (event) => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("dark-mode", dark ? "1" : "0");
  event.currentTarget.textContent = dark ? "☀" : "☾";
  event.currentTarget.title = dark ? "Włącz tryb jasny" : "Włącz tryb ciemny";
});
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.querySelector(`#${item.dataset.view}`);
    if (!target) return;
    document.querySelectorAll(".app-view").forEach((view) => view.classList.remove("active"));
    target.classList.add("active");
    document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
    if (item.dataset.view === "camera-view-page") {
      document.body.classList.add("camera-mode");
      startCamera();
    } else {
      document.body.classList.remove("camera-mode");
      stopCamera();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", item.getAttribute("href"));
  });
});

let cameraStream;
const cameraView = document.querySelector("#camera-view");
const cameraVideo = document.querySelector("#camera-video");
const arResult = document.querySelector("#ar-result");
const ocrCanvas = document.createElement("canvas");
let ocrTimer;
let ocrInProgress = false;
let lastOcrCandidate = null;
let ocrCandidateCount = 0;
let ocrWorkerPromise;

function parseOcrPrice(result) {
  const words = (result.data.words || [])
    .map((word) => {
      const value = word.text.replace(",", ".").replace(/[^\d.]/g, "");
      const amount = Number.parseFloat(value);
      const height = word.bbox ? word.bbox.y1 - word.bbox.y0 : 0;
      return { amount, height, hasDecimal: /^\d{1,4}\.\d{1,2}$/.test(value) };
    })
    .filter(({ amount, height }) => Number.isFinite(amount) && amount > 0 && amount <= 5000 && height > 10);
  const decimalPrices = words.filter(({ hasDecimal }) => hasDecimal);
  const candidates = decimalPrices.length ? decimalPrices : words;
  return candidates.sort((left, right) => right.height - left.height)[0]?.amount || null;
}

async function scanCameraFrame() {
  if (ocrInProgress || !cameraStream || !window.Tesseract || cameraVideo.readyState < 2) return;
  ocrInProgress = true;
  try {
    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;
    const cropX = Math.round(width * 0.12);
    const cropY = Math.round(height * 0.28);
    const cropWidth = Math.round(width * 0.76);
    const cropHeight = Math.round(height * 0.38);
    ocrCanvas.width = Math.min(cropWidth * 2, 1600);
    ocrCanvas.height = Math.min(cropHeight * 2, 1000);
    const context = ocrCanvas.getContext("2d", { willReadFrequently: true });
    context.filter = "grayscale(1) contrast(1.8)";
    context.drawImage(cameraVideo, cropX, cropY, cropWidth, cropHeight, 0, 0, ocrCanvas.width, ocrCanvas.height);
    const worker = await getOcrWorker();
    const result = await worker.recognize(ocrCanvas);
    const confidence = result.data.confidence || 0;
    const amount = parseOcrPrice(result);
    const rate = state.rates[state.selectedCurrency];
    if (amount === null || confidence < 20) {
      lastOcrCandidate = null;
      ocrCandidateCount = 0;
      arResult.hidden = true;
      document.querySelector("#camera-message").textContent = "Szukam ceny…";
      return;
    }
    if (amount === lastOcrCandidate) {
      ocrCandidateCount += 1;
    } else {
      lastOcrCandidate = amount;
      ocrCandidateCount = 1;
    }
    if (ocrCandidateCount >= 2) {
      const converted = rate ? `<small>≈ ${formatPrice(amount * rate)}</small>` : "<small>Ustal lokalizację, aby przeliczyć</small>";
      arResult.innerHTML = `${amount}${state.selectedCurrency ? ` ${state.selectedCurrency}` : ""}${converted}`;
      arResult.hidden = false;
      document.querySelector("#camera-message").textContent = "Cena rozpoznana";
    }
  } catch (error) {
    console.error("OCR nie zadziałał dla klatki kamery:", error);
  } finally {
    ocrInProgress = false;
  }
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = window.Tesseract.createWorker("eng", 1, { logger: () => {} })
      .then(async (worker) => {
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789,.",
          tessedit_pageseg_mode: "6",
        });
        return worker;
      });
  }
  return ocrWorkerPromise;
}

function startOcr() {
  clearInterval(ocrTimer);
  document.querySelector("#camera-message").textContent = "Skanuję cenę…";
  ocrTimer = window.setInterval(scanCameraFrame, 1800);
  scanCameraFrame();
}

async function startCamera() {
  const cameraMessage = document.querySelector("#camera-message");
  if (!cameraView || !cameraVideo || !cameraMessage) {
    console.error("Widok aparatu nie jest gotowy.");
    return false;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.textContent = "Aparat nie jest dostępny w tej przeglądarce.";
    cameraView.hidden = false;
    return false;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraView.hidden = false;
    document.querySelector("#camera-button").textContent = "Zamknij obiektyw";
    startOcr();
    return true;
  } catch (error) {
    cameraMessage.textContent = "Brak dostępu do aparatu. Zezwól na dostęp i spróbuj ponownie.";
    cameraView.hidden = false;
    console.error("Nie udało się uruchomić aparatu:", error);
    return false;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = undefined;
  }
  cameraVideo.srcObject = null;
  cameraView.hidden = true;
  arResult.hidden = true;
  clearInterval(ocrTimer);
  if (ocrWorkerPromise) {
    ocrWorkerPromise.then((worker) => worker.terminate()).catch((error) => console.error("Nie udało się zamknąć OCR:", error));
    ocrWorkerPromise = undefined;
  }
  document.querySelector("#camera-button").textContent = "Uruchom aparat";
}

document.querySelector("#camera-button").addEventListener("click", async () => {
  if (cameraStream) {
    stopCamera();
    return;
  }
  await startCamera();
});
document.querySelector("#camera-back").addEventListener("click", () => {
  stopCamera();
  document.querySelector('[data-view="calculator-view"]').click();
});

if (localStorage.getItem("dark-mode") === "1") {
  document.body.classList.add("dark");
  document.querySelector("#theme-toggle").textContent = "☀";
}
renderHistory();
window.setTimeout(detectCurrencyFromGps, 250);
loadRates();
const initialView = document.querySelector(`[data-view="${window.location.hash.slice(1)}"]`);
if (initialView) initialView.click();
