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
    const channelInfo = { name, psychoPass, messageInfo, monitorTimeout: 0 };

    this.channels.set(id, channelInfo);
  }

  /**
   * Get a user's username.
   *
   * @public
   * @param {string} id The user id.
   * @return {string} The user's username.
   */
  getUserUsername(id) {
    return this.users.get(id).username;
  }

  /**
   * Get a user's name. If the user does not have a registered name, the
   * username is returned.
   *
   * @public
   * @param {string} id The user id.
   * @return {string} The user's name, or username if no registered name is
   * found.
   */
  getUserName(id) {
    let user = this.users.get(id).name;

    if (!user) {
      user = this.getUserUsername(id);
    }

    return user;
  }

  /**
   * Get a user's Psycho-Pass.
   *
   * @public
   * @param {string} id The user id.
   * @return {number} The user's Psycho-Pass.
   */
  getUserPsychoPass(id) {
    return this.users.get(id).psychoPass;
  }

  /**
   * Get the name of a channel.
   *
   * @public
   * @param {string} id The channel id.
   * @return {string} The channel name.
   */
  getChannelName(id) {
    return this.channels.get(id).name;
  }

  /**
   * Get a channel's Psycho-Pass.
   *
   * @public
   * @param {string} id The channel id.
   * @return {number} The channel's Psycho-Pass.
   */
  getChannelPsychoPass(id) {
    return this.channels.get(id).psychoPass;
  }

  /**
   * Get the timeout value used by the monitoring feature for the specified
   * channel.
   *
   * @public
   * @param {string} id The channel id.
   * @return {number} The monitor timeout value.
   */
  getChannelMonitorTimeout(id) {
    return this.channels.get(id).monitorTimeout;
  }

  /**
   * Set the monitor timeout value of the specified channel.
   *
   * @public
   * @param {string} id The channel id.
   * @param {number} monitorTimeout The timeout value in ticks e.g. 10.
   */
  setChannelMonitorTimeout(id, monitorTimeout) {
    this.channels.get(id).monitorTimeout = monitorTimeout;
  }

  /**
   * Subtract one from the monitor timeout value.
   *
   * @public
   * @param {string} id The channel id.
   */
  tickChannelMonitorTimeout(id) {
    const channel = this.channels.get(id);

    if (channel.monitorTimeout > 0) {
      channel.monitorTimeout--;
    }
  }
};
