PLAN DE IMPLEMENTARE — STUDIO DAW
==================================
Regulă de lucru: fiecare cerință nouă este înscrisă aici. [x] înseamnă implementată în cod și verificată la build/test; verificarea cu fișierele reale și pe Windows este marcată separat, nu se presupune.

CERINȚE DIN ULTIMUL MESAJ — CODUL ESTE IMPLEMENTAT
--------------------------------------------------
- [x] Selecția clipului/regiunii are contur de 1 px (ultima cerință prevalează asupra cererii anterioare de 3 px).
- [x] Eliminat toggle-ul „Select On/Off”; Select este unealta permanentă.
- [x] Înlocuit sliderul „Prompt” cu „Style”; valoarea Style este transmisă textului de context al agentului.
- [x] Snap: liniile verticale se redesenează la valoarea aleasă în fiecare lane din playlist.
- [x] Snap: liniile verticale se desenează și în editorul maxim audio și în piano-roll MIDI; liniile de măsură au contrast separat.
- [x] Play/Pause din transportul playlist-ului pornește/oprește audio și notele MIDI programate pe poziția playhead-ului.
- [x] Markere globale de timp: dublu-click pe riglă adaugă marker la Snap; drag mută la Snap; click-dreapta șterge; marker-ele se salvează local și în exportul JSON.
- [x] Markere de clip: dublu-click în waveform/piano-roll adaugă; drag repoziționează la Snap; dublu-click pe marker îl elimină.
- [x] Waveform-ul playlist audio este o undă centrală stereo-combinată, color/albastră pentru citire vizuală apropiată de captura „audio parts”.
- [x] Editorul Audio maximum view are waveform albastră centrală și linii Snap/măsură.
- [x] Piano-roll are taste verticale în dreapta, rânduri pitch, note verde-pal, pencil/select, Snap și playhead.
- [x] Mutarea clipurilor: pointer drag stânga/dreapta și între canale; click selectează, al doilea click pe același clip îl deselectează.
- [x] Selecție goală pe canal: drag creează chenar verde luminos de 1 px; centrul mută cu cursor palmă/grab; marginile schimbă lungimea la Snap; click pe selecție o închide. Nu se creează încă un clip automat la selectarea zonei.
- [x] Ignoră fișierele SoundFont din git (`SoundFonts/*.sf2`, `.sf3`, audio samples); `gitpush.bat` refuză push-ul dacă regula de ignorare lipsește.
- [x] Repository-ul public `DarrSasa/Studio-DAW` este conectat la `origin/main`; am autentificare de scriere autorizată în workspace și pot publica commit-urile direct. Utilizatorul primește actualizările în același folder doar cu `gitpull.bat`, fără dezarhivări repetate.
- [x] Scripturi Windows `gitpush.bat`, `gitpull.bat`, `gitremote.bat`; fișierul de autentificare nu este inclus în repo/arhive.
- [x] Rulat Vite local: aplicația și fișierele FluidSynth Worklet servesc; asset-urile Worklet au răspuns HTTP 200.

REFERINȚA VIZUALĂ MIDI
----------------------
- [x] Piano-roll cu claviatura verticală în stânga, desenată cu taste albe/negre distincte și nume de note mai lizibile pe fiecare tastă.
- [x] Scrollbar vertical cu track gri închis și thumb mai deschis; scrollbar-ul orizontal de jos este ascuns.
- [x] Zoom vertical cu rotița în pătratul din colțul dreapta-sus; zoom orizontal rămâne pe rigla măsurilor.
- [x] Thumb-ul de navigare orizontală poate fi tras; capetele indică resize stânga/dreapta.
- [x] Piano-roll-ul maxim se poate deplasa prin bara de titlu, iar overlay-ul nu mai interceptează clickurile din afara ferestrei (ex. transportul playlist-ului).
- [x] Liniile verticale rămân vizibile la setările Snap; dungile gri deschis evidențiază notele din gama selectată.
- [ ] Verificare vizuală interactivă finală în mediul Windows al utilizatorului.

SOUNDFONT / GM
--------------
- [x] Folder `SoundFonts/` în proiect, cu instrucțiuni pentru copiere locală și link de descărcare.
- [x] Aplicația deschide picker pentru `.sf2`; utilizatorul poate alege un fișier copiat în folder.
- [x] FluidSynth WebAudioWorklet inclus, program GM 1–128 și buton Preview; MIDI-ul folosește SoundFont-ul ales.
- [x] Folderul și sample-urile SoundFont sunt excluse din push; fișierul de licență/attribution trebuie păstrat local din arhiva SoundFont originală.
- [ ] Încărcarea și audiția cu un SoundFont real necesită verificarea utilizatorului; nu există un SF2 de test în workspace.

AUDIO DSP
---------
- [x] Time-stretch cu păstrarea pitch-ului prin SoundTouchJS; factor reglabil 0.50–2.00 și procesare la redare.
- [x] Pitch semitone + cent (sutimi de semiton) separat, cu time correction.
- [x] Formant shift semitone + cent prin mutarea/egalizarea rezonanțelor vocale (aproximație EQ), procesat în AudioBuffer.
- [x] Teste automate sintetice pentru durata stretch-ului, pitch processing și validitatea bufferului după formant EQ.
- [ ] Ascultare A/B cu clipuri vocale/instrumentale reale și test pe Windows. Formant DSP-ul este aproximație spectrală, nu procesor LPC/cepstral profesional.

PLANUL ANTERIOR — STATUS
------------------------
PASUL 1 — Playlist și UI de bază
- [x] Riglă și grilă playlist, playhead comun, marker de playhead, culori de pistă/mute.
- [x] Add Track Audio/MIDI/Upload; selector unic Audio/MIDI.
- [x] Tempo manual/Tap/+/−; snap și overview.
- [x] Follow Track apare în UI, dar analiza BPM variabil nu este implementată.

PASUL 2 — Editor extins Audio/MIDI
- [x] Editor maxim al clipului, waveform audio/piano-roll, Playhead.
- [x] Note MIDI desenabile cu Pencil; margini resize ↔; centru mută sus/jos/stânga/dreapta la Snap.
- [x] Selectare dreptunghiulară și ștergere note MIDI.
- [x] Piano-roll cu Key/Scale și tastatură verticală dreapta.
- [x] Zoom orizontal și navigare/scroll piano-roll; verificarea vizuală finală în mediul Windows rămâne deschisă.

PASUL 3 — Editare, markere și playback
- [x] Play/Pause în playlist pentru audio/MIDI, solo/mute, nivel de pistă.
- [x] Loop/reverse/speed/pitch/volum clip Audio.
- [x] Cut audio split, markere locale și markere globale pe riglă.
- [x] Select, mutare clip între canale, chenar de selecție goală și resize la Snap.
- [ ] Reverse/split după setări DSP combinate și alte cazuri-limită necesită validare cu fișiere reale.
- [ ] Peak/transient snapping nu este detector profesionist de transient; marker-ul Snap este disponibil.

PASUL 4 — Prompt, Style, Lyrics și Agent
- [x] Style text, slider Style, Lyrics cu tag-uri, referințe și agent text selectabil Gemini/Groq/OpenRouter/Local, cu chei locale și model OpenRouter configurabil.
- [x] UI pentru MusicAPI trial și Suno-API.io, selector V6/V6 Wild/V6 Mini, cheie locală, verificare sold/task și player rezultate; confirmare înainte de o cerere care consumă credite. Endpointul oficial Suno este doar linkat, deoarece documentația de cont nu este accesibilă aici.

PASUL 5 — GM și pachet
- [x] FluidSynth/SoundFont loader, selectare program GM și test-note.
- [x] `SoundFonts/`, gitignore pentru SF2, scripts pentru push/pull/remote.
- [x] URL remote configurat și verificat: `https://github.com/DarrSasa/Studio-DAW`; push direct din workspace este disponibil. Pentru utilizator, update-ul în același folder se face cu `gitpull.bat`.
- [ ] Finalul pe Windows depinde de testul utilizatorului pentru audio/MIDI/SF2 și eventuala corectare a bugurilor găsite.

VERIFICARE AUTOMATĂ A ITERAȚIEI
-------------------------------
- [x] `npm test`: 7/7 teste trecute (5 parser/engine + 2 DSP buffer).
- [x] `npm run build`: TypeScript și Vite build trecute.
- [x] AudioContext este deblocat direct din gestul Play; clipurile audio noi se salvează/restaurează local din IndexedDB, iar erorile audio sunt raportate în UI.
- [x] API Agent: Gemini 3.8 Flash, Groq, OpenRouter și Local, cu chei/model salvate local.
- [x] Suno: MusicAPI balance/create/task status pentru V6/V6 Wild/V6 Mini, Suno-API.io create/query (terț), plus verificare gratuită C2PA file/URL.
- [ ] Generarea externă Suno nu a fost testată cu cheie de cont: utilizatorul trebuie să folosească creditul trial propriu și să confirme costul/limitarea în UI înainte de test.
- [x] Vite servit în preview; FluidSynth Worklet assets verificate HTTP 200.
- [ ] Interacțiuni de pointer, selecție, GM real și DSP nu pot fi declarate validate audiovizual pe Windows aici.

NOTE DE LIVRARE ȘI SIGURANȚĂ
---------------------------
- Se păstrează corpus/repo-uri; nu se accesează PC-ul utilizatorului.
- Nu se includ SoundFont-uri protejate în repo sau arhivă; regula git exclude exact asset-urile voluminoase.
- Export JSON nu include audio. Audio-ul sursă importat este păstrat local în IndexedDB; clipurile vechi fără assetId pot necesita reimport o singură dată.
- Cheile API sunt salvate în localStorage pe calculatorul browserului; nu se includ în repository și nu trebuie trimise în chat. localStorage nu este un seif securizat.
- `gitpush.bat` face commit și push către `origin main`; `gitpull.bat` face `git pull --rebase origin main`; `gitremote.bat` cere URL-ul repository-ului remote și încearcă push-ul inițial.
