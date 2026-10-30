1import React, { useState, useRef, useEffect } from "react";
2import {
3  Play,
4  Pause,
5  SkipBack,
6  RotateCcw,
7  Undo2,
8  Redo2,
9  Volume2,
10  VolumeX,
11  Sliders,
12  Waves,
13  Music,
14  Plus,
15  ArrowUp,
16  X,
17  Download,
18  Settings,
19  Sparkles,
20  Layers,
21  Search,
22  ZoomIn,
23  ZoomOut,
24  FolderOpen,
25  Mic2,
26  FileAudio,
27  Radio,
28  Check,
29  Code
30} from "lucide-react";
31import { generateSong, GenerateError } from "@flowmusic/sdk";
32import type { Clip } from "@flowmusic/sdk";
33
34interface Track {
35  id: string;
36  name: string;
37  type: "audio" | "midi" | "ai";
38  muted: boolean;
39  solo: boolean;
40  volume: number; // 0 to 1
41  pan: number; // -1 to 1
42  color: string;
43  clips: AudioClip[];
44}
45
46interface AudioClip {
47  id: string;
48  name: string;
49  startTime: number; // seconds
50  duration: number; // seconds
51  color: string;
52  audioUrl?: string;
53  prompt?: string;
54}
55
56interface AIMessage {
57  role: "user" | "assistant" | "system";
58  text: string;
59  timestamp: string;
60  actionTaken?: string;
61}
62
63export default function StudioDAW() {
64  // Transport state
65  const [isPlaying, setIsPlaying] = useState(false);
66  const [currentTime, setCurrentTime] = useState(0); // in seconds
67  const [bpm, setBpm] = useState(120);
68  const [timeSignature, setTimeSignature] = useState("4/4");
69  const [isLooping, setIsLooping] = useState(false);
70  const [masterVolume, setMasterVolume] = useState(0.85);
71  const [isMasterMuted, setIsMasterMuted] = useState(false);
72
73  // Hidden audio element ref for active clip playback
74  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
75  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
76
77  // Tracks state with initial audio samples
78  const [tracks, setTracks] = useState<Track[]>([
79    {
80      id: "track-1",
81      name: "Vocals Lead",
82      type: "audio",
83      muted: false,
84      solo: false,
85      volume: 0.8,
86      pan: 0,
87      color: "#3b82f6",
88      clips: [
89        {
90          id: "clip-1",
91          name: "Verse 1 Vocal",
92          startTime: 0,
93          duration: 16,
94          color: "#2563eb",
95        },
96      ],
97    },
98    {
99      id: "track-2",
100      name: "Synth Chords",
101      type: "midi",
102      muted: false,
103      solo: false,
104      volume: 0.75,
105      pan: -0.2,
106      color: "#10b981",
107      clips: [
108        {
109          id: "clip-2",
110          name: "Main Progression",
111          startTime: 0,
112          duration: 32,
113          color: "#059669",
114        },
115      ],
116    },
117    {
118      id: "track-3",
119      name: "AI Drum Kit",
120      type: "ai",
121      muted: false,
122      solo: false,
123      volume: 0.9,
124      pan: 0,
125      color: "#f59e0b",
126      clips: [
127        {
128          id: "clip-3",
129          name: "Groove Pattern",
130          startTime: 8,
131          duration: 24,
132          color: "#d97706",
133        },
134      ],
135    },
136  ]);
137
138  const [selectedTrackId, setSelectedTrackId] = useState<string>("track-1");
139  const [showAddMenu, setShowAddMenu] = useState(false);
140  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
141
142  // Timeline view settings
143  const [zoomLevel, setZoomLevel] = useState(24); // pixels per second
144  const totalDuration = 120; // 2 minutes timeline
145
146  // AI Prompt bar & manager popup
147  const [promptText, setPromptText] = useState("");
148  const [selectedModel, setSelectedModel] = useState("v6-mini");
149  const [isGenerating, setIsGenerating] = useState(false);
150  const [statusMessage, setStatusMessage] = useState<string | null>(null);
151  const [showAIChatModal, setShowAIChatModal] = useState(false);
152  const [showWebhookModal, setShowWebhookModal] = useState(false);
153
154  // Webhook / Custom API settings (for user's external LLM / Suno integration)
155  const [customApiEndpoint, setCustomApiEndpoint] = useState("https://api.your-endpoint.com/v1/generate");
156  const [customApiKey, setCustomApiKey] = useState("");
157  const [customPromptWrapper, setCustomPromptWrapper] = useState(
158    `{"model": "suno-v6-mini", "prompt": "{{PROMPT}}", "bpm": {{BPM}}, "track": "{{TRACK}}"}`
159  );
160
161  // AI conversation log (Manager)
162  const [conversation, setConversation] = useState<AIMessage[]>([
163    {
164      role: "assistant",
165      text: "Salut! Sunt asistentul tău AI de producție. Poți să-mi ceri să creez părți noi (tobe, synth, voce), să organizez timeline-ul sau să generez prin modelul selectat.",
166      timestamp: "12:00",
167    },
168  ]);
169
170  // Audio Context playback ref for timeline simulation
171  const animFrameRef = useRef<number | null>(null);
172  const lastTimeRef = useRef<number>(performance.now());
173
174  // Web Audio Context synthesizer for audio simulation of tracks without URLs
175  const audioCtxRef = useRef<AudioContext | null>(null);
176  const oscNodeRef = useRef<OscillatorNode | null>(null);
177  const gainNodeRef = useRef<GainNode | null>(null);
178
179  // Audio Playback synchronization with timeline
180  useEffect(() => {
181    if (isPlaying) {
182      // Find any clip playing right now that has audioUrl
183      let currentActiveUrl: string | null = null;
184      let clipOffset = 0;
185      for (const track of tracks) {
186        if (track.muted) continue;
187        for (const clip of track.clips) {
188          if (clip.audioUrl && currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
189            currentActiveUrl = clip.audioUrl;
190            clipOffset = currentTime - clip.startTime;
191            break;
192          }
193        }
194      }
195
196      if (currentActiveUrl) {
197        if (activeAudioUrl !== currentActiveUrl) {
198          setActiveAudioUrl(currentActiveUrl);
199        }
200        if (audioPlayerRef.current) {
201          audioPlayerRef.current.volume = isMasterMuted ? 0 : masterVolume;
202          if (Math.abs(audioPlayerRef.current.currentTime - clipOffset) > 0.5) {
203            audioPlayerRef.current.currentTime = clipOffset;
204          }
205          audioPlayerRef.current.play().catch(() => {});
206        }
207      } else {
208        // Fallback Web Audio synth tone for timeline feedback
209        try {
210          if (!audioCtxRef.current) {
211            audioCtxRef.current = new AudioContext();
212          }
213          if (audioCtxRef.current.state === "suspended") {
214            audioCtxRef.current.resume();
215          }
216          if (!oscNodeRef.current && audioCtxRef.current) {
217            const osc = audioCtxRef.current.createOscillator();
218            const gain = audioCtxRef.current.createGain();
219            osc.type = "sine";
220            osc.frequency.setValueAtTime(220, audioCtxRef.current.currentTime);
221            gain.gain.setValueAtTime(isMasterMuted ? 0 : masterVolume * 0.08, audioCtxRef.current.currentTime);
222            osc.connect(gain);
223            gain.connect(audioCtxRef.current.destination);
224            osc.start();
225            oscNodeRef.current = osc;
226            gainNodeRef.current = gain;
227          }
228        } catch {}
229      }
230
231      lastTimeRef.current = performance.now();
232      const loop = (now: number) => {
233        const delta = (now - lastTimeRef.current) / 1000;
234        lastTimeRef.current = now;
235        setCurrentTime((prev) => {
236          const next = prev + delta;
237          if (next >= totalDuration) {
238            return isLooping ? 0 : totalDuration;
239          }
240          return next;
241        });
242        animFrameRef.current = requestAnimationFrame(loop);
243      };
244      animFrameRef.current = requestAnimationFrame(loop);
245    } else {
246      if (animFrameRef.current !== null) {
247        cancelAnimationFrame(animFrameRef.current);
248      }
249      if (audioPlayerRef.current) {
250        audioPlayerRef.current.pause();
251      }
252      if (oscNodeRef.current) {
253        try {
254          oscNodeRef.current.stop();
255          oscNodeRef.current.disconnect();
256        } catch {}
257        oscNodeRef.current = null;
258      }
259    }
260
261    return () => {
262      if (animFrameRef.current !== null) {
263        cancelAnimationFrame(animFrameRef.current);
264      }
265    };
266  }, [isPlaying, isLooping, totalDuration, currentTime, masterVolume, isMasterMuted, activeAudioUrl, tracks]);
267
268  // Format time (00:00.000)
269  const formatTime = (seconds: number) => {
270    const mins = Math.floor(seconds / 60);
271    const secs = Math.floor(seconds % 60);
272    const ms = Math.floor((seconds % 1) * 1000);
273    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
274  };
275
276  // Format bar/beat (e.g. 001.1.1)
277  const formatBarBeat = (seconds: number) => {
278    const beatsPerSec = bpm / 60;
279    const totalBeats = seconds * beatsPerSec;
280    const bar = Math.floor(totalBeats / 4) + 1;
281    const beat = Math.floor(totalBeats % 4) + 1;
282    const sub = Math.floor((totalBeats % 1) * 4) + 1;
283    return `${String(bar).padStart(3, "0")}.${beat}.${sub}`;
284  };
285
286  // Add new track
287  const handleAddTrack = (type: "audio" | "midi" | "upload") => {
288    const colors: Record<string, string> = {
289      audio: "#3b82f6",
290      midi: "#10b981",
291      upload: "#8b5cf6",
292    };
293    const newTrack: Track = {
294      id: `track-${Date.now()}`,
295      name: type === "audio" ? `Audio ${tracks.length + 1}` : type === "midi" ? `MIDI ${tracks.length + 1}` : `Uploaded Clip`,
296      type: type === "upload" ? "audio" : type,
297      muted: false,
298      solo: false,
299      volume: 0.8,
300      pan: 0,
301      color: colors[type] || "#3b82f6",
302      clips: [],
303    };
304    setTracks([...tracks, newTrack]);
305    setSelectedTrackId(newTrack.id);
306    setShowAddMenu(false);
307  };
308
309  // AI Generation trigger
310  const handleSendPrompt = async () => {
311    if (!promptText.trim()) return;
312    const userPrompt = promptText.trim();
313    setPromptText("");
314    setIsGenerating(true);
315    setStatusMessage(`Generare în curs cu ${selectedModel}...`);
316
317    // Add user message to manager log
318    const userMsg: AIMessage = {
319      role: "user",
320      text: userPrompt,
321      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
322    };
323    setConversation((prev) => [...prev, userMsg]);
324
325    try {
326      // Use Flow Music SDK in-sandbox generation
327      const clipResult = await generateSong({
328        soundPrompt: `${userPrompt}, ${bpm} bpm, melodic arrangement, high quality`,
329        title: userPrompt.slice(0, 24),
330      });
331
332      const newClipDuration = clipResult.duration || 16;
333      const targetStartTime = currentTime;
334
335      // Add clip to the selected track
336      setTracks((prevTracks) => {
337        return prevTracks.map((tr) => {
338          if (tr.id === selectedTrackId) {
339            return {
340              ...tr,
341              clips: [
342                ...tr.clips,
343                {
344                  id: `clip-${Date.now()}`,
345                  name: clipResult.title || "AI Part",
346                  startTime: targetStartTime,
347                  duration: newClipDuration,
348                  color: tr.color,
349                  audioUrl: clipResult.audioUrl,
350                  prompt: userPrompt,
351                },
352              ],
353            };
354          }
355          return tr;
356        });
357      });
358
359      const assistantMsg: AIMessage = {
360        role: "assistant",
361        text: `Am adăugat cu succes piesa generată "${clipResult.title}" pe track-ul curent la poziția ${formatTime(targetStartTime)}.`,
362        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
363        actionTaken: `Adăugat: ${clipResult.title}`,
364      };
365      setConversation((prev) => [...prev, assistantMsg]);
366      setStatusMessage("Generare completă!");
367    } catch (err: unknown) {
368      const errorMessage = err instanceof GenerateError ? err.message : err instanceof Error ? err.message : "A apărut o eroare la generare";
369      
370      const assistantMsg: AIMessage = {
371        role: "assistant",
372        text: `Eroare generare: ${errorMessage}. Dacă vrei să folosești propriul model sau Suno v6 printr-un server extern, folosește panoul "Connect LLM" din bara de sus.`,
373        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
374      };
375      setConversation((prev) => [...prev, assistantMsg]);
376      setStatusMessage(`Eroare: ${errorMessage}`);
377    } finally {
378      setIsGenerating(false);
379      setTimeout(() => setStatusMessage(null), 4000);
380    }
381  };
382
383  return (
384    <div className="min-h-screen w-full bg-[#121214] text-[#ececed] flex flex-col font-sans select-none overflow-hidden">
385      {/* Audio Playback Element */}
386      {activeAudioUrl && (
387        <audio
388          ref={audioPlayerRef}
389          src={activeAudioUrl}
390          crossOrigin="anonymous"
391          onEnded={() => {
392            if (isLooping) {
393              setCurrentTime(0);
394            }
395          }}
396        />
397      )}
398
399      {/* 1. TOP HEADER NAVIGATION BAR */}
400      <header className="h-12 border-b border-[#232328] bg-[#161619] px-4 flex items-center justify-between z-20 shrink-0">
401        {/* Left: Brand & Project Name */}
402        <div className="flex items-center gap-3">
403          <div className="flex items-center gap-2">
404            <span className="font-black tracking-widest text-lg text-white">SUNO</span>
405            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#27272f] text-gray-400">
406              STUDIO
407            </span>
408          </div>
409
410          <div className="h-4 w-[1px] bg-[#2a2a32]" />
411
412          <div className="flex items-center gap-1.5 hover:bg-[#23232a] px-2 py-1 rounded cursor-pointer transition">
413            <span className="text-xs font-medium text-gray-200">Untitled Project</span>
414            <span className="text-gray-400 text-xs">···</span>
415          </div>
416
417          <button className="text-xs px-2.5 py-1 rounded bg-[#202026] hover:bg-[#2a2a32] text-gray-300 font-medium transition">
418            Preview
419          </button>
420          <button className="text-xs px-2.5 py-1 rounded bg-[#2d1b4e] hover:bg-[#3b2366] text-[#c084fc] font-medium border border-[#581c87]/50 transition">
421            Upgrade to edit
422          </button>
423
424          <div className="flex items-center gap-1 ml-1 text-gray-400">
425            <button className="p-1 hover:text-white rounded hover:bg-[#23232a]" title="Undo">
426              <Undo2 className="w-3.5 h-3.5" />
427            </button>
428            <button className="p-1 hover:text-white rounded hover:bg-[#23232a]" title="Redo">
429              <Redo2 className="w-3.5 h-3.5" />
430            </button>
431          </div>
432        </div>
433
434        {/* Center: Transport Controls & Time Display */}
435        <div className="flex items-center gap-3">
436          <div className="flex items-center bg-[#1d1d23] border border-[#2b2b34] rounded-lg px-2 py-1 gap-1">
437            <button
438              onClick={() => {
439                setCurrentTime(0);
440                if (audioPlayerRef.current) audioPlayerRef.current.currentTime = 0;
441              }}
442              className="p-1 text-gray-400 hover:text-white transition"
443              title="Return to Zero"
444            >
445              <SkipBack className="w-3.5 h-3.5" />
446            </button>
447            <button
448              onClick={() => setIsLooping(!isLooping)}
449              className={`p-1 rounded transition ${isLooping ? "text-blue-400 bg-blue-900/30" : "text-gray-400 hover:text-white"}`}
450              title="Loop"
451            >
452              <RotateCcw className="w-3.5 h-3.5" />
453            </button>
454            <button
455              onClick={() => setIsPlaying(!isPlaying)}
456              className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 ml-1 transition"
457            >
458              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
459            </button>
460          </div>
461
462          {/* Time & Bar displays */}
463          <div className="flex items-center bg-[#1a1a20] border border-[#26262f] rounded-lg px-3 py-1 gap-3 font-mono text-xs">
464            <div className="flex items-center gap-1 text-gray-300">
465              <span className="text-[10px] text-gray-500 font-sans">TIME</span>
466              <span>{formatTime(currentTime)}</span>
467            </div>
468            <div className="h-3 w-[1px] bg-[#31313d]" />
469            <div className="flex items-center gap-1 text-gray-300">
470              <span className="text-[10px] text-gray-500 font-sans">BAR</span>
471              <span>{formatBarBeat(currentTime)}</span>
472            </div>
473          </div>
474        </div>
475
476        {/* Right: Tempo, Time Sig, Export, Library & AI Settings */}
477        <div className="flex items-center gap-2">
478          {/* BPM */}
479          <div className="flex items-center bg-[#1c1c22] border border-[#272730] px-2.5 py-1 rounded text-xs gap-1.5">
480            <input
481              type="number"
482              value={bpm}
483              onChange={(e) => setBpm(Number(e.target.value))}
484              className="w-9 bg-transparent text-right font-medium text-gray-200 focus:outline-none"
485              min={40}
486              max={240}
487            />
488            <span className="text-gray-400 text-[11px]">BPM</span>
489          </div>
490
491          {/* Time Sig */}
492          <div className="bg-[#1c1c22] border border-[#272730] px-2 py-1 rounded text-xs text-gray-300 font-medium">
493            {timeSignature}
494          </div>
495
496          {/* API / External LLM Connect */}
497          <button
498            onClick={() => setShowWebhookModal(true)}
499            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e2330] hover:bg-[#283145] text-blue-400 text-xs font-medium border border-blue-900/40 transition"
500            title="Conexiuni API & LLM Extern"
501          >
502            <Code className="w-3 h-3" />
503            <span>Connect LLM</span>
504          </button>
505
506          {/* Export */}
507          <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#25252e] hover:bg-[#31313c] text-gray-200 text-xs font-medium transition">
508            <Download className="w-3 h-3" />
509            <span>Export</span>
510          </button>
511
512          {/* Library / Manager AI */}
513          <button
514            onClick={() => setShowAIChatModal(true)}
515            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2b2b36] hover:bg-[#393946] text-white text-xs font-semibold transition"
516          >
517            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
518            <span>Manager AI</span>
519          </button>
520        </div>
521      </header>
522
523      {/* 2. MAIN WORKSPACE AREA */}
524      <div className="flex-1 flex overflow-hidden relative">
525        {/* LEFT COLUMN: TRACK HEADERS */}
526        <div
527          className={`${
528            leftSidebarCollapsed ? "w-12" : "w-64"
529          } border-r border-[#24242b] bg-[#17171a] flex flex-col shrink-0 transition-all duration-200 z-10`}
530        >
531          {/* Header toolbar */}
532          <div className="h-9 border-b border-[#24242b] px-3 flex items-center justify-between text-gray-400">
533            {!leftSidebarCollapsed && (
534              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
535                Tracks ({tracks.length})
536              </span>
537            )}
538            <button
539              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
540              className="p-1 hover:text-white rounded hover:bg-[#222228] ml-auto"
541              title="Toggle sidebar"
542            >
543              <Sliders className="w-3.5 h-3.5" />
544            </button>
545          </div>
546
547          {/* Track Headers List */}
548          <div className="flex-1 overflow-y-auto divide-y divide-[#212128]">
549            {tracks.map((track) => (
550              <div
551                key={track.id}
552                onClick={() => setSelectedTrackId(track.id)}
553                className={`h-20 px-3 py-2 flex flex-col justify-between cursor-pointer transition ${
554                  selectedTrackId === track.id
555                    ? "bg-[#23232c] border-l-2 border-blue-500"
556                    : "hover:bg-[#1c1c22] border-l-2 border-transparent"
557                }`}
558              >
559                {!leftSidebarCollapsed ? (
560                  <>
561                    <div className="flex items-center justify-between">
562                      <div className="flex items-center gap-2 truncate">
563                        <div
564                          className="w-2.5 h-2.5 rounded-full shrink-0"
565                          style={{ backgroundColor: track.color }}
566                        />
567                        <span className="text-xs font-medium text-gray-200 truncate">{track.name}</span>
568                      </div>
569                      <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-[#2b2b35] text-gray-400 font-mono">
570                        {track.type}
571                      </span>
572                    </div>
573
574                    {/* Mute, Solo, Volume slider */}
575                    <div className="flex items-center justify-between gap-2 mt-1">
576                      <div className="flex items-center gap-1">
577                        <button
578                          onClick={(e) => {
579                            e.stopPropagation();
580                            setTracks(
581                              tracks.map((t) => (t.id === track.id ? { ...t, muted: !t.muted } : t))
582                            );
583                          }}
584                          className={`w-5 h-5 text-[10px] font-bold rounded flex items-center justify-center transition ${
585                            track.muted
586                              ? "bg-red-950 text-red-400 border border-red-800"
587                              : "bg-[#24242d] text-gray-400 hover:text-white"
588                          }`}
589                        >
590                          M
591                        </button>
592                        <button
593                          onClick={(e) => {
594                            e.stopPropagation();
595                            setTracks(
596                              tracks.map((t) => (t.id === track.id ? { ...t, solo: !t.solo } : t))
597                            );
598                          }}
599                          className={`w-5 h-5 text-[10px] font-bold rounded flex items-center justify-center transition ${
600                            track.solo
601                              ? "bg-yellow-950 text-yellow-400 border border-yellow-700"
602                              : "bg-[#24242d] text-gray-400 hover:text-white"
603                          }`}
604                        >
605                          S
606                        </button>
607                      </div>
608
609                      {/* Mini Volume fader */}
610                      <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
611                        <Volume2 className="w-3 h-3 text-gray-500" />
612                        <input
613                          type="range"
614                          min="0"
615                          max="1"
616                          step="0.01"
617                          value={track.volume}
618                          onChange={(e) => {
619                            const val = parseFloat(e.target.value);
620                            setTracks(tracks.map((t) => (t.id === track.id ? { ...t, volume: val } : t)));
621                          }}
622                          className="w-full h-1 bg-[#2c2c36] accent-blue-500 rounded appearance-none cursor-pointer"
623                        />
624                      </div>
625                    </div>
626                  </>
627                ) : (
628                  <div className="flex flex-col items-center justify-center h-full gap-2">
629                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
630                    <span className="text-[10px] font-mono text-gray-400">{track.name.slice(0, 3)}</span>
631                  </div>
632                )}
633              </div>
634            ))}
635          </div>
636
637          {/* Add Track Button & Dropdown Menu */}
638          <div className="p-2 border-t border-[#23232b] relative">
639            <button
640              onClick={() => setShowAddMenu(!showAddMenu)}
641              className="w-full py-1.5 px-3 rounded bg-[#202027] hover:bg-[#2a2a34] text-gray-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
642            >
643              <Plus className="w-3.5 h-3.5" />
644              {!leftSidebarCollapsed && <span>Add new track</span>}
645            </button>
646
647            {/* Menu Popup (matches Screenshot 2) */}
648            {showAddMenu && (
649              <div className="absolute left-2 bottom-12 w-48 bg-[#1f1f26] border border-[#31313d] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1">
650                <button
651                  onClick={() => handleAddTrack("audio")}
652                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2b2b36] transition text-left text-xs group"
653                >
654                  <div className="flex items-center gap-2.5">
655                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
656                      <Waves className="w-3.5 h-3.5" />
657                    </div>
658                    <span className="font-semibold text-gray-200">Audio</span>
659                  </div>
660                  <span className="text-[10px] text-gray-500 bg-[#16161c] px-1.5 py-0.5 rounded font-mono group-hover:text-gray-300">
661                    A
662                  </span>
663                </button>
664
665                <button
666                  onClick={() => handleAddTrack("midi")}
667                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2b2b36] transition text-left text-xs group"
668                >
669                  <div className="flex items-center gap-2.5">
670                    <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white">
671                      <Music className="w-3.5 h-3.5" />
672                    </div>
673                    <span className="font-semibold text-gray-200">MIDI</span>
674                  </div>
675                  <span className="text-[10px] text-gray-500 bg-[#16161c] px-1.5 py-0.5 rounded font-mono group-hover:text-gray-300">
676                    M
677                  </span>
678                </button>
679
680                <button
681                  onClick={() => handleAddTrack("upload")}
682                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2b2b36] transition text-left text-xs group"
683                >
684                  <div className="flex items-center gap-2.5">
685                    <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center text-white">
686                      <FolderOpen className="w-3.5 h-3.5" />
687                    </div>
688                    <span className="font-semibold text-gray-200">Upload</span>
689                  </div>
690                  <span className="text-[10px] text-gray-500 bg-[#16161c] px-1.5 py-0.5 rounded font-mono group-hover:text-gray-300">
691                    U
692                  </span>
693                </button>
694              </div>
695            )}
696          </div>
697        </div>
698
699        {/* RIGHT AREA: TIMELINE & ARRANGER */}
700        <div className="flex-1 flex flex-col bg-[#111113] overflow-x-auto relative">
701          {/* Time Ruler (bars, beats, seconds) */}
702          <div
703            className="h-9 border-b border-[#24242b] bg-[#141417] sticky top-0 z-10 flex items-center"
704            style={{ width: `${totalDuration * zoomLevel}px` }}
705            onClick={(e) => {
706              const rect = e.currentTarget.getBoundingClientRect();
707              const clickX = e.clientX - rect.left;
708              const newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
709              setCurrentTime(newTime);
710            }}
711          >
712            {Array.from({ length: Math.ceil(totalDuration / 2) }).map((_, i) => {
713              const sec = i * 2;
714              const isMajor = sec % 10 === 0;
715              return (
716                <div
717                  key={sec}
718                  className="absolute flex flex-col items-start border-l border-[#272730]"
719                  style={{ left: `${sec * zoomLevel}px`, height: isMajor ? "100%" : "40%" }}
720                >
721                  {isMajor && (
722                    <span className="text-[10px] font-mono text-gray-500 pl-1 select-none">
723                      {Math.floor(sec / 60)}:
724                      {String(sec % 60).padStart(2, "0")}
725                    </span>
726                  )}
727                </div>
728              );
729            })}
730
731            {/* Playhead Marker on ruler */}
732            <div
733              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
734              style={{ left: `${currentTime * zoomLevel}px` }}
735            >
736              <div className="w-3 h-3 bg-red-500 rotate-45 -ml-[5px] -mt-1.5 rounded-xs" />
737            </div>
738          </div>
739
740          {/* Tracks Lanes */}
741          <div
742            className="flex-1 relative divide-y divide-[#1e1e24]"
743            style={{ width: `${totalDuration * zoomLevel}px` }}
744            onClick={(e) => {
745              const rect = e.currentTarget.getBoundingClientRect();
746              const clickX = e.clientX - rect.left;
747              const newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
748              setCurrentTime(newTime);
749            }}
750          >
751            {/* Playhead vertical line passing through all tracks */}
752            <div
753              className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-20 pointer-events-none"
754              style={{ left: `${currentTime * zoomLevel}px` }}
755            />
756
757            {/* Vertical grid lines (beats) */}
758            {Array.from({ length: Math.ceil(totalDuration / 4) }).map((_, i) => (
759              <div
760                key={i}
761                className="absolute top-0 bottom-0 border-l border-[#1a1a20] pointer-events-none"
762                style={{ left: `${i * 4 * zoomLevel}px` }}
763              />
764            ))}
765
766            {/* Track Lanes */}
767            {tracks.map((track) => (
768              <div
769                key={track.id}
770                className={`h-20 relative transition ${
771                  selectedTrackId === track.id ? "bg-[#18181d]/60" : "bg-transparent"
772                }`}
773              >
774                {/* Audio/MIDI Clips on this lane */}
775                {track.clips.map((clip) => {
776                  const clipLeft = clip.startTime * zoomLevel;
777                  const clipWidth = clip.duration * zoomLevel;
778                  return (
779                    <div
780                      key={clip.id}
781                      className="absolute top-1 bottom-1 rounded-md border border-white/10 shadow-md p-1.5 flex flex-col justify-between overflow-hidden cursor-move transition hover:brightness-110"
782                      style={{
783                        left: `${clipLeft}px`,
784                        width: `${clipWidth}px`,
785                        backgroundColor: clip.color + "44",
786                        borderLeft: `4px solid ${clip.color}`,
787                      }}
788                      onClick={(e) => {
789                        e.stopPropagation();
790                        if (clip.audioUrl) {
791                          setActiveAudioUrl(clip.audioUrl);
792                          setCurrentTime(clip.startTime);
793                        }
794                      }}
795                    >
796                      <div className="flex items-center justify-between">
797                        <span className="text-[11px] font-semibold text-white/90 truncate">{clip.name}</span>
798                        <span className="text-[9px] text-white/60 font-mono">{clip.duration.toFixed(1)}s</span>
799                      </div>
800
801                      {/* Fake waveform representation */}
802                      <div className="flex items-center gap-[2px] h-6 w-full opacity-60">
803                        {Array.from({ length: Math.floor(clipWidth / 5) }).map((_, idx) => {
804                          const heightPct = 20 + Math.sin(idx * 0.4) * 30 + Math.cos(idx * 0.8) * 40;
805                          return (
806                            <div
807                              key={idx}
808                              className="w-1 rounded-full bg-white/70"
809                              style={{ height: `${Math.max(15, Math.min(95, heightPct))}%` }}
810                            />
811                          );
812                        })}
813                      </div>
814                    </div>
815                  );
816                })}
817              </div>
818            ))}
819          </div>
820
821          {/* FLOATING AI PROMPT / COMMAND BAR (Matches screenshot bottom bubble) */}
822          <div className="sticky bottom-6 left-1/2 -translate-x-1/2 w-[540px] max-w-[90%] z-40">
823            <div className="bg-[#18181d]/95 backdrop-blur-md border border-[#30303b] shadow-2xl rounded-2xl p-2.5 flex flex-col gap-2 relative">
824              <div className="flex items-center gap-2">
825                <button
826                  onClick={() => setShowAddMenu(true)}
827                  className="w-7 h-7 rounded-full bg-[#272731] hover:bg-[#343440] flex items-center justify-center text-gray-300 transition shrink-0"
828                  title="Add part or file"
829                >
830                  <Plus className="w-4 h-4" />
831                </button>
832
833                <input
834                  type="text"
835                  value={promptText}
836                  onChange={(e) => setPromptText(e.target.value)}
837                  onKeyDown={(e) => {
838                    if (e.key === "Enter" && !e.shiftKey) {
839                      e.preventDefault();
840                      handleSendPrompt();
841                    }
842                  }}
843                  placeholder="Select a spot on the timeline and ask me to add a part..."
844                  className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none"
845                  disabled={isGenerating}
846                />
847
848                {/* Model Selector Dropdown (e.g. v6-mini) */}
849                <div className="relative">
850                  <select
851                    value={selectedModel}
852                    onChange={(e) => setSelectedModel(e.target.value)}
853                    className="bg-[#23232c] text-gray-300 text-[11px] font-medium py-1 px-2.5 rounded-lg border border-[#33333f] focus:outline-none cursor-pointer"
854                  >
855                    <option value="v6-mini">v6-mini</option>
856                    <option value="v6-full">v6-full</option>
857                    <option value="gemini-manager">Gemini Manager</option>
858                    <option value="custom-llm">Custom LLM Webhook</option>
859                  </select>
860                  <span className="absolute -top-2 -right-1 text-[8px] bg-red-600/90 text-white font-bold px-1 rounded-full uppercase tracking-tighter">
861                    BETA
862                  </span>
863                </div>
864
865                {/* Submit / Generate Button */}
866                <button
867                  onClick={handleSendPrompt}
868                  disabled={isGenerating || !promptText.trim()}
869                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition shrink-0"
870                  title="Send to AI"
871                >
872                  {isGenerating ? (
873                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
874                  ) : (
875                    <ArrowUp className="w-4 h-4" />
876                  )}
877                </button>
878              </div>
879
880              {/* Status indicator message */}
881              {statusMessage && (
882                <div className="text-[10px] text-blue-400 px-2 flex items-center gap-1.5 animate-pulse">
883                  <Sparkles className="w-3 h-3" />
884                  <span>{statusMessage}</span>
885                </div>
886              )}
887            </div>
888          </div>
889        </div>
890      </div>
891
892      {/* 3. BOTTOM MASTER BAR & ZOOM UTILITIES */}
893      <footer className="h-10 border-t border-[#23232a] bg-[#151518] px-4 flex items-center justify-between text-xs text-gray-400 shrink-0 z-20">
894        {/* Master Output Meter & Fader */}
895        <div className="flex items-center gap-3">
896          <span className="font-bold text-[11px] text-gray-300">Main</span>
897          <button
898            onClick={() => setIsMasterMuted(!isMasterMuted)}
899            className="hover:text-white transition"
900          >
901            {isMasterMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
902          </button>
903          <input
904            type="range"
905            min="0"
906            max="1"
907            step="0.01"
908            value={isMasterMuted ? 0 : masterVolume}
909            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
910            className="w-24 h-1.5 bg-[#262630] accent-blue-500 rounded appearance-none cursor-pointer"
911          />
912          <span className="font-mono text-[10px] text-gray-500">
913            {isMasterMuted ? "MUTED" : `${Math.round(masterVolume * 100)}%`}
914          </span>
915        </div>
916
917        {/* Center: Selected track info */}
918        <div className="text-[11px] text-gray-500">
919          Selected: <span className="text-gray-300 font-medium">{tracks.find((t) => t.id === selectedTrackId)?.name || "None"}</span>
920        </div>
921
922        {/* Right: Zoom controls & View Toggles */}
923        <div className="flex items-center gap-2">
924          <button
925            onClick={() => setZoomLevel((z) => Math.max(12, z - 4))}
926            className="p-1 hover:text-white rounded hover:bg-[#202026]"
927            title="Zoom out"
928          >
929            <ZoomOut className="w-3.5 h-3.5" />
930          </button>
931          <span className="text-[10px] font-mono text-gray-500">{zoomLevel}px/s</span>
932          <button
933            onClick={() => setZoomLevel((z) => Math.min(64, z + 4))}
934            className="p-1 hover:text-white rounded hover:bg-[#202026]"
935            title="Zoom in"
936          >
937            <ZoomIn className="w-3.5 h-3.5" />
938          </button>
939        </div>
940      </footer>
941
942      {/* 4. MODAL: AI MANAGER & CHAT WINDOW */}
943      {showAIChatModal && (
944        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
945          <div className="w-[580px] max-w-full bg-[#18181e] border border-[#2e2e3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
946            {/* Modal Header */}
947            <div className="p-4 border-b border-[#292934] flex items-center justify-between bg-[#15151a]">
948              <div className="flex items-center gap-2.5">
949                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center border border-yellow-500/30">
950                  <Sparkles className="w-4 h-4" />
951                </div>
952                <div>
953                  <h3 className="font-semibold text-sm text-gray-100">AI Studio Manager</h3>
954                  <p className="text-[11px] text-gray-400">Coordonează compoziția și dictează instrucțiuni pentru Suno v6</p>
955                </div>
956              </div>
957              <button
958                onClick={() => setShowAIChatModal(false)}
959                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#252530]"
960              >
961                <X className="w-4 h-4" />
962              </button>
963            </div>
964
965            {/* Chat Body */}
966            <div className="flex-1 overflow-y-auto p-4 space-y-3">
967              {conversation.map((msg, idx) => (
968                <div
969                  key={idx}
970                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
971                >
972                  <div
973                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
974                      msg.role === "user"
975                        ? "bg-blue-600 text-white rounded-br-none"
976                        : "bg-[#22222b] text-gray-200 border border-[#2f2f3d] rounded-bl-none"
977                    }`}
978                  >
979                    <p>{msg.text}</p>
980                    {msg.actionTaken && (
981                      <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center gap-1 text-[10px] text-yellow-300">
982                        <Check className="w-3 h-3" />
983                        <span>{msg.actionTaken}</span>
984                      </div>
985                    )}
986                  </div>
987                  <span className="text-[9px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
988                </div>
989              ))}
990            </div>
991
992            {/* Chat Input */}
993            <div className="p-3 border-t border-[#292934] bg-[#15151a] flex items-center gap-2">
994              <input
995                type="text"
996                placeholder="Ex: Adaugă un beat de trap la 140 BPM sau un pian jazzy..."
997                className="flex-1 bg-[#21212a] border border-[#30303e] rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
998                onKeyDown={(e) => {
999                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
1000                    setPromptText(e.currentTarget.value.trim());
1001                    e.currentTarget.value = "";
1002                    setShowAIChatModal(false);
1003                    setTimeout(() => handleSendPrompt(), 100);
1004                  }
1005                }}
1006              />
1007              <button
1008                onClick={() => setShowAIChatModal(false)}
1009                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium"
1010              >
1011                Trimite
1012              </button>
1013            </div>
1014          </div>
1015        </div>
1016      )}
1017
1018      {/* 5. MODAL: EXTERNAL LLM & WEBHOOK CONNECTOR */}
1019      {showWebhookModal && (
1020        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
1021          <div className="w-[620px] max-w-full bg-[#18181e] border border-[#2e2e3a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
1022            <div className="p-4 border-b border-[#292934] flex items-center justify-between bg-[#15151a]">
1023              <div className="flex items-center gap-2.5">
1024                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
1025                  <Code className="w-4 h-4" />
1026                </div>
1027                <div>
1028                  <h3 className="font-semibold text-sm text-gray-100">Conector API / LLM Extern (Suno & Google AI)</h3>
1029                  <p className="text-[11px] text-gray-400">Conectează propriul endpoint sau copiază codul de apelare</p>
1030                </div>
1031              </div>
1032              <button
1033                onClick={() => setShowWebhookModal(false)}
1034                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#252530]"
1035              >
1036                <X className="w-4 h-4" />
1037              </button>
1038            </div>
1039
1040            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
1041              <div>
1042                <label className="block text-gray-300 font-medium mb-1">API Endpoint URL (LLM / Suno Gateway)</label>
1043                <input
1044                  type="text"
1045                  value={customApiEndpoint}
1046                  onChange={(e) => setCustomApiEndpoint(e.target.value)}
1047                  className="w-full bg-[#202028] border border-[#31313e] rounded-lg px-3 py-2 text-gray-200 font-mono text-xs focus:outline-none focus:border-blue-500"
1048                />
1049              </div>
1050
1051              <div>
1052                <label className="block text-gray-300 font-medium mb-1">API Key / Bearer Token (Opțional)</label>
1053                <input
1054                  type="password"
1055                  placeholder="sk-..."
1056                  value={customApiKey}
1057                  onChange={(e) => setCustomApiKey(e.target.value)}
1058                  className="w-full bg-[#202028] border border-[#31313e] rounded-lg px-3 py-2 text-gray-200 font-mono text-xs focus:outline-none focus:border-blue-500"
1059                />
1060              </div>
1061
1062              <div>
1063                <label className="block text-gray-300 font-medium mb-1">JSON Payload Schema (Copy-Paste)</label>
1064                <textarea
1065                  rows={4}
1066                  value={customPromptWrapper}
1067                  onChange={(e) => setCustomPromptWrapper(e.target.value)}
1068                  className="w-full bg-[#202028] border border-[#31313e] rounded-lg p-2.5 text-gray-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
1069                />
1070              </div>
1071
1072              <div className="p-3 bg-[#131317] border border-[#252530] rounded-xl text-gray-400 space-y-1.5 text-[11px]">
1073                <p className="font-semibold text-gray-200">Cum funcționează integrarea:</p>
1074                <p>1. Când trimiți un prompt din bara de jos, interfața îl poate transmite către acest endpoint extern prin webhook.</p>
1075                <p>2. Modelul manager (ex. Google Gemini) structurează instrucțiunile muzicale (BPM, stil, lungime) și le trimite către generatorul audio.</p>
1076                <p>3. Răspunsul audio este mapat automat ca un clip pe track-ul curent din timeline.</p>
1077              </div>
1078            </div>
1079
1080            <div className="p-4 border-t border-[#292934] bg-[#15151a] flex justify-end gap-2">
1081              <button
1082                onClick={() => setShowWebhookModal(false)}
1083                className="px-4 py-2 bg-[#252530] hover:bg-[#30303d] text-gray-300 rounded-xl font-medium transition"
1084              >
1085                Închide
1086              </button>
1087              <button
1088                onClick={() => {
1089                  setShowWebhookModal(false);
1090                  setStatusMessage("Configurația API a fost salvată!");
1091                  setTimeout(() => setStatusMessage(null), 3000);
1092                }}
1093                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition"
1094              >
1095                Salvează Configurația
1096              </button>
1097            </div>
1098          </div>
1099        </div>
1100      )}
1101    </div>
1102  );
1103}