"use strict";

const APP_VERSION = "1.4.1";
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const UPDATE_CHECK_MS = 60 * 60 * 1000;

const I18N = {
  en: {
    tab_rates: "Rates", tab_convert: "Convert", tab_gold: "Gold", tab_crypto: "Crypto",
    profile_title: "Profile & Settings", my_settings: "My settings", open_profile: "Open profile and settings",
    notification_settings: "Notification settings", preferences: "Preferences", appearance: "Appearance",
    updates: "App updates", check_updates: "Check for updates", checking_updates: "Checking for updates…",
    up_to_date: "You're using the latest version.", update_available: "A new version is ready.",
    install_update: "Update and reload", update_ready_sub: "Reload MM Rates to use the newest version.",
    update_error: "Couldn't check for updates. Try again when you're online.", current_version: "Current version",
    usd_market: "USD / MMK · market", official: "CBM official reference", buy: "buy", sell: "sell",
    updated: "Data updated", loading: "Loading rates…", saved: "saved",
    offline: "Can't reach the server. Pull down or tap to retry.", offline_saved: "Offline · showing saved rates from",
    syncing: "Checking sources for newer rates…", synced: "Price changes received", no_newer: "No newer prices were available",
    already_fresh: "Sources were checked recently", partial_sync: "Some sources could not update", all_sources_failed: "No source could update — showing saved rates",
    sync: "Refresh", sync_now: "Refresh prices", sync_now_sub: "Checks sources only when stored rates are old enough.",
    pull_to_refresh: "Pull to refresh", release_to_refresh: "Release to refresh", pull_refreshing: "Refreshing prices…",
    sync_failed: "Refresh failed. Your saved rates remain available.", no_history: "Not enough history yet — the chart fills in as data keeps collecting.",
    amount: "Amount", currency: "Currency", result: "Estimated result", to_mmk: "Foreign → MMK", from_mmk: "MMK → foreign", swap: "Swap direction",
    using_buy: "Uses the market buy rate", using_sell: "Uses the market sell rate", using_mid: "Buy/sell unavailable, so the midpoint is used",
    convert_note: "Reference estimate only. The final transaction rate and fees can differ.",
    gold_ygn: "Yangon gold · per kyattha", gold_world: "World gold · per oz (PAXG proxy)",
    gold_note: "Yangon gold and the world proxy measure different markets and units, so they should not match.",
    disclaimer: "Aggregated public reference rates. For information only — not a transaction quote.",
    set_name: "Set your name", on_device: "Saved on this device only", edit: "Edit", save_name: "Save", cancel: "Cancel", name_label: "Display name",
    notifications: "Notifications", noti_daily: "Daily rate summary", noti_coming: "Coming soon", noti_coming_sub: "Push delivery is not enabled yet. This control will appear after secure server subscriptions are ready.",
    contact_title: "Developer", contact_web: "Website", contact_mail: "Email", contact_report: "Report a wrong rate", developer_role: "Developer & maintainer",
    data_sync: "Data & freshness", auto_refresh: "Automatic screen refresh", every_five: "Every 5 minutes while the app is open",
    last_update: "Newest stored price", connection: "Connection", online: "Online", offline_status: "Offline", data_sources: "Data sources",
    auto_refresh_on: "Automatic screen refresh is on", auto_refresh_off: "Automatic screen refresh is off",
    language_action: "Switch language", theme_action: "Change appearance", share_app: "Share MM Rates", share_app_sub: "Send the app link to friends.",
    copied_link: "App link copied", share_failed: "Could not share the app link.", app_type: "App type", pwa: "Installable web app",
    app_title: "About", app_lang: "Language", theme_system: "System", theme_light: "Light", theme_dark: "Dark",
    privacy: "Privacy policy", methodology: "Data methodology", fresh: "Fresh", delayed: "Delayed", stale: "Stale", unavailable: "Unavailable",
    source_market: "Automatic market feed", source_cbm: "CBM official", source_coingecko: "Crypto & gold proxy", source_binance: "Binance P2P reference",
    source_manual_market: "Manually verified market rates", source_manual_gold: "Manual Yangon gold", source_time: "Source time", checked_time: "Checked", check_failed: "Latest check failed",
    market_unavailable: "Market rates are temporarily unavailable", market_unavailable_sub: "The automatic feed is outdated or unavailable. Official, P2P, gold, and crypto references may still be shown.", no_convert_rates: "No usable market rate is currently available for conversion.",
    chart_title: "Price history", chart_desc: "A line chart showing the selected rate over the chosen period.",
    pairs: {
      USD_MMK_MARKET: "USD / MMK", USD_MMK_OFFICIAL: "USD / MMK (CBM)", THB_MMK_MARKET: "THB / MMK",
      SGD_MMK_MARKET: "SGD / MMK", EUR_MMK_MARKET: "EUR / MMK", MYR_MMK_MARKET: "MYR / MMK",
      JPY_MMK_MARKET: "JPY / MMK", CNY_MMK_MARKET: "CNY / MMK", KRW_MMK_MARKET: "KRW / MMK",
      USDT_MMK_P2P: "USDT / MMK · P2P", BTC_USD: "BTC / USD", ETH_USD: "ETH / USD",
      USDT_USD: "USDT / USD", XAU_USD_PROXY: "Gold (world proxy)", GOLD_YGN_KYATTHA: "Yangon gold",
    },
  },
  my: {
    tab_rates: "ဈေးနှုန်း", tab_convert: "ငွေလဲ", tab_gold: "ရွှေ", tab_crypto: "ခရစ်ပတို",
    profile_title: "ပရိုဖိုင်နှင့် ဆက်တင်များ", my_settings: "ကျွန်ုပ်၏ ဆက်တင်များ", open_profile: "ပရိုဖိုင်နှင့် ဆက်တင်များ ဖွင့်ရန်",
    notification_settings: "အသိပေးချက် ဆက်တင်များ", preferences: "စိတ်ကြိုက်ဆက်တင်များ", appearance: "မြင်ကွင်း",
    updates: "အက်ပ် အပ်ဒိတ်များ", check_updates: "အပ်ဒိတ် စစ်ရန်", checking_updates: "အပ်ဒိတ် စစ်နေသည်…",
    up_to_date: "နောက်ဆုံးဗားရှင်းကို အသုံးပြုနေပါသည်။", update_available: "ဗားရှင်းအသစ် ရရှိနေပါပြီ။",
    install_update: "အပ်ဒိတ်လုပ်ပြီး ပြန်ဖွင့်ရန်", update_ready_sub: "နောက်ဆုံးဗားရှင်းအသုံးပြုရန် MM Rates ကို ပြန်ဖွင့်ပါ။",
    update_error: "အပ်ဒိတ် စစ်၍မရပါ။ အွန်လိုင်းဖြစ်ချိန် ပြန်စမ်းပါ။", current_version: "လက်ရှိဗားရှင်း",
    usd_market: "ဒေါ်လာ / ကျပ် · ပြင်ပပေါက်ဈေး", official: "ဗဟိုဘဏ် ရည်ညွှန်းနှုန်း", buy: "ဝယ်", sell: "ရောင်း",
    updated: "ဒေတာနောက်ဆုံးရ", loading: "ဈေးနှုန်းများ ရယူနေသည်…", saved: "သိမ်းထားသော",
    offline: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ ပြန်စမ်းရန် နှိပ်ပါ။", offline_saved: "အော့ဖ်လိုင်း · သိမ်းထားသောဈေးနှုန်းအချိန်",
    syncing: "ရင်းမြစ်များမှ ဈေးနှုန်းအသစ် စစ်နေသည်…", synced: "ဈေးနှုန်းပြောင်းလဲမှု ရရှိပြီ", no_newer: "ဈေးနှုန်းအသစ် မရရှိသေးပါ",
    already_fresh: "ရင်းမြစ်များကို မကြာသေးမီက စစ်ပြီးပါပြီ", partial_sync: "ရင်းမြစ်အချို့ကို အပ်ဒိတ်မလုပ်နိုင်ပါ", all_sources_failed: "မည်သည့်ရင်းမြစ်မှ အပ်ဒိတ်မရပါ — သိမ်းထားသောဈေးနှုန်းများကို ပြထားသည်",
    sync: "ပြန်ရယူ", sync_now: "ဈေးနှုန်း ပြန်ရယူရန်", sync_now_sub: "သိမ်းထားသောဈေးနှုန်း အချိန်ကြာမှသာ ရင်းမြစ်များကို စစ်ပါမည်။",
    pull_to_refresh: "ပြန်ရယူရန် အောက်ဆွဲပါ", release_to_refresh: "ပြန်ရယူရန် လွှတ်ပါ", pull_refreshing: "ဈေးနှုန်းများ ပြန်ရယူနေသည်…",
    sync_failed: "ပြန်ရယူ၍မရပါ။ သိမ်းထားသောဈေးနှုန်းများ ဆက်ကြည့်နိုင်သည်။", no_history: "မှတ်တမ်း မလုံလောက်သေးပါ — အချက်အလက် ဆက်စုနေပါသည်။",
    amount: "ပမာဏ", currency: "ငွေကြေး", result: "ခန့်မှန်းရလဒ်", to_mmk: "နိုင်ငံခြားငွေ → ကျပ်", from_mmk: "ကျပ် → နိုင်ငံခြားငွေ", swap: "ဦးတည်ရာ ပြောင်းရန်",
    using_buy: "ဈေးကွက် ဝယ်ဈေးဖြင့် တွက်ထားသည်", using_sell: "ဈေးကွက် ရောင်းဈေးဖြင့် တွက်ထားသည်", using_mid: "ဝယ်/ရောင်းဈေးမရှိ၍ အလယ်နှုန်းသုံးထားသည်",
    convert_note: "ရည်ညွှန်းခန့်မှန်းချက်သာ ဖြစ်သည်။ အမှန်တကယ်နှုန်းနှင့် ဝန်ဆောင်ခ ကွာနိုင်သည်။",
    gold_ygn: "ရန်ကုန် ရွှေဈေး · တစ်ကျပ်သား", gold_world: "ကမ္ဘာ့ရွှေဈေး · တစ်အောင်စ (PAXG)",
    gold_note: "ရန်ကုန်ရွှေနှင့် ကမ္ဘာ့ proxy တို့သည် ဈေးကွက်နှင့် ယူနစ်မတူသောကြောင့် တူညီမည်မဟုတ်ပါ။",
    disclaimer: "အများသုံးရင်းမြစ်များမှ စုစည်းထားသော ရည်ညွှန်းဈေးနှုန်းများသာ ဖြစ်ပြီး အရောင်းအဝယ်ကမ်းလှမ်းချက် မဟုတ်ပါ။",
    set_name: "အမည် သတ်မှတ်ရန်", on_device: "ဤစက်ထဲတွင်သာ သိမ်းထားသည်", edit: "ပြင်ရန်", save_name: "သိမ်းရန်", cancel: "မလုပ်တော့", name_label: "ပြသမည့်အမည်",
    notifications: "အသိပေးချက်များ", noti_daily: "နေ့စဉ် ဈေးနှုန်း အနှစ်ချုပ်", noti_coming: "မကြာမီ", noti_coming_sub: "Push ပို့ခြင်း မဖွင့်ရသေးပါ။ လုံခြုံသော server subscription ပြီးလျှင် ဖွင့်နိုင်မည်။",
    contact_title: "ဖန်တီးသူ", contact_web: "ဝက်ဘ်ဆိုက်", contact_mail: "အီးမေးလ်", contact_report: "ဈေးနှုန်း မှားနေကြောင်း အကြောင်းကြားရန်", developer_role: "ဖန်တီးသူနှင့် ထိန်းသိမ်းသူ",
    data_sync: "ဒေတာနှင့် နောက်ဆုံးရအခြေအနေ", auto_refresh: "မျက်နှာပြင် အလိုအလျောက်ပြန်ရယူခြင်း", every_five: "အက်ပ်ဖွင့်ထားစဉ် ၅ မိနစ်တိုင်း",
    last_update: "သိမ်းထားသော နောက်ဆုံးဈေးနှုန်း", connection: "ချိတ်ဆက်မှု", online: "အွန်လိုင်း", offline_status: "အော့ဖ်လိုင်း", data_sources: "ဒေတာရင်းမြစ်များ",
    auto_refresh_on: "မျက်နှာပြင် အလိုအလျောက်ပြန်ရယူခြင်း ဖွင့်ထားသည်", auto_refresh_off: "မျက်နှာပြင် အလိုအလျောက်ပြန်ရယူခြင်း ပိတ်ထားသည်",
    language_action: "ဘာသာစကား ပြောင်းရန်", theme_action: "မြင်ကွင်း ပြောင်းရန်", share_app: "MM Rates ကို မျှဝေရန်", share_app_sub: "အက်ပ်လင့်ခ်ကို မိတ်ဆွေများထံ ပို့ပါ။",
    copied_link: "အက်ပ်လင့်ခ် ကူးပြီးပါပြီ", share_failed: "အက်ပ်လင့်ခ်ကို မျှဝေ၍မရပါ။", app_type: "အက်ပ်အမျိုးအစား", pwa: "ထည့်သွင်းနိုင်သော ဝဘ်အက်ပ်",
    app_title: "အကြောင်း", app_lang: "ဘာသာစကား", theme_system: "စက်အလိုက်", theme_light: "အလင်း", theme_dark: "အမှောင်",
    privacy: "ကိုယ်ရေးအချက်အလက် မူဝါဒ", methodology: "ဒေတာရယူပုံ", fresh: "အသစ်", delayed: "နောက်ကျ", stale: "အချိန်ကြာ", unavailable: "မရရှိ",
    source_market: "အလိုအလျောက် ပြင်ပပေါက်ဈေးရင်းမြစ်", source_cbm: "ဗဟိုဘဏ်", source_coingecko: "ခရစ်ပတိုနှင့် ရွှေ proxy", source_binance: "Binance P2P ရည်ညွှန်း",
    source_manual_market: "လက်ဖြင့်အတည်ပြုထားသော ပေါက်ဈေး", source_manual_gold: "လက်ဖြင့်ထည့်သွင်းထားသော ရန်ကုန်ရွှေ", source_time: "ရင်းမြစ်အချိန်", checked_time: "စစ်ဆေးချိန်", check_failed: "နောက်ဆုံးစစ်ဆေးမှု မအောင်မြင်ပါ",
    market_unavailable: "ပြင်ပပေါက်ဈေး ယာယီမရရှိနိုင်ပါ", market_unavailable_sub: "အလိုအလျောက်ရင်းမြစ်သည် အချိန်ဟောင်းနေခြင်း သို့မဟုတ် မရရှိခြင်း ဖြစ်နိုင်သည်။ ဗဟိုဘဏ်၊ P2P၊ ရွှေနှင့် ခရစ်ပတို ရည်ညွှန်းနှုန်းများကို ဆက်ပြနိုင်ပါသည်။", no_convert_rates: "ငွေလဲတွက်ရန် အသုံးပြုနိုင်သော ပေါက်ဈေး မရှိသေးပါ။",
    chart_title: "ဈေးနှုန်းမှတ်တမ်း", chart_desc: "ရွေးချယ်ထားသောကာလအတွင်း ဈေးနှုန်းပြောင်းလဲမှုကို ပြသော လိုင်းဇယား။",
    pairs: {
      USD_MMK_MARKET: "ဒေါ်လာ / ကျပ်", USD_MMK_OFFICIAL: "ဒေါ်လာ / ကျပ် (ဗဟိုဘဏ်)", THB_MMK_MARKET: "ဘတ် / ကျပ်",
      SGD_MMK_MARKET: "စင်္ကာပူဒေါ်လာ / ကျပ်", EUR_MMK_MARKET: "ယူရို / ကျပ်", MYR_MMK_MARKET: "ရင်းဂစ် / ကျပ်",
      JPY_MMK_MARKET: "ယန်း / ကျပ်", CNY_MMK_MARKET: "ယွမ် / ကျပ်", KRW_MMK_MARKET: "ဝမ် / ကျပ်",
      USDT_MMK_P2P: "USDT / ကျပ် · P2P", BTC_USD: "BTC / ဒေါ်လာ", ETH_USD: "ETH / ဒေါ်လာ",
      USDT_USD: "USDT / ဒေါ်လာ", XAU_USD_PROXY: "ကမ္ဘာ့ရွှေ proxy", GOLD_YGN_KYATTHA: "ရန်ကုန်ရွှေ",
    },
  },
};

const state = {
  lang: localStorage.getItem("lang") || "en",
  themeMode: localStorage.getItem("themeMode") || localStorage.getItem("theme") || "system",
  tab: "rates",
  rates: {},
  sources: [],
  dataUpdatedAt: null,
  dataCollectedAt: null,
  coreUpdatedAt: null,
  serverTime: null,
  loaded: false,
  error: false,
  offlineSnapshot: false,
  convert: { amount: "100", pair: "USD_MMK_MARKET", toMMK: true },
  profileName: localStorage.getItem("profileName") || "",
  editingName: false,
  autoRefreshOn: localStorage.getItem("autoRefreshOn") !== "0",
  updateAvailable: false,
  updateStatus: "",
  swRegistration: null,
  sheetPair: null,
  sheetRange: "24h",
  syncBusy: false,
  bannerMessage: "",
  modalReturnFocus: null,
};

const $ = (selector) => document.querySelector(selector);
const t = (key) => I18N[state.lang][key] || key;
const pairName = (pair) => I18N[state.lang].pairs[pair] || pair.replaceAll("_", " / ");
const sourceNames = { "market-rates": "source_market", "myanmar-currency-api": "source_market", "cbm-official": "source_cbm", cbm: "source_cbm", coingecko: "source_coingecko", "binance-p2p": "source_binance", "manual-market": "source_manual_market", "manual-gold": "source_manual_gold", manual: "source_manual_gold" };
const mediaDark = matchMedia("(prefers-color-scheme: dark)");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function fmt(value) {
  if (!Number.isFinite(Number(value))) return "—";
  const number = Number(value);
  const digits = Math.abs(number) >= 1000 ? 0 : 2;
  return number.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtCompact(value) {
  const number = Number(value);
  return number >= 1e6 ? `${(number / 1e6).toFixed(2)}M` : fmt(number);
}

function relativeTime(timestamp) {
  if (!timestamp) return t("unavailable");
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return state.lang === "my" ? "ယခု" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return state.lang === "my" ? `${minutes} မိနစ်အကြာ` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return state.lang === "my" ? `${hours} နာရီအကြာ` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return state.lang === "my" ? `${days} ရက်အကြာ` : `${days}d ago`;
}

function rateTimestamp(rate) {
  if (!rate) return null;
  return rate.effective_at || rate.source_published_at || rate.fetched_at || rate.collected_at || null;
}

function freshness(value) {
  if (value && typeof value === "object" && value.freshness) {
    const key = ["fresh", "delayed", "stale"].includes(value.freshness) ? value.freshness : "unavailable";
    return { key, className: key };
  }
  const timestamp = typeof value === "object" ? rateTimestamp(value) : value;
  if (!timestamp) return { key: "unavailable", className: "unavailable" };
  const age = Date.now() - timestamp;
  if (age < 45 * 60 * 1000) return { key: "fresh", className: "fresh" };
  if (age < 2 * 60 * 60 * 1000) return { key: "delayed", className: "delayed" };
  return { key: "stale", className: "stale" };
}

function freshnessBadge(value, compact = false) {
  const status = freshness(value);
  return `<span class="freshness ${status.className}"><span class="freshness-dot"></span>${compact ? "" : t(status.key)}</span>`;
}

function rateTimeDetails(rate) {
  if (!rate) return "";
  const sourceAt = rateTimestamp(rate);
  const checkedAt = rate.collected_at || null;
  if (!rate.source_published_at || rate.timestamp_kind === "collected") {
    return `${t("checked_time")} ${relativeTime(checkedAt || sourceAt)}`;
  }
  const sourceText = `${t("source_time")} ${relativeTime(sourceAt)}`;
  if (!checkedAt || Math.abs(checkedAt - sourceAt) < 60_000) return sourceText;
  return `${sourceText} · ${t("checked_time")} ${relativeTime(checkedAt)}`;
}

function sourceLabel(source) {
  return t(sourceNames[source] || source);
}

function pctSpan(change) {
  if (!change || !Number.isFinite(change.pct)) return "";
  const className = change.pct >= 0 ? "up" : "down";
  const sign = change.pct >= 0 ? "+" : "";
  return `<span class="pct ${className}">${sign}${change.pct.toFixed(2)}%</span>`;
}

function effectiveTheme() {
  if (state.themeMode === "system") return mediaDark.matches ? "dark" : "light";
  return state.themeMode;
}

function themeLabel() {
  if (state.themeMode === "system") return t("theme_system");
  return state.themeMode === "dark" ? t("theme_dark") : t("theme_light");
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "👤";
  return parts.slice(0, 2).map((part) => [...part][0].toUpperCase()).join("");
}

function applyChrome() {
  document.documentElement.dataset.theme = effectiveTheme();
  document.documentElement.lang = state.lang === "my" ? "my" : "en";
  $("#syncLabel").textContent = t("sync");
  $("#syncBtn").setAttribute("aria-label", t("sync_now"));
  $("#notiBtn").setAttribute("aria-label", t("notification_settings"));
  $("#profileBtn").setAttribute("aria-label", t("open_profile"));
  $("#headerInitials").textContent = initials(state.profileName);
  $("#notiBadge").hidden = true;
  $("#profileUpdateBadge").hidden = !state.updateAvailable;
  $("#profileEyebrow").textContent = t("my_settings");
  $("#profileTitle").textContent = t("profile_title");
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  if (!document.body.classList.contains("pulling")) $("#pullRefreshText").textContent = t("pull_to_refresh");

  const line = $("#updatedLine");
  if (state.bannerMessage) {
    line.hidden = false;
    line.classList.remove("offline-line");
    line.textContent = state.bannerMessage;
  } else if (state.dataUpdatedAt) {
    line.hidden = false;
    line.classList.toggle("offline-line", state.offlineSnapshot || !navigator.onLine);
    const prefix = state.offlineSnapshot || !navigator.onLine ? t("offline_saved") : t("updated");
    line.textContent = `${prefix} ${new Date(state.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${relativeTime(state.dataUpdatedAt)}`;
  } else {
    line.hidden = true;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
  const json = await response.json();
  return { json, offline: response.headers.get("x-mm-rates-offline") === "1" };
}

function applyRatesPayload(json, offline = false) {
  if (!Array.isArray(json.rates)) throw new Error("invalid rates payload");
  state.rates = Object.fromEntries(json.rates.map((rate) => [rate.pair, rate]));
  state.sources = Array.isArray(json.sources) ? json.sources : [];
  state.dataUpdatedAt = json.data_updated_at || null;
  state.dataCollectedAt = json.data_collected_at || null;
  state.coreUpdatedAt = json.core_updated_at || null;
  state.serverTime = json.server_time || null;
  state.offlineSnapshot = offline;
  state.loaded = true;
  state.error = false;
}

async function loadRates() {
  try {
    const { json, offline } = await fetchJson("/v1/latest", { cache: "no-store" });
    applyRatesPayload(json, offline);
  } catch {
    state.error = true;
  }
  applyChrome();
  render();
  refreshOpenProfile();
}

function sparkline(points, width, height, stroke) {
  if (!points || points.length < 2) return "";
  const values = points.map((point) => point.mid);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const path = values.map((value, index) => `${index ? "L" : "M"}${(index * step).toFixed(1)},${(height - 4 - ((value - min) / span) * (height - 8)).toFixed(1)}`).join("");
  return `<svg class="board-spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function rateMeta(rate, inverse = false) {
  if (!rate) return "";
  return `<span class="rate-meta">${freshnessBadge(rate)}<span>${rateTimeDetails(rate)}</span>${inverse ? "" : `<span>${escapeHTML(sourceLabel(rate.source))}</span>`}</span>`;
}

function rateCard(rate) {
  const goldClass = rate.pair === "GOLD_YGN_KYATTHA" ? " gold-card" : "";
  const value = rate.pair === "GOLD_YGN_KYATTHA" ? fmtCompact(rate.mid) : fmt(rate.mid);
  return `<button class="card${goldClass}" data-pair="${rate.pair}">
    <span class="card-head"><span class="k">${pairName(rate.pair)}</span>${freshnessBadge(rate, true)}</span>
    <span class="v">${value}</span><span class="card-bottom">${pctSpan(rate.change24h)}<span>${relativeTime(rateTimestamp(rate))}</span></span>
  </button>`;
}

function renderRates(root) {
  const usd = state.rates.USD_MMK_MARKET;
  const official = state.rates.USD_MMK_OFFICIAL;
  const fallbackPairs = ["USD_MMK_OFFICIAL", "USDT_MMK_P2P", "GOLD_YGN_KYATTHA", "BTC_USD", "THB_MMK_MARKET", "SGD_MMK_MARKET", "EUR_MMK_MARKET"];
  const gridPairs = usd
    ? ["THB_MMK_MARKET", "USDT_MMK_P2P", "GOLD_YGN_KYATTHA", "BTC_USD", "SGD_MMK_MARKET", "EUR_MMK_MARKET"]
    : fallbackPairs;
  const cards = gridPairs.map((pair) => state.rates[pair]).filter(Boolean).map(rateCard).join("");

  if (state.error && !Object.keys(state.rates).length) {
    root.innerHTML = `<button class="empty retry-button" id="retryRates">${t("offline")}</button>`;
    $("#retryRates").addEventListener("click", loadRates);
    return;
  }
  if (!state.loaded && !Object.keys(state.rates).length) {
    root.innerHTML = `<p class="empty">${t("loading")}</p>`;
    return;
  }

  if (!usd) {
    root.innerHTML = `<section class="empty market-warning"><strong>${t("market_unavailable")}</strong><span>${t("market_unavailable_sub")}</span></section>
      ${cards ? `<div class="grid">${cards}</div>` : `<p class="empty">${t("unavailable")}</p>`}
      <p class="fineprint">${t("disclaimer")}</p>`;
    return;
  }

  root.innerHTML = `<button class="board" data-pair="USD_MMK_MARKET" style="text-align:left">
    <div class="board-top"><span class="board-label">${t("usd_market")}</span>${pctSpan(usd.change24h)}</div>
    <div class="board-mid">${fmt(usd.mid)}</div>
    <div class="board-buysell">
      ${usd.buy ? `<span>${t("buy")} <b>${fmt(usd.buy)}</b></span>` : ""}
      ${usd.sell ? `<span>${t("sell")} <b>${fmt(usd.sell)}</b></span>` : ""}
    </div>
    <div id="heroSpark"></div>
    <div class="board-status">${freshnessBadge(usd)}<span>${rateTimeDetails(usd)}</span></div>
    ${official ? `<div class="board-foot">${t("official")}: ${fmt(official.mid)} · ${rateTimeDetails(official)}</div>` : ""}
  </button>
  ${cards ? `<div class="grid">${cards}</div>` : ""}
  <p class="fineprint">${t("disclaimer")}</p>`;

  fetchJson("/v1/history?pair=USD_MMK_MARKET&range=7d")
    .then(({ json }) => {
      const target = document.getElementById("heroSpark");
      if (target) target.outerHTML = sparkline(json.points, 300, 44, "rgba(239,251,245,0.85)");
    })
    .catch(() => {});
}

function currencyCode(pair) {
  return pair.split("_")[0] || "";
}

function renderConvert(root) {
  const availablePairs = ["USD_MMK_MARKET", "THB_MMK_MARKET", "SGD_MMK_MARKET", "EUR_MMK_MARKET", "USDT_MMK_P2P"].filter((pair) => state.rates[pair]);
  if (!availablePairs.includes(state.convert.pair)) state.convert.pair = availablePairs[0] || "";
  if (!availablePairs.length) { root.innerHTML = `<p class="empty">${t("no_convert_rates")}</p>`; return; }
  const options = availablePairs.map((pair) => `<option value="${pair}" ${pair === state.convert.pair ? "selected" : ""}>${pairName(pair)}</option>`).join("");
  const rate = state.rates[state.convert.pair];
  const amount = Number.parseFloat(state.convert.amount.replace(/,/g, ""));
  const code = currencyCode(state.convert.pair);
  let usedRate = null;
  let methodKey = "using_mid";
  let result = "—";
  let outputUnit = state.convert.toMMK ? "MMK" : code;

  if (rate && Number.isFinite(amount)) {
    if (state.convert.toMMK) {
      usedRate = rate.buy || rate.mid;
      methodKey = rate.buy ? "using_buy" : "using_mid";
      result = fmt(amount * usedRate);
    } else {
      usedRate = rate.sell || rate.mid;
      methodKey = rate.sell ? "using_sell" : "using_mid";
      result = fmt(amount / usedRate);
    }
  }

  root.innerHTML = `<div class="field"><label for="cvAmount">${t("amount")}</label>
      <input id="cvAmount" type="text" inputmode="decimal" value="${escapeHTML(state.convert.amount)}"></div>
    <div class="field"><label for="cvPair">${t("currency")}</label><select id="cvPair">${options}</select></div>
    <button id="cvSwap" class="swap-btn">⇄ ${state.convert.toMMK ? t("to_mmk") : t("from_mmk")}</button>
    <div class="result-card"><div class="k">${t("result")}</div><div class="v">${result} <span class="result-unit">${outputUnit}</span></div>
      ${usedRate ? `<div class="conversion-method">${t(methodKey)}: ${fmt(usedRate)} MMK / ${code}</div>` : ""}</div>
    <p class="section-note">${t("convert_note")}</p>`;

  $("#cvAmount").addEventListener("input", (event) => {
    state.convert.amount = event.target.value;
    renderConvert(root);
    const input = $("#cvAmount");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
  $("#cvPair").addEventListener("change", (event) => { state.convert.pair = event.target.value; renderConvert(root); });
  $("#cvSwap").addEventListener("click", () => { state.convert.toMMK = !state.convert.toMMK; renderConvert(root); });
}

function listRows(root, pairs, note, compactPairs = []) {
  const rows = pairs.map((pair) => state.rates[pair]).filter(Boolean).map((rate) => {
    const value = compactPairs.includes(rate.pair) ? fmtCompact(rate.mid) : fmt(rate.mid);
    const label = rate.pair === "GOLD_YGN_KYATTHA" ? t("gold_ygn") : rate.pair === "XAU_USD_PROXY" ? t("gold_world") : pairName(rate.pair);
    return `<button class="row" data-pair="${rate.pair}">
      <span><span class="k">${label}</span><div class="sub">${rateTimeDetails(rate)} · ${escapeHTML(sourceLabel(rate.source))}</div></span>
      <span><span class="v">${value}</span><div class="row-status">${freshnessBadge(rate)}${pctSpan(rate.change24h)}</div></span>
    </button>`;
  }).join("");
  root.innerHTML = rows ? `<div class="list">${rows}</div><p class="section-note">${note}</p>` : `<p class="empty">${state.error ? t("offline") : state.loaded ? t("unavailable") : t("loading")}</p>`;
}

function render() {
  const root = $("#view");
  if (state.tab === "rates") renderRates(root);
  else if (state.tab === "convert") renderConvert(root);
  else if (state.tab === "gold") listRows(root, ["GOLD_YGN_KYATTHA", "XAU_USD_PROXY"], t("gold_note"), ["GOLD_YGN_KYATTHA"]);
  else if (state.tab === "crypto") listRows(root, ["BTC_USD", "ETH_USD", "USDT_USD", "USDT_MMK_P2P"], t("disclaimer"));
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("copy failed");
}

function backgroundElements() {
  return [$(".topbar"), $("#updatedLine"), $("#view"), $(".tabbar")].filter(Boolean);
}

function setBackgroundInert(value) {
  backgroundElements().forEach((element) => { element.inert = value; });
}

function focusableIn(container) {
  return [...container.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.offsetParent !== null);
}

function trapFocus(event, container) {
  if (event.key !== "Tab") return;
  const focusable = focusableIn(container);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function profileIsOpen() {
  return !$("#profileOverlay").hidden;
}

function refreshOpenProfile() {
  if (profileIsOpen() && !state.editingName) renderProfile($("#profileContent"));
  applyChrome();
}

function openProfile(section = "top", trigger = document.activeElement) {
  if (!$("#sheet").hidden) closeSheet();
  state.modalReturnFocus = trigger;
  $("#profileOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  setBackgroundInert(true);
  renderProfile($("#profileContent"));
  applyChrome();
  requestAnimationFrame(() => {
    const drawer = $("#profileOverlay .profile-drawer");
    if (section === "notifications") $("#notificationsGroup")?.scrollIntoView({ block: "start" });
    else drawer.scrollTop = 0;
    $("#profileClose").focus();
  });
}

function closeProfile() {
  $("#profileOverlay").hidden = true;
  document.body.style.overflow = "";
  setBackgroundInert(false);
  const returnTo = state.modalReturnFocus;
  state.modalReturnFocus = null;
  if (returnTo && document.contains(returnTo)) returnTo.focus();
}

async function checkForAppUpdate() {
  state.updateStatus = "checking_updates";
  refreshOpenProfile();
  try {
    if (!state.swRegistration) throw new Error("service worker unavailable");
    await state.swRegistration.update();
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (!state.updateAvailable) state.updateStatus = "up_to_date";
  } catch {
    state.updateStatus = "update_error";
  }
  refreshOpenProfile();
}

function installAppUpdate() {
  const waiting = state.swRegistration?.waiting;
  if (!waiting) return location.reload();
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
  waiting.postMessage({ type: "SKIP_WAITING" });
}

function sourceRows() {
  if (!state.sources.length) return `<div class="static-row"><span>${t("data_sources")}</span><span class="val">${t("unavailable")}</span></div>`;
  return state.sources.map((source) => {
    const label = t(sourceNames[source.source] || source.source);
    const statusKey = source.status === "missing" ? "unavailable" : source.status;
    const statusClass = ["fresh", "delayed", "stale"].includes(source.status) ? source.status : "unavailable";
    let detail = source.last_data_at
      ? `${t("source_time")} ${relativeTime(source.last_data_at)}${source.last_attempt ? ` · ${t("checked_time")} ${relativeTime(source.last_attempt)}` : ""}`
      : source.last_attempt ? `${t("checked_time")} ${relativeTime(source.last_attempt)}` : t("unavailable");
    if (source.check_status === "error") detail += ` · ${t("check_failed")}`;
    return `<div class="static-row source-row"><span><span>${label}</span><small>${detail}</small></span><span class="val source-health"><span class="freshness ${statusClass}"><span class="freshness-dot"></span></span><span>${t(statusKey)}</span></span></div>`;
  }).join("");
}

function renderProfile(root) {
  const name = state.profileName;
  const updatedText = state.dataUpdatedAt ? `${new Date(state.dataUpdatedAt).toLocaleString()} · ${relativeTime(state.dataUpdatedAt)}` : "—";
  const updateMessage = state.updateAvailable ? t("update_available") : state.updateStatus ? t(state.updateStatus) : "";
  const languageValue = state.lang === "en" ? "English" : "မြန်မာ";

  root.innerHTML = `<div class="profile-card profile-hero">
      <div class="avatar">${initials(name)}</div>
      <div class="profile-copy">${state.editingName ? `
        <label class="sr-only" for="profileNameInput">${t("name_label")}</label>
        <input id="profileNameInput" class="inline-name-input" maxlength="40" value="${escapeHTML(name)}" placeholder="${t("set_name")}">
        <div class="inline-name-actions"><button id="saveName" class="chip primary-chip">${t("save_name")}</button><button id="cancelName" class="chip">${t("cancel")}</button></div>` : `
        <div class="name">${name ? escapeHTML(name) : t("set_name")}</div><div class="hint">${t("on_device")}</div>`}</div>
      ${state.editingName ? "" : `<button id="editName" class="chip edit-name">${t("edit")}</button>`}
    </div>

    <section id="notificationsGroup" class="profile-group"><p class="group-title">${t("notifications")}</p>
      <div class="setting-row disabled-setting"><span><span class="k">${t("noti_daily")}</span><div class="sub">${t("noti_coming_sub")}</div></span><span class="coming-pill">${t("noti_coming")}</span></div>
    </section>

    <section class="profile-group"><p class="group-title">${t("updates")}</p>
      ${state.updateAvailable ? `<button id="installUpdate" class="update-card update-ready"><span class="update-icon">↑</span><span><strong>${t("install_update")}</strong><small>${t("update_ready_sub")}</small></span><span class="update-arrow">→</span></button>` :
        `<button id="checkUpdates" class="setting-row action-setting" ${state.updateStatus === "checking_updates" ? "disabled" : ""}><span><span class="k">${t("check_updates")}</span><div class="sub">${t("current_version")} ${APP_VERSION}</div></span><span class="action-pill"><span class="sync-ic">↻</span>${state.updateStatus === "checking_updates" ? "" : t("check_updates")}</span></button>`}
      <p class="section-note inline-message">${updateMessage}</p>
    </section>

    <section class="profile-group"><p class="group-title">${t("data_sync")}</p>
      <button id="profileSync" class="setting-row action-setting" ${state.syncBusy ? "disabled" : ""}><span><span class="k">${t("sync_now")}</span><div class="sub">${t("sync_now_sub")}</div></span><span class="action-pill"><span class="sync-ic">↻</span>${t("sync")}</span></button>
      <div class="setting-row"><span><span class="k">${t("auto_refresh")}</span><div class="sub">${state.autoRefreshOn ? t("auto_refresh_on") : t("auto_refresh_off")} · ${t("every_five")}</div></span><span class="switch"><input type="checkbox" id="autoRefreshToggle" ${state.autoRefreshOn ? "checked" : ""}><span class="track"></span></span></div>
      <div class="contact-list compact-list"><div class="static-row"><span>${t("last_update")}</span><span class="val">${updatedText}</span></div>
        <div class="static-row"><span>${t("connection")}</span><span class="val status-val"><span class="status-dot ${navigator.onLine ? "online" : "offline"}"></span>${navigator.onLine ? t("online") : t("offline_status")}</span></div>
        <div class="source-list-title">${t("data_sources")}</div>${sourceRows()}</div>
    </section>

    <section class="profile-group"><p class="group-title">${t("preferences")}</p><div class="contact-list">
      <button id="profileLang" class="contact-action"><span><strong>${t("app_lang")}</strong><small>${t("language_action")}</small></span><span class="val">${languageValue} →</span></button>
      <button id="profileTheme" class="contact-action"><span><strong>${t("appearance")}</strong><small>${t("theme_action")}</small></span><span class="val">${themeLabel()} →</span></button>
    </div></section>

    <section class="profile-group"><p class="group-title">${t("contact_title")}</p><div class="developer-card"><div class="developer-avatar">MS</div><div><div class="developer-name">MIN SITHU</div><div class="developer-role">${t("developer_role")}</div></div></div>
      <div class="contact-list"><a href="https://minsithu.org" target="_blank" rel="noopener"><span>${t("contact_web")}</span><span class="val">minsithu.org ↗</span></a>
        <a href="https://github.com/itsmeminsithu" target="_blank" rel="noopener"><span>GitHub</span><span class="val">@itsmeminsithu ↗</span></a>
        <a href="mailto:alex@minsithu.org?subject=MM%20Rates"><span>${t("contact_mail")}</span><span class="val">alex@minsithu.org</span></a>
        <a href="mailto:alex@minsithu.org?subject=MM%20Rates%20%E2%80%94%20wrong%20rate&body=App%20version%3A%20${APP_VERSION}%0AURL%3A%20${encodeURIComponent(location.href)}%0A%0APlease%20describe%20the%20wrong%20rate%3A"><span>${t("contact_report")}</span><span class="val">→</span></a></div>
    </section>

    <section class="profile-group"><p class="group-title">${t("app_title")}</p><div class="contact-list">
      <button id="shareApp" class="contact-action"><span><strong>${t("share_app")}</strong><small>${t("share_app_sub")}</small></span><span class="val">↗</span></button>
      <a href="/privacy.html"><span>${t("privacy")}</span><span class="val">→</span></a><a href="/methodology.html"><span>${t("methodology")}</span><span class="val">→</span></a>
      <div class="static-row"><span>${t("current_version")}</span><span class="val">${APP_VERSION}</span></div><div class="static-row"><span>${t("app_type")}</span><span class="val">${t("pwa")}</span></div></div>
      <p class="section-note inline-message" id="shareMsg"></p><p class="fineprint">${t("disclaimer")}</p></section>`;

  const q = (selector) => root.querySelector(selector);
  q("#editName")?.addEventListener("click", () => { state.editingName = true; renderProfile(root); requestAnimationFrame(() => q("#profileNameInput")?.focus()); });
  q("#cancelName")?.addEventListener("click", () => { state.editingName = false; renderProfile(root); });
  const saveName = () => {
    const input = q("#profileNameInput");
    state.profileName = String(input?.value || "").trim().slice(0, 40);
    localStorage.setItem("profileName", state.profileName);
    state.editingName = false;
    refreshOpenProfile();
  };
  q("#saveName")?.addEventListener("click", saveName);
  q("#profileNameInput")?.addEventListener("keydown", (event) => { if (event.key === "Enter") saveName(); });
  q("#profileSync").addEventListener("click", () => syncRates("profile"));
  q("#autoRefreshToggle").addEventListener("change", (event) => { state.autoRefreshOn = event.target.checked; localStorage.setItem("autoRefreshOn", state.autoRefreshOn ? "1" : "0"); refreshOpenProfile(); });
  q("#profileLang").addEventListener("click", () => { state.lang = state.lang === "en" ? "my" : "en"; localStorage.setItem("lang", state.lang); applyChrome(); render(); renderProfile(root); });
  q("#profileTheme").addEventListener("click", () => {
    state.themeMode = state.themeMode === "system" ? "light" : state.themeMode === "light" ? "dark" : "system";
    localStorage.setItem("themeMode", state.themeMode);
    applyChrome(); renderProfile(root);
  });
  q("#checkUpdates")?.addEventListener("click", checkForAppUpdate);
  q("#installUpdate")?.addEventListener("click", installAppUpdate);
  q("#shareApp").addEventListener("click", async () => {
    const shareData = { title: "MM Rates", text: "Myanmar exchange rates, gold and crypto", url: location.origin };
    const message = q("#shareMsg");
    try {
      if (window.MMRatesNative?.share) {
        window.MMRatesNative.share(shareData.title, shareData.text, shareData.url);
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(location.origin);
        message.textContent = t("copied_link");
      }
    } catch (error) { if (error?.name !== "AbortError") message.textContent = t("share_failed"); }
  });
}

function lineChart(points, pair) {
  if (!points || points.length < 2) return `<p class="empty">${t("no_history")}</p>`;
  const width = 320, height = 220, padLeft = 44, padRight = 8, padTop = 12, padBottom = 24;
  const values = points.map((point) => point.mid);
  const min = Math.min(...values), max = Math.max(...values), span = max - min || max * 0.01 || 1;
  const x = (index) => padLeft + (index / (points.length - 1)) * (width - padLeft - padRight);
  const y = (value) => padTop + (1 - (value - min) / span) * (height - padTop - padBottom);
  const path = values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join("");
  const area = `${path}L${x(values.length - 1).toFixed(1)},${height - padBottom}L${padLeft},${height - padBottom}Z`;
  const first = new Date(points[0].t), last = new Date(points[points.length - 1].t), dateOptions = { month: "short", day: "numeric" };
  const color = values.at(-1) >= values[0] ? "var(--rise)" : "var(--fall)";
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chartTitle chartDescription"><title id="chartTitle">${escapeHTML(pairName(pair))} · ${t("chart_title")}</title><desc id="chartDescription">${t("chart_desc")}</desc>
    <line x1="${padLeft}" y1="${y(max)}" x2="${width - padRight}" y2="${y(max)}" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="${padLeft}" y1="${y(min)}" x2="${width - padRight}" y2="${y(min)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    <text class="axis-label" x="2" y="${y(max) + 4}">${fmtCompact(max)}</text><text class="axis-label" x="2" y="${y(min) + 4}">${fmtCompact(min)}</text>
    <text class="axis-label" x="${padLeft}" y="${height - 6}">${first.toLocaleDateString(undefined, dateOptions)}</text><text class="axis-label" x="${width - padRight}" y="${height - 6}" text-anchor="end">${last.toLocaleDateString(undefined, dateOptions)}</text>
    <path d="${area}" fill="${color}" opacity="0.09"/><path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

async function openSheet(pair, trigger = document.activeElement) {
  if (profileIsOpen()) closeProfile();
  state.modalReturnFocus = trigger;
  state.sheetPair = pair;
  const rate = state.rates[pair];
  $("#sheetTitle").textContent = pairName(pair);
  $("#sheetBig").innerHTML = rate ? `${fmt(rate.mid)} ${pctSpan(rate.change24h)}` : "";
  $("#sheetNote").innerHTML = `${rateMeta(rate)}<br>${t("disclaimer")}`;
  $("#rangeRow").innerHTML = ["24h", "7d", "30d", "90d"].map((range) => `<button class="range-btn ${range === state.sheetRange ? "active" : ""}" data-range="${range}">${range}</button>`).join("");
  $("#sheet").hidden = false;
  document.body.style.overflow = "hidden";
  setBackgroundInert(true);
  $("#sheetClose").focus();
  await loadSheetChart();
}

async function loadSheetChart() {
  const wrap = $("#chartWrap");
  wrap.innerHTML = `<p class="empty">${t("loading")}</p>`;
  try {
    const { json } = await fetchJson(`/v1/history?pair=${encodeURIComponent(state.sheetPair)}&range=${encodeURIComponent(state.sheetRange)}`);
    wrap.innerHTML = lineChart(json.points, state.sheetPair);
  } catch {
    wrap.innerHTML = `<p class="empty">${t("offline")}</p>`;
  }
}

function closeSheet() {
  $("#sheet").hidden = true;
  document.body.style.overflow = "";
  setBackgroundInert(false);
  const returnTo = state.modalReturnFocus;
  state.modalReturnFocus = null;
  if (returnTo && document.contains(returnTo)) returnTo.focus();
}

async function syncRates(trigger = "button") {
  if (state.syncBusy) return;
  state.syncBusy = true;
  const button = $("#syncBtn"), line = $("#updatedLine"), pull = $("#pullRefresh");
  button.classList.add("syncing");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  state.bannerMessage = t("syncing");
  applyChrome();
  if (trigger === "pull") { pull.classList.add("refreshing"); $("#pullRefreshText").textContent = t("pull_refreshing"); }

  try {
    const { json, offline } = await fetchJson("/v1/refresh", { method: "POST", cache: "no-store" });
    applyRatesPayload(json, offline);
    render();
    document.querySelectorAll(".board-mid, .card .v, .row .v").forEach((element) => element.classList.add("flash"));
    const refresh = json.refresh || {};
    let message;
    if (refresh.skipped) message = t("already_fresh");
    else if (refresh.failure_count > 0 && refresh.success_count === 0) message = t("all_sources_failed");
    else if (refresh.collection_changed) message = t("synced");
    else message = t("no_newer");
    if (refresh.failure_count > 0 && refresh.success_count > 0) message += ` · ${t("partial_sync")}`;
    state.bannerMessage = `${message}${state.dataUpdatedAt ? ` · ${relativeTime(state.dataUpdatedAt)}` : ""}`;
  } catch {
    state.error = true;
    state.bannerMessage = t("sync_failed");
  } finally {
    state.syncBusy = false;
    button.classList.remove("syncing");
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (trigger === "pull") finishPullRefresh();
    refreshOpenProfile();
    setTimeout(() => { state.bannerMessage = ""; applyChrome(); }, 5000);
  }
}

const PULL_THRESHOLD = 72;
const PULL_MAX = 112;
let pullStartY = null, pullDistance = 0, pullReady = false;

function updatePullRefresh(distance) {
  const pull = $("#pullRefresh");
  pullDistance = Math.min(PULL_MAX, Math.max(0, distance));
  pullReady = pullDistance >= PULL_THRESHOLD;
  pull.style.setProperty("--pull-distance", `${pullDistance}px`);
  pull.style.setProperty("--pull-opacity", String(Math.min(1, pullDistance / 32)));
  pull.classList.toggle("ready", pullReady);
  pull.setAttribute("aria-hidden", pullDistance > 8 ? "false" : "true");
  $("#pullRefreshText").textContent = pullReady ? t("release_to_refresh") : t("pull_to_refresh");
  document.body.classList.toggle("pulling", pullDistance > 0);
}

function finishPullRefresh() {
  const pull = $("#pullRefresh");
  pull.classList.remove("ready", "refreshing");
  pull.style.setProperty("--pull-distance", "0px");
  pull.style.setProperty("--pull-opacity", "0");
  pull.setAttribute("aria-hidden", "true");
  document.body.classList.remove("pulling");
  pullDistance = 0;
  pullReady = false;
  $("#pullRefreshText").textContent = t("pull_to_refresh");
}

function watchServiceWorker(registration) {
  state.swRegistration = registration;
  if (registration.waiting) { state.updateAvailable = true; state.updateStatus = "update_available"; refreshOpenProfile(); }
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        state.updateAvailable = true;
        state.updateStatus = "update_available";
        refreshOpenProfile();
      }
    });
  });
}

$("#syncBtn").addEventListener("click", () => syncRates("button"));
$("#profileBtn").addEventListener("click", (event) => openProfile("top", event.currentTarget));
$("#notiBtn").addEventListener("click", (event) => openProfile("notifications", event.currentTarget));
$("#profileClose").addEventListener("click", closeProfile);
$("#profileOverlay").addEventListener("click", (event) => { if (event.target === $("#profileOverlay")) closeProfile(); });
$("#sheet").addEventListener("click", (event) => { if (event.target === $("#sheet")) closeSheet(); });
$("#sheetClose").addEventListener("click", closeSheet);

document.addEventListener("click", (event) => {
  const pairElement = event.target.closest("[data-pair]");
  if (pairElement) return openSheet(pairElement.dataset.pair, pairElement);
  const rangeElement = event.target.closest("[data-range]");
  if (rangeElement) {
    state.sheetRange = rangeElement.dataset.range;
    document.querySelectorAll(".range-btn").forEach((button) => button.classList.toggle("active", button === rangeElement));
    loadSheetChart();
  }
});

document.addEventListener("keydown", (event) => {
  if (profileIsOpen()) {
    if (event.key === "Escape") return closeProfile();
    trapFocus(event, $("#profileOverlay .profile-drawer"));
  } else if (!$("#sheet").hidden) {
    if (event.key === "Escape") return closeSheet();
    trapFocus(event, $("#sheet .sheet-panel"));
  }
});

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button === tab));
  state.tab = tab.dataset.tab;
  render();
}));

document.addEventListener("touchstart", (event) => {
  if (window.scrollY > 0 || state.syncBusy || !$("#sheet").hidden || profileIsOpen() || event.touches.length !== 1) return;
  pullStartY = event.touches[0].clientY;
}, { passive: true });
document.addEventListener("touchmove", (event) => {
  if (pullStartY === null || state.syncBusy || event.touches.length !== 1) return;
  const raw = event.touches[0].clientY - pullStartY;
  if (raw <= 0) return updatePullRefresh(0);
  event.preventDefault();
  updatePullRefresh(raw * 0.48);
}, { passive: false });
document.addEventListener("touchend", () => {
  if (pullStartY === null) return;
  pullStartY = null;
  if (pullReady) { $("#pullRefresh").style.setProperty("--pull-distance", `${PULL_THRESHOLD}px`); syncRates("pull"); }
  else finishPullRefresh();
});
document.addEventListener("touchcancel", () => { pullStartY = null; finishPullRefresh(); });

window.addEventListener("online", () => { state.offlineSnapshot = false; loadRates(); });
window.addEventListener("offline", () => { applyChrome(); refreshOpenProfile(); });
mediaDark.addEventListener?.("change", () => { if (state.themeMode === "system") applyChrome(); });

applyChrome();
render();
loadRates();
setInterval(() => { if (state.autoRefreshOn) loadRates(); }, AUTO_REFRESH_MS);
setInterval(() => state.swRegistration?.update().catch(() => {}), UPDATE_CHECK_MS);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then(watchServiceWorker).catch(() => {});
