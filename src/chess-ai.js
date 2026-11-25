const MATERIAL = { p: 100, n: 315, b: 330, r: 500, q: 900, k: 20000 };
const INF = 1000000;
const MATE = 100000;

function evaluateWhite(game) {
  const board = game.board();
  let score = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const sign = piece.color === "w" ? 1 : -1;
      const centre = 3.5 - (Math.abs(3.5 - row) + Math.abs(3.5 - col)) / 2;
      let value = MATERIAL[piece.type] || 0;
      if (piece.type === "n") value += centre * 10;
      if (piece.type === "b") value += centre * 5;
      if (piece.type === "p") value += (piece.color === "w" ? 6 - row : row - 1) * 5 + centre * 1.5;
      if (piece.type === "k" && game.history().length < 18) value -= centre * 4;
      score += sign * value;
    }
  }
  return score;
}

function evaluateForTurn(game) {
  const whiteScore = evaluateWhite(game);
  return game.turn() === "w" ? whiteScore : -whiteScore;
}

function negamax(game, depth, alpha, beta, ply) {
  if (game.isCheckmate()) return -MATE + ply;
  if (game.isDraw()) return 0;
  if (depth <= 0) return evaluateForTurn(game);

  const moves = game.moves({ verbose: true });
  if (!moves.length) return game.isCheck() ? -MATE + ply : 0;

  moves.sort((a, b) => {
    const score = (move) => {
      const victim = move.captured ? MATERIAL[move.captured] : 0;
      const attacker = MATERIAL[move.piece] || 0;
      const promotion = move.promotion ? MATERIAL[move.promotion] : 0;
      return victim * 10 - attacker + promotion;
    };
    return score(b) - score(a);
  });

  let best = -INF;
  for (const move of moves) {
    game.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1);
    game.undo();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export function evaluatePosition(game) {
  return evaluateWhite(game);
}

export function chooseMove(game, options = {}) {
  const level = Math.max(1, Math.min(6, Number(options.level) || 1));
  const style = options.style || "adaptive";
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  let depth = level <= 1 ? 1 : level <= 3 ? 2 : 3;
  if (style === "gentle") depth = 1;
  if (style === "strong") depth = Math.min(3, Math.max(2, depth));

  const rated = [];
  for (const move of moves) {
    game.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    const score = -negamax(game, depth - 1, -INF, INF, 1);
    game.undo();
    const noise = style === "strong" ? 0
      : style === "gentle" ? 180
      : level === 1 ? 220
      : level === 2 ? 120
      : level === 3 ? 55 : 8;
    rated.push({ move, score: score + (Math.random() - 0.5) * noise });
  }

  rated.sort((a, b) => b.score - a.score);
  const count = style === "strong" ? 1
    : style === "gentle" ? Math.min(9, rated.length)
    : level === 1 ? Math.min(9, rated.length)
    : level === 2 ? Math.min(6, rated.length)
    : level === 3 ? Math.min(4, rated.length)
    : level === 4 ? Math.min(2, rated.length) : 1;
  return rated[Math.floor(Math.random() * count)].move;
}
