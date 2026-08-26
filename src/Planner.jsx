import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from "react";

/* ─────────────────────────── 토큰 ─────────────────────────── */
const C = {
  bg: "#FBF8F6",
  surface: "#FFFFFF",
  ink: "#1F2A44",
  inkSoft: "#59627A",
  muted: "#9AA0B0",
  line: "#EDE7E2",
  lineSoft: "#F4EFEB",
  rose: "#E0567A",
  roseSoft: "#FDEEF2",
  teal: "#2F9E8F",
  amber: "#DFA24C",
  indigo: "#5B6BE0",
};

/* 글씨 배율 — 설정에서 바꾸면 앱 전체 글씨와 버튼이 같이 커집니다 */
let SCALE = 1;
const fs = (n) => Math.round(n * SCALE * 10) / 10;
const px = (n) => Math.round(n * (1 + (SCALE - 1) * 0.6));

const DISPLAY = "'IBM Plex Sans KR', 'Pretendard', 'Noto Sans KR', sans-serif";
const BODY =
  "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

/* 카테고리는 사용자가 직접 고칠 수 있고, 아래는 처음 시작할 때의 기본값 */
const DEFAULT_TAGS = [
  { id: "acad", label: "학원", color: C.rose },
  { id: "class", label: "수업", color: C.teal },
  { id: "app", label: "앱", color: C.indigo },
  { id: "me", label: "개인", color: C.amber },
];
const PALETTE = [C.rose, C.teal, C.indigo, C.amber, "#8E5BD1", "#3E9E6B", "#D96A3C", "#5B7285"];

const TagCtx = createContext(DEFAULT_TAGS);
const useTags = () => useContext(TagCtx);
const findTag = (tags, id) => tags.find((t) => t.id === id) || null;

/* ─────────────────────────── 날짜 유틸 ─────────────────────────── */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const fmtDay = (k) => {
  const d = parseKey(k);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
};
const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
const uid = () => Math.random().toString(36).slice(2, 10);

/* ─────────────────────────── 사주(재미용) ─────────────────────────── */
const GAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const GAN_HAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const JI_HAN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const GAN_EL = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const EL_COLOR = { 목: "#3E9E6B", 화: "#E0567A", 토: "#C9954A", 금: "#8A93A8", 수: "#4A6FD1" };
const EL_HUE = { 목: "초록", 화: "빨강·분홍", 토: "노랑·베이지", 금: "흰색·회색", 수: "파랑·검정" };
const EL_DIR = { 목: "동쪽", 화: "남쪽", 토: "중앙", 금: "서쪽", 수: "북쪽" };

const jdn = (d) => {
  const a = Math.floor((14 - (d.getMonth() + 1)) / 12);
  const y = d.getFullYear() + 4800 - a;
  const m = d.getMonth() + 1 + 12 * a - 3;
  return (
    d.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  );
};
/* 검증됨: 2000-01-01 무오, 1900-01-01 갑술 */
const pillar = (d) => {
  const i = ((jdn(d) + 49) % 60 + 60) % 60;
  return { gan: i % 10, ji: i % 12 };
};
const pillarText = (p) => `${GAN[p.gan]}${JI[p.ji]}(${GAN_HAN[p.gan]}${JI_HAN[p.ji]})`;

/* 시두법: 갑기일=갑자시, 을경=병자시, 병신=무자시, 정임=경자시, 무계=임자시 */
const hourJi = (h) => Math.floor(((h + 1) % 24) / 2);
const hourPillar = (dayGan, h) => {
  const j = hourJi(h);
  return { gan: ((dayGan % 5) * 2 + j) % 10, ji: j };
};
const jiRange = (j) => {
  const s = (j * 2 + 23) % 24;
  return `${pad(s)}:30~${pad((s + 2) % 24)}:30`;
};
const yukhap = (i) => (13 - i) % 12;

const SAENG = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const GEUK = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };
const relation = (me, day) => {
  if (me === day) return "비겁";
  if (SAENG[me] === day) return "식상";
  if (SAENG[day] === me) return "인성";
  if (GEUK[me] === day) return "재성";
  return "관성";
};

const FORTUNE = {
  비겁: {
    head: "내 힘으로 밀어붙이는 날",
    lines: [
      "미뤄둔 일 중에 제일 무거운 것부터 손대면 의외로 쑥 나갑니다.",
      "남한테 맡기기보다 직접 처리하는 쪽이 빠른 날이에요.",
      "고집을 부려도 되는 날. 다만 사람 상대로는 한 톤만 낮추세요.",
    ],
    watch: "혼자 다 하려다 저녁에 방전될 수 있어요",
  },
  식상: {
    head: "말과 아이디어가 잘 풀리는 날",
    lines: [
      "설명하고 설득하는 일에 유리해요. 미뤄둔 통화나 상담을 오늘로.",
      "새로 만들고 싶던 것의 첫 삽을 뜨기 좋은 날입니다.",
      "머릿속에만 있던 걸 글이나 화면으로 꺼내두면 오래 갑니다.",
    ],
    watch: "말이 많아지는 날이라 한마디 더 얹는 걸 조심",
  },
  재성: {
    head: "손에 잡히는 결과를 챙길 날",
    lines: [
      "숫자·돈·정산과 관련된 일을 오늘 처리하면 깔끔합니다.",
      "벌여둔 것 중 하나를 끝내서 마무리 짓기 좋은 날이에요.",
      "실속 위주로 판단하세요. 오늘의 감은 대체로 맞습니다.",
    ],
    watch: "욕심내서 일을 하나 더 벌이지 않기",
  },
  관성: {
    head: "해야 할 일이 밀려오는 날",
    lines: [
      "바깥에서 요구가 들어올 수 있어요. 우선순위부터 정하고 시작하세요.",
      "규칙과 약속을 지키는 쪽이 이득인 날입니다.",
      "부담스러운 자리일수록 준비된 만큼만 보여주면 충분해요.",
    ],
    watch: "다 받아주다 일정이 무너질 수 있어요",
  },
  인성: {
    head: "배우고 채우는 날",
    lines: [
      "새로 벌이기보다 읽고 정리하는 데 시간을 쓰면 남는 게 있어요.",
      "도와줄 사람이 나타나는 날. 혼자 끙끙대지 말고 물어보세요.",
      "쉬어도 되는 날입니다. 쉬는 것도 오늘 할 일이에요.",
    ],
    watch: "생각만 하다 하루가 갈 수 있어요",
  },
};

const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

function buildFortune(birthKey, birthHour, todayKey) {
  const bp = pillar(parseKey(birthKey));
  const dp = pillar(parseKey(todayKey));
  const meEl = GAN_EL[bp.gan];
  const dayEl = GAN_EL[dp.gan];
  const f = FORTUNE[relation(meEl, dayEl)];
  const seed = hashStr(birthKey + String(birthHour) + todayKey);
  const by = parseKey(birthKey).getFullYear();
  const hasHour = birthHour !== null && birthHour !== undefined && birthHour !== "";
  const hp = hasHour ? hourPillar(bp.gan, Number(birthHour)) : null;
  const lucky = yukhap(dp.ji);

  let hourNote = null;
  if (hp) {
    const r2 = relation(meEl, GAN_EL[hp.gan]);
    hourNote =
      r2 === "비겁" ? "타고난 기질이 오늘 흐름과 같은 방향이라 평소 하던 대로가 잘 통합니다."
      : r2 === "식상" ? "말과 손이 잘 움직이는 기질이라, 오늘은 먼저 꺼내 보이는 쪽이 유리해요."
      : r2 === "재성" ? "실속을 챙기는 기질이라 오늘 같은 날엔 결정이 빠릅니다."
      : r2 === "관성" ? "책임감이 앞서는 기질이라 오늘은 짐을 덜어내는 연습이 필요해요."
      : "받아들이고 새기는 기질이라 오늘 배운 게 오래 남습니다.";
  }

  return {
    dayPillar: pillarText(dp),
    dayEl,
    myDay: pillarText(bp),
    myHour: hp ? pillarText(hp) : null,
    hourNote,
    head: f.head,
    line: f.lines[seed % f.lines.length],
    watch: f.watch,
    color: EL_HUE[dayEl],
    dir: EL_DIR[SAENG[dayEl]],
    num: (seed % 9) + 1,
    luckyTime: `${JI[lucky]}시 ${jiRange(lucky)}`,
    zodiac: ZODIAC[((by - 4) % 12 + 12) % 12],
    zodiacToday: ZODIAC[dp.ji],
  };
}

/* ─────────────────────────── 저장소 ───────────────────────────
   Claude 안에서는 window.storage를 쓰고, StackBlitz·Vercel 같은 곳에
   올렸을 때는 브라우저 저장소로 자동 전환됩니다. 둘 다 없으면
   메모리에만 담기고(새로고침 시 사라짐) 화면에 그 사실을 알려줘요.
--------------------------------------------------------------- */
const store = (() => {
  const w = typeof window !== "undefined" ? window : {};
  if (w.storage && typeof w.storage.get === "function") {
    return {
      kind: "cloud",
      get: async (k) => {
        try {
          const r = await w.storage.get(k);
          return r ? JSON.parse(r.value) : null;
        } catch {
          return null;
        }
      },
      set: async (k, v) => {
        try {
          await w.storage.set(k, JSON.stringify(v));
          return true;
        } catch {
          return false;
        }
      },
    };
  }
  let ls = null;
  try {
    w.localStorage.setItem("__probe", "1");
    w.localStorage.removeItem("__probe");
    ls = w.localStorage;
  } catch {
    ls = null;
  }
  const mem = {};
  return {
    kind: ls ? "browser" : "memory",
    get: async (k) => {
      try {
        const v = ls ? ls.getItem(k) : mem[k];
        return v ? JSON.parse(v) : null;
      } catch {
        return null;
      }
    },
    set: async (k, v) => {
      try {
        const s = JSON.stringify(v);
        if (ls) ls.setItem(k, s);
        else mem[k] = s;
        return true;
      } catch {
        return false;
      }
    },
  };
})();

const KEY = "planner:v1";
const PKEY = "planner:photos:v1";

/* 사진 압축: 긴 변 900px, JPEG 62% */
function compress(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        let { width: w, height: h } = img;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.62));
      };
      img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
      img.src = fr.result;
    };
    fr.onerror = () => reject(new Error("파일을 읽지 못했어요"));
    fr.readAsDataURL(file);
  });
}

/* ─────────────────────────── 앱 ─────────────────────────── */
export default function Planner() {
  const [tab, setTab] = useState("todo");
  const [data, setData] = useState({ todos: [], memos: [], profile: {} });
  const [photos, setPhotos] = useState({});
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [selDate, setSelDate] = useState(ymd(new Date()));
  const [settings, setSettings] = useState(false);
  const today = ymd(new Date());

  useEffect(() => {
    (async () => {
      const [d, p] = await Promise.all([store.get(KEY), store.get(PKEY)]);
      if (d && Array.isArray(d.todos))
        setData({ todos: d.todos, memos: d.memos || [], profile: d.profile || {} });
      if (p && typeof p === "object") setPhotos(p);
      setReady(true);
    })();
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("saving");
    Promise.all([store.set(KEY, data), store.set(PKEY, photos)]).then(([a, b]) => {
      const ok = a && b;
      setSaveState(ok ? "saved" : "error");
      if (ok) setTimeout(() => setSaveState("idle"), 1200);
    });
  }, [data, photos, ready]);

  const tags = data.profile.tags && data.profile.tags.length ? data.profile.tags : DEFAULT_TAGS;

  /* 자식들이 그려지기 전에 배율을 먼저 반영 */
  SCALE = data.profile.textScale || 1;

  /* 할 일 */
  const addTodo = (text, date, tag) =>
    setData((p) => ({
      ...p,
      todos: [
        { id: uid(), text: text.trim(), date: date || null, tag: tag || null, done: false, created: Date.now() },
        ...p.todos,
      ],
    }));
  const patchTodo = (id, patch) =>
    setData((p) => ({ ...p, todos: p.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const delTodo = (id) => setData((p) => ({ ...p, todos: p.todos.filter((t) => t.id !== id) }));
  const clearDone = () => setData((p) => ({ ...p, todos: p.todos.filter((t) => !t.done) }));

  /* 메모 */
  const addMemo = () => {
    const id = uid();
    setData((p) => ({ ...p, memos: [{ id, body: "", pinned: false, updated: Date.now() }, ...p.memos] }));
    return id;
  };
  const patchMemo = (id, patch, touch = true) =>
    setData((p) => ({
      ...p,
      memos: p.memos.map((m) => (m.id === id ? { ...m, ...patch, updated: touch ? Date.now() : m.updated } : m)),
    }));
  const delMemo = (id) => {
    setData((p) => ({ ...p, memos: p.memos.filter((m) => m.id !== id) }));
    setPhotos((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };
  const addPhotos = (id, srcs) =>
    setPhotos((p) => ({ ...p, [id]: [...(p[id] || []), ...srcs.map((src) => ({ pid: uid(), src }))] }));
  const delPhoto = (id, pid) =>
    setPhotos((p) => ({ ...p, [id]: (p[id] || []).filter((x) => x.pid !== pid) }));

  /* 설정 */
  const setBirthInfo = (birth, birthHour) =>
    setData((p) => ({ ...p, profile: { ...p.profile, birth, birthHour } }));
  const clearBirth = () =>
    setData((p) => ({ ...p, profile: { ...p.profile, birth: null, birthHour: null } }));
  const saveTags = (next) => setData((p) => ({ ...p, profile: { ...p.profile, tags: next } }));
  const setTextScale = (v) => setData((p) => ({ ...p, profile: { ...p.profile, textScale: v } }));
  const resetAll = () => {
    setData({ todos: [], memos: [], profile: {} });
    setPhotos({});
  };

  const open = data.todos.filter((t) => !t.done);
  const todayCount = open.filter((t) => t.date === today).length;
  const overdue = open.filter((t) => t.date && t.date < today).length;

  const weekAhead = useMemo(() => {
    const t = parseKey(today);
    const mon = addDays(t, -((t.getDay() + 6) % 7));
    const out = [];
    for (let i = 0; i < 7; i++) {
      const k = ymd(addDays(mon, i));
      if (k <= today) continue;
      const n = open.filter((x) => x.date === k).length;
      if (n > 0) out.push({ key: k, wd: WD[parseKey(k).getDay()], n });
    }
    return out;
  }, [open, today]);

  return (
    <TagCtx.Provider value={tags}>
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: BODY, color: C.ink }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
          * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { margin: 0; }
          input, textarea, button, select { font-family: inherit; color: inherit; }
          input:focus-visible, textarea:focus-visible, button:focus-visible, select:focus-visible {
            outline: 2px solid ${C.ink}; outline-offset: 2px;
          }
          .pl-row { transition: background .14s ease; }
          .pl-row:hover { background: ${C.lineSoft}; }
          .pl-x { opacity: 0; transition: opacity .14s ease; }
          .pl-row:hover .pl-x { opacity: 1; }
          @media (hover: none) { .pl-x { opacity: .55; } }
          .pl-cell { transition: background .14s ease, transform .14s ease; }
          .pl-cell:active { transform: scale(.94); }
          @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
          textarea { resize: none; }
        `}</style>

        <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 92 }}>
          <header
            style={{
              padding: "26px 20px 15px",
              borderBottom: `1px solid ${C.line}`,
              background: C.bg,
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: fs(14), letterSpacing: 2.5, color: C.muted, fontWeight: 700 }}>오늘</div>
                <div style={{ fontFamily: DISPLAY, fontSize: fs(30), fontWeight: 700, marginTop: 3, lineHeight: 1.15, letterSpacing: -0.5 }}>
                  {fmtDay(today)}
                </div>
              </div>

              {weekAhead.length > 0 && (
                <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: fs(13), letterSpacing: 2, color: C.muted, fontWeight: 700 }}>이번주</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 5, justifyContent: "flex-end" }}>
                    {weekAhead.map((w) => (
                      <button
                        key={w.key}
                        onClick={() => {
                          setSelDate(w.key);
                          setTab("cal");
                        }}
                        title={`${fmtDay(w.key)} · ${w.n}개`}
                        style={{
                          border: `1px solid ${C.line}`,
                          background: C.surface,
                          borderRadius: 9,
                          width: px(34),
                          height: px(38),
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <span style={{ fontFamily: DISPLAY, fontSize: fs(16.5), fontWeight: 700 }}>{w.wd}</span>
                        <span style={{ fontSize: fs(11), color: C.rose, lineHeight: 1 }}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: fs(16), color: C.inkSoft }}>
                남은 할 일 <b>{open.length}</b>개
                {todayCount > 0 && <> · 오늘 <b>{todayCount}</b>개</>}
                {overdue > 0 && <> · <span style={{ color: C.rose, fontWeight: 700 }}>지난 {overdue}개</span></>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                <span style={{ fontSize: fs(14), color: C.muted }}>
                  {saveState === "saving" && "저장 중"}
                  {saveState === "saved" && "저장됨"}
                  {saveState === "error" && <span style={{ color: C.rose }}>저장 실패</span>}
                </span>
                <button
                  onClick={() => setSettings(true)}
                  aria-label="설정"
                  style={{
                    border: `1px solid ${C.line}`,
                    background: C.surface,
                    borderRadius: 8,
                    width: px(36),
                    height: px(32),
                    cursor: "pointer",
                    padding: 0,
                    fontSize: fs(16),
                    color: C.inkSoft,
                    lineHeight: 1,
                  }}
                >
                  ⚙
                </button>
              </div>
            </div>

            {store.kind === "memory" && (
              <div style={{ marginTop: 9, fontSize: fs(14.5), color: C.rose, lineHeight: 1.5 }}>
                이 브라우저에서는 저장이 안 돼요. 창을 닫으면 기록이 사라집니다.
              </div>
            )}
          </header>

          {!ready ? (
            <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: fs(17) }}>불러오는 중…</div>
          ) : (
            <main style={{ padding: "18px 20px 0" }}>
              {tab === "todo" && (
                <>
                  <SajuCard
                    birth={data.profile.birth}
                    birthHour={data.profile.birthHour}
                    onSetBirth={setBirthInfo}
                    today={today}
                  />
                  <TodoView
                    todos={data.todos}
                    today={today}
                    onAdd={addTodo}
                    onPatch={patchTodo}
                    onDel={delTodo}
                    onClearDone={clearDone}
                  />
                </>
              )}
              {tab === "cal" && (
                <CalendarView
                  todos={data.todos}
                  today={today}
                  sel={selDate}
                  setSel={setSelDate}
                  onAdd={addTodo}
                  onPatch={patchTodo}
                  onDel={delTodo}
                />
              )}
              {tab === "memo" && (
                <MemoView
                  memos={data.memos}
                  photos={photos}
                  onAdd={addMemo}
                  onPatch={patchMemo}
                  onDel={delMemo}
                  onAddPhotos={addPhotos}
                  onDelPhoto={delPhoto}
                />
              )}
            </main>
          )}
        </div>

        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(251,248,246,.94)",
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${C.line}`,
            zIndex: 30,
          }}
        >
          <div style={{ maxWidth: 560, margin: "0 auto", display: "flex" }}>
            {[
              { id: "todo", label: "할 일" },
              { id: "cal", label: "캘린더" },
              { id: "memo", label: "메모" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  padding: `${px(18)}px 0 ${px(26)}px`,
                  cursor: "pointer",
                  fontSize: fs(17),
                  fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? C.ink : C.muted,
                  position: "relative",
                }}
              >
                {t.label}
                {tab === t.id && (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%) rotate(-1.2deg)",
                      bottom: 14,
                      width: 26,
                      height: 3,
                      borderRadius: 2,
                      background: C.rose,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {settings && (
          <Settings
            tags={tags}
            onSaveTags={saveTags}
            textScale={data.profile.textScale || 1}
            onTextScale={setTextScale}
            birth={data.profile.birth}
            birthHour={data.profile.birthHour}
            onClearBirth={clearBirth}
            onReset={resetAll}
            onClose={() => setSettings(false)}
          />
        )}
      </div>
    </TagCtx.Provider>
  );
}

/* ─────────────────────────── 설정 ─────────────────────────── */
function Settings({ tags, onSaveTags, textScale, onTextScale, birth, birthHour, onClearBirth, onReset, onClose }) {
  const [draft, setDraft] = useState(tags.map((t) => ({ ...t })));
  const [confirmReset, setConfirmReset] = useState(false);

  const setLabel = (i, v) => setDraft((d) => d.map((t, j) => (j === i ? { ...t, label: v } : t)));
  const setColor = (i, v) => setDraft((d) => d.map((t, j) => (j === i ? { ...t, color: v } : t)));
  const remove = (i) => setDraft((d) => d.filter((_, j) => j !== i));
  const add = () =>
    setDraft((d) => [...d, { id: uid(), label: "", color: PALETTE[d.length % PALETTE.length] }]);

  const commit = () => {
    const clean = draft.map((t) => ({ ...t, label: t.label.trim() })).filter((t) => t.label);
    onSaveTags(clean.length ? clean : DEFAULT_TAGS);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,24,36,.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          width: "100%",
          maxWidth: 560,
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "18px 18px 0 0",
          padding: "20px 20px 30px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: fs(23), fontWeight: 700, letterSpacing: -0.4 }}>설정</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", fontSize: fs(26), color: C.muted, cursor: "pointer", lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        {/* 글씨 크기 */}
        <div style={{ fontSize: fs(11), letterSpacing: 2, fontWeight: 700, color: C.muted, marginBottom: 5 }}>
          글씨 크기
        </div>
        <div style={{ fontSize: fs(12.5), color: C.inkSoft, lineHeight: 1.6, marginBottom: 11 }}>
          누르면 바로 바뀝니다. 눈이 편한 크기로 맞춰보세요.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
          {[
            [1, "보통", 15],
            [1.15, "크게", 17],
            [1.3, "아주 크게", 19],
            [1.5, "최대", 21],
          ].map(([v, label, sample]) => (
            <button
              key={label}
              onClick={() => onTextScale(v)}
              style={{
                flex: 1,
                border: textScale === v ? `2px solid ${C.ink}` : `1px solid ${C.line}`,
                background: C.surface,
                borderRadius: 12,
                padding: "13px 4px",
                cursor: "pointer",
                fontWeight: textScale === v ? 700 : 500,
                color: textScale === v ? C.ink : C.inkSoft,
                fontSize: sample,
                lineHeight: 1.3,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 카테고리 */}
        <div style={{ fontSize: fs(14), letterSpacing: 2, fontWeight: 700, color: C.muted, marginBottom: 5 }}>
          내 카테고리
        </div>
        <div style={{ fontSize: fs(15.5), color: C.inkSoft, lineHeight: 1.6, marginBottom: 11 }}>
          본인이 주로 하는 일에 맞게 이름과 색을 바꾸세요. 할 일에 붙이면 캘린더 별 색으로도 나타납니다.
        </div>

        {draft.map((t, i) => (
          <div
            key={t.id}
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: 11,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
              <input
                value={t.label}
                onChange={(e) => setLabel(i, e.target.value)}
                placeholder="예: 회의, 운동, 육아…"
                maxLength={8}
                style={{ flex: 1, border: "none", background: "none", fontSize: fs(17.5), fontWeight: 600, padding: 0, minWidth: 0 }}
              />
              <button
                onClick={() => remove(i)}
                aria-label="삭제"
                style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: fs(21), lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(i, c)}
                  aria-label="색 선택"
                  style={{
                    width: px(28),
                    height: px(28),
                    borderRadius: "50%",
                    background: c,
                    border: t.color === c ? `2.5px solid ${C.ink}` : "2.5px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {draft.length < 8 && (
          <button
            onClick={add}
            style={{
              width: "100%",
              border: `1px dashed ${C.muted}`,
              background: C.surface,
              borderRadius: 12,
              padding: "11px 0",
              fontSize: fs(16.5),
              fontWeight: 600,
              color: C.inkSoft,
              cursor: "pointer",
              marginTop: 2,
            }}
          >
            + 카테고리 추가
          </button>
        )}

        {/* 사주 */}
        <div style={{ fontSize: fs(14), letterSpacing: 2, fontWeight: 700, color: C.muted, margin: "24px 0 8px" }}>
          사주 정보
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: fs(16.5), color: birth ? C.ink : C.muted, lineHeight: 1.5 }}>
            {birth ? (
              <>
                {birth}
                <span style={{ color: C.inkSoft }}>
                  {birthHour === null || birthHour === undefined
                    ? " · 시간 모름"
                    : ` · ${JI[hourJi(Number(birthHour))]}시`}
                </span>
              </>
            ) : (
              "아직 입력 안 함"
            )}
          </div>
          {birth && (
            <button
              onClick={onClearBirth}
              style={{ border: "none", background: "none", fontSize: fs(15.5), color: C.rose, cursor: "pointer", fontWeight: 600, flexShrink: 0, padding: 0 }}
            >
              지우기
            </button>
          )}
        </div>
        <div style={{ fontSize: fs(14.5), color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
          한 번 넣으면 계속 저장돼요. 매일 다시 입력할 필요 없습니다.
        </div>

        {/* 저장 위치 */}
        <div style={{ fontSize: fs(14), letterSpacing: 2, fontWeight: 700, color: C.muted, margin: "24px 0 8px" }}>
          저장 위치
        </div>
        <div style={{ fontSize: fs(15.5), color: C.inkSoft, lineHeight: 1.65 }}>
          {store.kind === "cloud" && "계정에 저장 중 — 같은 계정이면 다른 기기에서도 이어집니다."}
          {store.kind === "browser" && "이 브라우저에 저장 중 — 기기마다 기록이 따로 쌓이고, 사람마다 각자의 목록을 갖게 됩니다."}
          {store.kind === "memory" && "저장할 곳을 찾지 못했어요. 창을 닫으면 기록이 사라집니다."}
        </div>

        {/* 초기화 */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          {confirmReset ? (
            <div style={{ background: C.roseSoft, borderRadius: 12, padding: 13 }}>
              <div style={{ fontSize: fs(16.5), lineHeight: 1.6, marginBottom: 11 }}>
                할 일·메모·사진·사주가 전부 지워집니다. 되돌릴 수 없어요.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setConfirmReset(false)}
                  style={{ flex: 1, border: `1px solid ${C.line}`, background: C.surface, borderRadius: 9, padding: "9px 0", fontSize: fs(16.5), fontWeight: 600, cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onReset();
                    onClose();
                  }}
                  style={{ flex: 1, border: "none", background: C.rose, color: "#fff", borderRadius: 9, padding: "9px 0", fontSize: fs(16.5), fontWeight: 700, cursor: "pointer" }}
                >
                  전부 지우기
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ border: "none", background: "none", fontSize: fs(15.5), color: C.rose, cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              전체 초기화
            </button>
          )}
        </div>

        <button
          onClick={commit}
          style={{
            width: "100%",
            border: "none",
            background: C.ink,
            color: "#fff",
            borderRadius: 11,
            padding: "13px 0",
            fontSize: fs(17.5),
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 20,
          }}
        >
          저장하고 닫기
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── 오늘의 사주 ─────────────────────────── */
const HOURS = [
  ["", "모름"],
  ["23", "자시 23:30~01:30"],
  ["1", "축시 01:30~03:30"],
  ["3", "인시 03:30~05:30"],
  ["5", "묘시 05:30~07:30"],
  ["7", "진시 07:30~09:30"],
  ["9", "사시 09:30~11:30"],
  ["11", "오시 11:30~13:30"],
  ["13", "미시 13:30~15:30"],
  ["15", "신시 15:30~17:30"],
  ["17", "유시 17:30~19:30"],
  ["19", "술시 19:30~21:30"],
  ["21", "해시 21:30~23:30"],
];

function SajuCard({ birth, birthHour, onSetBirth, today }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dDate, setDDate] = useState(birth || "");
  const [dHour, setDHour] = useState(birthHour === null || birthHour === undefined ? "" : String(birthHour));
  const f = useMemo(() => (birth ? buildFortune(birth, birthHour, today) : null), [birth, birthHour, today]);

  if (!birth || editing) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: fs(20), fontWeight: 700, marginBottom: 3, letterSpacing: -0.3 }}>
          오늘의 사주
        </div>
        <div style={{ fontSize: fs(15.5), color: C.inkSoft, lineHeight: 1.6, marginBottom: 11 }}>
          생년월일(양력)과 태어난 시간을 한 번만 넣으면, 이후로는 매일 자동으로 나옵니다.
        </div>

        <div style={{ fontSize: fs(14), color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>생년월일</div>
        <input
          type="date"
          value={dDate}
          onChange={(e) => setDDate(e.target.value)}
          style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 10px", fontSize: fs(17), background: C.surface }}
        />

        <div style={{ fontSize: fs(14), color: C.muted, fontWeight: 700, letterSpacing: 1, margin: "11px 0 5px" }}>태어난 시간</div>
        <select
          value={dHour}
          onChange={(e) => setDHour(e.target.value)}
          style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 10px", fontSize: fs(17), background: C.surface }}
        >
          {HOURS.map(([v, label]) => (
            <option key={v || "none"} value={v}>{label}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {birth && (
            <button
              onClick={() => setEditing(false)}
              style={{ border: `1px solid ${C.line}`, background: C.surface, borderRadius: 9, padding: "9px 15px", fontSize: fs(16.5), fontWeight: 600, color: C.inkSoft, cursor: "pointer" }}
            >
              취소
            </button>
          )}
          <button
            onClick={() => {
              if (!dDate) return;
              onSetBirth(dDate, dHour === "" ? null : Number(dHour));
              setEditing(false);
              setOpen(true);
            }}
            disabled={!dDate}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 9,
              padding: "9px 15px",
              fontSize: fs(16.5),
              fontWeight: 700,
              cursor: dDate ? "pointer" : "default",
              background: dDate ? C.ink : C.lineSoft,
              color: dDate ? "#fff" : C.muted,
            }}
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  const accent = EL_COLOR[f.dayEl];
  const facts = [
    ["오늘의 색", f.color],
    ["좋은 방향", f.dir],
    ["행운의 숫자", String(f.num)],
    ["잘 풀리는 시간", f.luckyTime],
    ["나의 일주", f.myDay.split("(")[0]],
    ["나의 시주", f.myHour ? f.myHour.split("(")[0] : "—"],
  ];

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", border: "none", background: "none", padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}
      >
        <span
          style={{
            flexShrink: 0, width: px(42), height: px(42), borderRadius: 11, background: accent, color: "#fff",
            display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: fs(18), fontWeight: 700,
          }}
        >
          {f.dayEl}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: fs(13), letterSpacing: 2, color: C.muted, fontWeight: 700 }}>
            오늘의 사주 · {f.dayPillar}
          </span>
          <span style={{ display: "block", fontFamily: DISPLAY, fontSize: fs(19), fontWeight: 700, marginTop: 2, letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {f.head}
          </span>
        </span>
        <span style={{ color: C.muted, fontSize: fs(16), flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ fontSize: fs(17), lineHeight: 1.75, color: C.ink, padding: "12px 14px", background: C.bg, borderRadius: 11, borderLeft: `3px solid ${accent}` }}>
            {f.line}
            {f.hourNote && (
              <>
                <br />
                <span style={{ color: C.inkSoft }}>{f.hourNote}</span>
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9, marginTop: 11 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ border: `1px solid ${C.lineSoft}`, borderRadius: 10, padding: "9px 11px" }}>
                <div style={{ fontSize: fs(13), color: C.muted, fontWeight: 700, letterSpacing: 1 }}>{k}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: fs(17.5), fontWeight: 700, marginTop: 3, letterSpacing: -0.3 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 11, fontSize: fs(16), color: C.inkSoft, lineHeight: 1.7 }}>
            <b style={{ color: C.rose }}>조심할 것</b> — {f.watch}
          </div>

          <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${C.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: fs(14), color: C.muted, lineHeight: 1.5 }}>
              {f.zodiac}띠 · 오늘은 {f.zodiacToday}날. 재미로 보는 거예요.
            </span>
            <button
              onClick={() => {
                setDDate(birth);
                setDHour(birthHour === null || birthHour === undefined ? "" : String(birthHour));
                setEditing(true);
              }}
              style={{ border: "none", background: "none", fontSize: fs(14.5), color: C.inkSoft, cursor: "pointer", fontWeight: 600, flexShrink: 0, padding: 0 }}
            >
              생일 수정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── 공용 칩 ─────────────────────────── */
const chipStyle = (active, color) => ({
  border: `${active ? 2 : 1}px solid ${active ? color : C.line}`,
  background: active ? color : C.surface,
  color: active ? "#fff" : C.inkSoft,
  borderRadius: 999,
  padding: `${px(active ? 6 : 7)}px ${px(13)}px`,
  fontSize: fs(15),
  fontWeight: active ? 700 : 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

/* ─────────────────────────── 입력창 ─────────────────────────── */
function AddBar({ onAdd, fixedDate, placeholder }) {
  const tags = useTags();
  const [text, setText] = useState("");
  const [date, setDate] = useState(fixedDate || null);
  const [tag, setTag] = useState(null);
  const [pick, setPick] = useState(false);
  const today = ymd(new Date());
  const tomorrow = ymd(addDays(new Date(), 1));

  useEffect(() => {
    if (fixedDate) setDate(fixedDate);
  }, [fixedDate]);

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text, date, tag);
    setText("");
    setTag(null);
    if (!fixedDate) {
      setDate(null);
      setPick(false);
    }
  };

  const chip = chipStyle;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 12, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder || "무엇을 해야 하나요?"}
          style={{ flex: 1, border: "none", background: "none", fontSize: fs(18), padding: `${px(9)}px 2px`, minWidth: 0 }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            border: "none",
            borderRadius: 10,
            padding: `${px(11)}px ${px(18)}px`,
            fontSize: fs(17),
            fontWeight: 700,
            cursor: text.trim() ? "pointer" : "default",
            background: text.trim() ? C.ink : C.lineSoft,
            color: text.trim() ? "#fff" : C.muted,
            flexShrink: 0,
          }}
        >
          추가
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {!fixedDate && (
          <>
            <button onClick={() => { setDate(date === today ? null : today); setPick(false); }} style={chip(date === today, C.ink)}>오늘</button>
            <button onClick={() => { setDate(date === tomorrow ? null : tomorrow); setPick(false); }} style={chip(date === tomorrow, C.ink)}>내일</button>
            <button onClick={() => setPick((v) => !v)} style={chip(pick || (date && date !== today && date !== tomorrow), C.ink)}>
              {date && date !== today && date !== tomorrow ? fmtDay(date) : "날짜"}
            </button>
            <span style={{ width: 1, background: C.line, margin: "2px 4px" }} />
          </>
        )}
        {tags.map((t) => (
          <button key={t.id} onClick={() => setTag(tag === t.id ? null : t.id)} style={chip(tag === t.id, t.color)}>
            {tag === t.id ? "✓ " : ""}{t.label}
          </button>
        ))}
      </div>

      {pick && !fixedDate && (
        <input
          type="date"
          value={date || ""}
          onChange={(e) => setDate(e.target.value || null)}
          style={{ marginTop: 9, width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: fs(17), background: C.surface }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── 할 일 한 줄 ─────────────────────────── */
function TodoRow({ t, today, onPatch, onDel, hideDate }) {
  const tags = useTags();
  const tg = findTag(tags, t.tag);
  const late = t.date && t.date < today && !t.done;
  const [editing, setEditing] = useState(false);
  const [dText, setDText] = useState(t.text);
  const [dDate, setDDate] = useState(t.date);
  const [dTag, setDTag] = useState(t.tag);
  const [pick, setPick] = useState(false);

  const tomorrow = ymd(addDays(parseKey(today), 1));

  const startEdit = () => {
    setDText(t.text);
    setDDate(t.date);
    setDTag(t.tag);
    setPick(false);
    setEditing(true);
  };
  const save = () => {
    if (!dText.trim()) return;
    onPatch(t.id, { text: dText.trim(), date: dDate, tag: dTag });
    setEditing(false);
  };

  /* ── 수정 모드 ── */
  if (editing) {
    return (
      <div
        style={{
          background: C.surface,
          border: `2px solid ${C.ink}`,
          borderRadius: 13,
          padding: px(14),
          margin: "8px -2px",
        }}
      >
        <input
          autoFocus
          value={dText}
          onChange={(e) => setDText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          style={{
            width: "100%",
            border: "none",
            background: "none",
            fontSize: fs(18),
            fontWeight: 500,
            padding: `${px(4)}px 0 ${px(10)}px`,
          }}
        />

        <div style={{ fontSize: fs(11), letterSpacing: 1.5, fontWeight: 700, color: C.muted, marginBottom: 7 }}>
          날짜
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 13 }}>
          <button onClick={() => { setDDate(null); setPick(false); }} style={chipStyle(!dDate, C.muted)}>없음</button>
          <button onClick={() => { setDDate(today); setPick(false); }} style={chipStyle(dDate === today, C.ink)}>오늘</button>
          <button onClick={() => { setDDate(tomorrow); setPick(false); }} style={chipStyle(dDate === tomorrow, C.ink)}>내일</button>
          <button
            onClick={() => setPick((v) => !v)}
            style={chipStyle(pick || (dDate && dDate !== today && dDate !== tomorrow), C.ink)}
          >
            {dDate && dDate !== today && dDate !== tomorrow ? fmtDay(dDate) : "날짜 고르기"}
          </button>
        </div>
        {pick && (
          <input
            type="date"
            value={dDate || ""}
            onChange={(e) => setDDate(e.target.value || null)}
            style={{
              width: "100%", border: `1px solid ${C.line}`, borderRadius: 9,
              padding: `${px(10)}px 10px`, fontSize: fs(16), background: C.surface, marginBottom: 13,
            }}
          />
        )}

        <div style={{ fontSize: fs(11), letterSpacing: 1.5, fontWeight: 700, color: C.muted, marginBottom: 7 }}>
          분류
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <button onClick={() => setDTag(null)} style={chipStyle(!dTag, C.muted)}>없음</button>
          {tags.map((x) => (
            <button key={x.id} onClick={() => setDTag(dTag === x.id ? null : x.id)} style={chipStyle(dTag === x.id, x.color)}>
              {x.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button
            onClick={() => onDel(t.id)}
            style={{ border: "none", background: "none", fontSize: fs(15), color: C.rose, fontWeight: 700, cursor: "pointer", padding: `${px(10)}px 4px` }}
          >
            삭제
          </button>
          <span style={{ flex: 1 }} />
          <button
            onClick={() => setEditing(false)}
            style={{
              border: `1px solid ${C.line}`, background: C.surface, borderRadius: 10,
              padding: `${px(11)}px ${px(18)}px`, fontSize: fs(15), fontWeight: 600, color: C.inkSoft, cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={!dText.trim()}
            style={{
              border: "none", borderRadius: 10, padding: `${px(11)}px ${px(20)}px`,
              fontSize: fs(15), fontWeight: 700, cursor: dText.trim() ? "pointer" : "default",
              background: dText.trim() ? C.ink : C.lineSoft, color: dText.trim() ? "#fff" : C.muted,
            }}
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  /* ── 보기 모드 ── */
  return (
    <div className="pl-row" style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: `${px(14)}px 10px`, borderRadius: 10, margin: "0 -10px" }}>
      <button
        onClick={() => onPatch(t.id, { done: !t.done })}
        aria-label={t.done ? "완료 취소" : "완료 표시"}
        style={{
          flexShrink: 0,
          marginTop: 1,
          width: px(26),
          height: px(26),
          borderRadius: "50%",
          border: `2px solid ${t.done ? C.teal : late ? C.rose : C.muted}`,
          background: t.done ? C.teal : "transparent",
          cursor: "pointer",
          padding: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        {t.done && (
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.3l2.4 2.4L9.6 3.9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div onClick={startEdit} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div
          style={{
            fontSize: fs(18),
            lineHeight: 1.45,
            color: t.done ? C.muted : C.ink,
            textDecoration: t.done ? "line-through" : "none",
            wordBreak: "break-word",
          }}
        >
          {t.text}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 6, flexWrap: "wrap" }}>
          {tg ? (
            <span style={{ fontSize: fs(14), fontWeight: 700, color: tg.color }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: tg.color, marginRight: 6, verticalAlign: 1 }} />
              {tg.label}
            </span>
          ) : (
            <span style={{ fontSize: fs(14), color: C.muted, fontWeight: 500 }}>+ 분류</span>
          )}
          {t.date && !hideDate && (
            <span style={{ fontSize: fs(14), color: late ? C.rose : C.muted, fontWeight: late ? 700 : 500 }}>{fmtDay(t.date)}</span>
          )}
        </div>
      </div>

      <button
        className="pl-x"
        onClick={() => onDel(t.id)}
        aria-label="삭제"
        style={{ flexShrink: 0, border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: fs(21), lineHeight: 1, padding: `${px(6)}px 6px` }}
      >
        ×
      </button>
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 6px" }}>
      <div style={{ fontSize: fs(14), letterSpacing: 2, fontWeight: 700, color: C.muted }}>{children}</div>
      {right}
    </div>
  );
}

/* ─────────────────────────── 할 일 탭 ─────────────────────────── */
function TodoView({ todos, today, onAdd, onPatch, onDel, onClearDone }) {
  const [showDone, setShowDone] = useState(false);
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const late = open.filter((t) => t.date && t.date < today);
  const now = open.filter((t) => t.date === today);
  const soon = open.filter((t) => t.date && t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const someday = open.filter((t) => !t.date);

  return (
    <>
      <AddBar onAdd={onAdd} />

      {todos.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: fs(22), fontWeight: 700, marginBottom: 8, letterSpacing: -0.3 }}>
            아직 비어 있어요
          </div>
          <div style={{ fontSize: fs(16.5), color: C.inkSoft, lineHeight: 1.7 }}>
            머릿속에 있는 것부터 하나씩 적어보세요.
            <br />
            날짜를 붙이면 캘린더에도 같이 표시됩니다.
          </div>
        </div>
      )}

      {late.length > 0 && (
        <>
          <SectionTitle>지난 할 일</SectionTitle>
          <div style={{ background: C.roseSoft, borderRadius: 12, padding: "4px 10px", margin: "0 -10px" }}>
            {late.map((t) => (
              <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} />
            ))}
          </div>
        </>
      )}

      {now.length > 0 && (
        <>
          <SectionTitle>오늘</SectionTitle>
          {now.map((t) => (
            <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} hideDate />
          ))}
        </>
      )}

      {soon.length > 0 && (
        <>
          <SectionTitle>예정</SectionTitle>
          {soon.map((t) => (
            <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} />
          ))}
        </>
      )}

      {someday.length > 0 && (
        <>
          <SectionTitle>날짜 없음</SectionTitle>
          {someday.map((t) => (
            <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} />
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <SectionTitle
            right={
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowDone((v) => !v)} style={{ border: "none", background: "none", fontSize: fs(15), color: C.inkSoft, cursor: "pointer", fontWeight: 600 }}>
                  {showDone ? "접기" : `펼치기 (${done.length})`}
                </button>
                {showDone && (
                  <button onClick={onClearDone} style={{ border: "none", background: "none", fontSize: fs(15), color: C.rose, cursor: "pointer", fontWeight: 600 }}>
                    전체 삭제
                  </button>
                )}
              </div>
            }
          >
            완료
          </SectionTitle>
          {showDone && done.map((t) => <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} />)}
        </>
      )}
      <div style={{ height: 20 }} />
    </>
  );
}

/* ─────────────────────────── 캘린더 탭 ─────────────────────────── */
function CalendarView({ todos, today, sel, setSel, onAdd, onPatch, onDel }) {
  const tags = useTags();
  const t0 = parseKey(today);
  const s0 = parseKey(sel);
  const [cur, setCur] = useState({ y: s0.getFullYear(), m: s0.getMonth() });

  useEffect(() => {
    const d = parseKey(sel);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  }, [sel]);

  const byDate = useMemo(() => {
    const map = {};
    todos.forEach((t) => {
      if (!t.date) return;
      (map[t.date] = map[t.date] || []).push(t);
    });
    return map;
  }, [todos]);

  const firstDow = new Date(cur.y, cur.m, 1).getDay();
  const total = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const move = (n) => {
    const d = new Date(cur.y, cur.m + n, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  };

  const selList = (byDate[sel] || []).slice().sort((a, b) => Number(a.done) - Number(b.done));
  const selOpen = selList.filter((t) => !t.done).length;

  const navBtn = {
    border: `1px solid ${C.line}`,
    background: C.surface,
    borderRadius: 10,
    width: px(40),
    height: px(40),
    cursor: "pointer",
    color: C.inkSoft,
    fontSize: fs(18),
    lineHeight: 1,
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => move(-1)} style={navBtn} aria-label="이전 달">‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: fs(26), fontWeight: 700, letterSpacing: -0.4 }}>
            {cur.y}년 {cur.m + 1}월
          </div>
          {(cur.y !== t0.getFullYear() || cur.m !== t0.getMonth()) && (
            <button
              onClick={() => setSel(today)}
              style={{ border: "none", background: "none", fontSize: fs(14), color: C.rose, cursor: "pointer", fontWeight: 700, marginTop: 2 }}
            >
              오늘로
            </button>
          )}
        </div>
        <button onClick={() => move(1)} style={navBtn} aria-label="다음 달">›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {WD.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: fs(13), fontWeight: 700, letterSpacing: 1, paddingBottom: 6, color: i === 0 ? C.rose : i === 6 ? C.indigo : C.muted }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const key = `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
          const list = byDate[key] || [];
          const isToday = key === today;
          const isSel = key === sel;
          const dow = new Date(cur.y, cur.m, d).getDay();
          const stars = list.slice(0, 4);
          return (
            <button
              key={key}
              className="pl-cell"
              onClick={() => setSel(key)}
              title={list.length ? `${list.length}개` : undefined}
              style={{
                border: "none",
                background: isSel ? C.ink : "transparent",
                borderRadius: 10,
                padding: "7px 0 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                minHeight: px(62),
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: fs(19),
                    fontWeight: isToday ? 700 : 500,
                    letterSpacing: -0.3,
                    color: isSel ? "#fff" : isToday ? C.rose : dow === 0 ? C.rose : dow === 6 ? C.indigo : C.ink,
                  }}
                >
                  {d}
                </span>
                {isToday && !isSel && (
                  <span style={{ position: "absolute", left: -2, right: -2, bottom: -2, height: 2, background: C.rose, borderRadius: 2, transform: "rotate(-1.5deg)" }} />
                )}
              </span>

              {/* 할 일 개수만큼 별 */}
              <span style={{ display: "flex", gap: 0.5, height: px(14), alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                {stars.map((t) => {
                  const tg = findTag(tags, t.tag);
                  return (
                    <span
                      key={t.id}
                      style={{
                        fontSize: fs(12),
                        lineHeight: 1,
                        color: t.done
                          ? isSel ? "#5d6579" : "#D8D2CD"
                          : tg ? tg.color : isSel ? "#fff" : C.inkSoft,
                      }}
                    >
                      ★
                    </span>
                  );
                })}
                {list.length > 4 && (
                  <span style={{ fontSize: fs(11), color: isSel ? "#fff" : C.muted, marginLeft: 1, fontWeight: 700 }}>
                    +{list.length - 4}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: fs(22), fontWeight: 700, letterSpacing: -0.3 }}>{fmtDay(sel)}</div>
          <div style={{ fontSize: fs(15), color: C.muted }}>
            {selList.length > 0
              ? `할 일 ${selList.length}개${selOpen !== selList.length ? ` · ${selOpen}개 남음` : ""}`
              : "일정 없음"}
          </div>
        </div>

        {selList.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {selList.map((t) => (
              <TodoRow key={t.id} t={t} today={today} onPatch={onPatch} onDel={onDel} hideDate />
            ))}
          </div>
        )}

        <AddBar onAdd={onAdd} fixedDate={sel} placeholder="이 날 할 일 추가" />

        {selList.length === 0 && (
          <div style={{ padding: "0 2px 30px", fontSize: fs(16.5), color: C.inkSoft, lineHeight: 1.7 }}>
            이 날은 아직 비어 있어요. 위에 적으면 바로 이 날짜로 들어갑니다.
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}

/* ─────────────────────────── 메모 탭 ─────────────────────────── */
function Highlight({ text, q }) {
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out = [];
  let i = 0;
  let n = 0;
  while (i < text.length) {
    const hit = lower.indexOf(needle, i);
    if (hit === -1) {
      out.push(text.slice(i));
      break;
    }
    if (hit > i) out.push(text.slice(i, hit));
    out.push(
      <mark key={n++} style={{ background: "#FFE9A8", color: C.ink, borderRadius: 3, padding: "0 1px" }}>
        {text.slice(hit, hit + q.length)}
      </mark>
    );
    i = hit + q.length;
  }
  return <>{out}</>;
}

function MemoView({ memos, photos, onAdd, onPatch, onDel, onAddPhotos, onDelPhoto }) {
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const query = q.trim();

  const titleOf = (b) => (b || "").split("\n")[0].trim() || "제목 없는 메모";
  const bodyOf = (b) => (b || "").split("\n").slice(1).join(" ").trim();

  const snippetOf = (b) => {
    const rest = bodyOf(b);
    if (!query) return rest.length > 60 ? rest.slice(0, 60) + "…" : rest;
    const hit = rest.toLowerCase().indexOf(query.toLowerCase());
    if (hit === -1) return rest.length > 60 ? rest.slice(0, 60) + "…" : rest;
    const from = Math.max(0, hit - 22);
    const to = Math.min(rest.length, hit + query.length + 44);
    return (from > 0 ? "…" : "") + rest.slice(from, to) + (to < rest.length ? "…" : "");
  };

  const when = (ts) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const sorted = useMemo(
    () => memos.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updated - a.updated),
    [memos]
  );

  const shown = useMemo(() => {
    if (!query) return sorted;
    const n = query.toLowerCase();
    return sorted.filter((m) => (m.body || "").toLowerCase().includes(n));
  }, [sorted, query]);

  const pickFiles = async (e, memoId) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const srcs = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        srcs.push(await compress(f));
      }
      if (srcs.length) onAddPhotos(memoId, srcs);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {memos.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: C.surface,
            border: `1px solid ${query ? C.ink : C.line}`,
            borderRadius: 12,
            padding: "10px 13px",
            marginBottom: 12,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4.6" stroke={query ? C.ink : C.muted} strokeWidth="1.6" />
            <path d="M10.6 10.6L14 14" stroke={query ? C.ink : C.muted} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="키워드로 메모 찾기"
            style={{ flex: 1, border: "none", background: "none", fontSize: fs(17.5), padding: 0, minWidth: 0 }}
          />
          {query && (
            <button onClick={() => setQ("")} aria-label="검색어 지우기" style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: fs(21), lineHeight: 1, padding: 0 }}>
              ×
            </button>
          )}
        </div>
      )}

      {query ? (
        <div style={{ fontSize: fs(15), color: C.muted, marginBottom: 12, paddingLeft: 2 }}>
          {shown.length > 0 ? `${shown.length}개 찾음` : "일치하는 메모 없음"}
        </div>
      ) : (
        <button
          onClick={() => setOpenId(onAdd())}
          style={{
            width: "100%",
            border: `1px dashed ${C.muted}`,
            background: C.surface,
            borderRadius: 14,
            padding: "13px 0",
            fontSize: fs(17),
            fontWeight: 600,
            color: C.inkSoft,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          + 새 메모
        </button>
      )}

      {memos.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: fs(22), fontWeight: 700, marginBottom: 8, letterSpacing: -0.3 }}>
            메모가 없어요
          </div>
          <div style={{ fontSize: fs(16.5), color: C.inkSoft, lineHeight: 1.7 }}>
            첫 줄이 제목이 됩니다.
            <br />
            글과 사진을 같이 넣을 수 있어요.
          </div>
        </div>
      )}

      {query && shown.length === 0 && memos.length > 0 && (
        <div style={{ textAlign: "center", padding: "36px 20px", fontSize: fs(16.5), color: C.inkSoft, lineHeight: 1.7 }}>
          제목과 내용 전체에서 찾았지만 없었어요.
          <br />
          더 짧은 단어로 바꿔보세요.
        </div>
      )}

      {shown.map((m) => {
        const isOpen = openId === m.id;
        const snip = snippetOf(m.body);
        const pics = photos[m.id] || [];
        return (
          <div key={m.id} style={{ background: C.surface, border: `1px solid ${isOpen ? C.ink : C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            {isOpen ? (
              <>
                <textarea
                  autoFocus
                  value={m.body}
                  onChange={(e) => onPatch(m.id, { body: e.target.value })}
                  placeholder={"첫 줄에 제목을 적어보세요\n\n내용…"}
                  rows={8}
                  style={{ width: "100%", border: "none", background: "none", fontSize: fs(17.5), lineHeight: 1.75, padding: 0 }}
                />

                {pics.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, margin: "8px 0 4px" }}>
                    {pics.map((p) => (
                      <div key={p.pid} style={{ position: "relative", paddingTop: "100%", borderRadius: 9, overflow: "hidden", background: C.lineSoft }}>
                        <img
                          src={p.src}
                          alt=""
                          onClick={() => setLightbox(p.src)}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                        />
                        <button
                          onClick={() => onDelPhoto(m.id, p.pid)}
                          aria-label="사진 삭제"
                          style={{
                            position: "absolute", top: 5, right: 5, width: px(26), height: px(26), borderRadius: "50%",
                            border: "none", background: "rgba(31,42,68,.72)", color: "#fff", fontSize: fs(16),
                            lineHeight: 1, cursor: "pointer", padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => pickFiles(e, m.id)} style={{ display: "none" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.lineSoft}`, paddingTop: 10, marginTop: 8, gap: 10 }}>
                  <div style={{ display: "flex", gap: 13, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => fileRef.current && fileRef.current.click()}
                      disabled={busy}
                      style={{ border: "none", background: "none", fontSize: fs(15.5), color: busy ? C.muted : C.indigo, cursor: busy ? "default" : "pointer", fontWeight: 700, padding: 0 }}
                    >
                      {busy ? "사진 넣는 중…" : "사진 추가"}
                    </button>
                    <button
                      onClick={() => onPatch(m.id, { pinned: !m.pinned }, false)}
                      style={{ border: "none", background: "none", fontSize: fs(15.5), color: m.pinned ? C.amber : C.inkSoft, cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                      {m.pinned ? "고정 해제" : "위에 고정"}
                    </button>
                    <button onClick={() => onDel(m.id)} style={{ border: "none", background: "none", fontSize: fs(15.5), color: C.rose, cursor: "pointer", fontWeight: 600, padding: 0 }}>
                      삭제
                    </button>
                  </div>
                  <button
                    onClick={() => setOpenId(null)}
                    style={{ border: "none", background: C.ink, color: "#fff", borderRadius: 9, padding: "7px 15px", fontSize: fs(16), fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                  >
                    완료
                  </button>
                </div>
              </>
            ) : (
              <div onClick={() => setOpenId(m.id)} style={{ cursor: "pointer", display: "flex", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: DISPLAY, fontSize: fs(20), fontWeight: 700, marginBottom: 4, wordBreak: "break-word", letterSpacing: -0.3 }}>
                    {m.pinned && <span style={{ color: C.amber, fontSize: fs(15), flexShrink: 0 }}>●</span>}
                    <span><Highlight text={titleOf(m.body)} q={query} /></span>
                  </div>
                  {snip && (
                    <div style={{ fontSize: fs(16), color: C.inkSoft, lineHeight: 1.6, wordBreak: "break-word" }}>
                      <Highlight text={snip} q={query} />
                    </div>
                  )}
                  <div style={{ fontSize: fs(14), color: C.muted, marginTop: 7 }}>
                    {when(m.updated)}
                    {pics.length > 0 && ` · 사진 ${pics.length}장`}
                  </div>
                </div>
                {pics.length > 0 && (
                  <img src={pics[0].src} alt="" style={{ width: px(66), height: px(66), borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{ height: 20 }} />

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(20,24,36,.9)", zIndex: 50,
            display: "grid", placeItems: "center", padding: 20, cursor: "zoom-out",
          }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 10 }} />
        </div>
      )}
    </>
  );
}

