export class TicTacToeGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
  }

  makeMove(position) {
    if (this.board[position] !== null || position < 0 || position > 8) return false;
    this.board[position] = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    return true;
  }

  checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    if (this.board.every(cell => cell !== null)) return 'draw';
    return null;
  }

  getBoard() { return [...this.board]; }

  aiMove() {
    const empty = this.board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return -1;
    const pick = empty[Math.floor(Math.random() * empty.length)];
    this.makeMove(pick);
    return pick;
  }

  render() {
    const symbols = this.board.map((v, i) => v || (i + 1).toString());
    return `${symbols[0]} | ${symbols[1]} | ${symbols[2]}\n---------\n${symbols[3]} | ${symbols[4]} | ${symbols[5]}\n---------\n${symbols[6]} | ${symbols[7]} | ${symbols[8]}`;
  }
}
