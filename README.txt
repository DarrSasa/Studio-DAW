STUDIO DAW — prototip local portabil
====================================

PORNIRE PE WINDOWS
1. Dezarchiveaza proiectul in C:\MY_PYTHON_PROJECTS\Studio DAW (sau alt folder).
2. Instaleaza Node.js LTS de pe https://nodejs.org/ daca nu este instalat.
3. Ruleaza run.bat. Prima pornire instaleaza dependentele npm si deschide http://localhost:5173.
4. Inchide fereastra CMD pentru oprire.

UTILIZARE CLIPURI
- Upload Audio/MIDI din Add Track > Upload; Play reda clipurile sincron cu playhead-ul.
- Click pe un clip il selecteaza; al doilea click il deselecteaza. Butonul Edit vizibil pe clip deschide editorul mare.
- MIDI: editor piano-roll; Pencil pe gol deseneaza; lângă margine cursorul ↔ redimensioneaza; in centru cursorul de mutare deplaseaza nota sus/jos si stanga/dreapta (orizontal la Snap).
- Select este unealta permanenta (fara toggle On/Off): click pe clip il selecteaza, al doilea click il deselecteaza; trage clipul stanga/dreapta sau vertical pe alt canal. In gol, trage pentru o regiune verde luminoasa cu contur de 1 px. Trage centrul ca sa o muti, marginile ca sa o redimensionezi la Snap; click pe selectie o sterge.
- Audio DSP: in editor regleaza Stretch (0.50–2.00), Pitch (semiton + cent) si Formant (semiton + cent), apasa Apply audio DSP, inchide editorul si apasa Play pentru a asculta.
- GM: Settings > Open SoundFont file, alege fisierul `.sf2`, selecteaza GM Program 1–128 si foloseste Preview GM program. MIDI-ul se reda prin FluidSynth WebAudioWorklet cand e incarcat SoundFont.

SOUNDFONT
- Folderul `SoundFonts/` este pregatit pentru copierea unui fisier SoundFont local.
- Recomandare: FluidR3_GM de Frank Wen, pagina cu descarcare si licenta: https://member.keymusician.com/Member/FluidR3_GM/index.html
- Copiaza fisierul extras in `SoundFonts/`, apoi selecteaza-l din aplicatie. Browserul nu poate citi automat folderul local; alegerea prin dialog este obligatorie. Fisierul nu este incarcat pe internet.
- Nu este inclus SoundFont-ul de 124+ MB; pastreaza documentele de copyright/licenta din arhiva originala.

LIMITARI IMPORTANTE
- Time-stretch/pitch sunt procesate offline prin SoundTouchJS; primul Play dupa schimbarea parametrilor poate intarzia, iar fisierele lungi pot folosi multa memorie. Asculta si verifica pe copii de fisiere.
- Formant shift este o aproximatie DSP bazata pe mutarea/egalizarea a doua benzi de rezonanta, nu un algoritm profesional LPC/cepstral; caracterul depinde de material.
- SoundFont-ul GM si procesarea trebuie testate cu fisierul tau real pe Windows; browserul necesita suport AudioWorklet.
- Key/Scale si estimarea BPM sunt aproximative; marker-ele nu sunt detector profesional de transient.
- Style/Lyrics sunt context pentru agentul text; Suno/API nu este conectat si nu se genereaza audio Suno.
- Export JSON nu include fișiere audio; obiectele audio importate necesita reimport dupa inchiderea paginii.

VERIFICARE CURENTA
- `npm test`: 7 teste automate (parser MIDI/tempo si DSP buffer) trecute.
- `npm run build`: TypeScript si Vite build trecute.
- FluidSynth worklet este inclus in build; nu exista inca un `.sf2` in workspace pentru verificarea audio a presetelor.
- Mai trebuie testate UI-ul si redarea auditiva cu fisiere MIDI/audio reale pe Windows inainte de arhiva finala.

GIT PENTRU WINDOWS
- Dupa dezarhivare, creeaza un repository gol pe GitHub/GitLab. Ruleaza `gitremote.bat` o singura data si lipeste URL-ul HTTPS/SSH al repo-ului. Scriptul initiaza branch main, configureaza autorul local si face push-ul initial.
- Pentru actualizare: `gitpull.bat`; dupa modificari: `gitpush.bat` si introdu un mesaj de commit.
- `.gitignore` exclude `SoundFonts/*.sf2` si `.sf3`; scriptul gitpush verifica acest lucru inainte de push. Nu copia token-uri/chei in repo.
- In aceasta arhiva repo-ul este local initializat in mediul de lucru, dar nu exista remote GitHub/GitLab; nu pot da un URL remote fara URL-ul tau/remote creat.

DEPENDENTE TERTE
- SoundTouchJS (LGPL-2.1), js-synthesizer (BSD-3-Clause), FluidSynth (LGPL); licentele sunt in node_modules dupa instalare.

Plan detaliat: PLAN-IMPLEMENTARE.md.
