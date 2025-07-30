import React, { useState, useEffect } from "react";
import "./App.css";

// --- Color Constants for easy tweaks from the provided palette ---
const COLORS = {
  primary: "#3498db",
  secondary: "#2ecc71",
  accent: "#e74c3c",
};

// PUBLIC_INTERFACE
// Helper: initializes empty board
const emptyBoard = () => Array(9).fill(null);

/**
 * Simple AI to pick first available square.
 * Returns index of the move.
 */
function aiMove(board) {
  // Try to win first or block if the player is about to win
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]
  ];
  // Try to win
  for (let [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    if (
      line.filter(cell => cell === "O").length === 2 &&
      line.includes(null)
    ) {
      return [a, b, c][line.indexOf(null)];
    }
  }
  // Try to block X win
  for (let [a,b,c] of lines) {
    const line = [board[a], board[b], board[c]];
    if (
      line.filter(cell => cell === "X").length === 2 &&
      line.includes(null)
    ) {
      return [a, b, c][line.indexOf(null)];
    }
  }
  // Center
  if (board[4] === null) return 4;
  // Corners
  const corners = [0,2,6,8].filter(i => board[i] === null);
  if (corners.length > 0) return corners[0];
  // Sides
  const sides = [1,3,5,7].filter(i => board[i] === null);
  if (sides.length > 0) return sides[0];
  // Fallback (should not happen)
  return board.findIndex(cell => cell === null);
}

/**
 * Find winner. Returns "X", "O", or null
 */
function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }
  return null;
}

/**
 * Checks if the board is full and there's no winner
 */
function isDraw(board) {
  return board.every(cell => cell !== null) && !calculateWinner(board);
}

/**
 * Loads score from localStorage or returns initial
 */
const loadScore = () => {
  try {
    const data = JSON.parse(localStorage.getItem("ttt-score"));
    return data && typeof data === "object"
      ? { X: data.X || 0, O: data.O || 0 }
      : { X: 0, O: 0 };
  } catch {
    return { X: 0, O: 0 };
  }
};

/**
 * Saves score to localStorage
 */
const saveScore = (score) => {
  localStorage.setItem("ttt-score", JSON.stringify(score));
};

/**
 * Square: single cell in the grid
 */
function Square({ value, onClick, disabled, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? " highlight" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Cell: ${value}` : "Empty cell"}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
// Main App
function App() {
  // 'single' (vs AI) or 'two' player
  const [mode, setMode] = useState("single"); 
  // 'X' always starts
  const [xIsNext, setXisNext] = useState(true); 
  const [board, setBoard] = useState(emptyBoard());
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [score, setScore] = useState(loadScore());
  const [aiThinking, setAiThinking] = useState(false);

  // For highlight
  const [winLine, setWinLine] = useState([]);

  // Check for winner/draw after every update
  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
      // Save score
      const newScore = { ...score, [win]: score[win] + 1 };
      setScore(newScore);
      saveScore(newScore);
      // Find the winning line for highlight
      const lines = [
        [0,1,2],[3,4,5],[6,7,8],[0,3,6],
        [1,4,7],[2,5,8],[0,4,8],[2,4,6]
      ];
      for (const line of lines) {
        const [a,b,c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          setWinLine(line);
          break;
        }
      }
    } else if (isDraw(board)) {
      setDraw(true);
    }
  //eslint-disable-next-line
  }, [board]);

  // AI move after player 'X', only on single-player mode and not game over
  useEffect(() => {
    if (
      mode === "single" &&
      !winner &&
      !draw &&
      !xIsNext
    ) {
      setAiThinking(true);
      const timeout = setTimeout(() => {
        const idx = aiMove(board);
        if (idx !== -1 && board[idx] === null) {
          const newBoard = [...board];
          newBoard[idx] = "O";
          setBoard(newBoard);
          setXisNext(true);
        }
        setAiThinking(false);
      }, 450); // add a minimal think time for realism
      return () => clearTimeout(timeout);
    }
  // Only react to these
  //eslint-disable-next-line
  }, [xIsNext, mode, board, winner, draw]);

  // Handle click
  const handleClick = (idx) => {
    // If cell filled, winner or AI's turn, ignore
    if (board[idx] || winner || (mode === "single" && !xIsNext)) return;
    const newBoard = [...board];
    newBoard[idx] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXisNext(!xIsNext);
  };

  // Restart current game (keeps score)
  const restartGame = () => {
    setBoard(emptyBoard());
    setXisNext(true);
    setWinner(null);
    setDraw(false);
    setWinLine([]);
  };

  // Reset everything including score
  const resetAll = () => {
    setBoard(emptyBoard());
    setXisNext(true);
    setWinner(null);
    setDraw(false);
    setScore({ X: 0, O: 0 });
    setWinLine([]);
    saveScore({ X: 0, O: 0 });
  };

  // New game but switch start player (for 'two' mode)
  const newGameSwitch = () => {
    setBoard(emptyBoard());
    setXisNext(prev => !prev);
    setWinner(null);
    setDraw(false);
    setWinLine([]);
  };

  // Switch mode
  const handleModeSelect = (newMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      restartGame();
      setScore(loadScore()); // Load/persist scores per mode if desired
    }
  };

  const currentPlayer = mode === "single" ? (xIsNext ? "You (X)" : "AI (O)") : (xIsNext ? "Player X" : "Player O");

  function renderStatus() {
    if (winner) {
      return (
        <span className="ttt-status win" style={{ color: COLORS.accent }}>
          {mode === "single"
            ? (winner === "X" ? "You win! 🎉" : "AI wins 😈")
            : `${winner} wins! 🎉`}
        </span>
      );
    }
    if (draw) {
      return (
        <span className="ttt-status draw" style={{ color: COLORS.primary }}>
          It's a draw.
        </span>
      );
    }
    return (
      <span className="ttt-status play">
        {mode === "single" ? "Turn: " : ""}
        <span style={{ color: xIsNext ? COLORS.primary : COLORS.secondary }}>{currentPlayer}</span>
        {aiThinking && <span className="ttt-ai-thinking"> &nbsp;AI thinking...</span>}
      </span>
    );
  }

  // Render grid
  const renderSquare = (idx) => {
    const highlight = winner && winLine.includes(idx);
    return (
      <Square
        key={idx}
        value={board[idx]}
        onClick={() => handleClick(idx)}
        disabled={!!board[idx] || winner || (mode === "single" && !xIsNext) || draw}
        highlight={highlight}
      />
    );
  };

  return (
    <div className="app-container">
      <h1 className="ttt-title" tabIndex={0}>
        Tic Tac Toe
      </h1>
      <div className="ttt-controls" role="group" aria-label="Game mode">
        <button
          className={`ttt-btn ${mode === "single" ? "selected" : ""}`}
          style={mode === "single" ? { backgroundColor: COLORS.primary } : {}}
          onClick={() => handleModeSelect("single")}
          aria-pressed={mode === "single"}
        >
          Single Player
        </button>
        <button
          className={`ttt-btn ${mode === "two" ? "selected" : ""}`}
          style={mode === "two" ? { backgroundColor: COLORS.primary } : {}}
          onClick={() => handleModeSelect("two")}
          aria-pressed={mode === "two"}
        >
          2 Player
        </button>
      </div>
      <div className="ttt-scoreboard" role="region" aria-label="Scoreboard">
        <div className="score">
          <span style={{ color: COLORS.primary }}>X</span> {score.X}
        </div>
        <div className="score">
          <span style={{ color: COLORS.secondary }}>O</span> {score.O}
        </div>
      </div>
      <div className="ttt-status-row">{renderStatus()}</div>
      <main className="ttt-board" role="region" aria-label="Tic Tac Toe grid">
        {[0, 1, 2].map(row => (
          <div className="ttt-board-row" key={row}>
            {[0, 1, 2].map(col => renderSquare(row * 3 + col))}
          </div>
        ))}
      </main>
      <div className="ttt-bottom-controls">
        <button
          className="ttt-btn"
          style={{ backgroundColor: COLORS.secondary }}
          onClick={restartGame}
        >
          Restart Game
        </button>
        <button
          className="ttt-btn"
          style={{ backgroundColor: "#eee", color: "#333", border: `1.5px solid ${COLORS.accent}` }}
          onClick={resetAll}
        >
          Reset Score
        </button>
        {mode === "two" && (
          <button
            className="ttt-btn"
            style={{ backgroundColor: COLORS.primary, marginLeft: 4 }}
            onClick={newGameSwitch}
            aria-label="Start new game, switch starting player"
          >
            New Game (Switch Player)
          </button>
        )}
      </div>
      <footer className="ttt-footer">
        <span>
          <span aria-label="Copyright" role="img">
            ©
          </span>{" "}
          Modern Tic Tac Toe — Minimalist React ({new Date().getFullYear()})
        </span>
      </footer>
    </div>
  );
}

export default App;
