import Entry from './Entry';

export default class {
  /**
   * Initialize the leaderboard as a sorted array of entries.
   */
  constructor() {
    this.leaderboard = [];
  }

  /**
   * Update the leaderboard with the given id and value. This method is meant
   * for both new and previously used ids.
   *
   * @public
   * @param {string} id
   * @param {number} newValue A numerical value used to rank entries.
   * @param {number|null} oldValue The old value associated with the id, or null
   * if this is the first time calling the method with the id.
   */
  update(id, newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    let entry;
    if (oldValue === null) {
      entry = new Entry(id, newValue);
    } else {
      entry = this.remove(id, oldValue);
      entry.setValue(newValue);
    }

    this.insert(entry);
  }

  /**
   * Add an entry to the leaderboard while maintaining the order.
   *
   * @private
   * @param {Entry} entry The Entry to insert.
   */
  insert(entry) {
    const value = entry.getValue();
    const index = this.findIndex(value);

    this.leaderboard.splice(index, 0, entry);
  }

  /**
   * Remove an entry from the leaderboard.
   *
   * @private
   * @param {string} id
   * @param {value} value
   * @return {Entry} The removed Entry.
   */
  remove(id, value) {
    let origin = this.findIndex(value);
    let index = origin;
    let entry = this.leaderboard[index];

    while (entry.getId() !== id && entry.getValue() === value) {
      entry = this.leaderboard[++index];
    }

    if (entry.getId() !== id) {
      index = origin - 1;
      entry = this.leaderboard[index];

      while (entry.getId() !== id) {
        entry = this.leaderboard[--index];
      }
    }

    const [entry] = this.leaderboard.splice(index, 1);
    return entry;
  }

  /**
   * Find the index of a value in the leaderboard. For duplicate values, return
   * the index of the first matching value.
   *
   * @param {number} target The target value.
   * @return {number} The index.
   */
  findIndex(target) {
    let low = 0;
    let high = this.leaderboard.length - 1;

    while (low <= high) {
      const mid = (low + high) / 2;
      const value = this.leaderboard[mid].getValue();

      if (value < target) {
        low = mid + 1;
      } else if (target < value) {
        high = mid - 1;
      } else {
        return mid;
      }
    }
  }
};
