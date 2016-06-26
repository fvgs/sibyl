/**
 * Functions for computing a Psycho-Pass.
 */

import sentiment from 'sentiment';

const NUM_USER_MESSAGES = 10;
const NUM_CHANNEL_MESSAGES = 20;

/**
 * Compute the rating of a single message.
 *
 * @public
 * @param {string} message
 * @return {number} The message rating.
 */
function computeMessageRating(message) {
  const { score, comparative } = sentiment(message);
  let psychoPass;

  if (score >= 0) {
    psychoPass = score * comparative * -1;
  } else {
    let multiplier = -1;
    if (comparative < -1) {
      multiplier = Math.sqrt(Math.abs(comparative)) * -1;
    }
    psychoPass = score * multiplier;
  }

  return psychoPass;
}

/**
 * Compute a user's Psycho-Pass.
 *
 * @public
 * @param {number[]} messageRatings An array containing zero to
 * {NUM_USER_MESSAGES} message ratings beginning with the most recent and ending
 * with the oldest.
 * @return {number} The user's Psycho-Pass.
 */
function computeUserPsychoPass(messageRatings) {
  const weightedRatingSum = messageRatings.reduce(userPsychoPassHelper, 0);
  const base = 70;
  let psychoPass = Math.floor(base + weightedRatingSum);

  if (psychoPass < 0) {
    psychoPass = 0;
  }

  return psychoPass;
}

/**
 * Compute the accumulated sum of weighted message ratings.
 *
 * @private
 * @param {number} sum
 * @param {number} currentMessageRating
 * @param {number} index
 * @return {number} The new sum.
 */
function userPsychoPassHelper(sum, currentMessageRating, index) {
  const weights = [5, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const weightedMessageRating = weights[index] * currentMessageRating;
  const newSum = sum + weightedMessageRating;

  return newSum;
}

/**
 * Compute a channel's Psycho-Pass.
 */
function computeChannelPsychoPass() {

}

export {
  computeMessageRating,
  computeUserPsychoPass,
  computeChannelPsychoPass,
  NUM_USER_MESSAGES,
  NUM_CHANNEL_MESSAGES,
};
