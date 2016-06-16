/**
 * Class responsible for serving an individual team.
 */

import { RtmClient, RTM_EVENTS } from '@slack/client';

import Sibyl from './Sibyl';

export default class TeamServer {
  constructor(token) {
    this.sibyl = new Sibyl(token);
    this.rtm = new RtmClient(token, { logLevel: 'warn' });

    this.bindEventHandlers();
    this.rtm.start();
  }

  bindEventHandlers() {
    this.rtm.on(RTM_EVENTS.MESSAGE, this.handleMessage.bind(this));
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_CREATED,
    //   this.handleChannelCreated.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_DELETED,
    //   this.handleChannelDeleted.bind(this)
    // );
    // this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, this.handleChannelRename.bind(this));
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_ARCHIVE,
    //   this.handleChannelArchive.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_UNARCHIVE,
    //   this.handleChannelUnarchive.bind(this)
    // );
    // this.rtm.on(
    //   RTM_EVENTS.CHANNEL_HISTORY_CHANGED,
    //   this.handleChannelHistoryChanged.bind(this)
    // );
  }

  handleMessage({ user, text, channel, ts }) {
    // TODO: Address these message subtypes
    // bot_message
    // me_message
    // message_changed
    // message_deleted
    // file_comment
    const response = this.sibyl.newMessage(user, text, channel, ts);
    response.then((res) => {
      if (res) {
        this.rtm.sendMessage(res, channel);
      }
    });
  }
};
