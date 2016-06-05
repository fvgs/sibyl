import {
  RtmClient,
  MemoryDataStore,
  CLIENT_EVENTS,
  RTM_EVENTS,
} from '@slack/client';

const slackTestToken = process.env.SIBYL_SLACK_TEST_TOKEN;
const rtm = new RtmClient(slackTestToken, { dataStore: new MemoryDataStore() });
rtm.start();

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {

});
