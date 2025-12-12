// -----------------------------
// デバッグ強化版 loadAllJSONs()
// -----------------------------
async function loadAllJSONs() {
  // clear previous (for re-entrancy)
  birthdayMap = {};
  eventsMap = [];
  topics = [];
  levelScores = {};

  // helper
  async function safeFetchJson(path) {
    console.log("fetch ->", path);
    try {
      const res = await fetch(path);
      if (!res.ok) {
        console.log(`⚠ fetch error ${res.status} ${res.statusText} for ${path}`);
        return null;
      }
      const j = await res.json();
      console.log("✅ parsed", path);
      return j;
    } catch (err) {
      console.log("‼ fetch/json error for", path, err && err.message ? err.message : err);
      return null;
    }
  }

  // fetch one by one so we can see which fails
  const birthday = await safeFetchJson("./data/birthday.json");
  const events = await safeFetchJson("./data/events.json");
  const topicsData = await safeFetchJson("./data/topics.json");
  const levelJson = await safeFetchJson("./data/levels.json");

  // validate and assign with fallbacks
  if (birthday && birthday.month && typeof birthday.month === "object") {
    birthdayMap = birthday.month;
    console.log("birthdayMap loaded, months:", Object.keys(birthdayMap).length);
  } else {
    console.log("⚠ birthday.json missing or invalid. Expected { month: {...} }");
    birthdayMap = {};
  }

  if (levelJson && levelJson.levels) {
    levelScores = levelJson.levels;
    console.log("levelScores:", levelScores);
  } else {
    console.log("⚠ levels.json missing or invalid. Using default fallbacks.");
    levelScores = { common:3, uncommon:2, limited:1, unique:1 };
  }

  // events: we accept missing categories but avoid calling .map on undefined
  if (events && typeof events === "object") {
    const std = Array.isArray(events.standard) ? events.standard : [];
    const spc = Array.isArray(events.special) ? events.special : [];
    // try both possible key spellings for inazuma (defensive)
    const ina = Array.isArray(events.inazumaEleven) ? events.inazumaEleven
              : Array.isArray(events.inszumaEleven) ? events.inszumaEleven
              : [];
    eventsMap = [
      ...std.map(e => ({ ...e, category: "standard" })),
      ...spc.map(e => ({ ...e, category: "special" })),
      ...ina.map(e => ({ ...e, category: "inazumaEleven" }))
    ];
    console.log(`events loaded: standard=${std.length}, special=${spc.length}, inazuma=${ina.length}`);
  } else {
    console.log("⚠ events.json missing or invalid");
    eventsMap = [];
  }

  // topics: flatten categories safely
  if (topicsData && topicsData.categories && typeof topicsData.categories === "object") {
    topics = [];
    for (const cat in topicsData.categories) {
      const arr = Array.isArray(topicsData.categories[cat]) ? topicsData.categories[cat] : [];
      arr.forEach(t => topics.push({ ...t, category: cat }));
    }
    console.log("topics loaded, total:", topics.length);
  } else {
    console.log("⚠ topics.json missing or invalid. topics empty.");
    topics = [];
  }

  console.log("loadAllJSONs finished.");
}