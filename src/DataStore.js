/**
 * Data store for user and channel data.
 */

export default class {
  constructor() {
    this.users = new Map();
    this.channels = new Map();
  }

  /**
   * Store information for a specific user for the first time.
   *
   * @public
   * @param {string} id The user id.
   * @param {string} username
   * @param {string} name
   * @param {number} psychoPass
   * @param {object[]} messageInfo
   */
  addUser(id, username, name, psychoPass, messageInfo) {
    const userInfo = { username, name, psychoPass, messageInfo };

    this.users.set(id, userInfo);
  }

  /**
   * Store information for a specific channel for the first time.
   *
   * @public
   * @param {string} id The channel id.
   * @param {string} name
   * @param {string} psychoPass
   * @param {object[]} messageInfo
   */
  addChannel(id, name, psychoPass, messageInfo) {
    const channelInfo = { name, psychoPass, messageInfo };

    this.channels.set(id, channelInfo);
  }
};
