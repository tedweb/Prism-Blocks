export const SIZE = 8;
export type Cell = string | null;
export type Board = Cell[][];
export type Point = readonly [number, number];
export type Piece = { id: string; shape: Point[]; color: string };

const COLORS = ['#58D6FF', '#A879FF', '#FF6F91', '#FFD166', '#52E0A4', '#FF9F55'];
const SHAPES: Point[][] = [
  [[0,0]], [[0,0],[0,1]], [[0,0],[1,0]], [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,0],[1,1]], [[0,0],[1,0],[1,1]], [[0,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,0],[0,1],[0,2],[1,1]], [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[1,0],[2,0]]
];

export const emptyBoard = (): Board => Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
export const bounds = (shape: Point[]) => ({
  w: Math.max(...shape.map(p => p[1])) + 1,
  h: Math.max(...shape.map(p => p[0])) + 1,
});
export function randomPiece(seed = Math.random()): Piece {
  const shape = SHAPES[Math.floor(seed * SHAPES.length)]!;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  return { id: `${Date.now()}-${Math.random()}`, shape, color };
}
export const newTray = () => [randomPiece(), randomPiece(), randomPiece()];
export function canPlace(board: Board, piece: Piece, row: number, col: number) {
  return piece.shape.every(([dr, dc]) => row + dr >= 0 && row + dr < SIZE && col + dc >= 0 && col + dc < SIZE && !board[row + dr]![col + dc]);
}
export function snapPlacement(board: Board, piece: Piece, pieceCenterX: number, pieceCenterY: number, boardX: number, boardY: number, cell: number, gap: number, snapRadius: number) {
  const b = bounds(piece.shape);
  const pitch = cell + gap;
  const firstCenterX = boardX + gap + cell / 2;
  const firstCenterY = boardY + gap + cell / 2;
  const rawCol = (pieceCenterX - firstCenterX) / pitch - (b.w - 1) / 2;
  const rawRow = (pieceCenterY - firstCenterY) / pitch - (b.h - 1) / 2;
  const row = Math.round(rawRow), col = Math.round(rawCol);

  if (canPlace(board, piece, row, col)) return { row, col, valid: true };

  let nearest: { row: number; col: number; distance: number } | null = null;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const candidateRow = row + dr, candidateCol = col + dc;
    if (!canPlace(board, piece, candidateRow, candidateCol)) continue;
    const candidateCenterX = firstCenterX + (candidateCol + (b.w - 1) / 2) * pitch;
    const candidateCenterY = firstCenterY + (candidateRow + (b.h - 1) / 2) * pitch;
    const distance = Math.hypot(pieceCenterX - candidateCenterX, pieceCenterY - candidateCenterY);
    if (distance <= snapRadius && (!nearest || distance < nearest.distance)) nearest = { row: candidateRow, col: candidateCol, distance };
  }
  return nearest ? { row: nearest.row, col: nearest.col, valid: true } : { row, col, valid: false };
}
export function placeAndClear(board: Board, piece: Piece, row: number, col: number) {
  const next = board.map(r => [...r]);
  piece.shape.forEach(([dr, dc]) => { next[row + dr]![col + dc] = piece.color; });
  const rows = Array.from({length: SIZE}, (_, r) => r).filter(r => next[r]!.every(Boolean));
  const cols = Array.from({length: SIZE}, (_, c) => c).filter(c => next.every(r => Boolean(r[c])));
  rows.forEach(r => { for (let c=0;c<SIZE;c++) next[r]![c] = null; });
  cols.forEach(c => { for (let r=0;r<SIZE;r++) next[r]![c] = null; });
  return { board: next, lines: rows.length + cols.length };
}
export function anyMove(board: Board, pieces: (Piece|null)[]) {
  return pieces.some(p => p && Array.from({length: SIZE}).some((_,r) => Array.from({length: SIZE}).some((__,c) => canPlace(board,p,r,c))));
}
