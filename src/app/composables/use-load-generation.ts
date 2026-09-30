
export interface LoadGeneration {
  begin(): number;
  isCurrent(gen: number): boolean;
}

export function useLoadGeneration(): LoadGeneration {
  let gen = 0;
  return {
    begin: () => ++gen,
    isCurrent: (g) => g === gen,
  };
}
