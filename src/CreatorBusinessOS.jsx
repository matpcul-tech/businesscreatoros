import { useState, useRef, useEffect } from "react";

const PLATFORMS = ["Instagram", "LinkedIn", "Facebook", "X", "TikTok"];

const PLATFORM_COLORS = {
  Instagram: "#E1306C",
  LinkedIn: "#0A66C2",
  Facebook: "#1877F2",
  X: "#000000",
  TikTok: "#FF0050",
};

const PLATFORM_CHAR_LIMITS = {
  Instagram: 2200,
  LinkedIn: 3000,
  Facebook: 63206,
  X: 280,
  TikTok: 2200,
};

const TONES = [
  { id: "professional", label: "Professional", desc: "Credible, polished, expert" },
  { id: "conversational", label: "Conversational", desc: "Warm, direct, human" },
  { id: "bold", label: "Bold", desc: "Confident, punchy, opinionated" },
  { id: "witty", label: "Witty", desc: "Sharp, clever, memorable" },
];

const GOALS = [
  { id: "awareness", label: "Build Awareness", prompt: "introduce the brand and what makes it different" },
  { id: "engagement", label: "Drive Engagement", prompt: "spark conversation, ask questions, invite responses" },
  { id: "authority", label: "Establish Authority", prompt: "share expertise, insights, or a strong point of view" },
  { id: "conversion", label: "Generate Leads", prompt: "highlight value and move the reader toward taking action" },
];

const TONE_PROMPTS = {
  professional: "Write in a polished, credible, expert tone. No slang. Clear and substantive.",
  conversational: "Write in a warm, direct, human tone. Like a knowledgeable friend talking to you.",
  bold: "Write in a confident, punchy, opinionated tone. Strong statements. No hedging.",
  witty: "Write in a sharp, clever tone. Use wordplay or unexpected angles where natural. Never forced.",
};

const extractJSON = (text) => {
  try { return JSON.parse(text.trim()); } catch {}
  const stripped = text.replace(/```json|```/gi, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  throw new Error("Could not parse AI response. Please try again.");
};


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #FFFFFF;
    --off: #F8FAFC;
    --slate-50: #F1F5F9;
    --slate-100: #E2E8F0;
    --slate-200: #CBD5E1;
    --slate-400: #94A3B8;
    --slate-600: #475569;
    --slate-800: #1E293B;
    --slate-900: #0F172A;
    --indigo: #6366F1;
    --indigo-light: #EEF2FF;
    --indigo-mid: #C7D2FE;
    --green: #10B981;
    --green-light: #ECFDF5;
    --red: #EF4444;
    --red-light: #FEF2F2;
    --amber: #F59E0B;
    --amber-light: #FFFBEB;
    --shadow-sm: 0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04);
    --shadow-md: 0 4px 16px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06);
    --shadow-lg: 0 12px 40px rgba(15,23,42,0.14), 0 4px 12px rgba(15,23,42,0.08);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 20px;
  }

  body { background: var(--off); }

  .app {
    min-height: 100vh;
    background: var(--off);
    color: var(--slate-900);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* NAV */
  .nav {
    background: var(--white);
    border-bottom: 1px solid var(--slate-100);
    padding: 0 28px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-sm);
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; }
  .nav-icon {
    width: 32px; height: 32px;
    background: var(--indigo);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
  }
  .nav-wordmark {
    font-family: 'Playfair Display', serif;
    font-size: 17px; font-weight: 700;
    color: var(--slate-900); letter-spacing: -0.01em;
  }
  .nav-wordmark span { color: var(--indigo); }
  .nav-badge {
    font-size: 11px; font-weight: 600;
    color: var(--indigo);
    background: var(--indigo-light);
    border: 1px solid var(--indigo-mid);
    padding: 3px 10px; border-radius: 20px; letter-spacing: 0.02em;
  }

  /* INTAKE */
  .intake { max-width: 600px; margin: 0 auto; padding: 52px 24px 80px; }
  .intake-kicker {
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--indigo); margin-bottom: 14px;
  }
  .intake-headline {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 6vw, 52px);
    font-weight: 700; line-height: 1.08;
    color: var(--slate-900); margin-bottom: 12px; letter-spacing: -0.02em;
  }
  .intake-headline em { font-style: italic; color: var(--indigo); }
  .intake-sub {
    font-size: 15px; color: var(--slate-600); line-height: 1.65;
    margin-bottom: 44px; font-weight: 400;
  }
  .form-stack { display: flex; flex-direction: column; gap: 22px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .label {
    font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--slate-600);
    display: flex; justify-content: space-between; align-items: center;
  }
  .label-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--slate-400); font-size: 11px; }

  /* URL INPUT */
  .input-row {
    display: flex; background: var(--white);
    border: 1.5px solid var(--slate-200); border-radius: var(--radius-sm);
    overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: var(--shadow-sm);
  }
  .input-row:focus-within { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .input-prefix {
    font-size: 13px; font-weight: 500; color: var(--slate-400);
    padding: 13px 0 13px 16px; white-space: nowrap;
  }
  .text-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 500; color: var(--slate-900); padding: 13px 16px;
  }
  .text-input::placeholder { color: var(--slate-400); font-weight: 400; }

  /* TONE / GOAL SELECTORS */
  .option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .option-card {
    padding: 12px 14px;
    background: var(--white);
    border: 1.5px solid var(--slate-200);
    border-radius: var(--radius-sm);
    cursor: pointer; transition: all 0.15s;
    box-shadow: var(--shadow-sm);
    text-align: left;
  }
  .option-card:hover { border-color: var(--indigo); background: var(--indigo-light); }
  .option-card.active {
    background: var(--indigo); border-color: var(--indigo);
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }
  .option-label {
    font-size: 13px; font-weight: 700;
    color: var(--slate-900); display: block; margin-bottom: 2px;
  }
  .option-card.active .option-label { color: white; }
  .option-desc {
    font-size: 11px; font-weight: 400; color: var(--slate-400);
  }
  .option-card.active .option-desc { color: rgba(255,255,255,0.75); }
  .option-card:hover:not(.active) .option-label { color: var(--indigo); }
  .option-card:hover:not(.active) .option-desc { color: var(--indigo); opacity: 0.7; }

  /* VIDEO TOGGLE */
  .feature-card {
    background: var(--white); border: 1.5px solid var(--slate-100);
    border-radius: var(--radius); overflow: hidden;
    box-shadow: var(--shadow-sm); transition: border-color 0.2s;
  }
  .feature-card.active { border-color: var(--indigo); }
  .feature-row {
    display: flex; align-items: center; padding: 16px 18px;
    cursor: pointer; gap: 14px; user-select: none; transition: background 0.15s;
  }
  .feature-row:hover { background: var(--slate-50); }
  .feature-icon {
    width: 38px; height: 38px; border-radius: var(--radius-sm);
    background: var(--indigo-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .feature-icon.active { background: var(--indigo); }
  .feature-text { flex: 1; }
  .feature-title { font-size: 14px; font-weight: 600; color: var(--slate-900); margin-bottom: 2px; }
  .feature-sub { font-size: 12px; color: var(--slate-400); font-weight: 400; }
  .pill-toggle {
    width: 44px; height: 24px; border-radius: 12px;
    background: var(--slate-200); position: relative;
    transition: background 0.25s; flex-shrink: 0;
  }
  .pill-toggle.on { background: var(--indigo); }
  .pill-toggle::after {
    content: ''; position: absolute;
    top: 3px; left: 3px; width: 18px; height: 18px;
    border-radius: 50%; background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.25s;
  }
  .pill-toggle.on::after { transform: translateX(20px); }
  .feature-panel { overflow: hidden; max-height: 0; transition: max-height 0.35s ease; }
  .feature-panel.open { max-height: 220px; }
  .feature-panel-inner {
    padding: 0 18px 18px;
    display: flex; flex-direction: column; gap: 10px;
    border-top: 1px solid var(--slate-100); padding-top: 16px;
  }
  .key-row {
    display: flex; background: var(--slate-50);
    border: 1.5px solid var(--slate-200); border-radius: var(--radius-sm);
    overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .key-row:focus-within { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .key-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: monospace; font-size: 12px; font-weight: 500;
    color: var(--slate-800); padding: 11px 14px; letter-spacing: 0.02em;
  }
  .key-input::placeholder { color: var(--slate-400); font-weight: 400; letter-spacing: 0; }
  .key-tag {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--indigo); background: var(--indigo-light);
    padding: 0 12px; display: flex; align-items: center;
    border-left: 1px solid var(--indigo-mid);
  }
  .luma-note { font-size: 11px; color: var(--slate-400); line-height: 1.6; }
  .luma-note a { color: var(--indigo); text-decoration: none; font-weight: 500; }
  .luma-note a:hover { text-decoration: underline; }

  /* BRAND CONTEXT */
  .context-toggle {
    display: flex; align-items: center; gap: 12px; padding: 14px 18px;
    background: var(--white); border: 1.5px solid var(--slate-100);
    border-radius: var(--radius-sm); cursor: pointer; user-select: none;
    transition: border-color 0.2s, background 0.15s; box-shadow: var(--shadow-sm);
  }
  .context-toggle:hover { background: var(--slate-50); border-color: var(--slate-200); }
  .ctx-chevron { font-size: 11px; color: var(--slate-400); transition: transform 0.3s; display: inline-block; }
  .ctx-chevron.open { transform: rotate(90deg); }
  .ctx-label { font-size: 13px; font-weight: 600; color: var(--slate-800); flex: 1; }
  .ctx-hint { font-size: 11px; color: var(--slate-400); font-weight: 400; }
  .ctx-panel {
    overflow: hidden; max-height: 0; transition: max-height 0.4s ease;
    background: var(--white); border: 1.5px solid var(--slate-100);
    border-top: none; border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }
  .ctx-panel.open { max-height: 400px; }
  .ctx-panel-inner { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .ctx-textarea {
    width: 100%; background: var(--slate-50); border: 1.5px solid var(--slate-200);
    border-radius: var(--radius-sm); outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 400;
    color: var(--slate-800); padding: 12px 14px; resize: vertical;
    min-height: 120px; line-height: 1.65; transition: border-color 0.2s;
  }
  .ctx-textarea:focus { border-color: var(--indigo); }
  .ctx-textarea::placeholder { color: var(--slate-400); }
  .char-count { font-size: 10px; color: var(--slate-400); text-align: right; font-weight: 500; }

  /* PLATFORMS */
  .platform-grid { display: flex; gap: 8px; flex-wrap: wrap; }
  .p-pill {
    display: flex; align-items: center; gap: 7px; padding: 8px 16px;
    border: 1.5px solid var(--slate-200); border-radius: 40px;
    background: var(--white); font-size: 12px; font-weight: 600;
    color: var(--slate-600); cursor: pointer; transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }
  .p-pill:hover { border-color: var(--slate-400); color: var(--slate-900); }
  .p-pill.active {
    background: var(--indigo); border-color: var(--indigo); color: white;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }
  .p-dot { width: 7px; height: 7px; border-radius: 50%; }

  /* GENERATE BUTTON */
  .gen-btn {
    width: 100%; padding: 16px; background: var(--indigo); border: none;
    border-radius: var(--radius-sm); color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }
  .gen-btn:hover:not(:disabled) {
    background: #4F46E5;
    box-shadow: 0 6px 20px rgba(99,102,241,0.45); transform: translateY(-1px);
  }
  .gen-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  .error-box {
    background: var(--red-light); border: 1px solid rgba(239,68,68,0.2);
    border-radius: var(--radius-sm); padding: 12px 16px;
    font-size: 13px; color: var(--red); line-height: 1.5; font-weight: 500;
  }

  /* LOADING */
  .loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: calc(100vh - 60px); gap: 20px; padding: 40px 24px;
  }
  .spin-ring {
    width: 48px; height: 48px;
    border: 3px solid var(--slate-100); border-top-color: var(--indigo);
    border-radius: 50%; animation: spin 0.9s linear infinite;
  }
  .load-title {
    font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700;
    color: var(--slate-900); letter-spacing: -0.01em;
  }
  .load-stage { font-size: 14px; color: var(--slate-600); font-weight: 400; }
  .load-bar-wrap {
    width: min(320px, 80%); height: 4px; background: var(--slate-100);
    border-radius: 4px; overflow: hidden;
  }
  .load-bar {
    height: 100%; background: var(--indigo);
    border-radius: 4px; transition: width 0.5s ease;
  }
  .load-detail { font-size: 11px; color: var(--slate-400); font-weight: 500; text-align: center; }

  /* SWIPE */
  .swipe-screen {
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 20px 40px; min-height: calc(100vh - 60px);
  }
  .swipe-bar {
    width: 100%; max-width: 420px;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px;
  }
  .swipe-counter { font-size: 13px; font-weight: 600; color: var(--slate-600); }
  .swipe-counter strong { color: var(--indigo); font-weight: 700; }
  .ghost-btn {
    font-size: 12px; font-weight: 600; color: var(--slate-600);
    background: var(--white); border: 1.5px solid var(--slate-200);
    border-radius: 8px; padding: 7px 16px; cursor: pointer; transition: all 0.15s;
  }
  .ghost-btn:hover { border-color: var(--slate-400); color: var(--slate-900); }
  .card-stack {
    position: relative; width: min(420px, 100%); height: 600px;
    margin-bottom: 28px; touch-action: none;
  }
  .post-card {
    position: absolute; inset: 0; background: var(--white);
    border-radius: var(--radius-lg); border: 1px solid var(--slate-100);
    box-shadow: var(--shadow-lg); display: flex; flex-direction: column;
    overflow: hidden; cursor: grab; user-select: none; will-change: transform;
  }
  .post-card:active { cursor: grabbing; }
  .post-card.behind-1 { transform: scale(0.96) translateY(10px); opacity: 0.55; pointer-events: none; }
  .post-card.behind-2 { transform: scale(0.92) translateY(20px); opacity: 0.28; pointer-events: none; }

  .card-media {
    width: 100%; height: 260px; position: relative;
    overflow: hidden; background: var(--slate-100); flex-shrink: 0;
  }
  .card-video { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.4s; }
  .card-video.hidden { opacity: 0; }
  .card-video.visible { opacity: 1; }
  .card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.4s; }
  .card-img.hidden { opacity: 0; }
  .card-img.visible { opacity: 1; }
  .card-media-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 55%, rgba(255,255,255,0.12) 100%);
    pointer-events: none;
  }
  .media-loading {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 10px; background: var(--slate-50);
  }
  .media-spin {
    width: 24px; height: 24px;
    border: 2px solid var(--slate-200); border-top-color: var(--indigo);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  .media-label-text {
    font-size: 11px; font-weight: 600; color: var(--slate-400);
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .ai-video-tag {
    position: absolute; top: 12px; right: 12px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: white; background: var(--indigo); border-radius: 6px; padding: 4px 10px;
    box-shadow: 0 2px 8px rgba(99,102,241,0.4);
  }
  .card-body {
    padding: 16px 20px 18px; flex: 1;
    display: flex; flex-direction: column; gap: 10px; overflow: hidden;
  }
  .card-platform-row { display: flex; align-items: center; gap: 7px; }
  .c-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .c-platform {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--slate-400); flex: 1;
  }
  .c-badges { display: flex; gap: 5px; align-items: center; }
  .c-badge {
    font-size: 10px; font-weight: 600; color: var(--indigo);
    background: var(--indigo-light); border-radius: 6px; padding: 2px 8px;
  }
  .c-badge.video { color: var(--green); background: var(--green-light); }
  .c-badge.warn { color: var(--amber); background: var(--amber-light); }
  .card-caption {
    font-size: 14px; font-weight: 400; line-height: 1.65;
    color: var(--slate-800); flex: 1; overflow: hidden;
    display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical;
  }
  .card-hashtags {
    font-size: 12px; font-weight: 500; color: var(--indigo); line-height: 1.8; opacity: 0.7;
  }
  .card-char-row {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 4px; margin-top: 2px;
  }
  .char-bar { height: 3px; flex: 1; border-radius: 3px; background: var(--slate-100); overflow: hidden; }
  .char-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
  .char-num { font-size: 10px; font-weight: 600; color: var(--slate-400); white-space: nowrap; }

  /* STAMPS */
  .stamp-wrap {
    position: absolute; top: 20px; opacity: 0;
    transition: opacity 0.12s; z-index: 5; pointer-events: none;
  }
  .stamp-wrap.save-stamp { right: 16px; }
  .stamp-wrap.skip-stamp { left: 16px; }
  .stamp {
    font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;
    padding: 6px 14px; border: 2.5px solid; border-radius: 6px;
  }
  .stamp.save { color: var(--green); border-color: var(--green); transform: rotate(-8deg); display: block; }
  .stamp.skip { color: var(--red); border-color: var(--red); transform: rotate(8deg); display: block; }

  /* ACTIONS */
  .action-row { display: flex; align-items: center; gap: 20px; }
  .act-btn {
    width: 58px; height: 58px; border-radius: 50%;
    border: 1.5px solid var(--slate-200); background: var(--white);
    font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; box-shadow: var(--shadow-md);
  }
  .act-btn.skip:hover { border-color: var(--red); color: var(--red); box-shadow: 0 4px 14px rgba(239,68,68,0.2); }
  .act-btn.save:hover { border-color: var(--green); color: var(--green); box-shadow: 0 4px 14px rgba(16,185,129,0.2); }
  .queue-count { text-align: center; min-width: 60px; }
  .queue-num {
    font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700;
    color: var(--indigo); line-height: 1; display: block;
  }
  .queue-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--slate-400);
  }

  @keyframes cardIn { from { opacity: 0; transform: scale(0.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .card-animate { animation: cardIn 0.28s ease forwards; }

  /* DONE */
  .done-screen {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: calc(100vh - 60px);
    padding: 48px 24px; text-align: center;
  }
  .done-check {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--green-light); border: 2px solid rgba(16,185,129,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; margin: 0 auto 24px;
  }
  .done-headline {
    font-family: 'Playfair Display', serif; font-size: clamp(40px, 8vw, 64px);
    font-weight: 700; line-height: 1; letter-spacing: -0.02em;
    color: var(--slate-900); margin-bottom: 12px;
  }
  .done-headline em { font-style: italic; color: var(--indigo); }
  .done-sub { font-size: 16px; color: var(--slate-600); margin-bottom: 40px; font-weight: 400; }
  .done-btns { display: flex; flex-direction: column; gap: 10px; width: min(300px, 100%); }
  .btn-primary {
    padding: 15px; background: var(--indigo); border: none;
    border-radius: var(--radius-sm); color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }
  .btn-primary:hover { background: #4F46E5; box-shadow: 0 6px 20px rgba(99,102,241,0.45); }
  .btn-ghost {
    padding: 15px; background: var(--white); border: 1.5px solid var(--slate-200);
    border-radius: var(--radius-sm); color: var(--slate-600);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: var(--slate-400); color: var(--slate-900); }

  /* SAVED */
  .saved-screen { padding: 32px 20px 60px; max-width: 660px; margin: 0 auto; }
  .saved-header {
    display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px;
  }
  .saved-headline {
    font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700;
    color: var(--slate-900); letter-spacing: -0.01em;
  }
  .saved-headline em { font-style: italic; color: var(--indigo); }
  .saved-sub { font-size: 12px; color: var(--slate-400); font-weight: 500; margin-top: 4px; }
  .saved-list { display: flex; flex-direction: column; gap: 16px; }
  .saved-card {
    background: var(--white); border: 1px solid var(--slate-100);
    border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .saved-card:hover { box-shadow: var(--shadow-md); border-color: var(--slate-200); }
  .saved-media { width: 100%; height: 180px; overflow: hidden; background: var(--slate-100); position: relative; }
  .saved-vid { width: 100%; height: 100%; object-fit: cover; display: block; }
  .saved-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .saved-media-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.1) 100%); }
  .saved-body { padding: 16px 18px 18px; }
  .saved-platform-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .s-dot { width: 6px; height: 6px; border-radius: 50%; }
  .s-platform {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--slate-400); flex: 1;
  }
  .s-video-tag {
    font-size: 10px; font-weight: 600; color: var(--green);
    background: var(--green-light); border-radius: 6px; padding: 2px 8px;
  }
  .saved-caption {
    font-size: 14px; font-weight: 400; line-height: 1.65;
    color: var(--slate-800); margin-bottom: 8px;
  }
  .saved-hashtags {
    font-size: 12px; font-weight: 500; color: var(--indigo);
    opacity: 0.65; margin-bottom: 14px; line-height: 1.8;
  }
  .saved-actions { display: flex; gap: 8px; }
  .copy-btn {
    flex: 1; padding: 10px 14px; background: var(--slate-50);
    border: 1.5px solid var(--slate-200); border-radius: var(--radius-sm);
    color: var(--slate-700); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .copy-btn:hover { background: var(--indigo-light); border-color: var(--indigo); color: var(--indigo); }
  .copy-btn.copied { background: var(--green-light); border-color: rgba(16,185,129,0.3); color: var(--green); }
  .dl-btn {
    padding: 10px 16px; background: var(--green-light);
    border: 1.5px solid rgba(16,185,129,0.25); border-radius: var(--radius-sm);
    color: var(--green); font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
  }
  .dl-btn:hover { background: var(--green); color: white; border-color: var(--green); }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function CreatorBusinessOS() {
  const [screen, setScreen] = useState("intake");
  const [url, setUrl] = useState("");
  const [brandContext, setBrandContext] = useState("");
  const [ctxOpen, setCtxOpen] = useState(false);
  const [platforms, setPlatforms] = useState(["Instagram", "LinkedIn"]);
  const [tone, setTone] = useState("professional");
  const [goal, setGoal] = useState("awareness");
  const [posts, setPosts] = useState([]);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState([]);
  const [stage, setStage] = useState("");
  const [detail, setDetail] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [mediaLoaded, setMediaLoaded] = useState({});
  const [commercials, setCommercials] = useState({});

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("cbos") || "null");
      if (!d) return;
      if (d.screen && d.screen !== "loading") setScreen(d.screen);
      if (d.posts) setPosts(d.posts);
      if (typeof d.index === "number") setIndex(d.index);
      if (d.saved) setSaved(d.saved);
      if (d.commercials) {
        const clean = {};
        for (const [k, v] of Object.entries(d.commercials)) {
          if (v && v.status === "done") clean[k] = v;
        }
        setCommercials(clean);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cbos", JSON.stringify({ screen, posts, index, saved, commercials }));
    } catch {}
  }, [screen, posts, index, saved, commercials]);

  const cardRef = useRef(null);
  const dragStart = useRef(null);
  const dragging = useRef(false);
  const dx = useRef(0);

  const togglePlatform = p => setPlatforms(prev =>
    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
  );

  const postCount = (n) => `${n} post${n !== 1 ? "s" : ""}`;

  const renderCommercial = async (post) => {
    const id = post.id;
    setCommercials(c => ({ ...c, [id]: { status: "fetching" } }));
    try {
      const terms = Array.isArray(post.searchTerms) ? post.searchTerms : [post.unsplashQuery || "business"];
      const clipsRes = await fetch("/api/pexels-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms, orientation: "landscape" }),
      });
      if (!clipsRes.ok) throw new Error("Pexels clips failed");
      const clipsData = await clipsRes.json();
      const urls = clipsData.clips.filter(c => c.url).map(c => c.url);
      if (urls.length === 0) throw new Error("No clips found");

      setCommercials(c => ({ ...c, [id]: { status: "rendering" } }));
      const renderRes = await fetch("/api/render-commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: post.script, clips: urls, orientation: "landscape" }),
      });
      if (!renderRes.ok) throw new Error("Render submission failed");
      const renderData = await renderRes.json();
      const project = renderData.project;

      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch("/api/render-status?project=" + encodeURIComponent(project));
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();
        if (statusData.status === "done" && statusData.url) {
          setCommercials(c => ({ ...c, [id]: { status: "done", url: statusData.url } }));
          return;
        }
        if (statusData.status === "error") throw new Error(statusData.message || "Render error");
      }
      throw new Error("Commercial render timed out");
    } catch {
      setCommercials(c => ({ ...c, [id]: { status: "error" } }));
    }
  };

  const generate = async () => {
    if (!url.trim() || platforms.length === 0) return;
    setError("");
    setScreen("loading");
    setProgress(0);

    const selectedGoal = GOALS.find(g => g.id === goal);
    const count = Math.min(platforms.length * 2, 8);
    const ctx = brandContext.trim() ? `\n\nBRAND CONTEXT:\n${brandContext.trim()}` : "";
    const videoField = `- "script": a 20-30 word voiceover script for a 6-second commercial (conversational, no em dashes)\n- "searchTerms": array of 3 visual search terms for stock footage (e.g. ["coffee shop", "laptop work", "city street"])\n- "unsplashQuery": 2-3 keywords for a fallback stock photo`;

    const prompt = `You are an expert social media strategist writing platform-native content for a real business.

Business URL: ${url}${ctx}

Generate exactly ${count} posts distributed across these platforms: ${platforms.join(", ")}.

TONE: ${TONE_PROMPTS[tone]}

GOAL: Each post should ${selectedGoal?.prompt}.

PLATFORM-SPECIFIC RULES:
- X: Hard max 280 characters for the caption. Be punchy. No filler.
- LinkedIn: 150-300 words. Can include a brief insight or takeaway. Professional.
- Instagram: 100-200 words. Visual language. Strong opening sentence.
- Facebook: Conversational. 80-150 words. Can ask a question.
- TikTok: 50-100 words. Energy, hooks, trending feel. First sentence is a hook.

CONTENT RULES:
- Never use em dashes. Use commas or colons instead.
- No generic phrases like "game-changer", "revolutionize", "in today's world", "in a world where".
- No emojis unless it fits TikTok or Instagram naturally.
- Each post must feel like it was written by a real human who knows this brand.
- Captions must not include hashtags.

Return ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].

Each object:
- "platform": one of ${platforms.map(p => `"${p}"`).join(", ")}
- "caption": the post body, platform-appropriate length, no hashtags
- "hashtags": 4-6 targeted hashtags as a single string
${videoField}`;

    const stages = [
      "Reading your brand...",
      "Profiling your audience...",
      "Writing platform copy...",
      "Applying tone and goal...",
      "Finalizing your queue...",
    ];
    let si = 0;
    setStage(stages[0]);
    setDetail("Claude is writing your posts");
    const iv = setInterval(() => { si = (si + 1) % stages.length; setStage(stages[si]); }, 1800);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      clearInterval(iv);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      if (!raw.trim()) throw new Error("Empty response. Please try again.");
      const parsed = extractJSON(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No posts returned. Try again.");

      setProgress(30);

      const newPosts = parsed.map((p, i) => ({
        ...p,
        platform: p.platform || platforms[i % platforms.length],
        videoUrl: null,
        imageUrl: `https://loremflickr.com/800/500/${encodeURIComponent((p.unsplashQuery || "business").replace(/\s+/g, ","))}?lock=${i}`,
        hasVideo: false,
        id: i,
      }));
      setCommercials({});
      setPosts(newPosts);
      newPosts.forEach(p => renderCommercial(p));

      setProgress(100);
      setIndex(0);
      setSaved([]);
      setMediaLoaded({});
      setTimeout(() => setScreen("swipe"), 300);
    } catch (err) {
      clearInterval(iv);
      setError(err.message || "Something went wrong.");
      setScreen("intake");
    }
  };

  const charInfo = (caption, platform) => {
    const limit = PLATFORM_CHAR_LIMITS[platform];
    if (!limit || !caption) return null;
    const len = caption.length;
    const pct = Math.min((len / limit) * 100, 100);
    const over = len > limit;
    const near = len > limit * 0.85;
    return { len, limit, pct, over, near };
  };

  const getX = e => e.touches ? e.touches[0]?.clientX ?? 0 : e.clientX;
  const onStart = e => { dragStart.current = getX(e); dragging.current = true; dx.current = 0; };
  const onMove = e => {
    if (!dragging.current) return;
    dx.current = getX(e) - (dragStart.current ?? 0);
    if (!cardRef.current) return;
    cardRef.current.style.transition = "none";
    cardRef.current.style.transform = `translateX(${dx.current}px) rotate(${dx.current * 0.06}deg)`;
    const pct = Math.min(Math.abs(dx.current) / 80, 1);
    const sw = cardRef.current.querySelector(".stamp-wrap.save-stamp");
    const kw = cardRef.current.querySelector(".stamp-wrap.skip-stamp");
    if (sw) sw.style.opacity = dx.current > 20 ? pct : 0;
    if (kw) kw.style.opacity = dx.current < -20 ? pct : 0;
  };
  const onEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const d = dx.current;
    dragStart.current = null;
    dx.current = 0;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.22s ease";
      cardRef.current.style.transform = "";
      const sw = cardRef.current.querySelector(".stamp-wrap.save-stamp");
      const kw = cardRef.current.querySelector(".stamp-wrap.skip-stamp");
      if (sw) sw.style.opacity = 0;
      if (kw) kw.style.opacity = 0;
    }
    if (d > 60) doSave();
    else if (d < -60) doSkip();
  };

  const doSave = () => { setSaved(p => [...p, posts[index]]); advance(); };
  const doSkip = () => advance();
  const advance = () => {
    if (index + 1 >= posts.length) setScreen("done");
    else setIndex(i => i + 1);
  };

  const copy = post => {
    navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`).then(() => {
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const reset = () => {
    setScreen("intake"); setPosts([]); setSaved([]); setIndex(0); setError(""); setProgress(0); setCommercials({});
    try { localStorage.removeItem("cbos"); } catch {}
  };

  const cur = posts[index];
  const curCharInfo = cur ? charInfo(cur.caption, cur.platform) : null;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-icon">🎯</div>
            <span className="nav-wordmark">Creator<span>OS</span></span>
          </div>
          <div className="nav-badge">
            {screen === "swipe" ? `${posts.length - index} left` :
             screen === "saved" ? `${postCount(saved.length)} ready` :
             "v4"}
          </div>
        </nav>

        {/* ── INTAKE ── */}
        {screen === "intake" && (
          <div className="intake">
            <p className="intake-kicker">Social Content Engine</p>
            <h1 className="intake-headline">Your brand voice,<br /><em>at scale.</em></h1>
            <p className="intake-sub">
              Paste a URL, set your tone and goal, pick your platforms.
              Claude writes platform-native posts that actually sound like you.
            </p>

            <div className="form-stack">

              <div className="field">
                <div className="label">Website URL</div>
                <div className="input-row">
                  <span className="input-prefix">https://</span>
                  <input
                    className="text-input"
                    type="text"
                    placeholder="yourbrand.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && generate()}
                  />
                </div>
              </div>

              <div className="field">
                <div className="label">
                  Content Tone
                  <span className="label-hint">{TONES.find(t => t.id === tone)?.desc}</span>
                </div>
                <div className="option-grid">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      className={`option-card ${tone === t.id ? "active" : ""}`}
                      onClick={() => setTone(t.id)}
                    >
                      <span className="option-label">{t.label}</span>
                      <span className="option-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label">
                  Post Goal
                  <span className="label-hint">{GOALS.find(g => g.id === goal)?.label}</span>
                </div>
                <div className="option-grid">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      className={`option-card ${goal === g.id ? "active" : ""}`}
                      onClick={() => setGoal(g.id)}
                    >
                      <span className="option-label">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BRAND CONTEXT */}
              <div>
                <div className="context-toggle" onClick={() => setCtxOpen(o => !o)}>
                  <span className={`ctx-chevron ${ctxOpen ? "open" : ""}`}>▶</span>
                  <span className="ctx-label">{brandContext ? "Brand context added" : "Add brand context"}</span>
                  <span className="ctx-hint">{brandContext ? "Active" : "Optional but recommended"}</span>
                </div>
                <div className={`ctx-panel ${ctxOpen ? "open" : ""}`}>
                  <div className="ctx-panel-inner">
                    <textarea
                      className="ctx-textarea"
                      placeholder={`Company name and what you do.
Who you serve and the problem you solve.
Key differentiators or proof points.
Topics or themes to emphasize.`}
                      value={brandContext}
                      onChange={e => setBrandContext(e.target.value)}
                      rows={5}
                    />
                    <div className="char-count">{brandContext.length} chars</div>
                  </div>
                </div>
              </div>

              {/* PLATFORMS */}
              <div className="field">
                <div className="label">
                  Platforms
                  <span className="label-hint">{platforms.length} selected</span>
                </div>
                <div className="platform-grid">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      className={`p-pill ${platforms.includes(p) ? "active" : ""}`}
                      onClick={() => togglePlatform(p)}
                    >
                      <span className="p-dot" style={{ background: platforms.includes(p) ? "white" : PLATFORM_COLORS[p] }} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="gen-btn"
                onClick={generate}
                disabled={!url.trim() || platforms.length === 0}
              >
                {`Generate ${Math.min(platforms.length * 2, 8)} Posts`}
              </button>

              {error && <div className="error-box">{error}</div>}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {screen === "loading" && (
          <div className="loading">
            <div className="spin-ring" />
            <p className="load-title">Writing your posts...</p>
            <p className="load-stage">{stage}</p>
            <div className="load-bar-wrap">
              <div className="load-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="load-detail">{detail}</p>
          </div>
        )}

        {/* ── SWIPE ── */}
        {screen === "swipe" && cur && (
          <div className="swipe-screen">
            <div className="swipe-bar">
              <p className="swipe-counter"><strong>{index + 1}</strong> of {posts.length}</p>
              <button className="ghost-btn" onClick={reset}>New Session</button>
            </div>

            <div className="card-stack">
              {posts[index + 2] && <div className="post-card behind-2" />}
              {posts[index + 1] && <div className="post-card behind-1" />}

              <div
                ref={cardRef}
                className="post-card card-animate"
                key={cur.id}
                onMouseDown={onStart}
                onMouseMove={onMove}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={onStart}
                onTouchMove={onMove}
                onTouchEnd={onEnd}
              >
                <div className="stamp-wrap save-stamp"><span className="stamp save">Save</span></div>
                <div className="stamp-wrap skip-stamp"><span className="stamp skip">Skip</span></div>

                <div className="card-media">
                  {(() => {
                    const comm = commercials[cur.id];
                    if (cur.hasVideo && cur.videoUrl) {
                      return (
                        <>
                          {!mediaLoaded[cur.id] && (
                            <div className="media-loading">
                              <div className="media-spin" />
                              <p className="media-label-text">Loading video</p>
                            </div>
                          )}
                          <video
                            className={`card-video ${mediaLoaded[cur.id] ? "visible" : "hidden"}`}
                            src={cur.videoUrl}
                            autoPlay muted loop playsInline
                            onLoadedData={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                            draggable={false}
                          />
                          <div className="ai-video-tag">Luma AI</div>
                        </>
                      );
                    }
                    if (comm && comm.status === "done" && comm.url) {
                      return (
                        <>
                          {!mediaLoaded[cur.id] && (
                            <div className="media-loading">
                              <div className="media-spin" />
                              <p className="media-label-text">Loading commercial</p>
                            </div>
                          )}
                          <video
                            className={`card-video ${mediaLoaded[cur.id] ? "visible" : "hidden"}`}
                            src={comm.url}
                            autoPlay muted loop playsInline
                            onLoadedData={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                            draggable={false}
                          />
                          <div className="ai-video-tag">Commercial</div>
                        </>
                      );
                    }
                    if (comm && (comm.status === "fetching" || comm.status === "rendering")) {
                      return (
                        <>
                          <img
                            className={`card-img ${mediaLoaded[cur.id] ? "visible" : "hidden"}`}
                            src={cur.imageUrl}
                            alt=""
                            onLoad={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                            onError={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                            draggable={false}
                          />
                          <div className="media-loading" style={{ background: "rgba(15,23,42,0.45)" }}>
                            <div className="media-spin" />
                            <p className="media-label-text" style={{ color: "rgba(255,255,255,0.8)" }}>Rendering commercial</p>
                          </div>
                        </>
                      );
                    }
                    return (
                      <>
                        {!mediaLoaded[cur.id] && (
                          <div className="media-loading">
                            <div className="media-spin" />
                            <p className="media-label-text">Loading image</p>
                          </div>
                        )}
                        <img
                          className={`card-img ${mediaLoaded[cur.id] ? "visible" : "hidden"}`}
                          src={cur.imageUrl}
                          alt=""
                          onLoad={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                          onError={() => setMediaLoaded(p => ({ ...p, [cur.id]: true }))}
                          draggable={false}
                        />
                      </>
                    );
                  })()}
                  <div className="card-media-overlay" />
                </div>

                <div className="card-body">
                  <div className="card-platform-row">
                    <span className="c-dot" style={{ background: PLATFORM_COLORS[cur.platform] || "#999" }} />
                    <span className="c-platform">{cur.platform}</span>
                    <div className="c-badges">
                      {curCharInfo?.over && <span className="c-badge warn">Over limit</span>}
                      {(() => {
                        const comm = commercials[cur.id];
                        if (cur.hasVideo) return <span className="c-badge video">AI Video</span>;
                        if (comm && comm.status === "done") return <span className="c-badge video">Commercial</span>;
                        if (comm && (comm.status === "fetching" || comm.status === "rendering")) return <span className="c-badge warn">Rendering...</span>;
                        return <span className="c-badge">AI Draft</span>;
                      })()}
                    </div>
                  </div>
                  <p className="card-caption">{cur.caption}</p>
                  <p className="card-hashtags">{cur.hashtags}</p>
                  {curCharInfo && (
                    <div className="card-char-row">
                      <div className="char-bar">
                        <div
                          className="char-fill"
                          style={{
                            width: `${curCharInfo.pct}%`,
                            background: curCharInfo.over ? "var(--red)" : curCharInfo.near ? "var(--amber)" : "var(--indigo)",
                          }}
                        />
                      </div>
                      <span className="char-num" style={{ color: curCharInfo.over ? "var(--red)" : "var(--slate-400)" }}>
                        {curCharInfo.len} / {curCharInfo.limit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-row">
              <button className="act-btn skip" onClick={doSkip}>✕</button>
              <div className="queue-count">
                <span className="queue-num">{saved.length}</span>
                <span className="queue-label">saved</span>
              </div>
              <button className="act-btn save" onClick={doSave}>✓</button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {screen === "done" && (
          <div className="done-screen">
            <div className="done-check">✓</div>
            <h2 className="done-headline">Queue<br /><em>complete.</em></h2>
            <p className="done-sub">{postCount(saved.length)} ready to publish.</p>
            <div className="done-btns">
              {saved.length > 0 && (
                <button className="btn-primary" onClick={() => setScreen("saved")}>View Saved Posts</button>
              )}
              <button className="btn-ghost" onClick={reset}>Start New Session</button>
            </div>
          </div>
        )}

        {/* ── SAVED ── */}
        {screen === "saved" && (
          <div className="saved-screen">
            <div className="saved-header">
              <div>
                <h2 className="saved-headline">Saved <em>Posts</em></h2>
                <p className="saved-sub">{postCount(saved.length)} ready to publish</p>
              </div>
              <button className="ghost-btn" onClick={reset}>New Session</button>
            </div>
            <div className="saved-list">
              {saved.map(post => (
                <div key={post.id} className="saved-card">
                  <div className="saved-media">
                    {post.hasVideo && post.videoUrl ? (
                      <video className="saved-vid" src={post.videoUrl} autoPlay muted loop playsInline />
                    ) : commercials[post.id]?.status === "done" && commercials[post.id]?.url ? (
                      <video className="saved-vid" src={commercials[post.id].url} autoPlay muted loop playsInline />
                    ) : (
                      <img className="saved-img" src={post.imageUrl} alt="" />
                    )}
                    <div className="saved-media-overlay" />
                  </div>
                  <div className="saved-body">
                    <div className="saved-platform-row">
                      <span className="s-dot" style={{ background: PLATFORM_COLORS[post.platform] || "#999" }} />
                      <span className="s-platform">{post.platform}</span>
                      {(post.hasVideo || commercials[post.id]?.status === "done") && (
                        <span className="s-video-tag">{post.hasVideo ? "AI Video" : "Commercial"}</span>
                      )}
                    </div>
                    <p className="saved-caption">{post.caption}</p>
                    <p className="saved-hashtags">{post.hashtags}</p>
                    <div className="saved-actions">
                      <button
                        className={`copy-btn ${copiedId === post.id ? "copied" : ""}`}
                        onClick={() => copy(post)}
                      >
                        {copiedId === post.id ? "Copied!" : "Copy Caption + Hashtags"}
                      </button>
                      {post.hasVideo && post.videoUrl ? (
                        <a className="dl-btn" href={post.videoUrl} target="_blank" rel="noopener noreferrer" download>
                          Save Video
                        </a>
                      ) : commercials[post.id]?.status === "done" && commercials[post.id]?.url ? (
                        <a className="dl-btn" href={commercials[post.id].url} target="_blank" rel="noopener noreferrer" download>
                          Save Commercial
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
