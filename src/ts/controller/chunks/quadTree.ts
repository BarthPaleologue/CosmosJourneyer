/**
 * A quadTree is defined recursively
 */
type tree<T> = tree<T>[] | T;

/**
 * A ChunkTree is a structure designed to manage LOD using a quadtree
 */
export class QuadTree<T> {
  private tree: tree<T> = [];

  /**
   * Function used to execute code on every leaf of the quadtree
   * @param tree the tree to explore
   * @param f the function to apply on every leaf
   */
  public executeOnEveryLeaf(f: (leaf: T) => void, tree: tree<T> = this.tree): void {
    if (tree instanceof Array) {
      for (const child of tree) {
        this.executeOnEveryLeaf(f, child);
      }
    } else {
      f(tree);
    }
  }

  public getLeaves(): T[] {
    const leaves: T[] = [];
    this.executeOnEveryLeaf((leaf) => leaves.push(leaf));

    return leaves;
  }

  public reset(): void {
    this.tree = [];
  }
}
