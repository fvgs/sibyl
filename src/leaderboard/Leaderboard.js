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
   * @param {number} [oldValue] The old value associated with the id. Not
   * used if first time calling the method for a particular id. If the id has
   * been updated previously, oldValue must be provided.
   */
  update(id, newValue, oldValue) {
    if (newValue === oldValue) {
      return;
    }

    let entry;
    if (oldValue === undefined) {
      entry = new Entry(id, newValue);
    } else {
      entry = this.remove(id, oldValue);
      entry.setValue(newValue);
    }

    this.insert(entry);
  }

  /**
   * Get the highest num entries.
   *
   * @private
   * @param {number} [num = 10] The number of entries to get.
   * @return {object[]} The num highest entries.
   */
  getHighest(num = 10) {
    const highest = this.leaderboard.slice(-10).map(entry => ({
      id: entry.getId(),
      value: entry.getValue(),
    }));

    return highest.reverse();
  }

  /**
   * Get the lowest num entries.
   *
   * @private
   * @param {number} [num = 10] The number of entries to get.
   * @return {object[]} The num lowest entries.
   */
  getLowest(num = 10) {
    const lowest = this.leaderboard.slice(0, 10).map(entry => ({
      id: entry.getId(),
      value: entry.getValue(),
    }));

    return lowest;
  }

  /**
   * Add an entry to the leaderboard while maintaining the order.
   *
   * @private
   * @param {Entry} entry The Entry to insert.
   */
  insert(entry) {
    const value = entry.getValue();
    let index = this.findIndex(value);

    if (this.leaderboard.length > 0 &&
        value > this.leaderboard[index].getValue()) {
      index++;
    }

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

    while (entry && entry.getId() !== id && entry.getValue() === value) {
      entry = this.leaderboard[++index];
    }

    if (entry.getId() !== id) {
      index = origin - 1;
      entry = this.leaderboard[index];

      while (entry.getId() !== id) {
        entry = this.leaderboard[--index];
      }
    }

    [entry] = this.leaderboard.splice(index, 1);
    return entry;
  }

  /**
   * Find the index of a value in the leaderboard. For duplicate values, return
   * the index of the first matching value. For a target not present in the
   * leaderboard, return the index of an adjacent value. Likewise, if the
   * leaderboard is empty, return 0.
   *
   * @private
   * @param {number} target The target value.
   * @return {number} The index.
   */
  findIndex(target) {
    let low = 0;
    let mid = 0;
    let high = this.leaderboard.length - 1;

    while (low <= high) {
      mid = Math.round((low + high) / 2);
      const value = this.leaderboard[mid].getValue();

      if (value < target) {
        low = mid + 1;
      } else if (target < value) {
        high = mid - 1;
      } else {
        return mid;
      }
    }

    return mid;
  }
};
