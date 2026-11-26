import { Chess } from "chess.js";
import { supabase, hasSupabaseConfig } from "./supabase-client.js";
import { chooseMove, evaluatePosition } from "./chess-ai.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
const PIECES = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
};
const LEVELS = [
  { name: "Rookie", description: "Learning the basics", min: 400, max: 650 },
  { name: "Learner", description: "Finding good moves", min: 650, max: 850 },
  { name: "Explorer", description: "Building game plans", min: 850, max: 1100 },
  { name: "Challenger", description: "Spotting tactics", min: 1100, max: 1400 },
  { name: "Strategist", description: "Thinking ahead", min: 1400, max: 1750 },
  { name: "Champion", description: "Advanced training", min: 1750, max: 2200 }
];
const LESSONS = [
  { title: "Your mission: checkmate.", body: "Chess is a game of plans. You and your opponent take turns. Your goal is to checkmate the other king: the king is under attack and has no legal escape.", fact: "You do not capture the king. You protect your own king and trap the opponent's king.", piece: "♔" },
  { title: "Meet your chess army.", body: "Each side starts with a king, queen, two rooks, two bishops, two knights and eight pawns. Every piece has its own way of moving.", fact: "The queen is the most powerful mover. The king is the most important piece. Pawns can promote when they reach the far side.", piece: "♕" },
  { title: "Rooks, bishops and queens.", body: "Rooks move straight along ranks and files. Bishops move diagonally. Queens combine both movements. They cannot jump over other pieces.", fact: "Keep your queen safe. Moving it out too early can let the opponent chase it and gain time.", piece: "♖" },
  { title: "Knights, pawns and kings.", body: "Knights move in an L-shape and can jump. Pawns move forward but capture diagonally. Kings move one square in any direction, but never into check.", fact: "A knight in the centre can control many squares. Keep your king away from attacked squares.", piece: "♘" },
  { title: "Check, checkmate and draw.", body: "Check means your king is attacked. You must answer it. Checkmate means there is no legal escape. A draw can happen when neither side can win.", fact: "When in check, move your king, block the attack if possible, or capture the checking piece.", piece: "♚" },
  { title: "Three habits of a strong player.", body: "Control the centre, develop your knights and bishops, and keep your king safe. Before each move, ask what your opponent is threatening.", fact: "Your first mission: move a centre pawn, develop a knight, and look for a safe place for your king. Let's play!", piece: "♙" }
];

let profile = null;
let signedInUser = null;
let suggestedMove = null;
let game = null;
let selectedSquare = null;
let legalTargets = [];
let lastMove = null;
let flipped = false;
let thinking = false;
let matchFinished = false;
let lessonIndex = 0;
let playerNotes = [];
let settings = { engineMode: "builtin", enginePath: "", adaptive: true, hints: true };

function accountPrefix() { return signedInUser?.id ? signedInUser.id + "-" : "local-"; }
function profileKey(name) { return "khelo-profile-" + accountPrefix() + name.toLowerCase().replace(/[^a-z0-9_-]/g, "_"); }
function lastPlayerKey() { return "khelo-last-player-" + accountPrefix(); }
function saveProfile() { if (profile) { localStorage.setItem(profileKey(profile.name), JSON.stringify(profile)); localStorage.setItem(lastPlayerKey(), profile.name); } }

function setAuthMessage(message, kind = "info") {
  const node = $("authMessage");
  node.textContent = message;
  node.dataset.kind = kind;
}
function openPlayerSpace(user) {
  signedInUser = user;
  const email = user?.email || "";
  const defaultName = email.includes("@") ? email.split("@")[0].slice(0, 20) : "Player";
  $("playerName").value = defaultName || "Player";
  let saved = null;
  try {
    const lastName = localStorage.getItem(lastPlayerKey());
    if (lastName) saved = JSON.parse(localStorage.getItem(profileKey(lastName)) || "null");
  } catch { saved = null; }
  if (saved) {
    profile = saved;
    showScreen("gameScreen");
    updateProfileUI();
    startMatch();
  } else {
    showScreen("setupScreen");
  }
}
function showSignedOutScreen() {
  signedInUser = null;
  profile = null;
  $("userChip").hidden = true;
  $("authPassword").value = "";
  $("authTitle").textContent = "Sign in to continue";
  $("authSubtitle").textContent = "Enter your KHELO email address and password.";
  $("signInBtn").disabled = false;
  $("createAccountBtn").disabled = false;
  setAuthMessage("Use your KHELO account password, not your Gmail password.");
  showScreen("authScreen");
}

async function initializeEmailLogin() {
  if (!hasSupabaseConfig || !supabase) {
    $("authConfigNote").hidden = false;
    $("emailLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      setAuthMessage("Email login is not configured. Add your Supabase Project URL and public anon/publishable key to .env, save it, and rebuild KHELO.", "error");
    });
    return;
  }

  $("authConfigNote").hidden = true;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) openPlayerSpace(data.session.user);
  } catch (error) {
    setAuthMessage("Could not restore your sign-in session: " + error.message, "error");
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showSignedOutScreen();
  });

  $("emailLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;
    const action = event.submitter?.value === "signup" ? "signup" : "signin";
    if (!email || !password) return;

    $("signInBtn").disabled = true;
    $("createAccountBtn").disabled = true;
    setAuthMessage(action === "signup" ? "Creating your KHELO account…" : "Signing in to KHELO…");

    try {
      if (action === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (!data.session || !data.user) {
          setAuthMessage("Supabase is still requiring email confirmation. Open Authentication → Sign In / Providers → Email in your Supabase dashboard and turn OFF Confirm email. Then create your account again. KHELO does not use OTP.", "error");
          return;
        }

        setAuthMessage("Your KHELO account is ready. Opening your chess space…", "success");
        openPlayerSpace(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Supabase did not return a signed-in user.");
        setAuthMessage("Signed in successfully. Opening your chess space…", "success");
        openPlayerSpace(data.user);
      }
    } catch (error) {
      const detail = String(error?.message || error);
      if (action === "signup" && /already registered|user already exists/i.test(detail)) {
        setAuthMessage("This email already has an account from the earlier OTP test, and that account may not have a password. In Supabase Authentication → Users, remove only your old KHELO test account, then use Create account again. You can also use another email address.", "error");
      } else if (action === "signin" && /invalid login credentials/i.test(detail)) {
        setAuthMessage("Email or password is incorrect. If this account was created using the old OTP-only version, it has no password yet. Remove only that old test user in Supabase Authentication → Users, then create a new KHELO account.", "error");
      } else {
        setAuthMessage((action === "signup" ? "Could not create account: " : "Could not sign in: ") + detail, "error");
      }
    } finally {
      $("signInBtn").disabled = false;
      $("createAccountBtn").disabled = false;
    }
  });
}

function levelIndex(rating) {
  if (rating < 650) return 0;
  if (rating < 850) return 1;
  if (rating < 1100) return 2;
  if (rating < 1400) return 3;
  if (rating < 1750) return 4;
  return 5;
}
function levelProgress(rating) {
  const item = LEVELS[levelIndex(rating)];
  return Math.max(0, Math.min(100, ((rating - item.min) / (item.max - item.min)) * 100));
}
function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2300);
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $(id).classList.add("active");
}
function updateProfileUI() {
  if (!profile) return;
  const index = levelIndex(profile.rating);
  const item = LEVELS[index];
  const letter = profile.name.charAt(0).toUpperCase();
  $("welcomeName").textContent = profile.name;
  $("profileName").textContent = profile.name;
  $("profileAvatar").textContent = letter;
  $("myAvatar").textContent = letter;
  $("myLabel").textContent = profile.name.toUpperCase() + " · WHITE";
  $("userAvatar").textContent = letter;
  $("userNameChip").textContent = profile.name;
  $("userChip").hidden = false;
  $("levelNumber").textContent = String(index + 1).padStart(2, "0");
  $("levelName").textContent = item.name;
  $("levelDescription").textContent = item.description;
  $("levelFill").style.width = levelProgress(profile.rating) + "%";
  $("levelProgress").textContent = Math.round(levelProgress(profile.rating)) + "% to next level";
  $("rating").textContent = profile.rating + " pts";
  $("wins").textContent = profile.wins;
  $("draws").textContent = profile.draws;
  $("losses").textContent = profile.losses;
  $("streak").textContent = profile.streak + "-match streak";
  $("levelTag").textContent = "LEVEL " + String(index + 1).padStart(2, "0") + " · " + item.name.toUpperCase();
  $("botDescription").textContent = ["Gentle practice opponent", "Friendly practice opponent", "Club training partner", "Focused practice rival", "KHELO strategist", "KHELO champion"][index];
}

function startMatch() {
  game = new Chess();
  selectedSquare = null;
  legalTargets = [];
  suggestedMove = null;
  lastMove = null;
  flipped = false;
  thinking = false;
  matchFinished = false;
  playerNotes = [];
  $("reviewCard").hidden = true;
  $("hintBtn").disabled = false;
  $("undoBtn").disabled = true;
  $("coachMessage").textContent = profile.rating < 650
    ? "Welcome to the board! You are White and move first. Try e4 or d4 to control the centre."
    : "Look for a useful developing move. Before you play, scan for checks, captures and threats.";
  $("missionTitle").textContent = "Own the centre";
  $("missionText").textContent = "Move a centre pawn, then bring out a knight.";
  $("matchStatus").textContent = "Waiting for your first move";
  $("myStatus").textContent = "Your turn starts the game";
  $("botTurn").textContent = "READY";
  renderBoard();
  renderHistory();
  updateProfileUI();
  updateTurnUI();
}

function renderBoard() {
  const board = $("board");
  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const matrix = game.board();
  board.innerHTML = "";

  rows.forEach((row) => cols.forEach((col) => {
    const squareName = "abcdefgh"[col] + (8 - row);
    const piece = matrix[row][col];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "square " + ((row + col) % 2 === 0 ? "light" : "dark");
    button.setAttribute("aria-label", squareName + (piece ? " " + piece.color + " " + piece.type : " empty"));
    if (selectedSquare === squareName) button.classList.add("selected");
    if (suggestedMove?.from === squareName) button.classList.add("suggested-from");
    if (suggestedMove?.to === squareName) button.classList.add("suggested-to");
    if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) button.classList.add("last");
    const target = legalTargets.find((move) => move.to === squareName);
    if (target) button.classList.add(piece ? "capture" : "legal");
    if (piece && piece.type === "k" && piece.color === game.turn() && game.isCheck()) button.classList.add("check");
    if (piece) {
      const span = document.createElement("span");
      span.className = "chess-piece " + (piece.color === "w" ? "white" : "black");
      span.textContent = PIECES[piece.color + piece.type];
      button.appendChild(span);
    }
    if ((!flipped && col === 0) || (flipped && col === 7)) {
      const coordinate = document.createElement("span");
      coordinate.className = "coordinate";
      coordinate.textContent = 8 - row;
      button.appendChild(coordinate);
    } else if ((!flipped && row === 7) || (flipped && row === 0)) {
      const coordinate = document.createElement("span");
      coordinate.className = "coordinate";
      coordinate.textContent = "abcdefgh"[col];
      button.appendChild(coordinate);
    }
    button.addEventListener("click", () => onSquareClick(squareName));
    board.appendChild(button);
  }));

  $("rankCoords").innerHTML = (flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map((n) => "<span>" + n + "</span>").join("");
  $("fileCoords").innerHTML = (flipped ? "hgfedcba" : "abcdefgh").split("").map((letter) => "<span>" + letter + "</span>").join("");
}

function onSquareClick(squareName) {
  if (!game || matchFinished || thinking || game.turn() !== "w") return;
  const piece = game.get(squareName);
  if (selectedSquare) {
    const target = legalTargets.find((move) => move.to === squareName);
    if (target) { playHumanMove(selectedSquare, squareName); return; }
    if (piece && piece.color === "w") { selectPiece(squareName); return; }
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    return;
  }
  if (piece && piece.color === "w") selectPiece(squareName);
}

function selectPiece(squareName) {
  selectedSquare = squareName;
  legalTargets = game.moves({ square: squareName, verbose: true });
  renderBoard();
  if (!legalTargets.length) toast("That piece has no legal move right now.");
}

function playHumanMove(from, to) {
  const before = evaluatePosition(game);
  let move;
  try { move = game.move({ from, to, promotion: "q" }); }
  catch { move = null; }
  if (!move) { toast("That move is not legal. Choose a highlighted square."); return; }
  const after = evaluatePosition(game);
  if (before - after > 190 && !move.captured) {
    playerNotes.push("Tiny tip: Before moving, check whether the piece you are moving is protected.");
  }
  selectedSquare = null;
  legalTargets = [];
  suggestedMove = null;
  lastMove = { from, to };
  renderBoard();
  renderHistory();
  $("coachMessage").textContent = move.san.includes("+")
    ? "Nice! That move gives check. Keep your own king safe while maintaining the pressure."
    : move.captured
      ? "You captured a piece. Before your next move, check whether your capturing piece is protected."
      : move.piece === "n" || move.piece === "b"
        ? "Good development. Bringing knights and bishops into the game helps you control more squares."
        : "Your move is on the board. Ask what it attacks and what your opponent may attack next.";
  if (checkGameEnd()) return;
  thinking = true;
  $("botTurn").textContent = "THINKING";
  updateTurnUI();
  setTimeout(playBotMove, 160);
}

async function playBotMove() {
  if (!game || matchFinished || game.turn() !== "b") { thinking = false; return; }
  const index = levelIndex(profile.rating) + 1;
  let move = null;

  if (settings.engineMode === "external" && settings.enginePath && window.kheloDesktop) {
    try {
      const bestmove = await window.kheloDesktop.getEngineMove({
        enginePath: settings.enginePath,
        fen: game.fen(),
        depth: Math.min(16, 5 + index * 2)
      });
      const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(bestmove || "");
      if (match) move = { from: match[1], to: match[2], promotion: match[3] || "q" };
    } catch (error) {
      toast("External engine failed. KHELO built-in AI will play this move.");
      console.warn(error);
    }
  }

  if (!move) move = chooseMove(game, { level: index, style: "adaptive" });
  if (!move) { thinking = false; checkGameEnd(); return; }

  try {
    const result = game.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    lastMove = { from: result.from, to: result.to };
  } catch (error) {
    console.error("KHELO move error:", error);
    thinking = false;
    toast("The opponent could not complete a move. Start a new match.");
    return;
  }

  thinking = false;
  selectedSquare = null;
  legalTargets = [];
  const coachMove = !game.isGameOver() && game.turn() === "w"
    ? chooseMove(game, { level: Math.min(3, levelIndex(profile.rating) + 1), style: "gentle" })
    : null;
  suggestedMove = coachMove ? { from: coachMove.from, to: coachMove.to } : null;
  renderBoard();
  renderHistory();
  $("botTurn").textContent = "READY";
  $("coachMessage").textContent = game.isCheck()
    ? "Your king is in check. Find a safe response: move it, block the attack, or capture the checking piece."
    : coachMove
      ? "Coach idea: consider " + coachMove.from.toUpperCase() + " → " + coachMove.to.toUpperCase() + ". The board marks the starting and suggested squares. Check your opponent's threat before choosing."
      : "Your turn. Take a moment to scan checks, captures and threats — then choose your plan.";
  updateTurnUI();
  $("undoBtn").disabled = false;
  checkGameEnd();
}

function renderHistory() {
  const moves = game.history();
  $("moveCount").textContent = Math.ceil(moves.length / 2) + " MOVES";
  if (!moves.length) {
    $("moveList").innerHTML = '<p class="empty-moves">Your moves will appear here.<br><small>White moves first.</small></p>';
    return;
  }
  $("moveList").innerHTML = "";
  for (let index = 0; index < moves.length; index += 2) {
    const row = document.createElement("div");
    row.className = "move-row";
    const number = document.createElement("span");
    number.className = "move-number";
    number.textContent = (index / 2 + 1) + ".";
    const white = document.createElement("span");
    white.textContent = moves[index] || "";
    const black = document.createElement("span");
    black.textContent = moves[index + 1] || "";
    row.append(number, white, black);
    $("moveList").appendChild(row);
  }
  $("moveList").scrollTop = $("moveList").scrollHeight;
}

function updateTurnUI() {
  if (matchFinished) return;
  if (thinking) {
    $("myTurn").textContent = "COACH THINKING";
    $("myStatus").textContent = "The opponent is choosing a move";
    $("matchStatus").textContent = "KHELO is thinking…";
  } else if (game.turn() === "w") {
    $("myTurn").textContent = game.isCheck() ? "KING IN CHECK" : "YOUR TURN";
    $("myStatus").textContent = "Choose your next move";
    $("matchStatus").textContent = game.isCheck() ? "Your king is in check — find a safe move" : "Your turn — choose a move";
  }
}

function checkGameEnd() {
  if (!game.isGameOver()) return false;
  if (game.isCheckmate()) finishMatch(game.turn() === "w" ? "loss" : "win");
  else finishMatch("draw");
  return true;
}

function buildReviewTip(result) {
  if (result === "loss") {
    return playerNotes[0] || "Tiny tip: Try castling earlier. It helps protect your king and brings a rook into the game.";
  }
  if (result === "win") return "Tiny tip: Great result! Keep developing your pieces and look for safe chances to create threats.";
  return "Tiny tip: Try to control the centre and make sure your pieces protect each other.";
}

function finishMatch(result) {
  matchFinished = true;
  thinking = false;
  const previousLevel = levelIndex(profile.rating);
  let change = result === "win" ? 24 + Math.min(profile.streak * 2, 8) : result === "loss" ? -20 : 4;
  if (result === "win") { profile.wins += 1; profile.streak += 1; change = 24 + Math.min(profile.streak * 2, 8); }
  else if (result === "loss") { profile.losses += 1; profile.streak = 0; }
  else { profile.draws += 1; profile.streak = 0; }
  if (settings.adaptive) profile.rating = Math.max(400, profile.rating + change);
  profile.played += 1;
  saveProfile();
  updateProfileUI();

  const newLevel = levelIndex(profile.rating);
  $("reviewTitle").textContent = newLevel > previousLevel
    ? "LEVEL UP! " + LEVELS[newLevel].name + " UNLOCKED"
    : result === "win" ? "Brilliant play!" : result === "loss" ? "Good effort. Keep learning." : "A thoughtful draw!";
  const summary = result === "win" ? "You won this match. Keep the good habits going. "
    : result === "loss" ? "This game is finished, but your learning is not. "
    : "Neither side won this time. A draw is part of chess too. ";
  $("reviewText").textContent = summary + buildReviewTip(result);
  $("reviewRating").textContent = "TRAINING POINTS  " + (change > 0 ? "+" : "") + change + " · NOW " + profile.rating;
  $("reviewCard").hidden = false;
  $("hintBtn").disabled = true;
  $("undoBtn").disabled = true;
  $("myTurn").textContent = "MATCH FINISHED";
  $("botTurn").textContent = "FINISHED";
  $("matchStatus").textContent = "Match complete · read your tiny tip";
  $("coachMessage").textContent = buildReviewTip(result);
  toast(newLevel > previousLevel ? "Level up! You reached " + LEVELS[newLevel].name + "." : "Match complete. Read your small coaching tip.");
}

$("setupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("playerName").value.trim();
  if (!name) { toast("Enter your player name first."); return; }
  const mode = document.querySelector('input[name="experience"]:checked').value;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(profileKey(name)) || "null"); } catch { saved = null; }
  profile = saved || {
    name, mode, rating: mode === "beginner" ? 500 : mode === "casual" ? 760 : 1080,
    wins: 0, losses: 0, draws: 0, played: 0, streak: 0, tutorialSeen: false
  };
  localStorage.setItem(lastPlayerKey(), name);
  showScreen("gameScreen");
  updateProfileUI();
  startMatch();
  if (profile.mode === "beginner" && !profile.tutorialSeen) { lessonIndex = 0; showLesson(); }
});

function showLesson() {
  const lesson = LESSONS[lessonIndex];
  $("lessonStep").textContent = "YOUR FIRST LESSON · " + String(lessonIndex + 1).padStart(2, "0");
  $("lessonTitle").textContent = lesson.title;
  $("lessonText").textContent = lesson.body;
  $("lessonFact").textContent = lesson.fact;
  $("lessonPiece").textContent = lesson.piece;
  $("lessonCount").textContent = String(lessonIndex + 1).padStart(2, "0") + " / 06";
  $("lessonProgress").style.width = ((lessonIndex + 1) / LESSONS.length * 100) + "%";
  $("nextLessonBtn").textContent = lessonIndex === LESSONS.length - 1 ? "Let's play! →" : "Next lesson →";
  $("lessonDialog").showModal();
}
function closeLesson() {
  if ($("lessonDialog").open) $("lessonDialog").close();
  profile.tutorialSeen = true;
  saveProfile();
}
$("nextLessonBtn").addEventListener("click", () => {
  if (lessonIndex < LESSONS.length - 1) { lessonIndex += 1; showLesson(); }
  else closeLesson();
});
$("skipLessonBtn").addEventListener("click", closeLesson);
$("closeLessonBtn").addEventListener("click", closeLesson);

$("switchPlayerBtn").addEventListener("click", () => {
  $("playerName").value = profile ? profile.name : "";
  $("userChip").hidden = true;
  showScreen("setupScreen");
});
$("userChip").addEventListener("click", () => {
  $("playerName").value = profile.name;
  showScreen("setupScreen");
});

$("hintBtn").addEventListener("click", () => {
  if (!settings.hints) { toast("Hints are disabled in Settings."); return; }
  if (!game || matchFinished || thinking || game.turn() !== "w") { toast("Hints are available on your turn."); return; }
  const move = chooseMove(game, { level: Math.min(3, levelIndex(profile.rating) + 1), style: "gentle" });
  if (!move) return;
  suggestedMove = { from: move.from, to: move.to };
  selectedSquare = move.from;
  legalTargets = game.moves({ square: move.from, verbose: true });
  renderBoard();
  $("coachMessage").textContent = "Coach move: " + move.from.toUpperCase() + " → " + move.to.toUpperCase() + ". The board highlights both squares. This is a suggestion, not a forced move.";
});
$("tipBtn").addEventListener("click", () => {
  if (matchFinished) return;
  $("coachMessage").textContent = game.isCheck()
    ? "Your king is in check. You must answer it: move the king, block the attack, or capture the checking piece."
    : "Small thinking routine: 1) Is my king safe? 2) Can I capture something? 3) What is my opponent threatening?";
});
$("undoBtn").addEventListener("click", () => {
  if (thinking || matchFinished || game.history().length < 2) { toast("Complete one opponent reply before taking back."); return; }
  game.undo();
  game.undo();
  selectedSquare = null;
  legalTargets = [];
  lastMove = null;
  renderBoard();
  renderHistory();
  updateTurnUI();
  $("undoBtn").disabled = game.history().length < 2;
  $("coachMessage").textContent = "We took back the last move pair. Try a different idea — practice is how you improve.";
});
$("flipBtn").addEventListener("click", () => { flipped = !flipped; renderBoard(); });
$("newMatchBtn").addEventListener("click", () => {
  if (game.history().length && !matchFinished && !window.confirm("Start a fresh match? This unfinished match will not count.")) return;
  startMatch();
});
$("resignBtn").addEventListener("click", () => {
  if (!matchFinished && window.confirm("End this match and record it as a loss?")) finishMatch("loss");
});
$("nextMatchBtn").addEventListener("click", startMatch);

$("fullscreenBtn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch { toast("Fullscreen is not available in this window."); }
});

$("settingsBtn").addEventListener("click", () => {
  document.querySelector('input[name="engineMode"][value="' + settings.engineMode + '"]').checked = true;
  $("enginePath").value = settings.enginePath || "";
  $("adaptiveToggle").checked = settings.adaptive;
  $("hintsToggle").checked = settings.hints;
  $("settingsDialog").showModal();
});
$("closeSettingsBtn").addEventListener("click", () => $("settingsDialog").close());
$("chooseEngineBtn").addEventListener("click", async () => {
  if (!window.kheloDesktop) { toast("Engine file selection is available in the installed desktop app."); return; }
  try {
    const selectedPath = await window.kheloDesktop.chooseEngine();
    if (selectedPath) {
      settings.enginePath = selectedPath;
      $("enginePath").value = selectedPath;
      document.querySelector('input[name="engineMode"][value="external"]').checked = true;
      toast("Chess engine selected.");
    }
  } catch (error) { toast(error.message || "Could not select the engine."); }
});
$("saveSettingsBtn").addEventListener("click", () => {
  settings.engineMode = document.querySelector('input[name="engineMode"]:checked').value;
  settings.adaptive = $("adaptiveToggle").checked;
  settings.hints = $("hintsToggle").checked;
  $("settingsDialog").close();
  toast("KHELO settings saved.");
});
$("resetSettingsBtn").addEventListener("click", () => {
  settings = { engineMode: "builtin", enginePath: "", adaptive: true, hints: true };
  $("settingsDialog").close();
  toast("Settings reset to KHELO built-in AI.");
});

if (window.kheloDesktop?.appVersion) {
  window.kheloDesktop.appVersion().then((version) => {
    $("appStatus").textContent = "DESKTOP APP · VERSION " + version;
  }).catch(() => {});
}

$("signOutBtn").addEventListener("click", async () => {
  if (!supabase) { showSignedOutScreen(); return; }
  const { error } = await supabase.auth.signOut();
  if (error) toast("Sign out failed: " + error.message);
  else showSignedOutScreen();
});

initializeEmailLogin();
