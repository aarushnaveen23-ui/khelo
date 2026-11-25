import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { chooseMove } from "../src/chess-ai.js";

test("starting position has twenty legal moves", () => {
  const game = new Chess();
  assert.equal(game.moves().length, 20);
});

test("built-in AI returns a legal opening move without changing the game", () => {
  const game = new Chess();
  const move = chooseMove(game, { level: 1, style: "gentle" });
  assert.ok(move);
  assert.ok(game.moves({ verbose: true }).some((candidate) => candidate.from === move.from && candidate.to === move.to));
  assert.equal(game.history().length, 0);
});

test("a normal move changes the side to move", () => {
  const game = new Chess();
  game.move({ from: "e2", to: "e4" });
  assert.equal(game.turn(), "b");
  assert.equal(game.moves().length, 20);
});

test("checkmate is detected", () => {
  const game = new Chess();
  for (const move of ["f3", "e5", "g4", "Qh4#"]) game.move(move);
  assert.equal(game.isCheckmate(), true);
  assert.equal(game.isGameOver(), true);
});
