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
  const psychoPass = computePsychoPass(messageRatings, NUM_USER_MESSAGES);
  return psychoPass;
}

/**
 * Compute a channel's Psycho-Pass.
 *
 * @public
 * @param {number[]} messageRatings An array containing zero to
 * {NUM_CHANNEL_MESSAGES} message ratings beginning with the most recent and
 * ending with the oldest.
 * @return {number} The channel's Psycho-Pass.
 */
function computeChannelPsychoPass(messageRatings) {
  const psychoPass = computePsychoPass(messageRatings, NUM_CHANNEL_MESSAGES);
  return psychoPass;
}

/**
 * Compute a Psycho-Pass.
 *
 * @private
 * @param {number[]} messageRatings An array of message ratings beginning with
 * the most recent and ending with the oldest.
 * @param {number} num The intended number of message ratings.
 * @return {number} The Psycho-Pass.
 */
function computePsychoPass(messageRatings, num) {
  const weights = getWeights(num);
  const reducer = reducerFactory(weights);
  const weightedRatingSum = messageRatings.reduce(reducer, 0);
  const base = 70;
  let psychoPass = Math.floor(base + weightedRatingSum);

  if (psychoPass < 0) {
    psychoPass = 0;
  }

  return psychoPass;
}

/**
 * Get the weights to use in computing a Psycho-Pass based on the number of
 * message ratings.
 *
 * @private
 * @param {number} num The number of message ratings.
 * @return {number[]} The numerical weights.
 */
function getWeights(num) {
  const weights10 = [5, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const weights20 = [
    2.5, 2.5, 2.5, 2.5, 2.5,
    2, 2, 2, 2, 2,
    1.5, 1.5, 1.5, 1.5, 1.5,
    1, 1, 1, 1, 1,
  ];

  let weights;
  switch (num) {
    case 10:
      weights = weights10;
      break;
    case 20:
      weights = weights20;
  }

  return weights;
}

/**
 * Get a message ratings reducer that uses the given weights.
 *
 * @private
 * @param {number[]} weights Weights corresponding to the message ratings to be
 * reduced.
 * @return {function} The reducer.
 */
function reducerFactory(weights) {
  return reducer;

  /**
   * Compute the accumulated sum of weighted message ratings.
   *
   * @private
   * @param {number} sum
   * @param {number} currentMessageRating
   * @param {number} index
   * @return {number} The new sum.
   */
  function reducer(sum, currentMessageRating, index) {
    const weightedMessageRating = weights[index] * currentMessageRating;
    const newSum = sum + weightedMessageRating;

    return newSum;
  }
}

export {
  computeMessageRating,
  computeUserPsychoPass,
  computeChannelPsychoPass,
  NUM_USER_MESSAGES,
  NUM_CHANNEL_MESSAGES,
};
