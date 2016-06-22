export default class {
  /**
   * Instantiate an entry for the leaderboard.
   *
   * @param {string} id
   * @param {number} value A numerical value used to rank entries.
   */
  constructor(id, value) {
    this.id = id;
    this.value = value;
  }

  getId() {
    return this.id;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    this.value = newValue;
  }
};
