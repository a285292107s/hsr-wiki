/**
 * 运营错误（operational）与程序错误（programming）的区分沿用原脚本设计：
 * - operational=true：网络/数据缺失等可预期故障 → 展示错误态 + 重试
 * - operational=false：数据结构损坏等程序故障 → fail-fast
 */
export class NkError extends Error {
  readonly operational: boolean;

  constructor(message: string, operational = true) {
    super(message);
    this.name = 'NkError';
    this.operational = operational;
  }
}
